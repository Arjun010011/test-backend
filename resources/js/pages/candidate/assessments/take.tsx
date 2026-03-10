import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    ListChecks,
    ShieldAlert,
    Video,
} from 'lucide-react';
import type { KeyboardEventHandler } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { answer, submit } from '@/routes/candidate/assessments';
import {
    runSamples,
    submitSolution,
} from '@/routes/candidate/assessments/questions';
import { show as submissionShow } from '@/routes/candidate/assessments/questions/submissions';

type Option = {
    id: number;
    option_text: string;
};

type CodingSampleCase = {
    id: number;
    stdin: string | null;
    expected_stdout: string;
};

type CodingQuestionMetadata = {
    slug: string;
    topic_label: string;
    statement_md: string;
    default_language: string;
    languages: string[];
    starter_code_by_language: Record<string, string>;
    time_limit_ms: number;
    memory_limit_mb: number;
    sample_cases: CodingSampleCase[];
};

type Question = {
    id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'coding' | string;
    category: string;
    difficulty: string;
    points: number;
    options: Option[];
    metadata?: CodingQuestionMetadata;
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
    existing_mcq_responses: Record<string, number>;
    existing_code_drafts: Record<
        string,
        { language: string | null; code: string | null }
    >;
    coding_submissions: Record<
        string,
        {
            latest: {
                id: number;
                status: string;
                verdict: string | null;
                hidden_passed_count: number | null;
                hidden_total_count: number | null;
                sample_passed_count: number | null;
                sample_total_count: number | null;
                created_at: string | null;
            } | null;
            best_passed_hidden: boolean;
            total_submissions: number;
        }
    >;
    remaining_time: number;
};

type CameraState = 'live' | 'blocked' | 'unsupported' | 'initializing';
type PersonState = 'checking' | 'detected' | 'not_detected' | 'unsupported';
type MediaPipeFaceDetector = {
    detectForVideo: (
        video: HTMLVideoElement,
        timestampMs: number,
    ) => { detections?: Array<unknown> };
    close?: () => void;
};
type MediaPipeFaceLandmarker = {
    detectForVideo: (
        video: HTMLVideoElement,
        timestampMs: number,
    ) => {
        faceLandmarks?: Array<Array<{ x: number; y: number }>>;
    };
    close?: () => void;
};
type FullscreenDocument = Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
};
type FullscreenElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
};

type JudgeCaseResult = {
    id: number;
    is_sample: boolean;
    verdict: string;
    passed: boolean;
    runtime_ms: number;
    stdout_preview: string;
    stderr_preview: string;
};

type JudgeRunResult = {
    verdict: string;
    compile_output: string | null;
    case_results: JudgeCaseResult[];
    sample_passed_count: number;
    sample_total_count: number;
    hidden_passed_count: number;
    hidden_total_count: number;
};

type CodingSubmissionSummary = {
    id: number;
    status: string;
    verdict: string | null;
    compile_output: string | null;
    sample_passed_count: number | null;
    sample_total_count: number | null;
    hidden_passed_count: number | null;
    hidden_total_count: number | null;
    created_at: string | null;
};

const escapeHtml = (value: string): string => {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
};

type TokenStyle =
    | 'keyword'
    | 'type'
    | 'string'
    | 'comment'
    | 'number'
    | 'plain';

const tokenClassName = (style: TokenStyle): string => {
    return (
        {
            keyword: 'text-fuchsia-300',
            type: 'text-cyan-300',
            string: 'text-amber-200',
            comment: 'text-slate-400 italic',
            number: 'text-emerald-200',
            plain: 'text-slate-100',
        }[style] ?? 'text-slate-100'
    );
};

type LanguageKey = 'java' | 'python' | 'javascript';

const highlightCode = (source: string, language: LanguageKey): string => {
    const javaKeywords = new Set([
        'abstract',
        'assert',
        'boolean',
        'break',
        'byte',
        'case',
        'catch',
        'char',
        'class',
        'const',
        'continue',
        'default',
        'do',
        'double',
        'else',
        'enum',
        'extends',
        'final',
        'finally',
        'float',
        'for',
        'goto',
        'if',
        'implements',
        'import',
        'instanceof',
        'int',
        'interface',
        'long',
        'native',
        'new',
        'package',
        'private',
        'protected',
        'public',
        'return',
        'short',
        'static',
        'strictfp',
        'super',
        'switch',
        'synchronized',
        'this',
        'throw',
        'throws',
        'transient',
        'try',
        'void',
        'volatile',
        'while',
        'true',
        'false',
        'null',
    ]);

    const jsKeywords = new Set([
        'await',
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'debugger',
        'default',
        'delete',
        'do',
        'else',
        'export',
        'extends',
        'false',
        'finally',
        'for',
        'function',
        'if',
        'import',
        'in',
        'instanceof',
        'let',
        'new',
        'null',
        'return',
        'super',
        'switch',
        'this',
        'throw',
        'true',
        'try',
        'typeof',
        'var',
        'void',
        'while',
        'with',
        'yield',
    ]);

    const pyKeywords = new Set([
        'and',
        'as',
        'assert',
        'break',
        'class',
        'continue',
        'def',
        'del',
        'elif',
        'else',
        'except',
        'False',
        'finally',
        'for',
        'from',
        'global',
        'if',
        'import',
        'in',
        'is',
        'lambda',
        'None',
        'nonlocal',
        'not',
        'or',
        'pass',
        'raise',
        'return',
        'True',
        'try',
        'while',
        'with',
        'yield',
    ]);

    const typeWords = new Set([
        'String',
        'Integer',
        'Long',
        'Double',
        'Float',
        'Boolean',
        'Character',
        'Object',
        'List',
        'ArrayList',
        'Map',
        'HashMap',
        'Set',
        'HashSet',
        'Queue',
        'Deque',
        'LinkedList',
        'Math',
        'System',
        'console',
        'Number',
        'Array',
        'Set',
        'str',
        'int',
        'float',
        'bool',
        'list',
        'dict',
        'set',
        'tuple',
    ]);

    const keywords =
        language === 'python'
            ? pyKeywords
            : language === 'javascript'
              ? jsKeywords
              : javaKeywords;

    const normalized = source.replaceAll('\t', '    ');

    const out: string[] = [];

    const push = (text: string, style: TokenStyle) => {
        const escaped = escapeHtml(text);
        if (style === 'plain') {
            out.push(escaped);
            return;
        }

        out.push(`<span class="${tokenClassName(style)}">${escaped}</span>`);
    };

    const isWordStart = (ch: string) => /[A-Za-z_]/.test(ch);
    const isWord = (ch: string) => /[A-Za-z0-9_]/.test(ch);
    const isDigit = (ch: string) => /[0-9]/.test(ch);

    let i = 0;
    let state:
        | 'normal'
        | 'string_single'
        | 'string_double'
        | 'string_backtick'
        | 'py_triple_single'
        | 'py_triple_double'
        | 'line_comment'
        | 'block_comment' = 'normal';
    let buffer = '';

    const flushBuffer = () => {
        if (buffer === '') {
            return;
        }

        if (keywords.has(buffer)) {
            push(buffer, 'keyword');
        } else if (typeWords.has(buffer)) {
            push(buffer, 'type');
        } else if (/^(0|[1-9][0-9]*)$/.test(buffer)) {
            push(buffer, 'number');
        } else {
            push(buffer, 'plain');
        }

        buffer = '';
    };

    while (i < normalized.length) {
        const ch = normalized[i] ?? '';
        const next = normalized[i + 1] ?? '';
        const next2 = normalized[i + 2] ?? '';

        if (state === 'normal') {
            if (language === 'python') {
                if (ch === '#') {
                    flushBuffer();
                    state = 'line_comment';
                    buffer = '#';
                    i += 1;
                    continue;
                }

                if (ch === "'" && next === "'" && next2 === "'") {
                    flushBuffer();
                    state = 'py_triple_single';
                    buffer = "'''";
                    i += 3;
                    continue;
                }

                if (ch === '"' && next === '"' && next2 === '"') {
                    flushBuffer();
                    state = 'py_triple_double';
                    buffer = '"""';
                    i += 3;
                    continue;
                }
            } else {
                if (ch === '/' && next === '/') {
                    flushBuffer();
                    state = 'line_comment';
                    buffer = '//';
                    i += 2;
                    continue;
                }

                if (ch === '/' && next === '*') {
                    flushBuffer();
                    state = 'block_comment';
                    buffer = '/*';
                    i += 2;
                    continue;
                }
            }

            if (ch === "'") {
                flushBuffer();
                state = 'string_single';
                buffer = "'";
                i += 1;
                continue;
            }

            if (ch === '"') {
                flushBuffer();
                state = 'string_double';
                buffer = '"';
                i += 1;
                continue;
            }

            if (language === 'javascript' && ch === '`') {
                flushBuffer();
                state = 'string_backtick';
                buffer = '`';
                i += 1;
                continue;
            }

            if (isWordStart(ch)) {
                buffer += ch;
                i += 1;
                while (i < normalized.length && isWord(normalized[i] ?? '')) {
                    buffer += normalized[i] ?? '';
                    i += 1;
                }
                flushBuffer();
                continue;
            }

            if (isDigit(ch)) {
                buffer += ch;
                i += 1;
                while (i < normalized.length && isDigit(normalized[i] ?? '')) {
                    buffer += normalized[i] ?? '';
                    i += 1;
                }
                flushBuffer();
                continue;
            }

            push(ch, 'plain');
            i += 1;
            continue;
        }

        if (state === 'line_comment') {
            if (ch === '\n') {
                push(buffer, 'comment');
                buffer = '';
                state = 'normal';
                push('\n', 'plain');
                i += 1;
                continue;
            }

            buffer += ch;
            i += 1;
            continue;
        }

        if (state === 'block_comment') {
            if (ch === '*' && next === '/') {
                buffer += '*/';
                push(buffer, 'comment');
                buffer = '';
                state = 'normal';
                i += 2;
                continue;
            }

            buffer += ch;
            i += 1;
            continue;
        }

        if (state === 'py_triple_single') {
            if (ch === "'" && next === "'" && next2 === "'") {
                buffer += "'''";
                push(buffer, 'string');
                buffer = '';
                state = 'normal';
                i += 3;
                continue;
            }

            buffer += ch;
            i += 1;
            continue;
        }

        if (state === 'py_triple_double') {
            if (ch === '"' && next === '"' && next2 === '"') {
                buffer += '"""';
                push(buffer, 'string');
                buffer = '';
                state = 'normal';
                i += 3;
                continue;
            }

            buffer += ch;
            i += 1;
            continue;
        }

        const isEscaped = ch === '\\';
        const isStringEnd =
            (state === 'string_single' && ch === "'") ||
            (state === 'string_double' && ch === '"') ||
            (state === 'string_backtick' && ch === '`');

        buffer += ch;
        i += 1;

        if (isEscaped && i < normalized.length) {
            buffer += normalized[i] ?? '';
            i += 1;
            continue;
        }

        if (isStringEnd) {
            push(buffer, 'string');
            buffer = '';
            state = 'normal';
        }
    }

    if (buffer !== '') {
        const tailStyle: TokenStyle =
            state === 'line_comment' || state === 'block_comment'
                ? 'comment'
                : state.startsWith('string') ||
                    state.startsWith('py_triple')
                  ? 'string'
                  : 'plain';
        push(buffer, tailStyle);
    }

    return out.join('');
};

