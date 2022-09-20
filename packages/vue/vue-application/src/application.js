import webdocker from '@webdocker/core';

const getWrapProps = (props = {}) => {
  const wrapProps = { ...props, ...(props.appProps || {}) };
  delete wrapProps.name;
  delete wrapProps.manifest;
  return wrapProps;
};

export default {
  name: 'Application',
  props: {
    name: {
      type: String,
      required: true,
    },
    manifest: {
      type: Object,
      required: false,
    },
    config: {
      type: Object,
      required: false,
    },
    lifecycles: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      loading: true,
      hasError: false,
      app: null,
      error: null,
      unmounted: false,
    };
  },
  render(h) {
    if (this.hasError) {
      if (this.$slots.error) {
        return this.$slots.error;
      }
      return h('pre', { style: { color: 'red' } }, this.error.stack);
    }
    if (this.loading) {
      if (this.$slots.loading) {
        return this.$slots.loading;
      }
    }
    return h('div', {
      class: this.class,
      ref: 'el',
    });
  },
  async mounted() {
    this.executeAction('mount', async () => {
      const { config, lifecycles } = getWrapProps(this.$props);
      this.app = await webdocker.loadApp({
        container: this.$refs.el,
        name: this.name,
        entry: this.manifest,
      }, config, lifecycles);

      this.app.mount();
      this.loading = false;
      this.$emit('microAppDidMount', this.app);
    });
  },
  beforeDestroy() {
    this.executeAction('unmount', () => {
      if (this.app) {
        this.app.unmount();
        this.$emit('microAppDidUnmount', this.app);
      }
    });
    this.unmounted = true;
  },
  methods: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    executeAction(action, thing = () => {}) {
      if (this.hasError && action !== 'unmount') {
        return;
      }
      Promise.resolve().then(() => {
        if (this.unmounted && action !== 'unmount') {
          return;
        }

        thing();
      }).catch((err) => {
        const error = new Error(`During '${action}',sub micro application threw an error:${err.message}`);
        this.hasError = true;
        this.loading = false;
        this.error = error;
        this.$emit('microAppDidCatch', error);
        console.error(error);
      });
    },
  },

};
