import { StylebotAiStyleContext } from '@stylebot/types';

const MAX_STYLESHEET_RULES = 300;
const MAX_STYLESHEET_CHARS = 30000;
const MAX_EXISTING_CSS_CHARS = 12000;
const MAX_HTML_CHARS = 2500;
const MAX_TEXT_CHARS = 1000;

const COMPUTED_PROPERTIES = [
  'display',
  'position',
  'box-sizing',
  'width',
  'height',
  'margin',
  'padding',
  'border',
  'border-radius',
  'background',
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'opacity',
  'box-shadow',
  'transform',
  'z-index',
];

const SAMPLE_SELECTORS = [
  ':root',
  'body',
  'header',
  'nav',
  'main',
  'section',
  'article',
  'aside',
  'footer',
  'h1',
  'h2',
  'p',
  'a',
  'button',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[class*="btn"]',
  '[class*="card"]',
  '[class*="modal"]',
];

type StyleContextOptions = {
  existingCss: string;
  stylebotUrl: string;
  activeSelector: string;
};

type ComputedStyleSample = StylebotAiStyleContext['computedStyles'][number];

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n/* truncated */`;
};

const isComputedStyleSample = (
  sample: ComputedStyleSample | null
): sample is ComputedStyleSample => sample !== null;

const getComputedStyleText = (element: Element): string => {
  const computed = window.getComputedStyle(element);

  return COMPUTED_PROPERTIES.map(property => {
    return `${property}: ${computed.getPropertyValue(property)};`;
  }).join('\n');
};

const getElementRectText = (element: Element): string => {
  const rect = element.getBoundingClientRect();

  return [
    `x: ${Math.round(rect.x)}`,
    `y: ${Math.round(rect.y)}`,
    `width: ${Math.round(rect.width)}`,
    `height: ${Math.round(rect.height)}`,
  ].join(', ');
};

const collectStyleSheets = (): StylebotAiStyleContext['styleSheets'] => {
  const readable: StylebotAiStyleContext['styleSheets']['readable'] = [];
  const blocked: StylebotAiStyleContext['styleSheets']['blocked'] = [];
  let totalChars = 0;

  Array.from(document.styleSheets).forEach((styleSheet): void => {
    const href = styleSheet.href || 'inline stylesheet';

    try {
      const rules = Array.from(styleSheet.cssRules)
        .slice(0, MAX_STYLESHEET_RULES)
        .map(rule => rule.cssText)
        .join('\n');
      const remainingChars = MAX_STYLESHEET_CHARS - totalChars;

      if (remainingChars <= 0) {
        return;
      }

      const css = truncate(rules, remainingChars);
      totalChars += css.length;

      readable.push({
        href,
        rules: css,
        truncated:
          rules.length > css.length ||
          styleSheet.cssRules.length > MAX_STYLESHEET_RULES,
      });
    } catch (e) {
      blocked.push({
        href,
        reason: e instanceof Error ? e.message : 'CSS rules are not readable.',
      });
    }
  });

  return { readable, blocked };
};

const collectComputedStyles = (): StylebotAiStyleContext['computedStyles'] => {
  return SAMPLE_SELECTORS.map(selector => {
    const elements = Array.from(document.querySelectorAll(selector));
    const element = elements[0];

    if (!element) {
      return null;
    }

    return {
      selector,
      count: elements.length,
      sample: truncate(element.outerHTML, MAX_HTML_CHARS),
      computedStyle: getComputedStyleText(element),
    };
  }).filter(isComputedStyleSample);
};

const collectActiveElement = (
  activeSelector: string
): StylebotAiStyleContext['activeElement'] => {
  if (!activeSelector) {
    return;
  }

  const element = document.querySelector(activeSelector);

  if (!element) {
    return;
  }

  const text = (element.textContent || '').trim();

  return {
    selector: activeSelector,
    html: truncate(element.outerHTML, MAX_HTML_CHARS),
    text: truncate(text, MAX_TEXT_CHARS),
    rect: getElementRectText(element),
    computedStyle: getComputedStyleText(element),
  };
};

export const collectStyleContext = ({
  existingCss,
  stylebotUrl,
  activeSelector,
}: StyleContextOptions): StylebotAiStyleContext => {
  return {
    page: {
      url: window.location.href,
      title: document.title,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      stylebotUrl,
    },
    existingCss: truncate(existingCss, MAX_EXISTING_CSS_CHARS),
    activeElement: collectActiveElement(activeSelector),
    styleSheets: collectStyleSheets(),
    computedStyles: collectComputedStyles(),
  };
};
