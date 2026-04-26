<template>
  <div class="style-editor">
    <div class="style-editor-overlay" />
    <div class="style-editor-modal">
      <div class="px-3 py-4">
        <b-form-input
          v-model="url"
          placeholder="Enter URL..."
          label="URL"
          autofocus
          style="max-width: 600px;"
        />
      </div>

      <div class="style-editor-panes mx-3">
        <div class="style-editor-pane style-editor-pane--css">
          <code-editor
            :css="css"
            language="css"
            @update="css = $event"
          />
        </div>

        <div
          class="style-editor-pane style-editor-pane--js"
          :class="{ 'style-editor-pane--collapsed': !jsExpanded }"
        >
          <button
            type="button"
            class="style-editor-js-tab"
            :aria-expanded="jsExpanded ? 'true' : 'false'"
            @click="jsExpanded = !jsExpanded"
          >
            <span>JavaScript</span>
            <span class="style-editor-js-tab-caret">
              {{ jsExpanded ? '▾' : '▴' }}
            </span>
          </button>

          <div v-show="jsExpanded" class="style-editor-js-body">
            <code-editor
              :css="js"
              language="javascript"
              @update="js = $event"
            />
          </div>
        </div>
      </div>

      <div class="style-editor-footer py-5 px-3">
        <app-button
          class="ml-3"
          variant="primary"
          :disabled="!url || (!css && !js)"
          @click="$emit('save', { initialUrl, url, css, js })"
        >
          {{ t('save') }}
        </app-button>

        <app-button @click="$emit('cancel')">{{ t('cancel') }}</app-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from '../AppButton.vue';
import CodeEditor from './CodeEditor.vue';

export default Vue.extend({
  name: 'StyleEditor',

  components: {
    AppButton,
    CodeEditor,
  },

  props: {
    initialUrl: {
      type: String,
      required: false,
      default: '',
    },

    initialCss: {
      type: String,
      required: false,
      default: '',
    },

    initialJs: {
      type: String,
      required: false,
      default: '',
    },
  },

  data(): {
    url: string;
    css: string;
    js: string;
    jsExpanded: boolean;
  } {
    return {
      url: this.initialUrl,
      css: this.initialCss,
      js: this.initialJs,
      jsExpanded: !!this.initialJs,
    };
  },
});
</script>

<style lang="scss">
.style-editor {
  position: relative;
  z-index: 100000;
}

.style-editor-overlay {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  background: #00000091;
}

.style-editor-modal {
  background: #fff;
  height: 80%;
  width: 80%;
  padding: 20px;
  position: fixed;
  top: 10%;
  left: 10%;
}

.style-editor-panes {
  display: flex;
  flex-direction: column;
  height: 75%;
  border: 1px solid #eee;
  border-right-width: 2px;
}

.style-editor-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.style-editor-pane--css {
  flex: 1 1 auto;
}

.style-editor-pane--js {
  flex: 0 0 auto;
  border-top: 1px solid #e5e7eb;
}

.style-editor-pane--js:not(.style-editor-pane--collapsed) {
  flex: 1 1 40%;
}

.style-editor-js-tab {
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

.style-editor-js-tab:hover {
  background: #f3f4f6;
}

.style-editor-js-tab-caret {
  font-size: 10px;
  color: #6b7280;
}

.style-editor-js-body {
  flex: 1 1 auto;
  min-height: 0;
}

.style-editor-footer {
  button {
    float: right;
  }
}
</style>
