/* eslint-disable import/no-unresolved */
import React, { HTMLAttributes, useState, useEffect } from 'react';
import type { LoadableAppEntry, FrameworkConfiguration, FrameworkLifecycles } from '@webdocker/core';
import { loadApp } from '@webdocker/core';

interface ReturnApp {
  name: string;
  mount: () => Promise<void>;
  unmount: () => Promise<void>;
}

interface ApplicationProps<T> extends HTMLAttributes<Element> {
  name:string;
  manifest:LoadableAppEntry,
  config:FrameworkConfiguration,
  lifeCycles?:FrameworkLifecycles<T>,
  /**
   * 处理错误的生命周期
   */
  microAppDidCatch?: (err: Error) => void;

  /**
   * 应用卸载之后生命周期
   */
  microAppDidUnmount?: (app:ReturnApp) => void | Promise<void>;

  /**
   * 引用完成加载之后生命周期
   */
  microAppDidMount?: (app:ReturnApp) => void;

}
export default function Application<T>(props:ApplicationProps<T>) {
  const {
    style = {}, className = '', name, manifest, config, lifeCycles,
    microAppDidCatch,
    microAppDidUnmount,
    microAppDidMount,
  } = props;
  const domRef = React.createRef<HTMLDivElement>();
  const [hasError, setHasError] = useState<boolean>(false);
  const [error, setError] = useState<Error|null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  let unmounted = false;

  let app:ReturnApp|null = null;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const executeAction = (action:string, thing:Function) => {
    if (hasError && action !== 'unmount') {
      return;
    }
    Promise.resolve()
      .then(() => {
        if (unmounted && action !== 'unmount') {
          return;
        }
        // eslint-disable-next-line consistent-return
        return thing();
      })
      .catch((err) => {
        const newError = new Error(
          `During '${action}', micro application threw an error:${err.message}`,
        );
        setError(newError);
        setHasError(true);
        setLoading(false);
        if (microAppDidCatch) {
          microAppDidCatch(newError);
        }
        console.error(newError);
      });
  };

  useEffect(() => {
    executeAction('mount', async () => {
      app = await loadApp(
        {
          container: domRef.current ? domRef.current : '',
          name,
          entry: manifest,
        },
        config,
        lifeCycles,
      );
      app.mount();
      setLoading(false);
      if (microAppDidMount) {
        microAppDidMount(app);
      }
    });
    return function cleanup() {
      executeAction('unmount', () => {
        if (app) {
          app.unmount();
          if (microAppDidUnmount) {
            microAppDidUnmount(app);
          }
        }
      });
      unmounted = true;
    };
  }, []);

  return (
    <React.Fragment>
      <div ref={domRef} style={style} className={className}>
      </div>
    </React.Fragment>
  );
}
