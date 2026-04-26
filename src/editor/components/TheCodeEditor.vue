<template>
  <div class="stylebot-code-editor">
    <div class="stylebot-code-editor__pane stylebot-code-editor__pane--css">
      <code-editor-iframe id="stylebot-selector-css" ref="cssEditor" />
    </div>

    <div
      class="stylebot-code-editor__pane stylebot-code-editor__pane--js"
      :class="{ 'stylebot-code-editor__pane--collapsed': !jsExpanded }"
    >
      <button
        type="button"
        class="stylebot-code-editor__js-tab"
        :aria-expanded="jsExpanded ? 'true' : 'false'"
        @click="toggleJs"
      >
        <span class="stylebot-code-editor__js-tab-label">JavaScript</span>
        <span class="stylebot-code-editor__js-tab-caret">
          {{ jsExpanded ? '▾' : '▴' }}
        </span>
      </button>

      <div v-show="jsExpanded" class="stylebot-code-editor__js-body">
        <code-editor-iframe ref="jsEditor" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { getRule, addEmptyRule, removeEmptyRules } from '@stylebot/css';
import { IframeMessage, ParentUpdateCssMessage } from '@stylebot/monaco-editor';

import CodeEditorIframe from './code/CodeEditorIframe.vue';

type EditorKey = 'css' | 'js';

export default Vue.extend({
  name: 'TheCodeEditor',

  components: {
    CodeEditorIframe,
  },

  data(): { jsExpanded: boolean } {
    return {
      jsExpanded: !!this.$store.state.js,
    };
  },

  computed: {
    css(): string {
      return this.$store.state.css;
    },

    js(): string {
      return this.$store.state.js;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },
  },

  watch: {
    activeSelector(selector: string): void {
      if (selector) {
        const css = removeEmptyRules(this.css);
        this.$store.dispatch('applyCss', { css });
      }

      this.handleActiveSelectorChange(selector);
    },

    css(value: string): void {
      const cssWindow = this.getEditorWindow('css');

      if (value === '' && cssWindow) {
        this.postCodeToEditor('css', cssWindow);
      }
    },

    js(value: string): void {
      if (value && !this.jsExpanded) {
        this.jsExpanded = true;
        this.$nextTick(() => {
          const jsWindow = this.getEditorWindow('js');
          if (jsWindow) this.postCodeToEditor('js', jsWindow);
        });
        return;
      }

      const jsWindow = this.getEditorWindow('js');

      if (value === '' && jsWindow) {
        this.postCodeToEditor('js', jsWindow);
      }
    },
  },

  created() {
    window.addEventListener('message', this.handleMessage);
    const css = removeEmptyRules(this.css);
    this.$store.dispatch('applyCss', { css });
  },

  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage);
  },

  methods: {
    getEditorIframe(key: EditorKey): HTMLIFrameElement | null | undefined {
      const ref = this.$refs[`${key}Editor`] as Vue | undefined;
      return ref?.$el.querySelector('iframe') as
        | HTMLIFrameElement
        | null
        | undefined;
    },

    getEditorWindow(key: EditorKey): Window | null | undefined {
      return this.getEditorIframe(key)?.contentWindow;
    },

    resolveSourceKey(source: MessageEventSource | null): EditorKey | null {
      if (!source) return null;
      if (source === this.getEditorWindow('css')) return 'css';
      if (source === this.getEditorWindow('js')) return 'js';
      return null;
    },

    postCodeToEditor(key: EditorKey, contentWindow: Window): void {
      const message: ParentUpdateCssMessage = {
        css: key === 'css' ? this.css : this.js,
        language: key === 'css' ? 'css' : 'javascript',
        type: 'stylebotCssUpdate',
        selector: key === 'css' ? this.activeSelector : '',
      };

      contentWindow.postMessage(message, chrome.runtime.getURL('*'));
    },

    handleMessage(message: {
      source: MessageEventSource | null;
      data: IframeMessage;
    }): void {
      const key = this.resolveSourceKey(message.source);
      if (!key) return;

      switch (message.data.type) {
        case 'stylebotMonacoIframeLoaded':
          this.handleIframeLoaded(key);
          break;

        case 'stylebotMonacoIframeCssUpdated':
          this.handleIframeCodeUpdate(key, message.data.css);
          break;
      }
    },

    handleIframeLoaded(key: EditorKey): void {
      if (key === 'css') {
        this.handleActiveSelectorChange(this.activeSelector);
      } else {
        const jsWindow = this.getEditorWindow('js');
        if (jsWindow) this.postCodeToEditor('js', jsWindow);
      }
    },

    handleIframeCodeUpdate(key: EditorKey, code: string): void {
      if (key === 'css') {
        this.$store.dispatch('applyCss', { css: code });
      } else {
        this.$store.dispatch('applyJs', { js: code });
      }
    },

    toggleJs(): void {
      this.jsExpanded = !this.jsExpanded;

      if (this.jsExpanded) {
        this.$nextTick(() => {
          const jsWindow = this.getEditorWindow('js');
          if (jsWindow) this.postCodeToEditor('js', jsWindow);
        });
      }
    },

    handleActiveSelectorChange(selector: string): void {
      const cssWindow = this.getEditorWindow('css');
      if (!cssWindow) return;

      if (selector && !getRule(this.css, selector)) {
        const css = addEmptyRule(this.css, selector);
        this.$store.dispatch('applyCss', { css });
      }

      this.postCodeToEditor('css', cssWindow);
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stylebot-code-editor__pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.stylebot-code-editor__pane--css {
  flex: 1 1 auto;
}

.stylebot-code-editor__pane--js {
  flex: 0 0 auto;
  border-top: 1px solid #e5e7eb;
}

.stylebot-code-editor__pane--js:not(.stylebot-code-editor__pane--collapsed) {
  flex: 0 0 50%;
}

.stylebot-code-editor__js-tab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 12px;
  background: #f9fafb;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.stylebot-code-editor__js-tab:hover {
  background: #f3f4f6;
}

.stylebot-code-editor__js-tab-caret {
  font-size: 10px;
  color: #6b7280;
}

.stylebot-code-editor__js-body {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
