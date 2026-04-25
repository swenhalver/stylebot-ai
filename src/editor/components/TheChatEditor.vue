<template>
  <div
    class="sb-chat"
    @keydown.stop
    @keypress.stop
    @keyup.stop
  >
    <header class="sb-chat__topbar">
      <div class="sb-chat__brand">
        <span class="sb-chat__brand-dot"></span>
        <span class="sb-chat__brand-name">Stylebot AI</span>
      </div>

      <div class="sb-chat__topbar-actions">
        <select
          id="stylebot-open-ai-model"
          v-model="selectedModel"
          class="sb-chat__model-select"
          :title="t('open_ai_model')"
          @change="saveModel"
        >
          <option
            v-for="model in modelOptions"
            :key="model.value"
            :value="model.value"
          >
            {{ model.label }}
          </option>
        </select>

        <button
          v-if="chatHistory.length"
          type="button"
          class="sb-chat__icon-btn"
          :title="t('clear_chat_history')"
          @click="clearHistory"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path
              d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
            ></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>

        <button
          type="button"
          class="sb-chat__icon-btn"
          :title="t('open_ai_options')"
          @click="openOptions"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.22.74.22 1.13 0 .39-.08.77-.22 1.13z"
            ></path>
          </svg>
        </button>
      </div>
    </header>

    <div
      v-if="!storedApiKey"
      class="sb-chat__banner"
      role="alert"
    >
      <span>{{ t('chat_error_missing_key') }}</span>
      <button
        type="button"
        class="sb-chat__banner-btn"
        @click="openOptions"
      >
        {{ t('open_ai_options') }}
      </button>
    </div>

    <main ref="thread" class="sb-chat__thread">
      <div
        v-if="!chatHistory.length && !generating"
        class="sb-chat__empty"
      >
        <div class="sb-chat__empty-glyph">✦</div>
        <h2 class="sb-chat__empty-title">{{ t('chat_empty_title') }}</h2>
        <p class="sb-chat__empty-sub">{{ t('chat_empty_subtitle') }}</p>

        <ul class="sb-chat__suggestions">
          <li
            v-for="suggestion in suggestions"
            :key="suggestion"
          >
            <button
              type="button"
              class="sb-chat__suggestion"
              @click="useSuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </li>
        </ul>
      </div>

      <template v-else>
        <article
          v-for="(entry, index) in chatHistory"
          :key="`${entry.createdAt}-${index}`"
          class="sb-msg"
          :class="`sb-msg--${entry.role}`"
        >
          <div class="sb-msg__avatar" :aria-label="entry.role">
            <span v-if="entry.role === 'user'">U</span>
            <span v-else>✦</span>
          </div>

          <div class="sb-msg__body">
            <div class="sb-msg__tools">
              <button
                type="button"
                class="sb-msg__tool"
                :title="t('edit_message')"
                @click="startEdit(index)"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                </svg>
              </button>

              <button
                type="button"
                class="sb-msg__tool"
                :title="t('delete_message')"
                @click="deleteEntry(index)"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div
              v-if="editingIndex === index"
              class="sb-msg__edit"
            >
              <textarea
                v-model="editDraft"
                class="sb-msg__edit-input"
                rows="3"
                @keydown.exact.stop
                @keypress.exact.stop
                @keyup.exact.stop
                @keydown.escape.prevent="cancelEdit"
                @keydown.meta.enter.prevent="saveEdit"
                @keydown.ctrl.enter.prevent="saveEdit"
              />
              <div class="sb-msg__edit-actions">
                <button
                  type="button"
                  class="sb-msg__code-btn"
                  @click="cancelEdit"
                >{{ t('cancel') }}</button>
                <button
                  type="button"
                  class="sb-msg__code-btn sb-msg__code-btn--primary"
                  @click="saveEdit"
                >{{ t('save') }}</button>
              </div>
            </div>

            <div
              v-else-if="entry.content"
              class="sb-msg__bubble"
            >{{ entry.content }}</div>

            <div v-if="entry.css" class="sb-msg__code">
              <div class="sb-msg__code-head">
                <span class="sb-msg__code-lang">css</span>
                <div class="sb-msg__code-actions">
                  <button
                    type="button"
                    class="sb-msg__code-btn"
                    @click="copyCss(entry.css)"
                  >
                    {{ t('copy') }}
                  </button>
                  <button
                    type="button"
                    class="sb-msg__code-btn sb-msg__code-btn--primary"
                    @click="applyCssFromEntry(entry.css)"
                  >
                    {{ t('apply_generated_css') }}
                  </button>
                </div>
              </div>
              <pre class="sb-msg__code-pre"><code>{{ entry.css }}</code></pre>
            </div>
          </div>
        </article>

        <article
          v-if="generating"
          class="sb-msg sb-msg--assistant sb-msg--typing"
        >
          <div class="sb-msg__avatar"><span>✦</span></div>
          <div class="sb-msg__body">
            <div class="sb-msg__bubble sb-msg__bubble--typing">
              <span class="sb-typing"><i></i><i></i><i></i></span>
              <span class="sb-chat__typing-label">{{ status }}</span>
            </div>
          </div>
        </article>
      </template>
    </main>

    <p
      v-if="error"
      class="sb-chat__error"
      role="alert"
    >{{ error }}</p>

    <footer class="sb-chat__composer">
      <div class="sb-chat__composer-inner">
        <textarea
          ref="input"
          v-model="prompt"
          class="sb-chat__input"
          rows="1"
          :placeholder="t('chat_prompt_placeholder')"
          :disabled="generating"
          @input="autoGrow"
          @keydown.enter.exact.prevent="generateCss"
          @keydown.shift.enter.exact="handleShiftEnter"
        />

        <button
          type="button"
          class="sb-chat__send"
          :disabled="generating || !prompt.trim() || !storedApiKey"
          :title="t('generate_css')"
          @click="generateCss"
        >
          <svg
            v-if="!generating"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span v-else class="sb-chat__send-spinner" aria-hidden="true"></span>
        </button>
      </div>

      <p class="sb-chat__hint">{{ t('chat_composer_hint') }}</p>
    </footer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { t } from '@stylebot/i18n';
