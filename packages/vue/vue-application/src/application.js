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
    };
  },
  render(h) {
    if (this.error) {
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
    const { config, lifecycles } = getWrapProps(this.$props);

    this.app = await webdocker.loadApp({
      container: this.$refs.el,
      name: this.name,
      entry: this.manifest,
    }, config, lifecycles);

    this.app.mount();
    this.loading = false;
    this.$emit('microAppDidMount');
  },
  beforeDestroy() {
    if (this.app) {
      this.app.unmount();
    }
  },
};
