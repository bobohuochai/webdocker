/* eslint-disable import/no-unresolved */
import React, { HTMLAttributes, useState, useEffect } from 'react';
import type {
  LoadableAppEntry, FrameworkConfiguration, FrameworkLifecycles,
} from '@webdocker/core';
import { loadApp } from '@webdocker/core';
import ReactLoading from 'react-loading';
import './Application.scss';

interface ReturnApp {
  name: string;
  mount: () => Promise<void>;
  unmount: () => Promise<void>;
}

interface ApplicationProps extends HTMLAttributes<Element> {
  name:string;
  manifest:LoadableAppEntry,
  config:FrameworkConfiguration,
  lifeCycles?:FrameworkLifecycles<any>,
  initialPath?:string;
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

  /**
   * 是否关闭错误提示
   */
  error?: boolean | React.ReactElement;

  loading?:boolean | React.ReactElement;

}
export default function Application(props:ApplicationProps) {
  const {
    style = {}, className = '', name, manifest, initialPath, config, lifeCycles,
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

  const getError = () => {
    const propError = props.error;
    if (propError === false) {
      return null;
    } if (propError && React.isValidElement(propError)) {
      return propError;
    }
    const commonErrorStyle = {
      lineHeight: '22px',
      color: '#d93026',
      fontSize: 14,
    };
    const containerStyle = {
      background: '#fcebea',
      padding: '24px',
    };
    return error && (
      <div style={containerStyle}>
        <div style={commonErrorStyle}>{error.message}</div>
        <pre style={commonErrorStyle}>{error.stack }</pre>
      </div>
    );
  };

  const getLoading = () => {
    const loadingProp = props.loading;
    if (loadingProp === false) {
      return null;
    } if (loadingProp && React.isValidElement(loadingProp)) {
      return loadingProp;
    }
    return <div className='loading-box'><ReactLoading type='bars' color='#1fa0e8'></ReactLoading></div>;
  };

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
          initialPath,
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

  if (hasError && error) {
    return getError();
  }

  return (
    <React.Fragment>
      {loading ? getLoading() : null}
      <div ref={domRef} style={style} className={className}>
      </div>
    </React.Fragment>
  );
}