import { StylebotAiChatHistoryEntry } from '@stylebot/types';

import { generateCssWithOpenAi, openOptionsPage } from '../utils/chrome';
import { collectStyleContext } from '../utils/style-context';

const CHAT_HISTORY_STORAGE_KEY = 'ai-chat-history';
const CHAT_DRAFT_STORAGE_KEY = 'ai-chat-draft';
const MAX_CHAT_HISTORY_ENTRIES = 30;
const DEFAULT_OPEN_AI_MODEL = 'gpt-5.4-mini';
const OPEN_AI_MODEL_OPTIONS = [
  { label: 'GPT-5.5', value: 'gpt-5.5' },
  { label: 'GPT-5.5 Pro', value: 'gpt-5.5-pro' },
  { label: 'GPT-5.4', value: 'gpt-5.4' },
  { label: 'GPT-5.4 Pro', value: 'gpt-5.4-pro' },
  { label: 'GPT-5.4 mini', value: DEFAULT_OPEN_AI_MODEL },
  { label: 'GPT-5.4 nano', value: 'gpt-5.4-nano' },
  { label: 'GPT-5', value: 'gpt-5' },
  { label: 'GPT-5 mini', value: 'gpt-5-mini' },
  { label: 'GPT-5 nano', value: 'gpt-5-nano' },
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4.1 mini', value: 'gpt-4.1-mini' },
  { label: 'GPT-4.1', value: 'gpt-4.1' },
];

