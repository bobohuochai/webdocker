import webdocker from '@webdocker/core';

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
  },
  data() {
    return {
      loading: true,
      hasError: false,
      app: null,
    };
  },
  render(h) {
    return h('div', {
      class: this.class,
      ref: 'el',
    });
  },
  async mounted() {
    this.app = await webdocker.loadApp({
      container: this.$refs.el,
      name: this.name,
      entry: this.manifest,
    });
    this.app.mount();
  },
  beforeDestroy() {
    if (this.app) {
      this.app.unmount();
    }
  },
};
