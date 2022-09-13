import postcss from 'postcss';
// style标签插入head
var rawDocumentBodyAppend = HTMLBodyElement.prototype.appendChild;
var arrayify = function (list) { return [].slice.call(list, 0); };
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
// eslint-disable-next-line no-inner-declarations
function travser(nodes) {
    return nodes.reduce(function (ruleList, item) {
        var rule;
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
                    cssText: "".concat(item.toString(), ";"),
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
export function parseRulePostCss(css) {
    try {
        var root = postcss.parse(css);
        return travser(root.nodes);
    }
    catch (error) {
        return [];
    }
}
var ScopedCSS = /** @class */ (function () {
    function ScopedCSS() {
        var styleNode = document.createElement('style');
        rawDocumentBodyAppend.call(document.body, styleNode);
        this.swapNode = styleNode;
        this.sheet = styleNode.sheet;
        this.sheet.disabled = true;
    }
    ScopedCSS.prototype.process = function (styleNode, prefix) {
        var _this = this;
        var _a;
        if (prefix === void 0) { prefix = ''; }
        if (ScopedCSS.ModifiedTag in styleNode) {
            return;
        }
        if (styleNode.textContent !== '') {
            var textNode = document.createTextNode(styleNode.textContent || '');
            this.swapNode.appendChild(textNode);
            // https://github.com/umijs/qiankun/issues/2116
            var rules = arrayify((_a = parseRulePostCss(textNode.textContent || '')) !== null && _a !== void 0 ? _a : []);
            var css = this.rewrite(rules, prefix);
            // eslint-disable-next-line no-param-reassign
            styleNode.textContent = css;
            this.swapNode.removeChild(textNode);
            // eslint-disable-next-line no-param-reassign
            styleNode[ScopedCSS.ModifiedTag] = true;
            return;
        }
        var mutator = new MutationObserver(function (mutations) {
            var _a;
            for (var i = 0; i < mutations.length; i += 1) {
                var mutation = mutations[i];
                if (ScopedCSS.ModifiedTag in styleNode) {
                    return;
                }
                if (mutation.type === 'childList') {
                    var rules = arrayify((_a = parseRulePostCss(styleNode.textContent || '')) !== null && _a !== void 0 ? _a : []);
                    var css = _this.rewrite(rules, prefix);
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
    };
    ScopedCSS.prototype.rewrite = function (rules, prefix) {
        var _this = this;
        if (prefix === void 0) { prefix = ''; }
        var css = '';
        rules.forEach(function (rule) {
            switch (rule.type) {
                case RuleType.STYLE:
                    css += _this.ruleStyle(rule, prefix);
                    break;
                case RuleType.MEDIA:
                    css += _this.ruleMedia(rule, prefix);
                    break;
                case RuleType.SUPPORTS:
                    css += _this.ruleSupport(rule, prefix);
                    break;
                default:
                    css += "".concat(rule.cssText);
                    break;
            }
        });
        return css;
    };
    // handle case:
    // .app-main {}
    // html, body {}
    // eslint-disable-next-line class-methods-use-this
    ScopedCSS.prototype.ruleStyle = function (rule, prefix) {
        var rootSelectorRE = /((?:[^\w\-.#]|^)(body|html|:root))/gm;
        var rootCombinationRE = /(html[^\w{[]+)/gm;
        var selector = rule.selectorText.trim();
        var cssText = rule.cssText;
        // handle html { ... }
        // handle body { ... }
        // handle :root { ... }
        if (selector === 'html' || selector === 'body' || selector === ':root') {
            return cssText.replace(rootSelectorRE, prefix);
        }
        // handle html body { ... }
        // handle html > body { ... }
        if (rootCombinationRE.test(rule.selectorText)) {
            var siblingSelectorRE = /(html[^\w{]+)(\+|~)/gm;
            // since html + body is a non-standard rule for html
            // transformer will ignore it
            if (!siblingSelectorRE.test(rule.selectorText)) {
                cssText = cssText.replace(rootCombinationRE, '');
            }
        }
        // handle grouping selector, a,span,p,div { ... }
        cssText = cssText.replace(/^[\s\S]+{/, function (selectors) { return selectors.replace(/(^|,\n?)([^,]+)/g, function (item, p, s) {
            // handle div,body,span { ... }
            if (rootSelectorRE.test(item)) {
                return item.replace(rootSelectorRE, function (m) {
                    // do not discard valid previous character, such as body,html or *:not(:root)
                    var whitePrevChars = [',', '('];
                    if (m && whitePrevChars.includes(m[0])) {
                        return "".concat(m[0]).concat(prefix);
                    }
                    // replace root selector with prefix
                    return prefix;
                });
            }
            return "".concat(p).concat(prefix, " ").concat(s.replace(/^ */, ''));
        }); });
        return cssText;
    };
    // handle case:
    // @media screen and (max-width: 300px) {}
    ScopedCSS.prototype.ruleMedia = function (rule, prefix) {
        var css = this.rewrite(arrayify(rule.cssRules), prefix);
        return "@media ".concat(rule.conditionText || rule.media.mediaText, " {").concat(css, "}");
    };
    // handle case:
    // @supports (display: grid) {}
    ScopedCSS.prototype.ruleSupport = function (rule, prefix) {
        var css = this.rewrite(arrayify(rule.cssRules), prefix);
        return "@supports ".concat(rule.conditionText || rule.cssText.split('{')[0], " {").concat(css, "}");
    };
    ScopedCSS.ModifiedTag = 'Symbol(style-modified-webdocker)';
    return ScopedCSS;
}());
export { ScopedCSS };
var processor;
export var WebDockerCSSRewriteAttr = 'data-webdocker';
export var process = function (appWrapper, stylesheetElement, appName) {
    // lazy singleton pattern
    if (!processor) {
        processor = new ScopedCSS();
    }
    var mountDOM = appWrapper;
    if (!mountDOM) {
        return;
    }
    var tag = (mountDOM.tagName || '').toLowerCase();
    if (tag && stylesheetElement.tagName === 'STYLE') {
        var prefix = "".concat(tag, "[").concat(WebDockerCSSRewriteAttr, "=\"").concat(appName, "\"]");
        processor.process(stylesheetElement, prefix);
    }
};
