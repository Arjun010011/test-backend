import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock3, ListChecks, ShieldAlert, Video } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { answer, submit } from '@/routes/candidate/assessments';

type Option = {
    id: number;
    option_text: string;
};

type Question = {
    id: number;
    question_text: string;
    category: string;
    difficulty: string;
    points: number;
    options: Option[];
};

type Props = {
    assessment: {
        id: number;
        title: string;
        duration_minutes: number;
    };
    attempt: {
        id: number;
        status: string;
    };
    questions: Question[];
    existing_responses: Record<string, number>;
    remaining_time: number;
};

export default function CandidateAssessmentsTake({
    assessment,
    questions,
    existing_responses,
    remaining_time,
}: Props) {
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(remaining_time);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>(
        Object.entries(existing_responses).reduce<Record<number, number>>((carry, [questionId, optionId]) => {
            const parsedQuestionId = Number(questionId);
            if (Number.isFinite(parsedQuestionId)) {
                carry[parsedQuestionId] = optionId;
            }

            return carry;
        }, {}),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
    const [cameraState, setCameraState] = useState<'live' | 'blocked' | 'unsupported' | 'initializing'>('initializing');
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const lastLoggedAtRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const tabSwitchCountRef = useRef(0);

    const currentQuestion = questions[activeQuestionIndex];

    const answeredCount = useMemo(
        () => questions.filter((question) => selectedOptions[question.id] !== undefined).length,
        [questions, selectedOptions],
    );

    const logProctoringEvent = async (
        eventType: string,
        severity: 'low' | 'medium' | 'high',
        metadata: Record<string, unknown> = {},
    ) => {
        const now = Date.now();
        const throttleKey = `${eventType}-${severity}`;
        const lastLoggedAt = lastLoggedAtRef.current[throttleKey] ?? 0;

        if (now - lastLoggedAt < 5000) {
            return;
        }

        lastLoggedAtRef.current[throttleKey] = now;

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        await fetch(`/candidate/assessments/${assessment.id}/proctor-events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                event_type: eventType,
                severity,
                metadata,
                occurred_at: new Date().toISOString(),
            }),
        });
    };

    const submitAssessment = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.post(submit({ assessment: assessment.id }).url);
    };

    useEffect(() => {
        if (remainingSeconds <= 0 || isSubmitting) {
            return;
        }

        const timer = window.setInterval(() => {
            setRemainingSeconds((currentSeconds) => {
                if (currentSeconds <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }

                return currentSeconds - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [remainingSeconds, isSubmitting]);

    useEffect(() => {
        if (remainingSeconds !== 0 || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.post(submit({ assessment: assessment.id }).url);
    }, [assessment.id, isSubmitting, remainingSeconds]);

    useEffect(() => {
        let mounted = true;

        const setupWebcamSignal = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraState('unsupported');

                if (mounted) {
                    setProctoringWarnings((warnings) => [
                        ...warnings,
                        'Camera API unavailable. Continue, but this attempt will be flagged.',
                    ]);
                }

                await logProctoringEvent('webcam_unavailable', 'medium');

                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

                streamRef.current = stream;

                if (videoPreviewRef.current !== null) {
                    videoPreviewRef.current.srcObject = stream;
                }

                setCameraState('live');
                await logProctoringEvent('webcam_permission_granted', 'low');
            } catch {
                setCameraState('blocked');

                if (mounted) {
                    setProctoringWarnings((warnings) => [
                        ...warnings,
                        'Camera permission denied. Recruiter will be notified in proctoring logs.',
                    ]);
                }

                await logProctoringEvent('webcam_permission_denied', 'high');
            }
        };

        void setupWebcamSignal();

        const onVisibilityChange = () => {
            if (document.hidden) {
                const nextCount = tabSwitchCountRef.current + 1;
                tabSwitchCountRef.current = nextCount;
                setTabSwitchCount(nextCount);

                if (nextCount === 1) {
                    setProctoringWarnings((warnings) => [
                        ...warnings,
                        'Warning: Tab switch detected. More than 3 switches will auto-submit your test.',
                    ]);
                } else {
                    setProctoringWarnings((warnings) => [...warnings, `Tab switch detected (${nextCount}).`]);
                }

                void logProctoringEvent('tab_hidden', 'high', { tab_switch_count: nextCount });

                if (nextCount > 3 && !isSubmitting) {
                    setProctoringWarnings((warnings) => [
                        ...warnings,
                        'Tab switch limit exceeded. Auto-submitting your test.',
                    ]);
                    void logProctoringEvent('tab_switch_limit_exceeded', 'high', { tab_switch_count: nextCount });
                    submitAssessment();
                }
            }
        };

        const onBlur = () => {
            setProctoringWarnings((warnings) => [...warnings, 'Window focus lost.']);
            void logProctoringEvent('window_blur', 'medium');
        };

        const onCopy = () => {
            void logProctoringEvent('copy_attempt', 'medium');
        };

        const onPaste = () => {
            void logProctoringEvent('paste_attempt', 'high');
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        document.addEventListener('copy', onCopy);
        document.addEventListener('paste', onPaste);

        return () => {
            mounted = false;
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('paste', onPaste);

            if (streamRef.current !== null) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [assessment.id, isSubmitting]);

    const persistAnswer = async (questionId: number, selectedOptionId: number) => {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        const response = await fetch(answer({ assessment: assessment.id }).url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                question_id: questionId,
                selected_option_id: selectedOptionId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save answer');
        }
    };

    const selectOption = async (questionId: number, selectedOptionId: number) => {
        setSelectedOptions((currentOptions) => ({
            ...currentOptions,
            [questionId]: selectedOptionId,
        }));

        try {
            await persistAnswer(questionId, selectedOptionId);
        } catch {
            setProctoringWarnings((warnings) => [
                ...warnings,
                'Could not save the selected answer. Please select again before submitting.',
            ]);
        }
    };

    const minutes = Math.floor(remainingSeconds / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(remainingSeconds % 60)
        .toString()
        .padStart(2, '0');

    return (
        <AppLayout fullWidth>
            <Head title={`Take ${assessment.title}`} />

            <div className="fixed top-20 right-4 z-20 w-52 overflow-hidden rounded-xl border border-border/70 bg-black shadow-lg">
                <div className="flex items-center gap-1 border-b border-white/15 bg-black/80 px-2 py-1 text-[11px] font-medium text-white">
                    <Video className="size-3.5" />
                    Proctoring Camera
                    <span className="ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {cameraState === 'live' ? 'Live' : cameraState === 'initializing' ? 'Starting' : 'Off'}
                    </span>
                </div>
                <div className="relative h-32 w-full bg-slate-900">
                    <video
                        ref={videoPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full object-cover ${cameraState === 'live' ? 'block' : 'hidden'}`}
                    />
                    {cameraState !== 'live' && (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-slate-200">
                            {cameraState === 'blocked'
                                ? 'Camera permission denied'
                                : cameraState === 'unsupported'
                                  ? 'Camera not supported'
                                  : 'Initializing camera...'}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid w-full gap-4 px-3 py-4 sm:grid-cols-[320px_minmax(0,1fr)] sm:px-4">
                <aside className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                    <div>
                        <h2 className="text-base font-semibold">{assessment.title}</h2>
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock3 className="size-4 text-cyan-600" />
                            Time left: {minutes}:{seconds}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/60 p-3 text-sm">
                        <p className="inline-flex items-center gap-1 font-medium">
                            <ListChecks className="size-4 text-indigo-600" />
                            Progress
                        </p>
                        <p className="mt-1 text-muted-foreground">
                            {answeredCount} / {questions.length} answered
                        </p>
                        <p className="mt-1 text-muted-foreground">Tab switches: {tabSwitchCount}</p>
                    </div>

                    {proctoringWarnings.length > 0 && (
                        <div className="rounded-xl border border-amber-300/70 bg-amber-100/80 p-3 text-xs text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200">
                            <p className="inline-flex items-center gap-1 font-semibold">
                                <ShieldAlert className="size-4" />
                                Proctoring alerts
                            </p>
                            <ul className="mt-1 list-disc pl-4">
                                {proctoringWarnings.slice(-3).map((warning, index) => (
                                    <li key={`${warning}-${index}`}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((question, index) => {
                            const isAnswered = selectedOptions[question.id] !== undefined;

                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    onClick={() => setActiveQuestionIndex(index)}
                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                        activeQuestionIndex === index
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : isAnswered
                                              ? 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200'
                                              : 'border-border/70 bg-background'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={submitAssessment}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <CheckCircle2 className="size-4" />
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                </aside>

                <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    {currentQuestion ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full border border-border/70 px-2 py-1 text-xs text-muted-foreground">
                                    Question {activeQuestionIndex + 1} / {questions.length}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-full border border-border/70 px-2 py-1 capitalize">
                                        {currentQuestion.difficulty}
                                    </span>
                                    <span className="rounded-full border border-border/70 px-2 py-1">
                                        {currentQuestion.points} pts
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold leading-relaxed">{currentQuestion.question_text}</h3>

                            <div className="space-y-2">
                                {currentQuestion.options.map((option, optionIndex) => {
                                    const isSelected = selectedOptions[currentQuestion.id] === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => selectOption(currentQuestion.id, option.id)}
                                            className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                                                isSelected
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border/70 bg-background hover:bg-accent/40'
                                            }`}
                                        >
                                            <span className="mr-2 font-semibold text-muted-foreground">
                                                {String.fromCharCode(65 + optionIndex)}.
                                            </span>
                                            {option.option_text}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={activeQuestionIndex === 0}
                                    onClick={() => setActiveQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1))}
                                    className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={activeQuestionIndex === questions.length - 1}
                                    onClick={() =>
                                        setActiveQuestionIndex((currentIndex) => Math.min(questions.length - 1, currentIndex + 1))
                                    }
                                    className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No questions loaded.</p>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
