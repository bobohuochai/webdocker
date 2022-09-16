import { ScopedCSS } from '../src/sandbox/css';

let cssProcessor:ScopedCSS|null;
beforeAll(() => {
  cssProcessor = new ScopedCSS();
});

afterAll(() => {
  cssProcessor = null;
});

const fakeStyleNode = (css:string) => {
  const styleNode = document.createElement('style');
  const cssNode = document.createTextNode(css);
  styleNode.appendChild(cssNode);
  document.body.appendChild(styleNode);
  return styleNode;
};

const sleep = (ms:number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const removeWhiteSpaceString = (s:string|null) => {
  if (s == null) {
    return s;
  }
  const whiteSpaceReg = /\s/g;
  return s.replace(whiteSpaceReg, '');
};

test('should add attribute selector correctly', () => {
  const actualValue = '.react15-main {display: flex; flex-direction: column; align-items: center;}';
  const expectValue = 'div[data-webdocker="vue2"] .react15-main {display: flex; flex-direction: column; align-items: center;}';
  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');
  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should add attribute selector correctly when style node changes', async () => {
  const actualValue = '.react15-main {display: flex; flex-direction: column; align-items: center;}';
  const expectValue = 'div[data-webdocker="vue2"] .react15-main {display: flex; flex-direction: column; align-items: center;}';
  const styleNode = fakeStyleNode('');
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  const textNode = document.createTextNode(actualValue);
  styleNode.appendChild(textNode);

  await sleep(200);

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should replace html correctly', () => {
  const actualValue = 'html {font-size:14px;}';
  const expectValue = 'div[data-webdocker="vue2"] {font-size:14px;}';
  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should replace body correctly', () => {
  const actualValue = 'body {font-size:14px;}';
  const expectValue = 'div[data-webdocker="vue2"] {font-size:14px;}';
  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should replace :root correctly', () => {
  const actualValue = ':root {--gray: #eee}';
  const expectValue = 'div[data-webdocker="vue2"] {--gray: #eee}';
  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should replace :root correctly [2]', () => {
  const actualValue = 'svg:not(:root) {overflow: hidden;}';
  const expectValue = 'svg:not(div[data-webdocker="vue2"]){overflow:hidden;}';
  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should rewrite root-level correctly', () => {
  const actualValue = 'html + div {font-size: 14px;}';
  const expectValue = 'div[data-webdocker="vue2"] + div {font-size: 14px;}';
  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should handle root-level descendant selector [1]', () => {
  const actualValue = 'html > body {color: #eee;}';
  const expectValue = 'div[data-webdocker="vue2"] {color: #eee;}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should rewrite root-level correctly [3]', () => {
  const actualValue = `[type="reset"],
    [type="submit"],
    button,
    html [type="button"] {
      -webkit-appearance: button;
    }`;
  const expectValue = `div[data-webdocker="vue2"] [type="reset"],
  div[data-webdocker="vue2"] [type="submit"],
  div[data-webdocker="vue2"] button,
  div[data-webdocker="vue2"] [type="button"] {-webkit-appearance: button;}`;

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should not remove special root-level selector when rule is non-standard [1]', () => {
  const actualValue = 'html + body {color: #eee;}';
  const expectValue = 'div[data-webdocker="vue2"] +div[data-webdocker="vue2"] {color: #eee;}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should transform @supports', () => {
  const actualValue = '@supports (display: grid) {div{margin: 1cm;}}';
  const expectValue = '@supports (display: grid) {div[data-webdocker="vue2"] div {margin: 1cm;}}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should not transform @keyframes', () => {
  const actualValue = '@keyframes move {from {top: 0px;}to {top: 200px;}}';
  const expectValue = '@keyframes move {from {top: 0px;}to {top: 200px;}}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should not transform @font-face', () => {
  const actualValue = '@font-face {font-family: "Open Sans";}';
  const expectValue = '@font-face {font-family: "Open Sans";}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should not transform style that has already been transform [1]', async () => {
  const actualValue = '.react15-main {display: flex;}';
  const expectValue = 'div[data-webdocker="vue2"] .react15-main {display: flex;}';

  const styleNode = fakeStyleNode('');
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  const textNode = document.createTextNode(actualValue);
  styleNode.appendChild(textNode);

  await sleep(10);

  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should not transform @page', () => {
  const actualValue = '@page {margin: 1cm;}';
  const expectValue = '@page {margin: 1cm;}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should not transform @import', () => {
  const actualValue = "@import 'custom.css'";
  const expectValue = "@import 'custom.css'";

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});

test('should transform @media', () => {
  const actualValue = '@media screen and (max-width: 300px) {div{margin: 1cm;}}';
  const expectValue = '@media screen and (max-width: 300px) {div[data-webdocker="vue2"] div {margin: 1cm;}}';

  const styleNode = fakeStyleNode(actualValue);
  cssProcessor?.process(styleNode, 'div[data-webdocker="vue2"]');

  expect(removeWhiteSpaceString(styleNode.textContent)).toBe(removeWhiteSpaceString(expectValue));
});
