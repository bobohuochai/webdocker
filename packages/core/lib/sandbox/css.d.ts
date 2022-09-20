export declare function parseRulePostCss(css: string): any;
export declare class ScopedCSS {
    static ModifiedTag: string;
    sheet: StyleSheet;
    swapNode: HTMLStyleElement;
    constructor();
    process(styleNode: HTMLStyleElement, prefix?: string): void;
    rewrite(rules: CSSRule[], prefix?: string): string;
    ruleStyle(rule: CSSStyleRule, prefix: string): string;
    ruleMedia(rule: CSSMediaRule, prefix: string): string;
    ruleSupport(rule: CSSSupportsRule, prefix: string): string;
}
export declare const WebDockerCSSRewriteAttr = "data-webdocker";
export declare const process: (appWrapper: HTMLElement, stylesheetElement: HTMLStyleElement, appName: string) => void;
