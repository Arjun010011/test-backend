// Monaco needs explicit worker wiring in Vite.
// Import this module once before rendering any Monaco editor instance.

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

declare global {
    interface Window {
        MonacoEnvironment?: {
            getWorker: (moduleId: string, label: string) => Worker;
        };
    }
}

// eslint-disable-next-line no-restricted-globals
const globalTarget: Window = typeof self === 'undefined' ? window : (self as unknown as Window);

if (!globalTarget.MonacoEnvironment) {
    globalTarget.MonacoEnvironment = {
        getWorker(_moduleId: string, label: string) {
            if (label === 'json') {
                return new JsonWorker();
            }

            if (label === 'css' || label === 'scss' || label === 'less') {
                return new CssWorker();
            }

            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new HtmlWorker();
            }

            if (label === 'typescript' || label === 'javascript') {
                return new TsWorker();
            }

            return new EditorWorker();
        },
    };
}

