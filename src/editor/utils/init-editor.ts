import Vue from 'vue';
import VueDraggableResizable from 'vue-draggable-resizable';
import { Store } from 'vuex';
import { t } from '@stylebot/i18n';

import { State } from '../store';
import TheStylebotApp from '../components/TheStylebotApp.vue';

import '../index.scss';

import {
  IconsPlugin,
  TooltipPlugin,
  LayoutPlugin,
  DropdownPlugin,
  FormRadioPlugin,
  FormInputPlugin,
  InputGroupPlugin,
  ButtonPlugin,
  ButtonGroupPlugin,
  FormGroupPlugin,
  FormCheckboxPlugin,
  ListGroupPlugin,
  TableSimplePlugin,
  CollapsePlugin,
} from 'bootstrap-vue';

Vue.use(IconsPlugin);
Vue.use(TooltipPlugin);
Vue.use(LayoutPlugin);
Vue.use(DropdownPlugin);
Vue.use(FormRadioPlugin);
Vue.use(FormInputPlugin);
Vue.use(InputGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(FormGroupPlugin);
Vue.use(FormCheckboxPlugin);
Vue.use(ListGroupPlugin);
Vue.use(TableSimplePlugin);
Vue.use(CollapsePlugin);
Vue.component('vue-draggable-resizable', VueDraggableResizable);

Vue.mixin({
  methods: {
    t,
  },
});

const ts = (): string => new Date().toISOString();

Vue.config.errorHandler = (err, vm, info): void => {
  const componentName =
    (vm && (vm.$options.name || vm.$options._componentTag)) || 'unknown';
  console.error(
    `[${ts()}] Stylebot editor Vue error in <${componentName}> (${info}):`,
    err
  );
};

Vue.config.warnHandler = (msg, vm): void => {
  const componentName =
    (vm && (vm.$options.name || vm.$options._componentTag)) || 'unknown';
  console.warn(
    `[${ts()}] Stylebot editor Vue warn in <${componentName}>: ${msg}`
  );
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', event => {
    console.error(
      `[${ts()}] Stylebot editor window error at ${event.filename}:${event.lineno}:${event.colno}:`,
      event.error || event.message
    );
  });

  window.addEventListener('unhandledrejection', event => {
    console.error(
      `[${ts()}] Stylebot editor unhandled rejection:`,
      event.reason
    );
  });
}

const injectCss = (shadowRoot: ShadowRoot): void => {
  let url: string;
  try {
    url = chrome.runtime.getURL('editor/index.css');
  } catch (e) {
    console.error(
      `[${ts()}] Stylebot failed to resolve editor CSS URL (extension context likely invalidated):`,
      e
    );
    return;
  }

  fetch(url, { method: 'GET' })
    .then(response => response.text())
    .then(css => {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('id', 'stylebot-editor-css');
      styleEl.innerHTML = css;
      shadowRoot.appendChild(styleEl);
    })
    .catch(e => {
      console.error(`[${ts()}] Stylebot failed to inject editor CSS:`, e);
    });
};

const initEditor = (store: Store<State>): void => {
  if (document.getElementById('stylebot')) {
    return;
  }

  const stylebotAppHost = document.createElement('div');
  stylebotAppHost.id = 'stylebot';
  document.body.appendChild(stylebotAppHost);

  const shadowRoot = stylebotAppHost.attachShadow({ mode: 'open' });
  const stylebotApp = document.createElement('div');

  stylebotApp.id = 'stylebot-app';
  shadowRoot.appendChild(stylebotApp);

  injectCss(shadowRoot);

  new Vue({
    store,
    el: stylebotApp,
    render: h => h(TheStylebotApp),
  });
};

export { initEditor };