const verdictLabel = (verdict: string | null): string => {
    switch (verdict) {
        case 'AC':
            return 'Accepted';
        case 'WA':
            return 'Wrong Answer';
        case 'CE':
            return 'Compilation Error';
        case 'TLE':
            return 'Time Limit Exceeded';
        case 'RE':
            return 'Runtime Error';
        default:
            return verdict ? verdict : 'Unknown';
    }
};

const verdictTone = (
    verdict: string | null,
): 'success' | 'danger' | 'neutral' => {
    if (verdict === 'AC') {
        return 'success';
    }

    if (
        verdict === 'CE' ||
        verdict === 'TLE' ||
        verdict === 'RE' ||
        verdict === 'WA'
    ) {
        return 'danger';
    }

    return 'neutral';
};

const tonePillClass = (
    tone: 'success' | 'danger' | 'neutral',
): string => {
    return (
        {
            success:
                'border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
            danger: 'border-rose-300 bg-rose-500/10 text-rose-700 dark:text-rose-200',
            neutral:
                'border-slate-300 bg-slate-500/10 text-slate-700 dark:text-slate-200',
        }[tone] ?? 'border-slate-300 bg-slate-500/10 text-slate-700'
    );
};

function HighlightedCodeEditor({
    value,
    language,
    disabled,
    onChange,
    onKeyDown,
}: {
    value: string;
    language: LanguageKey;
    disabled: boolean;
    onChange: (nextValue: string) => void;
    onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
}) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const preRef = useRef<HTMLPreElement | null>(null);

    const highlighted = useMemo(() => {
        return highlightCode(value, language);
    }, [value, language]);

    const syncScroll = () => {
        if (!textareaRef.current || !preRef.current) {
            return;
        }

        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    };

    return (
        <div className="mt-3 w-full">
            <div className="relative w-full overflow-hidden rounded-lg border border-border/70 bg-slate-950/95 shadow-inner">
                <pre
                    ref={preRef}
                    aria-hidden={true}
                    className="pointer-events-none absolute inset-0 overflow-auto p-3 font-mono text-xs leading-relaxed text-slate-100"
                    style={{ tabSize: 4 }}
                >
                    <code
                        dangerouslySetInnerHTML={{
                            __html: highlighted + '\n',
                        }}
                    />
                </pre>

                <textarea
                    ref={textareaRef}
                    value={value}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={onKeyDown}
                    onScroll={syncScroll}
                    rows={18}
                    spellCheck={false}
                    className="relative z-10 w-full resize-y bg-transparent p-3 font-mono text-xs leading-relaxed text-transparent caret-slate-100 selection:bg-cyan-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ tabSize: 4 }}
                />
            </div>
        </div>
    );
}

const getFullscreenElement = (): Element | null => {
    if (typeof document === 'undefined') {
        return null;
    }

    const fullscreenDocument = document as FullscreenDocument;

    return (
        document.fullscreenElement ??
        fullscreenDocument.webkitFullscreenElement ??
        fullscreenDocument.msFullscreenElement ??
        null
    );
};

const isBrowserWindowFullscreen = (): boolean => {
    if (typeof window === 'undefined' || typeof screen === 'undefined') {
        return false;
    }

    const heightDelta = Math.abs(window.innerHeight - screen.height);
    const widthDelta = Math.abs(window.innerWidth - screen.width);

    return heightDelta <= 8 && widthDelta <= 8;
};

const isInFullscreenMode = (): boolean => {
    return getFullscreenElement() !== null || isBrowserWindowFullscreen();
};

