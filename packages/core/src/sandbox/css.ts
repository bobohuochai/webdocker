import postcss from 'postcss';
import type { ChildNode } from 'postcss';

// style标签插入body
const rawDocumentBodyAppend = HTMLBodyElement.prototype.appendChild;

const arrayify = <T>(list:CSSRuleList | any[]) => [].slice.call(list, 0) as T[];

// https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
// eslint-disable-next-line no-shadow
enum RuleType {
  // type: rule will be rewrote
  STYLE = 1,
  MEDIA = 4,
  SUPPORTS = 12,

  // type: value will be kept
  IMPORT = 3,
  FONT_FACE = 5,
  PAGE = 6,
  KEYFRAMES = 7,
  KEYFRAME = 8,
}

// https://github.com/umijs/qiankun/issues/2116
// eslint-disable-next-line no-inner-declarations
function travser(nodes: ChildNode[]) {
  return nodes.reduce((ruleList, item) => {
    let rule: any;
    if (item.type === 'rule') {
      rule = {
        selectorText: item.selector,
        cssText: item.toString(),
        type: RuleType.STYLE,
      };
    } else if (item.type === 'atrule') {
      if (item.name === 'media') {
        rule = {
          type: RuleType.MEDIA,
          conditionText: item.params,
          cssText: item.toString(),
          cssRules: travser(item.nodes),
        };
      } else if (item.name === 'supports') {
        rule = {
          type: RuleType.SUPPORTS,
          cssText: item.toString(),
          cssRules: travser(item.nodes),
          conditionText: item.params,
        };
      } else if (item.name === 'charset') {
        rule = {
          cssText: `${item.toString()};`,
        };
      } else {
        rule = {
          cssText: item.toString(),
        };
      }
    }
    if (rule) {
      return ruleList.concat(rule);
    }
    return ruleList;
  }, [] as any);
}

export function parseRulePostCss(css: string) {
  try {
    const root = postcss.parse(css);
    return travser(root.nodes);
  } catch (error) {
    return [];
  }
}

export class ScopedCSS {
  static ModifiedTag = 'Symbol(style-modified-webdocker)';

  sheet:StyleSheet;

  swapNode:HTMLStyleElement;

  constructor() {
    const styleNode = document.createElement('style');
    rawDocumentBodyAppend.call(document.body, styleNode);
    this.swapNode = styleNode;
    this.sheet = styleNode.sheet!;
    this.sheet.disabled = true;
  }

  process(styleNode:HTMLStyleElement, prefix = '') {
    if (ScopedCSS.ModifiedTag in styleNode) {
      return;
    }
    if (styleNode.textContent !== '') {
      const textNode = document.createTextNode(styleNode.textContent || '');
      this.swapNode.appendChild(textNode);
      const rules = arrayify<CSSRule>(parseRulePostCss(textNode.textContent || '') ?? []);
      const css = this.rewrite(rules, prefix);
      // eslint-disable-next-line no-param-reassign
      styleNode.textContent = css;

      this.swapNode.removeChild(textNode);
      // eslint-disable-next-line no-param-reassign
      (styleNode as any)[ScopedCSS.ModifiedTag] = true;
      return;
    }

    const mutator = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i += 1) {
        const mutation = mutations[i];

        if (ScopedCSS.ModifiedTag in styleNode) {
          return;
        }

        if (mutation.type === 'childList') {
          const rules = arrayify<CSSRule>(parseRulePostCss(styleNode.textContent || '') ?? []);
          const css = this.rewrite(rules, prefix);

          // eslint-disable-next-line no-param-reassign
          styleNode.textContent = css;
          // eslint-disable-next-line no-param-reassign
          (styleNode as any)[ScopedCSS.ModifiedTag] = true;
        }
      }
    });

    // since observer will be deleted when node be removed
    // we dont need create a cleanup function manually
    // see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
    mutator.observe(styleNode, { childList: true });
  }

  rewrite(rules: CSSRule[], prefix = '') {
    let css = '';

    rules.forEach((rule) => {
      switch (rule.type) {
        case RuleType.STYLE:
          css += this.ruleStyle(rule as CSSStyleRule, prefix);
          break;
        case RuleType.MEDIA:
          css += this.ruleMedia(rule as CSSMediaRule, prefix);
          break;
        case RuleType.SUPPORTS:
          css += this.ruleSupport(rule as CSSSupportsRule, prefix);
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
  ruleStyle(rule: CSSStyleRule, prefix: string) {
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
  ruleMedia(rule: CSSMediaRule, prefix: string) {
    const css = this.rewrite(arrayify(rule.cssRules), prefix);
    return `@media ${rule.conditionText || rule.media.mediaText} {${css}}`;
  }

  // handle case:
  // @supports (display: grid) {}
  ruleSupport(rule: CSSSupportsRule, prefix: string) {
    const css = this.rewrite(arrayify(rule.cssRules), prefix);
    return `@supports ${rule.conditionText || rule.cssText.split('{')[0]} {${css}}`;
  }
}

let processor:ScopedCSS;

export const WebDockerCSSRewriteAttr = 'data-webdocker';

export const process = (appWrapper:HTMLElement, stylesheetElement:HTMLStyleElement, appName:string) => {
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
