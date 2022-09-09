import postcss from 'postcss';
// style标签插入head
const rawDocumentBodyAppend = HTMLBodyElement.prototype.appendChild;
const arrayify = (list) => [].slice.call(list, 0);
// https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
// eslint-disable-next-line no-shadow
var RuleType;
(function (RuleType) {
    // type: rule will be rewrote
    RuleType[RuleType["STYLE"] = 1] = "STYLE";
    RuleType[RuleType["MEDIA"] = 4] = "MEDIA";
    RuleType[RuleType["SUPPORTS"] = 12] = "SUPPORTS";
    // type: value will be kept
    RuleType[RuleType["IMPORT"] = 3] = "IMPORT";
    RuleType[RuleType["FONT_FACE"] = 5] = "FONT_FACE";
    RuleType[RuleType["PAGE"] = 6] = "PAGE";
    RuleType[RuleType["KEYFRAMES"] = 7] = "KEYFRAMES";
    RuleType[RuleType["KEYFRAME"] = 8] = "KEYFRAME";
})(RuleType || (RuleType = {}));
export function parseRulePostCss(css) {
    try {
        const root = postcss.parse(css);
        // eslint-disable-next-line no-inner-declarations
        function travser(nodes) {
            return nodes.reduce((ruleList, item) => {
                let rule;
                if (item.type === 'rule') {
                    rule = {
                        selectorText: item.selector,
                        cssText: item.toString(),
                        type: RuleType.STYLE,
                    };
                }
                else if (item.type === 'atrule') {
                    if (item.name === 'media') {
                        rule = {
                            type: RuleType.MEDIA,
                            conditionText: item.params,
                            cssText: item.toString(),
                            cssRules: travser(item.nodes),
                        };
                    }
                    else if (item.name === 'supports') {
                        rule = {
                            type: RuleType.SUPPORTS,
                            cssText: item.toString(),
                            cssRules: travser(item.nodes),
                            conditionText: item.params,
                        };
                    }
                    else if (item.name === 'charset') {
                        rule = {
                            cssText: `${item.toString()};`,
                        };
                    }
                    else {
                        rule = {
                            cssText: item.toString(),
                        };
                    }
                }
                if (rule) {
                    return ruleList.concat(rule);
                }
                return ruleList;
            }, []);
        }
        return travser(root.nodes);
    }
    catch (error) {
        return [];
    }
}
export class ScopedCSS {
    constructor() {
        const styleNode = document.createElement('style');
        rawDocumentBodyAppend.call(document.body, styleNode);
        this.swapNode = styleNode;
        this.sheet = styleNode.sheet;
        this.sheet.disabled = true;
    }
    process(styleNode, prefix = '') {
        var _a;
        if (ScopedCSS.ModifiedTag in styleNode) {
            return;
        }
        if (styleNode.textContent !== '') {
            const textNode = document.createTextNode(styleNode.textContent || '');
            this.swapNode.appendChild(textNode);
            // https://github.com/umijs/qiankun/issues/2116
            const rules = arrayify((_a = parseRulePostCss(textNode.textContent || '')) !== null && _a !== void 0 ? _a : []);
            const css = this.rewrite(rules, prefix);
            // eslint-disable-next-line no-param-reassign
            styleNode.textContent = css;
            this.swapNode.removeChild(textNode);
            // eslint-disable-next-line no-param-reassign
            styleNode[ScopedCSS.ModifiedTag] = true;
            return;
        }
        const mutator = new MutationObserver((mutations) => {
            var _a;
            for (let i = 0; i < mutations.length; i += 1) {
                const mutation = mutations[i];
                if (ScopedCSS.ModifiedTag in styleNode) {
                    return;
                }
                if (mutation.type === 'childList') {
                    const rules = arrayify((_a = parseRulePostCss(styleNode.textContent || '')) !== null && _a !== void 0 ? _a : []);
                    const css = this.rewrite(rules, prefix);
                    // eslint-disable-next-line no-param-reassign
                    styleNode.textContent = css;
                    // eslint-disable-next-line no-param-reassign
                    styleNode[ScopedCSS.ModifiedTag] = true;
                }
            }
        });
        // since observer will be deleted when node be removed
        // we dont need create a cleanup function manually
        // see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
        mutator.observe(styleNode, { childList: true });
    }
    rewrite(rules, prefix = '') {
        let css = '';
        rules.forEach((rule) => {
            switch (rule.type) {
                case RuleType.STYLE:
                    css += this.ruleStyle(rule, prefix);
                    break;
                case RuleType.MEDIA:
                    css += this.ruleMedia(rule, prefix);
                    break;
                case RuleType.SUPPORTS:
                    css += this.ruleSupport(rule, prefix);
                    break;
                default:
                    css += `${rule.cssText}`;
                    break;
            }
        });
        return css;
    }
    // handle case:
    // .app-main {}
    // html, body {}
    // eslint-disable-next-line class-methods-use-this
    ruleStyle(rule, prefix) {
        const rootSelectorRE = /((?:[^\w\-.#]|^)(body|html|:root))/gm;
        const rootCombinationRE = /(html[^\w{[]+)/gm;
        const selector = rule.selectorText.trim();
        let { cssText } = rule;
        // handle html { ... }
        // handle body { ... }
        // handle :root { ... }
        if (selector === 'html' || selector === 'body' || selector === ':root') {
            return cssText.replace(rootSelectorRE, prefix);
        }
        // handle html body { ... }
        // handle html > body { ... }
        if (rootCombinationRE.test(rule.selectorText)) {
            const siblingSelectorRE = /(html[^\w{]+)(\+|~)/gm;
            // since html + body is a non-standard rule for html
            // transformer will ignore it
            if (!siblingSelectorRE.test(rule.selectorText)) {
                cssText = cssText.replace(rootCombinationRE, '');
            }
        }
        // handle grouping selector, a,span,p,div { ... }
        cssText = cssText.replace(/^[\s\S]+{/, (selectors) => selectors.replace(/(^|,\n?)([^,]+)/g, (item, p, s) => {
            // handle div,body,span { ... }
            if (rootSelectorRE.test(item)) {
                return item.replace(rootSelectorRE, (m) => {
                    // do not discard valid previous character, such as body,html or *:not(:root)
                    const whitePrevChars = [',', '('];
                    if (m && whitePrevChars.includes(m[0])) {
                        return `${m[0]}${prefix}`;
                    }
                    // replace root selector with prefix
                    return prefix;
                });
            }
            return `${p}${prefix} ${s.replace(/^ */, '')}`;
        }));
        return cssText;
    }
    // handle case:
    // @media screen and (max-width: 300px) {}
    ruleMedia(rule, prefix) {
        const css = this.rewrite(arrayify(rule.cssRules), prefix);
        return `@media ${rule.conditionText || rule.media.mediaText} {${css}}`;
    }
    // handle case:
    // @supports (display: grid) {}
    ruleSupport(rule, prefix) {
        const css = this.rewrite(arrayify(rule.cssRules), prefix);
        return `@supports ${rule.conditionText || rule.cssText.split('{')[0]} {${css}}`;
    }
}
ScopedCSS.ModifiedTag = 'Symbol(style-modified-webdocker)';
let processor;
export const WebDockerCSSRewriteAttr = 'data-webdocker';
export const process = (appWrapper, stylesheetElement, appName) => {
    // lazy singleton pattern
    if (!processor) {
        processor = new ScopedCSS();
    }
    const mountDOM = appWrapper;
    if (!mountDOM) {
        return;
    }
    const tag = (mountDOM.tagName || '').toLowerCase();
    if (tag && stylesheetElement.tagName === 'STYLE') {
        const prefix = `${tag}[${WebDockerCSSRewriteAttr}="${appName}"]`;
        processor.process(stylesheetElement, prefix);
    }
};
