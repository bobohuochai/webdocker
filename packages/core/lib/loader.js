import { __awaiter } from "tslib";
import { importEntry } from 'import-html-entry';
import { createSandboxContainer } from './sandbox/index';
import * as css from './sandbox/css';
export function getDefaultTplWrapper(name) {
    return (tpl) => `<div id="${name}" data-name="${name}">${tpl}</div>`;
}
const rawAppendChild = HTMLElement.prototype.appendChild;
const WebDockerSubAppContainerAttr = '__WEB_DOCKER_APP';
function createElement(appContent, appInstanceId) {
    const containerElement = document.createElement('div');
    containerElement.innerHTML = appContent;
    const appElement = containerElement.firstChild;
    const attr = appElement.getAttribute(css.WebDockerCSSRewriteAttr);
    if (!attr) {
        appElement.setAttribute(css.WebDockerCSSRewriteAttr, appInstanceId);
    }
    const styleNodes = appElement.querySelectorAll('style') || [];
    styleNodes.forEach((stylesheetElement) => {
        css.process(appElement, stylesheetElement, appInstanceId);
    });
    // 添加微应用入口
    const subappElement = document.createElement('div');
    subappElement.setAttribute('id', WebDockerSubAppContainerAttr);
    rawAppendChild.call(appElement, subappElement);
    return appElement;
}
function getContainer(container) {
    return typeof container === 'string' ? document.querySelector(container) : container;
}
function render(element, container) {
    const containerElement = getContainer(container);
    console.log('render===>', containerElement, element);
    if (containerElement && element) {
        rawAppendChild.call(containerElement, element);
    }
}
/** generate app wrapper dom getter */
function getAppWrapperGetter(elementGetter) {
    return () => {
        const element = elementGetter();
        return element === null || element === void 0 ? void 0 : element.querySelector(`#${WebDockerSubAppContainerAttr}`);
    };
}
export function loadApp({ container, name, entry }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { execScripts, template } = yield importEntry(Object.assign({}, entry));
        const appInstanceId = 'lightYear-1';
        const appName = name;
        const appContent = getDefaultTplWrapper(appInstanceId)(template);
        const appElement = createElement(appContent, appInstanceId);
        const appWrapperGetter = getAppWrapperGetter(() => appElement);
        // 第一次加载设置应用可见区域 dom 结构
        // 确保每次应用加载前容器 dom 结构已经设置完毕
        render(appElement, container);
        const sandboxContainer = createSandboxContainer(appName);
        const { proxy } = sandboxContainer.instance;
        const scriptExports = yield execScripts(proxy, true);
        console.log('script exports===>', scriptExports, appElement);
        return {
            mount: () => {
                scriptExports.mount({ container: appWrapperGetter() });
            },
        };
    });
}
