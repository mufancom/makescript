declare module 'highlight.js/lib/core' {
  export default class {
    static registerLanguage(language: string, languageObject: unknown): void;

    static highlight(language: string, content: string): {value: string};
  }
}
