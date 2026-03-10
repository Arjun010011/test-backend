import { useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

import '@/lib/monaco-workers';

export type MonacoLanguage = 'java' | 'python' | 'javascript';

let registeredLanguages: Set<string> | null = null;
let registerPromise: Promise<void> | null = null;

const ensureLanguagesRegistered = async (
    monaco: typeof Monaco,
): Promise<void> => {
    if (registeredLanguages?.has('java') && registeredLanguages?.has('python')) {
        return;
    }

    if (registerPromise) {
        await registerPromise;
        return;
    }

    registerPromise = (async () => {
        if (!registeredLanguages) {
            registeredLanguages = new Set<string>();
        }

        const registerBasic = async (
            id: 'java' | 'python',
            loader: () => Promise<{ language: Monaco.languages.IMonarchLanguage; conf: Monaco.languages.LanguageConfiguration }>,
        ) => {
            if (registeredLanguages?.has(id)) {
                return;
            }

            const mod = await loader();

            monaco.languages.register({ id });
            monaco.languages.setMonarchTokensProvider(id, mod.language);
            monaco.languages.setLanguageConfiguration(id, mod.conf);

            registeredLanguages?.add(id);
        };

        await registerBasic('java', async () => import('monaco-editor/esm/vs/basic-languages/java/java'));
        await registerBasic('python', async () => import('monaco-editor/esm/vs/basic-languages/python/python'));
    })();

    await registerPromise;
};

export default function MonacoCodeEditor({
    value,
    language,
    disabled,
    onChange,
    height = 420,
}: {
    value: string;
    language: MonacoLanguage;
    disabled: boolean;
    onChange: (nextValue: string) => void;
    height?: number;
}) {
    const lastValueRef = useRef<string>(value);

    const options = useMemo<Monaco.editor.IStandaloneEditorConstructionOptions>(
        () => ({
            readOnly: disabled,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineHeight: 18,
            fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: false,
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined',
            formatOnType: true,
            formatOnPaste: false,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            inlineSuggest: { enabled: true },
            padding: { top: 12, bottom: 12 },
        }),
        [disabled],
    );

    return (
        <div className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-slate-950/95 shadow-inner">
            <Editor
                value={value}
                height={height}
                theme="vs-dark"
                language={language}
                options={options}
                beforeMount={async (monaco) => {
                    await ensureLanguagesRegistered(monaco);
                }}
                onChange={(nextValue) => {
                    const safe = nextValue ?? '';
                    if (safe === lastValueRef.current) {
                        return;
                    }

                    lastValueRef.current = safe;
                    onChange(safe);
                }}
            />
        </div>
    );
}

