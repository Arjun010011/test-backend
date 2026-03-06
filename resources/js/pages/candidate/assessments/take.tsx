import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock3, ListChecks, ShieldAlert, Video } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

type CameraState = 'live' | 'blocked' | 'unsupported' | 'initializing';
type PersonState = 'checking' | 'detected' | 'not_detected' | 'unsupported';
type FaceDetectorLike = {
    detect: (input: HTMLVideoElement) => Promise<Array<unknown>>;
};
type FaceDetectorCtor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;

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
    const [pendingSaveCount, setPendingSaveCount] = useState(0);
    const [failedSaveQuestionIds, setFailedSaveQuestionIds] = useState<number[]>([]);
    const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
    const [cameraState, setCameraState] = useState<CameraState>('initializing');
    const [personState, setPersonState] = useState<PersonState>('checking');
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    const currentQuestion = questions[activeQuestionIndex];

    const lastLoggedAtRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const tabSwitchCountRef = useRef(0);
    const pendingSavesRef = useRef(new Set<Promise<boolean>>());
    const isSubmittingRef = useRef(false);
    const detectionIntervalRef = useRef<number | null>(null);

    const answeredCount = useMemo(
        () => questions.filter((question) => selectedOptions[question.id] !== undefined).length,
        [questions, selectedOptions],
    );

    const canAccessQuestions = cameraState === 'live' && personState === 'detected' && isFullscreen;

    const addWarning = (message: string) => {
        setProctoringWarnings((warnings) => {
            if (warnings[warnings.length - 1] === message) {
                return warnings;
            }

            return [...warnings, message];
        });
    };

    const addFailedSave = (questionId: number) => {
        setFailedSaveQuestionIds((currentIds) => {
            if (currentIds.includes(questionId)) {
                return currentIds;
            }

            return [...currentIds, questionId];
        });
    };

    const clearFailedSave = (questionId: number) => {
        setFailedSaveQuestionIds((currentIds) => currentIds.filter((id) => id !== questionId));
    };

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

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        try {
            await fetch(`/candidate/assessments/${assessment.id}/proctor-events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    event_type: eventType,
                    severity,
                    metadata,
                    occurred_at: new Date().toISOString(),
                }),
            });
        } catch {
            return;
        }
    };

    const requestExamFullscreen = async (): Promise<boolean> => {
        if (!document.documentElement.requestFullscreen) {
            addWarning('Fullscreen mode is not supported in this browser.');
            void logProctoringEvent('fullscreen_unsupported', 'high');
            return false;
        }

        if (document.fullscreenElement) {
            return true;
        }

        try {
            await document.documentElement.requestFullscreen();
            return true;
        } catch {
            addWarning('Fullscreen permission denied. Test remains locked until fullscreen is enabled.');
            void logProctoringEvent('fullscreen_denied', 'high');
            return false;
        }
    };

    const flushPendingSaves = async (): Promise<void> => {
        const pending = Array.from(pendingSavesRef.current);

        if (pending.length === 0) {
            return;
        }

        await Promise.allSettled(pending);
    };

    const submitAssessment = async () => {
        if (isSubmittingRef.current) {
            return;
        }

        setIsSubmitting(true);
        isSubmittingRef.current = true;

        await flushPendingSaves();

        if (failedSaveQuestionIds.length > 0) {
            addWarning('Some answers are still not saved. Please reselect those answers before submitting.');
            setIsSubmitting(false);
            isSubmittingRef.current = false;
            return;
        }

        router.post(
            submit({ assessment: assessment.id }).url,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    setIsSubmitting(false);
                    isSubmittingRef.current = false;
                },
                onFinish: () => {
                    isSubmittingRef.current = false;
                },
            },
        );
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

        void submitAssessment();
    }, [isSubmitting, remainingSeconds]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const inFullscreen = Boolean(document.fullscreenElement);
            setIsFullscreen(inFullscreen);

            if (!inFullscreen) {
                addWarning('Fullscreen exited. Test remains locked until fullscreen is re-enabled.');
                void logProctoringEvent('fullscreen_exit', 'high');
            }
        };

        void requestExamFullscreen();
        setIsFullscreen(Boolean(document.fullscreenElement));

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const setupWebcamSignal = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraState('unsupported');
                setPersonState('unsupported');

                if (mounted) {
                    addWarning('Camera API unavailable. Test remains locked.');
                }

                await logProctoringEvent('webcam_unavailable', 'high');

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
                setPersonState('not_detected');

                if (mounted) {
                    addWarning('Camera permission denied. Test remains locked until camera is allowed.');
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
                    addWarning('Warning: Tab switch detected. More than 3 switches will auto-submit your test.');
                } else {
                    addWarning(`Tab switch detected (${nextCount}).`);
                }

                void logProctoringEvent('tab_hidden', 'high', { tab_switch_count: nextCount });

                if (nextCount > 3 && !isSubmittingRef.current) {
                    addWarning('Tab switch limit exceeded. Auto-submitting your test.');
                    void logProctoringEvent('tab_switch_limit_exceeded', 'high', { tab_switch_count: nextCount });
                    void submitAssessment();
                }
            }
        };

        const onBlur = () => {
            addWarning('Window focus lost.');
            void logProctoringEvent('window_blur', 'medium');
        };

        const onCopy = () => {
            void logProctoringEvent('copy_attempt', 'medium');
        };

        const onPaste = () => {
            void logProctoringEvent('paste_attempt', 'high');
        };

        const onContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            addWarning('Right-click is blocked during the test.');
            void logProctoringEvent('context_menu_attempt', 'medium');
        };

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isSubmittingRef.current) {
                event.preventDefault();
                event.returnValue = 'Your test is still in progress.';
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const blockedShortcuts =
                event.key === 'F5' ||
                ((event.ctrlKey || event.metaKey) && ['r', 'w', 't', 'n', 'l', 'p'].includes(key)) ||
                (event.altKey && key === 'arrowleft');

            if (blockedShortcuts) {
                event.preventDefault();
                addWarning('Navigation shortcuts are blocked until the test is submitted.');
                void logProctoringEvent('shortcut_blocked', 'medium', { key: event.key });
            }
        };

        history.pushState(null, '', window.location.href);
        const onPopState = () => {
            history.pushState(null, '', window.location.href);
            addWarning('Back navigation is blocked until the test is submitted.');
            void logProctoringEvent('back_navigation_blocked', 'high');
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        document.addEventListener('copy', onCopy);
        document.addEventListener('paste', onPaste);
        document.addEventListener('contextmenu', onContextMenu);
        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('popstate', onPopState);

        return () => {
            mounted = false;
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('paste', onPaste);
            document.removeEventListener('contextmenu', onContextMenu);
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('popstate', onPopState);

            if (streamRef.current !== null) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (detectionIntervalRef.current !== null) {
                window.clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }

            if (document.fullscreenElement) {
                void document.exitFullscreen();
            }
        };
    }, [assessment.id]);

    useEffect(() => {
        if (cameraState !== 'live') {
            return;
        }

        const FaceDetectorImpl = (window as Window & { FaceDetector?: FaceDetectorCtor }).FaceDetector;

        if (!FaceDetectorImpl) {
            setPersonState('unsupported');
            addWarning('Person detection is unsupported in this browser. Test remains locked.');
            void logProctoringEvent('person_detection_unsupported', 'high');
            return;
        }

        const detector = new FaceDetectorImpl({ fastMode: true, maxDetectedFaces: 2 });

        const detectPerson = async () => {
            if (videoPreviewRef.current === null || videoPreviewRef.current.readyState < 2) {
                return;
            }

            try {
                const faces = await detector.detect(videoPreviewRef.current);

                if (faces.length === 1) {
                    setPersonState('detected');
                    void logProctoringEvent('person_detected', 'low');
                    return;
                }

                if (faces.length === 0) {
                    setPersonState('not_detected');
                    addWarning('No person detected on camera. Test is locked until one person is visible.');
                    void logProctoringEvent('no_person_detected', 'high');
                    return;
                }

                setPersonState('not_detected');
                addWarning('Multiple people detected on camera. Only one person is allowed.');
                void logProctoringEvent('multiple_people_detected', 'high', { detected_faces: faces.length });
            } catch {
                setPersonState('not_detected');
                addWarning('Person detection failed. Keep camera visible and try again.');
                void logProctoringEvent('person_detection_failed', 'high');
            }
        };

        setPersonState('checking');
        void detectPerson();

        detectionIntervalRef.current = window.setInterval(() => {
            void detectPerson();
        }, 1800);

        return () => {
            if (detectionIntervalRef.current !== null) {
                window.clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
        };
    }, [cameraState]);

    const persistAnswer = async (questionId: number, selectedOptionId: number): Promise<boolean> => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        for (let attemptCount = 1; attemptCount <= 3; attemptCount += 1) {
            try {
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

                clearFailedSave(questionId);
                setLastSavedAt(new Date().toLocaleTimeString());
                return true;
            } catch {
                if (attemptCount === 3) {
                    addFailedSave(questionId);
                    addWarning('Could not save the selected answer. Please select again before submitting.');
                    void logProctoringEvent('answer_save_failed', 'medium', { question_id: questionId });
                    return false;
                }

                await new Promise((resolve) => {
                    window.setTimeout(resolve, 250 * attemptCount);
                });
            }
        }

        return false;
    };

    const selectOption = async (questionId: number, selectedOptionId: number) => {
        if (!canAccessQuestions) {
            addWarning('Test is locked. Enable camera + person detection + fullscreen to continue.');
            return;
        }

        setSelectedOptions((currentOptions) => ({
            ...currentOptions,
            [questionId]: selectedOptionId,
        }));

        setPendingSaveCount((currentCount) => currentCount + 1);

        const savePromise = persistAnswer(questionId, selectedOptionId);
        pendingSavesRef.current.add(savePromise);

        try {
            await savePromise;
        } finally {
            pendingSavesRef.current.delete(savePromise);
            setPendingSaveCount((currentCount) => Math.max(0, currentCount - 1));
        }
    };

    const minutes = Math.floor(remainingSeconds / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(remainingSeconds % 60)
        .toString()
        .padStart(2, '0');

    return (
        <>
            <Head title={`Take ${assessment.title}`} />

            <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 text-slate-100">
                <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

                <div className="fixed top-4 right-4 z-30 w-56 overflow-hidden rounded-xl border border-white/20 bg-black/75 shadow-lg backdrop-blur-sm">
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

                <div className="relative z-10 grid h-full w-full gap-4 overflow-y-auto p-4 sm:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-sm">
                        <div>
                            <h2 className="text-base font-semibold text-white">{assessment.title}</h2>
                            <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-300">
                                <Clock3 className="size-4 text-cyan-400" />
                                Time left: {minutes}:{seconds}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3 text-sm">
                            <p className="inline-flex items-center gap-1 font-medium text-white">
                                <ListChecks className="size-4 text-indigo-400" />
                                Progress
                            </p>
                            <p className="mt-1 text-slate-300">
                                {answeredCount} / {questions.length} answered
                            </p>
                            <p className="mt-1 text-slate-300">Tab switches: {tabSwitchCount}</p>
                            <p className="mt-1 text-slate-300">Pending saves: {pendingSaveCount}</p>
                            <p className="mt-1 text-slate-300">Unsaved answers: {failedSaveQuestionIds.length}</p>
                            <p className="mt-1 text-slate-300">Last saved: {lastSavedAt ?? 'Not yet'}</p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3 text-xs text-slate-200">
                            <p>
                                Fullscreen: <span className={isFullscreen ? 'text-emerald-300' : 'text-rose-300'}>{isFullscreen ? 'On' : 'Off'}</span>
                            </p>
                            <p>
                                Camera: <span className={cameraState === 'live' ? 'text-emerald-300' : 'text-rose-300'}>{cameraState}</span>
                            </p>
                            <p>
                                Person detection:{' '}
                                <span className={personState === 'detected' ? 'text-emerald-300' : 'text-rose-300'}>
                                    {personState.replace('_', ' ')}
                                </span>
                            </p>
                        </div>

                        {proctoringWarnings.length > 0 && (
                            <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-3 text-xs text-amber-100">
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
                                                ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                                                : isAnswered
                                                  ? 'border-emerald-300/80 bg-emerald-500/15 text-emerald-100'
                                                  : 'border-white/15 bg-slate-900/90 text-slate-200'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            disabled={isSubmitting || pendingSaveCount > 0}
                            onClick={() => {
                                void submitAssessment();
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400 bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <CheckCircle2 className="size-4" />
                            {isSubmitting ? 'Submitting...' : pendingSaveCount > 0 ? 'Saving answers...' : 'Submit Test'}
                        </button>
                    </aside>

                    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-sm">
                        {!canAccessQuestions && (
                            <div className="mb-4 rounded-xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                                <p className="font-semibold">Test locked</p>
                                <p className="mt-1">Enable fullscreen and make sure exactly one person is visible on camera to continue.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void requestExamFullscreen();
                                    }}
                                    className="mt-3 rounded-md border border-rose-200/50 bg-rose-100/10 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100/20"
                                >
                                    Retry Fullscreen
                                </button>
                            </div>
                        )}

                        {currentQuestion ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="rounded-full border border-white/20 px-2 py-1 text-xs text-slate-300">
                                        Question {activeQuestionIndex + 1} / {questions.length}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <span className="rounded-full border border-white/20 px-2 py-1 capitalize">
                                            {currentQuestion.difficulty}
                                        </span>
                                        <span className="rounded-full border border-white/20 px-2 py-1">
                                            {currentQuestion.points} pts
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold leading-relaxed text-white">{currentQuestion.question_text}</h3>

                                <div className="space-y-2">
                                    {currentQuestion.options.map((option, optionIndex) => {
                                        const isSelected = selectedOptions[currentQuestion.id] === option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                disabled={!canAccessQuestions || isSubmitting}
                                                onClick={() => {
                                                    void selectOption(currentQuestion.id, option.id);
                                                }}
                                                className={`w-full rounded-xl border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                    isSelected
                                                        ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
                                                        : 'border-white/15 bg-slate-800/80 text-slate-100 hover:bg-slate-700/70'
                                                }`}
                                            >
                                                <span className="mr-2 font-semibold text-slate-300">{String.fromCharCode(65 + optionIndex)}.</span>
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
                                        className="rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={activeQuestionIndex === questions.length - 1}
                                        onClick={() =>
                                            setActiveQuestionIndex((currentIndex) => Math.min(questions.length - 1, currentIndex + 1))
                                        }
                                        className="rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-300">No questions loaded.</p>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