const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') {
        return null;
    }

    const cookie = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(`${name}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.split('=').slice(1).join('='));
};

export default function CandidateAssessmentsTake({
    assessment,
    attempt,
    questions,
    existing_mcq_responses,
    existing_code_drafts,
    coding_submissions,
    remaining_time,
}: Props) {
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(remaining_time);
    const [selectedOptions, setSelectedOptions] = useState<
        Record<number, number>
    >(
        Object.entries(existing_mcq_responses).reduce<Record<number, number>>(
            (carry, [questionId, optionId]) => {
                const parsedQuestionId = Number(questionId);
                if (Number.isFinite(parsedQuestionId)) {
                    carry[parsedQuestionId] = optionId;
                }

                return carry;
            },
            {},
        ),
    );
    const [codeDrafts, setCodeDrafts] = useState<Record<number, string>>(
        Object.entries(existing_code_drafts).reduce<Record<number, string>>(
            (carry, [questionId, entry]) => {
                const parsedQuestionId = Number(questionId);
                if (Number.isFinite(parsedQuestionId)) {
                    if (entry.code) {
                        carry[parsedQuestionId] = entry.code;
                    }
                }

                return carry;
            },
            {},
        ),
    );
    const [selectedLanguages, setSelectedLanguages] = useState<
        Record<number, string>
    >(
        Object.entries(existing_code_drafts).reduce<Record<number, string>>(
            (carry, [questionId, entry]) => {
                const parsedQuestionId = Number(questionId);
                if (Number.isFinite(parsedQuestionId)) {
                    if (entry.language) {
                        carry[parsedQuestionId] = entry.language;
                    }
                }

                return carry;
            },
            {},
        ),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingSaveCount, setPendingSaveCount] = useState(0);
    const [failedSaveQuestionIds, setFailedSaveQuestionIds] = useState<
        number[]
    >([]);
    const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
    const [cameraState, setCameraState] = useState<CameraState>('initializing');
    const [personState, setPersonState] = useState<PersonState>('checking');
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [runResults, setRunResults] = useState<
        Record<number, JudgeRunResult | null>
    >({});
    const [isRunningSamples, setIsRunningSamples] = useState<
        Record<number, boolean>
    >({});
    const [latestSubmission, setLatestSubmission] = useState<
        Record<number, CodingSubmissionSummary | null>
    >(
        Object.entries(coding_submissions).reduce<
            Record<number, CodingSubmissionSummary | null>
        >((carry, [questionId, summary]) => {
            const parsedQuestionId = Number(questionId);
            if (Number.isFinite(parsedQuestionId)) {
                carry[parsedQuestionId] = summary.latest
                    ? { ...summary.latest, compile_output: null }
                    : null;
            }

            return carry;
        }, {}),
    );
    const [isSubmittingSolution, setIsSubmittingSolution] = useState<
        Record<number, boolean>
    >({});

    const currentQuestion = questions[activeQuestionIndex];

    useEffect(() => {
        if (!currentQuestion || currentQuestion.question_type !== 'coding') {
            return;
        }

        const questionId = currentQuestion.id;
        const language = selectedLanguageForQuestion(currentQuestion);

        if (selectedLanguages[questionId] === undefined) {
            setSelectedLanguages((current) => ({
                ...current,
                [questionId]: language,
            }));
        }

        try {
            const stored = window.localStorage.getItem(
                `coding_draft:${attempt.id}:${questionId}:${language}`,
            );

            if (stored !== null) {
                setCodeDrafts((current) => ({
                    ...current,
                    [questionId]: stored,
                }));
            } else if (codeDrafts[questionId] === undefined) {
                const starter =
                    currentQuestion.metadata?.starter_code_by_language?.[
                        language
                    ] ?? '';
                setCodeDrafts((current) => ({
                    ...current,
                    [questionId]: starter,
                }));
            }
        } catch {
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeQuestionIndex]);

    const lastLoggedAtRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const tabSwitchCountRef = useRef(0);
    const pendingSavesRef = useRef(new Set<Promise<boolean>>());
    const isSubmittingRef = useRef(false);
    const detectionIntervalRef = useRef<number | null>(null);
    const detectionFailureCountRef = useRef(0);
    const previousNosePositionRef = useRef<{ x: number; y: number } | null>(
        null,
    );
    const lastMovementWarningAtRef = useRef(0);
    const mediaPipeIssueStrikesRef = useRef<Record<string, number>>({});
    const answerAbortControllersRef = useRef(
        new Map<number, AbortController>(),
    );
    const answerRequestVersionRef = useRef(new Map<number, number>());
    const codeDraftSaveTimeoutsRef = useRef(new Map<number, number>());
    const submissionPollIntervalsRef = useRef(new Map<number, number>());
    const failedSaveQuestionIdsRef = useRef<number[]>([]);

    useEffect(() => {
        failedSaveQuestionIdsRef.current = failedSaveQuestionIds;
    }, [failedSaveQuestionIds]);

    const answeredCount = useMemo(() => {
        return questions.filter((question) => {
            if (question.question_type === 'coding') {
                const draft = codeDrafts[question.id];
                return typeof draft === 'string' && draft.trim() !== '';
            }

            return selectedOptions[question.id] !== undefined;
        }).length;
    }, [codeDrafts, questions, selectedOptions]);

    const canAccessQuestions =
        cameraState === 'live' &&
        (personState === 'detected' ||
            personState === 'unsupported' ||
            personState === 'checking') &&
        isFullscreen;

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
        setFailedSaveQuestionIds((currentIds) =>
            currentIds.filter((id) => id !== questionId),
        );
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

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        const xsrfToken = getCookieValue('XSRF-TOKEN');

        try {
            await fetch(
                `/candidate/assessments/${assessment.id}/proctor-events`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                    },
                    credentials: 'same-origin',
                    keepalive: true,
                    body: JSON.stringify({
                        event_type: eventType,
                        severity,
                        metadata,
                        occurred_at: new Date().toISOString(),
                    }),
                },
            );
        } catch {
            return;
        }
    };

    const requestExamFullscreen = async (): Promise<boolean> => {
        const fullscreenElement = document.documentElement as FullscreenElement;
        const requestFullscreen =
            fullscreenElement.requestFullscreen ??
            fullscreenElement.webkitRequestFullscreen ??
            fullscreenElement.msRequestFullscreen;

        if (!requestFullscreen) {
            addWarning('Fullscreen mode is not supported in this browser.');
            void logProctoringEvent('fullscreen_unsupported', 'high');
            const inFullscreen = isInFullscreenMode();
            setIsFullscreen(inFullscreen);
            return inFullscreen;
        }

        if (isInFullscreenMode()) {
            return true;
        }

        try {
            await requestFullscreen.call(fullscreenElement);
            const inFullscreen = isInFullscreenMode();

            if (inFullscreen) {
                return true;
            }

            addWarning(
                'Fullscreen permission denied. Test remains locked until fullscreen is enabled.',
            );
            void logProctoringEvent('fullscreen_denied', 'high');
            return false;
        } catch {
            if (isInFullscreenMode()) {
                return true;
            }

            addWarning(
                'Fullscreen permission denied. Test remains locked until fullscreen is enabled.',
            );
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

        if (failedSaveQuestionIdsRef.current.length > 0) {
            addWarning(
                'Some answers are still not saved. Please reselect those answers before submitting.',
            );
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

    const resetMediaPipeIssueStrike = (issueKey: string): void => {
        if (mediaPipeIssueStrikesRef.current[issueKey] !== undefined) {
            delete mediaPipeIssueStrikesRef.current[issueKey];
        }
    };

    const registerMediaPipeIssue = (
        issueKey: string,
        firstWarning: string,
        persistWarning: string,
        eventType: string,
        metadata: Record<string, unknown> = {},
    ): void => {
        const nextStrike =
            (mediaPipeIssueStrikesRef.current[issueKey] ?? 0) + 1;
        mediaPipeIssueStrikesRef.current[issueKey] = nextStrike;

        if (nextStrike === 1) {
            addWarning(firstWarning);
            void logProctoringEvent(eventType, 'high', {
                strike: nextStrike,
                ...metadata,
            });
            return;
        }

        addWarning(persistWarning);
        void logProctoringEvent(`${eventType}_persistent`, 'high', {
            strike: nextStrike,
            ...metadata,
        });
        void submitAssessment();
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
        return () => {
            submissionPollIntervalsRef.current.forEach((intervalId) => {
                window.clearInterval(intervalId);
            });
            submissionPollIntervalsRef.current.clear();

            codeDraftSaveTimeoutsRef.current.forEach((timeoutId) => {
                window.clearTimeout(timeoutId);
            });
            codeDraftSaveTimeoutsRef.current.clear();
        };
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const inFullscreen = isInFullscreenMode();
            setIsFullscreen(inFullscreen);

            if (!inFullscreen) {
                addWarning(
                    'Fullscreen exited. Test remains locked until fullscreen is re-enabled.',
                );
                void logProctoringEvent('fullscreen_exit', 'high');
            }
        };

        void requestExamFullscreen();
        setIsFullscreen(isInFullscreenMode());

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener(
            'webkitfullscreenchange',
            handleFullscreenChange,
        );
        window.addEventListener('resize', handleFullscreenChange);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
            document.removeEventListener(
                'webkitfullscreenchange',
                handleFullscreenChange,
            );
            window.removeEventListener('resize', handleFullscreenChange);
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
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });

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
                    addWarning(
                        'Camera permission denied. Test remains locked until camera is allowed.',
                    );
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
                    addWarning(
                        'Warning: Tab switch detected. More than 3 switches will auto-submit your test.',
                    );
                } else {
                    addWarning(`Tab switch detected (${nextCount}).`);
                }

                void logProctoringEvent('tab_hidden', 'high', {
                    tab_switch_count: nextCount,
                });

                if (nextCount > 3 && !isSubmittingRef.current) {
                    addWarning(
                        'Tab switch limit exceeded. Auto-submitting your test.',
                    );
                    void logProctoringEvent(
                        'tab_switch_limit_exceeded',
                        'high',
                        { tab_switch_count: nextCount },
                    );
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
                ((event.ctrlKey || event.metaKey) &&
                    ['r', 'w', 't', 'n', 'l', 'p'].includes(key)) ||
                (event.altKey && key === 'arrowleft');

            if (blockedShortcuts) {
                event.preventDefault();
                addWarning(
                    'Navigation shortcuts are blocked until the test is submitted.',
                );
                void logProctoringEvent('shortcut_blocked', 'medium', {
                    key: event.key,
                });
            }
        };

        history.pushState(null, '', window.location.href);
        const onPopState = () => {
            history.pushState(null, '', window.location.href);
            addWarning(
                'Back navigation is blocked until the test is submitted.',
            );
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
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
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

            answerAbortControllersRef.current.forEach((controller) =>
                controller.abort(),
            );
            answerAbortControllersRef.current.clear();

            if (detectionIntervalRef.current !== null) {
                window.clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }

            const fullscreenDocument = document as FullscreenDocument;
            const exitFullscreen =
                document.exitFullscreen ??
                fullscreenDocument.webkitExitFullscreen ??
                fullscreenDocument.msExitFullscreen;

            if (getFullscreenElement() && exitFullscreen) {
                void exitFullscreen.call(document);
            }
        };
    }, [assessment.id]);

    useEffect(() => {
        if (cameraState !== 'live') {
            return;
        }

        let detector: MediaPipeFaceDetector | null = null;
        let landmarker: MediaPipeFaceLandmarker | null = null;
        let cancelled = false;

        const detectPerson = async () => {
            if (
                videoPreviewRef.current === null ||
                videoPreviewRef.current.readyState < 2 ||
                detector === null
            ) {
                return;
            }

            try {
                const timestamp = performance.now();
                const detectionResult = detector.detectForVideo(
                    videoPreviewRef.current,
                    timestamp,
                );
                const faces = detectionResult.detections ?? [];

                if (faces.length === 1) {
                    detectionFailureCountRef.current = 0;
                    setPersonState('detected');
                    void logProctoringEvent('person_detected', 'low');
                    mediaPipeIssueStrikesRef.current = {};

                    if (landmarker !== null) {
                        const landmarkResult = landmarker.detectForVideo(
                            videoPreviewRef.current,
                            timestamp,
                        );
                        const nose = landmarkResult.faceLandmarks?.[0]?.[1];

                        if (nose) {
                            const previousNose =
                                previousNosePositionRef.current;

                            if (previousNose !== null) {
                                const movementDelta = Math.hypot(
                                    nose.x - previousNose.x,
                                    nose.y - previousNose.y,
                                );
                                const now = Date.now();

                                if (
                                    movementDelta > 0.12 &&
                                    now - lastMovementWarningAtRef.current >
                                        2500
                                ) {
                                    lastMovementWarningAtRef.current = now;
                                    registerMediaPipeIssue(
                                        'excessive_movement',
                                        'Excessive camera movement detected. Keep your face centered.',
                                        'Excessive camera movement persisted. Auto-submitting your test.',
                                        'head_movement_detected',
                                        {
                                            movement_delta: Number(
                                                movementDelta.toFixed(4),
                                            ),
                                        },
                                    );
                                } else if (movementDelta <= 0.12) {
                                    resetMediaPipeIssueStrike(
                                        'excessive_movement',
                                    );
                                    void logProctoringEvent(
                                        'head_stable',
                                        'low',
                                        {
                                            movement_delta: Number(
                                                movementDelta.toFixed(4),
                                            ),
                                        },
                                    );
                                }
                            }

                            previousNosePositionRef.current = {
                                x: nose.x,
                                y: nose.y,
                            };
                        }
                    }

                    return;
                }

                if (faces.length === 0) {
                    setPersonState('not_detected');
                    previousNosePositionRef.current = null;
                    const issueKey = 'no_person_detected';
                    const nextStrike =
                        (mediaPipeIssueStrikesRef.current[issueKey] ?? 0) + 1;
                    mediaPipeIssueStrikesRef.current[issueKey] = nextStrike;

                    const warningLimit = 3;

                    if (nextStrike === 1) {
                        addWarning(
                            'Warning: No person detected on camera. More than 3 warnings will auto-submit your test.',
                        );
                    } else if (nextStrike <= warningLimit) {
                        addWarning(
                            `No person detected warning (${nextStrike}/${warningLimit}).`,
                        );
                    } else {
                        addWarning(
                            'No person detection warning limit exceeded. Auto-submitting your test.',
                        );
                    }

                    void logProctoringEvent('no_person_detected', 'high', {
                        strike: nextStrike,
                        warning_limit: warningLimit,
                    });

                    if (nextStrike > warningLimit && !isSubmittingRef.current) {
                        void logProctoringEvent(
                            'no_person_detected_limit_exceeded',
                            'high',
                            {
                                strike: nextStrike,
                                warning_limit: warningLimit,
                            },
                        );
                        void submitAssessment();
                    }

                    return;
                }

                setPersonState('not_detected');
                previousNosePositionRef.current = null;
                registerMediaPipeIssue(
                    'multiple_people_detected',
                    'Multiple people detected on camera. Warning issued.',
                    'Multiple people still detected. Auto-submitting your test.',
                    'multiple_people_detected',
                    { detected_faces: faces.length },
                );
            } catch {
                detectionFailureCountRef.current += 1;

                if (detectionFailureCountRef.current >= 3) {
                    setPersonState('unsupported');
                    addWarning(
                        'Person detection is unstable in this browser. You can continue, but proctoring checks are limited.',
                    );
                    void logProctoringEvent(
                        'person_detection_unstable',
                        'medium',
                    );
                    return;
                }

                setPersonState('not_detected');
                registerMediaPipeIssue(
                    'person_detection_failed',
                    'Person detection failed. Warning issued; keep camera visible.',
                    'Person detection continues to fail. Auto-submitting your test.',
                    'person_detection_failed',
                );
            }
        };

        const initializeMediaPipe = async () => {
            try {
                const vision = await import('@mediapipe/tasks-vision');
                const fileset = await vision.FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm',
                );

                detector = await vision.FaceDetector.createFromOptions(
                    fileset,
                    {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
                        },
                        runningMode: 'VIDEO',
                        minDetectionConfidence: 0.5,
                    },
                );

                landmarker = await vision.FaceLandmarker.createFromOptions(
                    fileset,
                    {
                        baseOptions: {
                            modelAssetPath:
                                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        },
                        runningMode: 'VIDEO',
                        numFaces: 1,
                        minFaceDetectionConfidence: 0.5,
                        minFacePresenceConfidence: 0.5,
                        minTrackingConfidence: 0.5,
                    },
                );

                if (cancelled) {
                    detector.close?.();
                    landmarker.close?.();
                    return;
                }

                setPersonState('checking');
                void detectPerson();

                detectionIntervalRef.current = window.setInterval(() => {
                    void detectPerson();
                }, 1200);
            } catch {
                if (!cancelled) {
                    setPersonState('unsupported');
                    addWarning(
                        'Person detection is unsupported in this browser. You can continue, but proctoring checks are limited.',
                    );
                    void logProctoringEvent(
                        'person_detection_unsupported',
                        'medium',
                    );
                }
            }
        };

        void initializeMediaPipe();

        return () => {
            cancelled = true;

            if (detectionIntervalRef.current !== null) {
                window.clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }

            previousNosePositionRef.current = null;
            detector?.close?.();
            landmarker?.close?.();
        };
    }, [cameraState]);

    const persistResponse = async (
        questionId: number,
        payload: {
            selected_option_id?: number;
            answer_text?: string;
            language?: string;
        },
        requestVersion: number,
    ): Promise<boolean> => {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        const xsrfToken = getCookieValue('XSRF-TOKEN');

        const previousController =
            answerAbortControllersRef.current.get(questionId);
        if (previousController) {
            previousController.abort();
        }

        for (let attemptCount = 1; attemptCount <= 3; attemptCount += 1) {
            if (
                (answerRequestVersionRef.current.get(questionId) ?? 0) !==
                requestVersion
            ) {
                return true;
            }

            const controller = new AbortController();
            answerAbortControllersRef.current.set(questionId, controller);

            try {
                const response = await fetch(
                    answer({ assessment: assessment.id }).url,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                            ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                        },
                        credentials: 'same-origin',
                        signal: controller.signal,
                        body: JSON.stringify({
                            question_id: questionId,
                            ...payload,
                        }),
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to save answer');
                }

                if (
                    (answerRequestVersionRef.current.get(questionId) ?? 0) !==
                    requestVersion
                ) {
                    return true;
                }

                clearFailedSave(questionId);
                setLastSavedAt(new Date().toLocaleTimeString());
                return true;
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return true;
                }

                if (
                    (answerRequestVersionRef.current.get(questionId) ?? 0) !==
                    requestVersion
                ) {
                    return true;
                }

                if (attemptCount === 3) {
                    addFailedSave(questionId);
                    addWarning(
                        'Could not save your response. Please try again before submitting.',
                    );
                    void logProctoringEvent('answer_save_failed', 'medium', {
                        question_id: questionId,
                    });
                    return false;
                }

                await new Promise((resolve) => {
                    window.setTimeout(resolve, 250 * attemptCount);
                });
            }
        }

        return false;
    };

    const selectOption = async (
        questionId: number,
        selectedOptionId: number,
    ) => {
        if (!canAccessQuestions) {
            addWarning(
                'Test is locked. Enable camera + person detection + fullscreen to continue.',
            );
            return;
        }

        const nextRequestVersion =
            (answerRequestVersionRef.current.get(questionId) ?? 0) + 1;
        answerRequestVersionRef.current.set(questionId, nextRequestVersion);

        setSelectedOptions((currentOptions) => ({
            ...currentOptions,
            [questionId]: selectedOptionId,
        }));

        setPendingSaveCount((currentCount) => currentCount + 1);

        const savePromise = persistResponse(
            questionId,
            { selected_option_id: selectedOptionId },
            nextRequestVersion,
        );
        pendingSavesRef.current.add(savePromise);

        try {
            await savePromise;
        } finally {
            pendingSavesRef.current.delete(savePromise);
            setPendingSaveCount((currentCount) =>
                Math.max(0, currentCount - 1),
            );
        }
    };

    const updateCodeDraft = (questionId: number, nextCode: string) => {
        if (!canAccessQuestions) {
            addWarning(
                'Test is locked. Enable camera + person detection + fullscreen to continue.',
            );
            return;
        }

        setCodeDrafts((currentDrafts) => ({
            ...currentDrafts,
            [questionId]: nextCode,
        }));

        const language = selectedLanguages[questionId] ?? 'java';
        try {
            window.localStorage.setItem(
                `coding_draft:${attempt.id}:${questionId}:${language}`,
                nextCode,
            );
        } catch {
            // ignore
        }

        const existingTimeoutId =
            codeDraftSaveTimeoutsRef.current.get(questionId);
        if (existingTimeoutId !== undefined) {
            window.clearTimeout(existingTimeoutId);
        }

        const timeoutId = window.setTimeout(() => {
            const nextRequestVersion =
                (answerRequestVersionRef.current.get(questionId) ?? 0) + 1;
            answerRequestVersionRef.current.set(questionId, nextRequestVersion);

            setPendingSaveCount((currentCount) => currentCount + 1);
            const savePromise = persistResponse(
                questionId,
                {
                    answer_text: nextCode,
                    language: selectedLanguages[questionId] ?? 'java',
                },
                nextRequestVersion,
            );
            pendingSavesRef.current.add(savePromise);

            void savePromise.finally(() => {
                pendingSavesRef.current.delete(savePromise);
                setPendingSaveCount((currentCount) =>
                    Math.max(0, currentCount - 1),
                );
            });
        }, 450);

        codeDraftSaveTimeoutsRef.current.set(questionId, timeoutId);
    };

    const selectedLanguageForQuestion = (question: Question): string => {
        if (question.question_type !== 'coding') {
            return 'java';
        }

        return (
            selectedLanguages[question.id] ??
            question.metadata?.default_language ??
            question.metadata?.languages?.[0] ??
            'java'
        );
    };

    const resolveSourceCode = (question: Question): string => {
        const draft = codeDrafts[question.id];

        if (typeof draft === 'string' && draft.trim() !== '') {
            return draft;
        }

        const language = selectedLanguageForQuestion(question);

        return question.metadata?.starter_code_by_language?.[language] ?? '';
    };

    const runSampleTests = async (question: Question) => {
        if (!canAccessQuestions) {
            addWarning(
                'Test is locked. Enable camera + person detection + fullscreen to continue.',
            );
            return;
        }

        setIsRunningSamples((current) => ({ ...current, [question.id]: true }));

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        const xsrfToken = getCookieValue('XSRF-TOKEN');

        try {
            const response = await fetch(
                runSamples({ assessment: assessment.id, question: question.id })
                    .url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        language:
                            selectedLanguages[question.id] ??
                            question.metadata?.default_language ??
                            'java',
                        source_code: resolveSourceCode(question),
                    }),
                },
            );

            const payload = (await response.json().catch(() => null)) as {
                result?: JudgeRunResult;
                message?: string;
            } | null;

            if (!response.ok) {
                addWarning(payload?.message ?? 'Could not run sample tests.');
                void logProctoringEvent('run_samples_failed', 'medium', {
                    question_id: question.id,
                });
                return;
            }

            if (!payload?.result) {
                addWarning('No judge result returned for sample tests.');
                return;
            }

            setRunResults((current) => ({
                ...current,
                [question.id]: payload.result ?? null,
            }));
        } catch {
            addWarning('Could not run sample tests due to a network error.');
            void logProctoringEvent('run_samples_network_error', 'medium', {
                question_id: question.id,
            });
        } finally {
            setIsRunningSamples((current) => ({
                ...current,
                [question.id]: false,
            }));
        }
    };

    const pollSubmission = (questionId: number, submissionId: number) => {
        const existingIntervalId =
            submissionPollIntervalsRef.current.get(questionId);
        if (existingIntervalId !== undefined) {
            window.clearInterval(existingIntervalId);
        }

        const intervalId = window.setInterval(async () => {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const xsrfToken = getCookieValue('XSRF-TOKEN');

            try {
                const response = await fetch(
                    submissionShow({
                        assessment: assessment.id,
                        question: questionId,
                        submission: submissionId,
                    }).url,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                            ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                        },
                        credentials: 'same-origin',
                    },
                );

                const payload = (await response.json().catch(() => null)) as {
                    submission?: CodingSubmissionSummary;
                } | null;

                if (!response.ok || !payload?.submission) {
                    return;
                }

                setLatestSubmission((current) => ({
                    ...current,
                    [questionId]: payload.submission ?? null,
                }));

                if (
                    payload.submission.status === 'completed' ||
                    payload.submission.status === 'failed'
                ) {
                    const currentIntervalId =
                        submissionPollIntervalsRef.current.get(questionId);
                    if (currentIntervalId !== undefined) {
                        window.clearInterval(currentIntervalId);
                        submissionPollIntervalsRef.current.delete(questionId);
                    }
                }
            } catch {
                return;
            }
        }, 1200);

        submissionPollIntervalsRef.current.set(questionId, intervalId);
    };

    const submitCodingAnswer = async (question: Question) => {
        if (!canAccessQuestions) {
            addWarning(
                'Test is locked. Enable camera + person detection + fullscreen to continue.',
            );
            return;
        }

        setIsSubmittingSolution((current) => ({
            ...current,
            [question.id]: true,
        }));

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');
        const xsrfToken = getCookieValue('XSRF-TOKEN');
        const sourceCode = resolveSourceCode(question);

        const nextRequestVersion =
            (answerRequestVersionRef.current.get(question.id) ?? 0) + 1;
        answerRequestVersionRef.current.set(question.id, nextRequestVersion);

        setPendingSaveCount((currentCount) => currentCount + 1);
        const savePromise = persistResponse(
            question.id,
            {
                answer_text: sourceCode,
                language:
                    selectedLanguages[question.id] ??
                    question.metadata?.default_language ??
                    'java',
            },
            nextRequestVersion,
        );
        pendingSavesRef.current.add(savePromise);

        try {
            await savePromise;
        } finally {
            pendingSavesRef.current.delete(savePromise);
            setPendingSaveCount((currentCount) =>
                Math.max(0, currentCount - 1),
            );
        }

        try {
            const response = await fetch(
                submitSolution({
                    assessment: assessment.id,
                    question: question.id,
                }).url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        language:
                            selectedLanguages[question.id] ??
                            question.metadata?.default_language ??
                            'java',
                        source_code: sourceCode,
                    }),
                },
            );

            const payload = (await response.json().catch(() => null)) as {
                submission?: {
                    id: number;
                    status: string;
                    submission_number: number;
                };
                message?: string;
            } | null;

            if (!response.ok || !payload?.submission) {
                addWarning(payload?.message ?? 'Could not submit solution.');
                void logProctoringEvent('submit_solution_failed', 'medium', {
                    question_id: question.id,
                });
                return;
            }

            setLatestSubmission((current) => ({
                ...current,
                [question.id]: {
                    id: payload.submission!.id,
                    status: payload.submission!.status,
                    verdict: null,
                    compile_output: null,
                    sample_passed_count: null,
                    sample_total_count: null,
                    hidden_passed_count: null,
                    hidden_total_count: null,
                    created_at: new Date().toISOString(),
                },
            }));

            pollSubmission(question.id, payload.submission.id);
        } catch {
            addWarning('Could not submit solution due to a network error.');
            void logProctoringEvent('submit_solution_network_error', 'medium', {
                question_id: question.id,
            });
        } finally {
            setIsSubmittingSolution((current) => ({
                ...current,
                [question.id]: false,
            }));
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

            <div className="fixed inset-0 z-50 overflow-hidden bg-background text-foreground">
                <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
                <div className="pointer-events-none absolute right-1/4 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

                <div className="fixed top-4 right-4 z-30 w-56 overflow-hidden rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-1 border-b border-border bg-muted px-2 py-1 text-[11px] font-medium text-foreground">
                        <Video className="size-3.5" />
                        Proctoring Camera
                        <span
                            className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white ${cameraState === 'live' ? 'bg-emerald-500' : cameraState === 'initializing' ? 'bg-amber-500' : 'bg-rose-500'}`}
                        >
                            {cameraState === 'live'
                                ? 'Live'
                                : cameraState === 'initializing'
                                  ? 'Starting'
                                  : 'Off'}
                        </span>
                    </div>
                    <div className="relative h-32 w-full bg-muted">
                        <video
                            ref={videoPreviewRef}
                            autoPlay
                            playsInline
                            muted
                            className={`h-full w-full object-cover ${cameraState === 'live' ? 'block' : 'hidden'}`}
                        />
                        {cameraState !== 'live' && (
                            <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
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
                    <aside className="space-y-4 rounded-2xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-sm">
                        <div>
                            <h2 className="text-base font-semibold text-foreground">
                                {assessment.title}
                            </h2>
                            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock3 className="size-4 text-cyan-400" />
                                Time left: {minutes}:{seconds}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                            <p className="inline-flex items-center gap-1 font-medium text-foreground">
                                <ListChecks className="size-4 text-indigo-400" />
                                Progress
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                {answeredCount} / {questions.length} answered
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                Tab switches: {tabSwitchCount}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                Pending saves: {pendingSaveCount}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                Unsaved answers: {failedSaveQuestionIds.length}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                Last saved: {lastSavedAt ?? 'Not yet'}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                            <p>
                                Fullscreen:{' '}
                                <span
                                    className={
                                        isFullscreen
                                            ? 'text-emerald-600 dark:text-emerald-300'
                                            : 'text-rose-600 dark:text-rose-300'
                                    }
                                >
                                    {isFullscreen ? 'On' : 'Off'}
                                </span>
                            </p>
                            <p>
                                Camera:{' '}
                                <span
                                    className={
                                        cameraState === 'live'
                                            ? 'text-emerald-600 dark:text-emerald-300'
                                            : 'text-rose-600 dark:text-rose-300'
                                    }
                                >
                                    {cameraState}
                                </span>
                            </p>
                            <p>
                                Person detection:{' '}
                                <span
                                    className={
                                        personState === 'detected'
                                            ? 'text-emerald-600 dark:text-emerald-300'
                                            : 'text-rose-600 dark:text-rose-300'
                                    }
                                >
                                    {personState.replace('_', ' ')}
                                </span>
                            </p>
                        </div>

                        {proctoringWarnings.length > 0 && (
                            <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-xs text-amber-800 dark:border-amber-300/40 dark:text-amber-100">
                                <p className="inline-flex items-center gap-1 font-semibold">
                                    <ShieldAlert className="size-4" />
                                    Proctoring alerts
                                </p>
                                <ul className="mt-1 list-disc pl-4">
                                    {proctoringWarnings
                                        .slice(-3)
                                        .map((warning, index) => (
                                            <li key={`${warning}-${index}`}>
                                                {warning}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((question, index) => {
                                const isAnswered =
                                    question.question_type === 'coding'
                                        ? typeof codeDrafts[question.id] ===
                                              'string' &&
                                          codeDrafts[question.id].trim() !== ''
                                        : selectedOptions[question.id] !==
                                          undefined;

                                return (
                                    <button
                                        key={question.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveQuestionIndex(index)
                                        }
                                        className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                            activeQuestionIndex === index
                                                ? 'border-cyan-400 bg-cyan-500 text-white dark:text-slate-950'
                                                : isAnswered
                                                  ? 'border-emerald-400/80 bg-emerald-500/15 text-emerald-800 dark:border-emerald-300/80 dark:text-emerald-100'
                                                  : 'border-border bg-background text-muted-foreground'
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
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400 bg-cyan-400 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-950"
                        >
                            <CheckCircle2 className="size-4" />
                            {isSubmitting
                                ? 'Submitting...'
                                : pendingSaveCount > 0
                                  ? 'Saving answers...'
                                  : 'Submit Test'}
                        </button>
                    </aside>

                    <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-2xl backdrop-blur-sm">
                        {!canAccessQuestions && (
                            <div className="mb-4 rounded-xl border border-rose-400/50 bg-rose-500/10 p-4 text-sm text-rose-800 dark:border-rose-300/40 dark:text-rose-100">
                                <p className="font-semibold">Test locked</p>
                                <p className="mt-1">
                                    Enable fullscreen and make sure exactly one
                                    person is visible on camera to continue.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void requestExamFullscreen();
                                    }}
                                    className="mt-3 rounded-md border border-rose-300/60 bg-rose-100/20 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100/30 dark:border-rose-200/50 dark:bg-rose-100/10 dark:hover:bg-rose-100/20"
                                >
                                    Retry Fullscreen
                                </button>
                            </div>
                        )}

                        {currentQuestion ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                        Question {activeQuestionIndex + 1} /{' '}
                                        {questions.length}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full border border-border px-2 py-1 capitalize">
                                            {currentQuestion.difficulty}
                                        </span>
                                        <span className="rounded-full border border-border px-2 py-1">
                                            {currentQuestion.points} pts
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg leading-relaxed font-semibold text-foreground">
                                    {currentQuestion.question_text}
                                </h3>

                                {currentQuestion.question_type === 'coding' ? (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="space-y-3">
                                            <div className="rounded-xl border border-border bg-background/80 p-4">
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                    Problem
                                                </p>
                                                <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                                                    {currentQuestion.metadata
                                                        ?.statement_md ??
                                                        'Problem statement missing.'}
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span className="rounded-full border border-border px-2 py-1">
                                                        Time:{' '}
                                                        {currentQuestion
                                                            .metadata
                                                            ?.time_limit_ms ??
                                                            2000}
                                                        ms
                                                    </span>
                                                    <span className="rounded-full border border-border px-2 py-1">
                                                        Memory:{' '}
                                                        {currentQuestion
                                                            .metadata
                                                            ?.memory_limit_mb ??
                                                            256}
                                                        MB
                                                    </span>
                                                    <span className="rounded-full border border-border px-2 py-1">
                                                        Samples:{' '}
                                                        {currentQuestion
                                                            .metadata
                                                            ?.sample_cases
                                                            ?.length ?? 0}
                                                        /3
                                                    </span>
                                                </div>
                                            </div>

                                            <details className="rounded-xl border border-border bg-background/80 p-4">
                                                <summary className="cursor-pointer text-sm font-semibold">
                                                    Sample test cases (3)
                                                </summary>
                                                <div className="mt-3 space-y-3">
                                                    {(
                                                        currentQuestion.metadata
                                                            ?.sample_cases ?? []
                                                    ).map((sample, index) => (
                                                        <div
                                                            key={sample.id}
                                                            className="rounded-lg border border-border/70 bg-muted/30 p-3"
                                                        >
                                                            <p className="text-xs font-semibold text-muted-foreground">
                                                                Sample #
                                                                {index + 1}
                                                            </p>
                                                            <div className="mt-2 grid gap-3 md:grid-cols-2">
                                                                <div>
                                                                    <p className="text-[11px] font-semibold text-muted-foreground">
                                                                        Input
                                                                    </p>
                                                                    <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border/70 bg-background p-2 text-xs text-foreground">
                                                                        {(
                                                                            sample.stdin ??
                                                                            ''
                                                                        ).trim() ===
                                                                        ''
                                                                            ? '(empty)'
                                                                            : sample.stdin}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-semibold text-muted-foreground">
                                                                        Expected
                                                                        output
                                                                    </p>
                                                                    <pre className="mt-1 max-h-48 overflow-auto rounded-md border border-border/70 bg-background p-2 text-xs text-foreground">
                                                                        {
                                                                            sample.expected_stdout
                                                                        }
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>

                                            {runResults[currentQuestion.id] ? (
                                                <div className="rounded-xl border border-border bg-background/80 p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold">
                                                            Run result
                                                        </p>
                                                        {(() => {
                                                            const result =
                                                                runResults[
                                                                    currentQuestion
                                                                        .id
                                                                ];

                                                            if (!result) {
                                                                return null;
                                                            }

                                                            const passedAllSamples =
                                                                result.sample_total_count >
                                                                    0 &&
                                                                result.sample_passed_count ===
                                                                    result.sample_total_count &&
                                                                !result.compile_output;

                                                            const tone = passedAllSamples
                                                                ? 'success'
                                                                : verdictTone(
                                                                      result.verdict,
                                                                  );

                                                            return (
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span
                                                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${tonePillClass(
                                                                            tone,
                                                                        )}`}
                                                                    >
                                                                        {passedAllSamples
                                                                            ? 'Accepted'
                                                                            : verdictLabel(
                                                                                  result.verdict,
                                                                              )}
                                                                    </span>
                                                                    <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                                                        {result.sample_passed_count}
                                                                        /
                                                                        {result.sample_total_count}{' '}
                                                                        samples
                                                                        passed
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    {runResults[
                                                        currentQuestion.id
                                                    ]?.compile_output ? (
                                                        <pre className="mt-3 max-h-60 overflow-auto rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-foreground">
                                                            {
                                                                runResults[
                                                                    currentQuestion
                                                                        .id
                                                                ]
                                                                    ?.compile_output
                                                            }
                                                        </pre>
                                                    ) : (
                                                        <div className="mt-3 space-y-2">
                                                            {(
                                                                runResults[
                                                                    currentQuestion
                                                                        .id
                                                                ]
                                                                    ?.case_results ??
                                                                []
                                                            ).map(
                                                                (
                                                                    resultCase,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            resultCase.id
                                                                        }
                                                                        className={`rounded-lg border p-3 text-sm ${
                                                                            resultCase.passed
                                                                                ? 'border-emerald-300 bg-emerald-500/10'
                                                                                : 'border-rose-300 bg-rose-500/10'
                                                                        }`}
                                                                    >
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <p className="font-semibold">
                                                                                Sample
                                                                                case
                                                                                #
                                                                                {(
                                                                                    currentQuestion
                                                                                        .metadata
                                                                                        ?.sample_cases ??
                                                                                    []
                                                                                ).findIndex(
                                                                                    (
                                                                                        c,
                                                                                    ) =>
                                                                                        c.id ===
                                                                                        resultCase.id,
                                                                                ) +
                                                                                    1}
                                                                            </p>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {
                                                                                    resultCase.verdict
                                                                                }{' '}
                                                                                •{' '}
                                                                                {
                                                                                    resultCase.runtime_ms
                                                                                }
                                                                                ms
                                                                            </span>
                                                                        </div>
                                                                        {(
                                                                            resultCase.stderr_preview ??
                                                                            ''
                                                                        ).trim() !==
                                                                            '' && (
                                                                            <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-border/70 bg-background p-2 text-xs">
                                                                                {
                                                                                    resultCase.stderr_preview
                                                                                }
                                                                            </pre>
                                                                        )}
                                                                        {(
                                                                            resultCase.stdout_preview ??
                                                                            ''
                                                                        ).trim() !==
                                                                            '' && (
                                                                            <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-border/70 bg-background p-2 text-xs">
                                                                                {
                                                                                    resultCase.stdout_preview
                                                                                }
                                                                            </pre>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            {(() => {
                                                const summary =
                                                    latestSubmission[
                                                        currentQuestion.id
                                                    ];
                                                const codingSummary =
                                                    coding_submissions[
                                                        String(
                                                            currentQuestion.id,
                                                        )
                                                    ];

                                                if (
                                                    !summary &&
                                                    !codingSummary
                                                ) {
                                                    return null;
                                                }

                                                const bestPassed =
                                                    codingSummary?.best_passed_hidden ??
                                                    false;
                                                const totalSubmissions =
                                                    codingSummary?.total_submissions ??
                                                    0;

                                                return (
                                                    <div className="rounded-xl border border-border bg-background/80 p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold">
                                                                Submission
                                                                status
                                                            </p>
                                                            <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                                                                Attempts:{' '}
                                                                {
                                                                    totalSubmissions
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                                            <span
                                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                                                    bestPassed
                                                                        ? 'border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                                                                        : 'border-slate-300 bg-slate-500/10 text-slate-700 dark:text-slate-200'
                                                                }`}
                                                            >
                                                                Best hidden:{' '}
                                                                {bestPassed
                                                                    ? 'Passed'
                                                                    : 'Not passed'}
                                                            </span>
                                                            {(() => {
                                                                if (!summary) {
                                                                    return null;
                                                                }

                                                                const hiddenTotal =
                                                                    summary.hidden_total_count ??
                                                                    0;
                                                                const hiddenPassed =
                                                                    summary.hidden_passed_count ??
                                                                    0;
                                                                const hiddenAllPassed =
                                                                    hiddenTotal >
                                                                        0 &&
                                                                    hiddenPassed ===
                                                                        hiddenTotal;

                                                                const completed =
                                                                    summary.status ===
                                                                    'completed';
                                                                const accepted =
                                                                    completed &&
                                                                    summary.verdict ===
                                                                        'AC' &&
                                                                    hiddenAllPassed;

                                                                const tone =
                                                                    accepted
                                                                        ? 'success'
                                                                        : completed
                                                                          ? verdictTone(
                                                                                summary.verdict,
                                                                            )
                                                                          : 'neutral';

                                                                const label =
                                                                    accepted
                                                                        ? 'Accepted'
                                                                        : completed
                                                                          ? verdictLabel(
                                                                                summary.verdict,
                                                                            )
                                                                          : 'Running...';

                                                                return (
                                                                    <span
                                                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${tonePillClass(
                                                                            tone,
                                                                        )}`}
                                                                    >
                                                                        {label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>

                                                        {summary &&
                                                        summary.hidden_total_count !==
                                                            null ? (
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                Hidden:{' '}
                                                                {summary.hidden_passed_count ??
                                                                    0}
                                                                /
                                                                {
                                                                    summary.hidden_total_count
                                                                }{' '}
                                                                passed
                                                            </p>
                                                        ) : null}

                                                        {summary &&
                                                        summary.status ===
                                                            'completed' &&
                                                        summary.hidden_total_count !==
                                                            null &&
                                                        (summary.hidden_passed_count ??
                                                            0) ===
                                                            summary.hidden_total_count ? (
                                                            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                                                                <CheckCircle2 className="size-4" />
                                                                Passed all test
                                                                cases
                                                            </p>
                                                        ) : null}

                                                        {summary?.compile_output ? (
                                                            <pre className="mt-3 max-h-60 overflow-auto rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-foreground">
                                                                {
                                                                    summary.compile_output
                                                                }
                                                            </pre>
                                                        ) : null}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-xl border border-border bg-background/80 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    {(() => {
                                                        const currentLanguage =
                                                            selectedLanguageForQuestion(
                                                                currentQuestion,
                                                            );
                                                        const extension =
                                                            currentLanguage ===
                                                            'python'
                                                                ? 'py'
                                                                : currentLanguage ===
                                                                    'javascript'
                                                                  ? 'js'
                                                                  : 'java';

                                                        return (
                                                            <>
                                                                <p className="text-sm font-semibold">
                                                                    Editor (
                                                                    {currentLanguage.toUpperCase()}
                                                                    )
                                                                </p>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Edit{' '}
                                                                    <code className="font-mono text-[11px]">
                                                                        Solution.
                                                                        {
                                                                            extension
                                                                        }
                                                                    </code>{' '}
                                                                    only. main
                                                                    is hidden.
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <label className="text-xs font-semibold text-muted-foreground">
                                                        Compiler
                                                    </label>
                                                    <select
                                                        value={selectedLanguageForQuestion(
                                                            currentQuestion,
                                                        )}
                                                        onChange={(event) => {
                                                            const nextLanguage =
                                                                event.target
                                                                    .value;

                                                            setSelectedLanguages(
                                                                (current) => ({
                                                                    ...current,
                                                                    [currentQuestion.id]:
                                                                        nextLanguage,
                                                                }),
                                                            );

                                                            try {
                                                                const stored =
                                                                    window.localStorage.getItem(
                                                                        `coding_draft:${attempt.id}:${currentQuestion.id}:${nextLanguage}`,
                                                                    );

                                                                const nextCode =
                                                                    stored ??
                                                                    currentQuestion
                                                                        .metadata
                                                                        ?.starter_code_by_language?.[
                                                                        nextLanguage
                                                                    ] ??
                                                                    '';

                                                                setCodeDrafts(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [currentQuestion.id]:
                                                                            nextCode,
                                                                    }),
                                                                );
                                                            } catch {
                                                                const nextCode =
                                                                    currentQuestion
                                                                        .metadata
                                                                        ?.starter_code_by_language?.[
                                                                        nextLanguage
                                                                    ] ?? '';

                                                                setCodeDrafts(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [currentQuestion.id]:
                                                                            nextCode,
                                                                    }),
                                                                );
                                                            }
                                                        }}
                                                        className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold"
                                                    >
                                                        {(
                                                            currentQuestion
                                                                .metadata
                                                                ?.languages ??
                                                            []
                                                        ).map((language) => (
                                                            <option
                                                                key={language}
                                                                value={language}
                                                            >
                                                                {language.toUpperCase()}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <HighlightedCodeEditor
                                                    value={
                                                        codeDrafts[
                                                            currentQuestion.id
                                                        ] ??
                                                        resolveSourceCode(
                                                            currentQuestion,
                                                        )
                                                    }
                                                    language={selectedLanguageForQuestion(
                                                        currentQuestion,
                                                    ) as LanguageKey}
                                                    disabled={
                                                        !canAccessQuestions ||
                                                        isSubmitting
                                                    }
                                                    onChange={(nextValue) =>
                                                        updateCodeDraft(
                                                            currentQuestion.id,
                                                            nextValue,
                                                        )
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key !== 'Tab'
                                                        ) {
                                                            return;
                                                        }

                                                        event.preventDefault();

                                                        const textarea =
                                                            event.currentTarget;
                                                        const start =
                                                            textarea.selectionStart;
                                                        const end =
                                                            textarea.selectionEnd;
                                                        const value =
                                                            textarea.value;
                                                        const next = `${value.slice(0, start)}\t${value.slice(end)}`;

                                                        updateCodeDraft(
                                                            currentQuestion.id,
                                                            next,
                                                        );

                                                        window.requestAnimationFrame(
                                                            () => {
                                                                textarea.selectionStart =
                                                                    textarea.selectionEnd =
                                                                        start +
                                                                        1;
                                                            },
                                                        );
                                                    }}
                                                />

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !canAccessQuestions ||
                                                            isSubmitting ||
                                                            isRunningSamples[
                                                                currentQuestion
                                                                    .id
                                                            ]
                                                        }
                                                        onClick={() => {
                                                            void runSampleTests(
                                                                currentQuestion,
                                                            );
                                                        }}
                                                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {isRunningSamples[
                                                            currentQuestion.id
                                                        ]
                                                            ? 'Running samples...'
                                                            : 'Run samples'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !canAccessQuestions ||
                                                            isSubmitting ||
                                                            isSubmittingSolution[
                                                                currentQuestion
                                                                    .id
                                                            ]
                                                        }
                                                        onClick={() => {
                                                            void submitCodingAnswer(
                                                                currentQuestion,
                                                            );
                                                        }}
                                                        className="rounded-lg border border-cyan-400 bg-cyan-400 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 dark:text-slate-950"
                                                    >
                                                        {isSubmittingSolution[
                                                            currentQuestion.id
                                                        ]
                                                            ? 'Submitting...'
                                                            : 'Submit solution'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {currentQuestion.options.map(
                                            (option, optionIndex) => {
                                                const isSelected =
                                                    selectedOptions[
                                                        currentQuestion.id
                                                    ] === option.id;

                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        disabled={
                                                            !canAccessQuestions ||
                                                            isSubmitting
                                                        }
                                                        onClick={() => {
                                                            void selectOption(
                                                                currentQuestion.id,
                                                                option.id,
                                                            );
                                                        }}
                                                        className={`w-full rounded-xl border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                                            isSelected
                                                                ? 'border-cyan-400 bg-cyan-500/15 text-cyan-800 dark:border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-100'
                                                                : 'border-border bg-background text-foreground hover:bg-muted/60'
                                                        }`}
                                                    >
                                                        <span className="mr-2 font-semibold text-muted-foreground">
                                                            {String.fromCharCode(
                                                                65 +
                                                                    optionIndex,
                                                            )}
                                                            .
                                                        </span>
                                                        {option.option_text}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        disabled={activeQuestionIndex === 0}
                                        onClick={() =>
                                            setActiveQuestionIndex(
                                                (currentIndex) =>
                                                    Math.max(
                                                        0,
                                                        currentIndex - 1,
                                                    ),
                                            )
                                        }
                                        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/70 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            activeQuestionIndex ===
                                            questions.length - 1
                                        }
                                        onClick={() =>
                                            setActiveQuestionIndex(
                                                (currentIndex) =>
                                                    Math.min(
                                                        questions.length - 1,
                                                        currentIndex + 1,
                                                    ),
                                            )
                                        }
                                        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/70 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No questions loaded.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
