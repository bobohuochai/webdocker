<template>
    <div v-if="!hasError" class="appliction-box" ref="el">
      <slot v-if="$slots.loading" name="loading">
      </slot>
      <loading v-else is-full-page :active.sync="loading" color="#1fa0e8" background-color="#000" loader="bars"
       />
     </div>
     <div v-else>
        <slot v-if="$slots.error" name="error"></slot> 
        <slot v-else >
            <pre style="color:red">{{error.stack}}</pre>
        </slot>
     </div>
</template>

<script>
import webdocker from '@webdocker/core';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';

const getWrapProps = (props = {}) => {
  const wrapProps = { ...props, ...(props.appProps || {}) };
  delete wrapProps.name;
  delete wrapProps.manifest;
  return wrapProps;
};

export default {
  name: 'Application',
  components:{Loading},
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
      loader: null,
    };
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

       return thing()
      }).catch((err) => {
        console.log('error====>',this)
        const error = new Error(`During '${action}', micro application threw an error:${err.message}`);
        this.error = error;
        this.hasError = true;
        this.loading = false;
        this.$emit('microAppDidCatch', error);
        console.error(error);
      });
    },
  }
};
</script>
