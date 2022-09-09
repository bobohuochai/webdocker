import ProxySandbox from './proxySandbox';

export function createSandboxContainer(appName:string, globalContext?: typeof window) {
  const sandbox = new ProxySandbox(appName, globalContext);
  return {
    instance: sandbox,
    async mount() {
      sandbox.active();
    },
    async unmount() {
      sandbox.inactive();
    },
  };
}