export default Vue.extend({
  name: 'TheChatEditor',

  data(): {
    prompt: string;
    status: string;
    error: string;
    chatHistory: Array<StylebotAiChatHistoryEntry>;
    selectedModel: string;
    modelOptions: Array<{ label: string; value: string }>;
    generating: boolean;
    suggestions: Array<string>;
    editingIndex: number;
    editDraft: string;
  } {
    return {
      editingIndex: -1,
      editDraft: '',
      prompt: '',
      status: t('chat_status_ready'),
      error: '',
      chatHistory: [],
      selectedModel: DEFAULT_OPEN_AI_MODEL,
      modelOptions: OPEN_AI_MODEL_OPTIONS,
      generating: false,
      suggestions: [
        t('chat_suggestion_dark'),
        t('chat_suggestion_readable'),
        t('chat_suggestion_hide_ads'),
        t('chat_suggestion_compact'),
      ],
    };
  },

  computed: {
    storedApiKey(): string {
      return this.$store.state.options.openAiApiKey;
    },

    storedModel(): string {
      return this.$store.state.options.openAiModel;
    },

    css(): string {
      return this.$store.state.css;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    stylebotUrl(): string {
      return this.$store.state.url;
    },
  },

  watch: {
    prompt(value: string): void {
      this.setStoredDraft(value);
    },
  },

  async created(): Promise<void> {
    this.selectedModel = this.storedModel || DEFAULT_OPEN_AI_MODEL;
    this.chatHistory = await this.getStoredHistory();
    this.prompt = await this.getStoredDraft();
    this.$nextTick(() => {
      this.autoGrow();
      this.scrollToBottom();
    });
  },

  methods: {
    getHistoryKey(): string {
      return this.stylebotUrl || window.location.hostname;
    },

    getStoredHistory(): Promise<Array<StylebotAiChatHistoryEntry>> {
      return new Promise(resolve => {
        chrome.storage.local.get(CHAT_HISTORY_STORAGE_KEY, items => {
          const historyMap = items[CHAT_HISTORY_STORAGE_KEY] || {};
          resolve(historyMap[this.getHistoryKey()] || []);
        });
      });
    },

    setStoredHistory(
      chatHistory: Array<StylebotAiChatHistoryEntry>
    ): Promise<void> {
      return new Promise(resolve => {
        chrome.storage.local.get(CHAT_HISTORY_STORAGE_KEY, items => {
          const historyMap = items[CHAT_HISTORY_STORAGE_KEY] || {};

          chrome.storage.local.set(
            {
              [CHAT_HISTORY_STORAGE_KEY]: {
                ...historyMap,
                [this.getHistoryKey()]: chatHistory,
              },
            },
            resolve
          );
        });
      });
    },

    async appendHistoryEntry(
      entry: Omit<StylebotAiChatHistoryEntry, 'createdAt'>
    ): Promise<void> {
      const chatHistory = [
        ...this.chatHistory,
        { ...entry, createdAt: new Date().toISOString() },
      ].slice(-MAX_CHAT_HISTORY_ENTRIES);

      this.chatHistory = chatHistory;
      await this.setStoredHistory(chatHistory);
      this.$nextTick(() => this.scrollToBottom());
    },

    startEdit(index: number): void {
      this.editingIndex = index;
      this.editDraft = this.chatHistory[index]?.content || '';
    },

    cancelEdit(): void {
      this.editingIndex = -1;
      this.editDraft = '';
    },

    async saveEdit(): Promise<void> {
      const index = this.editingIndex;
      if (index < 0 || !this.chatHistory[index]) return;
      const next = this.chatHistory.slice();
      next[index] = { ...next[index], content: this.editDraft };
      this.chatHistory = next;
      this.editingIndex = -1;
      this.editDraft = '';
      await this.setStoredHistory(next);
    },

    async deleteEntry(index: number): Promise<void> {
      const next = this.chatHistory.slice();
      next.splice(index, 1);
      this.chatHistory = next;
      await this.setStoredHistory(next);
    },

    getStoredDraft(): Promise<string> {
      return new Promise(resolve => {
        chrome.storage.local.get(CHAT_DRAFT_STORAGE_KEY, items => {
          const map = items[CHAT_DRAFT_STORAGE_KEY] || {};
          resolve(map[this.getHistoryKey()] || '');
        });
      });
    },

    setStoredDraft(value: string): void {
      chrome.storage.local.get(CHAT_DRAFT_STORAGE_KEY, items => {
        const map = items[CHAT_DRAFT_STORAGE_KEY] || {};
        chrome.storage.local.set({
          [CHAT_DRAFT_STORAGE_KEY]: {
            ...map,
            [this.getHistoryKey()]: value,
          },
        });
      });
    },

    async clearHistory(): Promise<void> {
      this.chatHistory = [];
      this.error = '';
      await this.setStoredHistory([]);
    },

    saveModel(): void {
      this.$store.dispatch('setOpenAiModel', this.selectedModel);
    },

    openOptions(): void {
      openOptionsPage();
    },

    useSuggestion(suggestion: string): void {
      this.prompt = suggestion;
      this.$nextTick(() => {
        this.autoGrow();
        (this.$refs.input as HTMLTextAreaElement)?.focus();
      });
    },

    handleShiftEnter(): void {
      this.$nextTick(() => this.autoGrow());
    },

    autoGrow(): void {
      const el = this.$refs.input as HTMLTextAreaElement | undefined;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    },

    scrollToBottom(): void {
      const el = this.$refs.thread as HTMLElement | undefined;
      if (el) el.scrollTop = el.scrollHeight;
    },

    copyCss(css: string): void {
      try {
        navigator.clipboard.writeText(css);
      } catch (e) {
        // clipboard may be unavailable; ignore
      }
    },

    applyCssFromEntry(css: string): void {
      this.$store.dispatch('applyCss', { css: css.trim() });
      this.status = t('chat_status_applied');
    },

    async generateCss(): Promise<void> {
      const prompt = this.prompt.trim();

      if (!this.storedApiKey) {
        this.error = t('chat_error_missing_key');
        return;
      }

      if (!prompt) return;

      this.generating = true;
      this.error = '';
      this.status = t('chat_status_collecting');
      this.prompt = '';
      this.$nextTick(() => this.autoGrow());

      try {
        const chatHistory = [...this.chatHistory];
        await this.appendHistoryEntry({ role: 'user', content: prompt });

        const styleContext = collectStyleContext({
          existingCss: this.css,
          stylebotUrl: this.stylebotUrl,
          activeSelector: this.activeSelector,
        });

        this.status = t('chat_status_generating');

        const response = await generateCssWithOpenAi(
          prompt,
          styleContext,
          chatHistory
        );

        const assistantContent =
          response.message ||
          (response.css
            ? t('chat_generated_css_message')
            : response.error || '');

        if (assistantContent || response.css) {
          await this.appendHistoryEntry({
            role: 'assistant',
            content: assistantContent,
            css: response.css,
          });
        }

        if (response.error) {
          this.error = t('chat_error_generation_failed', [response.error]);
          return;
        }

        this.status = t('chat_status_generated');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error.';
        this.error = t('chat_error_generation_failed', [message]);
      } finally {
        this.generating = false;
        this.$nextTick(() => {
          this.scrollToBottom();
          (this.$refs.input as HTMLTextAreaElement)?.focus();
        });
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.sb-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
}

.sb-chat__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 2;
}

.sb-chat__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #111827;
}

.sb-chat__brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.sb-chat__topbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sb-chat__model-select {
  font-size: 12px;
  padding: 4px 24px 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  color: #111827;
  max-width: 150px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 12px;

  &:hover {
    border-color: #9ca3af;
  }
}

.sb-chat__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
}

.sb-chat__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  border-bottom: 1px solid #fde68a;
}

.sb-chat__banner-btn {
  border: 1px solid #92400e;
  background: transparent;
  color: #92400e;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #92400e;
    color: #fef3c7;
  }
}

