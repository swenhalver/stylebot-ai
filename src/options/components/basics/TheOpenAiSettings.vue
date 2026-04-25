<template>
  <div>
    <h2>{{ t('open_ai_settings') }}</h2>

    <div class="description mb-2">
      {{ t('open_ai_api_key_description') }}
    </div>

    <label class="api-key-label" for="stylebot-options-open-ai-api-key">
      {{ t('open_ai_api_key') }}
    </label>

    <div class="open-ai-key-row">
      <b-form-input
        id="stylebot-options-open-ai-api-key"
        v-model="apiKey"
        type="password"
        autocomplete="off"
        placeholder="sk-..."
      />

      <app-button class="ml-2" @click="saveApiKey">
        {{ t('save_api_key') }}
      </app-button>
    </div>

    <div v-if="saved" class="saved-message mt-2">
      {{ t('api_key_saved') }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'TheOpenAiSettings',

  components: {
    AppButton,
  },

  data(): {
    apiKey: string;
    saved: boolean;
  } {
    return {
      apiKey: '',
      saved: false,
    };
  },

  created(): void {
    this.apiKey = this.$store.state.options.openAiApiKey;
  },

  methods: {
    saveApiKey(): void {
      this.$store.dispatch('setOption', {
        name: 'openAiApiKey',
        value: this.apiKey.trim(),
      });
      this.saved = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.description {
  color: #888;
  font-size: 14px;
}

.api-key-label {
  color: #555;
  font-size: 13px;
  font-weight: 600;
}

.open-ai-key-row {
  display: flex;
  align-items: center;
}

.saved-message {
  color: #16804f;
  font-size: 13px;
}
</style>