.sb-chat__thread {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 18px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sb-chat__empty {
  margin: auto;
  max-width: 320px;
  text-align: center;
  color: #374151;
}

.sb-chat__empty-glyph {
  font-size: 28px;
  color: #6366f1;
  margin-bottom: 6px;
}

.sb-chat__empty-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #111827;
}

.sb-chat__empty-sub {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 14px;
}

.sb-chat__suggestions {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}

.sb-chat__suggestion {
  width: 100%;
  text-align: left;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12.5px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: #ffffff;
    border-color: #c7d2fe;
  }
}

.sb-msg {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.sb-msg--user {
  flex-direction: row-reverse;
}

.sb-msg__avatar {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.sb-msg--user .sb-msg__avatar {
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
}

.sb-msg__body {
  max-width: calc(100% - 42px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.sb-msg:hover .sb-msg__tools {
  opacity: 1;
}

.sb-msg__tools {
  position: absolute;
  top: -8px;
  right: -4px;
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  opacity: 0;
  transition: opacity 120ms ease;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(17, 24, 39, 0.08);
}

.sb-msg--user .sb-msg__tools {
  right: auto;
  left: -4px;
}

.sb-msg__tool {
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms ease, color 120ms ease;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
}

.sb-msg__edit {
  width: 100%;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sb-msg__edit-input {
  width: 100%;
  min-width: 240px;
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: #111827;
  background: #ffffff;
  border: 1px solid #a5b4fc;
  border-radius: 10px;
  padding: 8px 10px;
  resize: vertical;
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.sb-msg__edit-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.sb-msg--user .sb-msg__body {
  align-items: flex-end;
}

.sb-msg__bubble {
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
}

.sb-msg--user .sb-msg__bubble {
  background: #111827;
  color: #f9fafb;
  border-color: #111827;
}

.sb-msg__bubble--typing {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f3f4f6;
  color: #6b7280;
}

.sb-typing {
  display: inline-flex;
  gap: 3px;

  i {
    width: 6px;
    height: 6px;
    background: #9ca3af;
    border-radius: 50%;
    animation: sb-bounce 1.2s infinite ease-in-out;
  }
  i:nth-child(2) { animation-delay: 0.15s; }
  i:nth-child(3) { animation-delay: 0.3s; }
}

@keyframes sb-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.sb-chat__typing-label {
  font-size: 12px;
}

.sb-msg__code {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #1f2937;
  background: #0b1020;
  width: 100%;
}

.sb-msg__code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 10px;
  background: #111827;
  color: #9ca3af;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sb-msg__code-actions {
  display: flex;
  gap: 4px;
}

.sb-msg__code-btn {
  border: 1px solid #374151;
  background: transparent;
  color: #e5e7eb;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 11px;
  cursor: pointer;

  &:hover { background: #1f2937; }

  &--primary {
    background: #6366f1;
    border-color: #6366f1;
    color: #ffffff;

    &:hover { background: #4f46e5; border-color: #4f46e5; }
  }
}

.sb-msg__code-pre {
  margin: 0;
  padding: 10px 12px;
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.5;
  color: #e5e7eb;
  max-height: 280px;
  overflow: auto;
  white-space: pre;
}

.sb-chat__error {
  margin: 0 14px 6px;
  padding: 8px 10px;
  font-size: 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.sb-chat__composer {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 10px 14px 12px;
}

.sb-chat__composer-inner {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 6px 6px 6px 12px;
  transition: border-color 120ms ease, background 120ms ease;

  &:focus-within {
    border-color: #a5b4fc;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
}

.sb-chat__input {
  flex: 1 1 auto;
  border: 0;
  outline: none;
  background: transparent;
  resize: none;
  font-size: 13.5px;
  line-height: 1.5;
  color: #111827;
  overflow: hidden;
  padding: 6px 0;
  font-family: inherit;

  &:disabled { color: #9ca3af; }
}

.sb-chat__send {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 0;
  background: #111827;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;

  &:hover:not(:disabled) { background: #374151; }
  &:active:not(:disabled) { transform: scale(0.96); }

  &:disabled {
    background: #d1d5db;
    color: #f9fafb;
    cursor: not-allowed;
  }
}

.sb-chat__send-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: sb-spin 0.8s linear infinite;
}

@keyframes sb-spin {
  to { transform: rotate(360deg); }
}

.sb-chat__hint {
  margin: 6px 4px 0;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}
</style>
