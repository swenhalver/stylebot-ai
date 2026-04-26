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

    <label class="api-key-label mt-3 d-block" for="stylebot-options-open-ai-model">
      {{ t('open_ai_model') }}
    </label>

    <div class="description mb-2">
      {{ t('open_ai_model_description') }}
    </div>

    <b-form-select
      id="stylebot-options-open-ai-model"
      v-model="model"
      class="model-select"
      :options="modelOptions"
      @change="saveModel"
    />

    <div v-if="modelSaved" class="saved-message mt-2">
      {{ t('default_model_saved') }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from '../AppButton.vue';
import {
  DEFAULT_OPEN_AI_MODEL,
  OPEN_AI_MODEL_OPTIONS,
} from '@stylebot/settings';

export default Vue.extend({
  name: 'TheOpenAiSettings',

  components: {
    AppButton,
  },

  data(): {
    apiKey: string;
    model: string;
    saved: boolean;
    modelSaved: boolean;
    modelOptions: Array<{ value: string; text: string }>;
  } {
    return {
      apiKey: '',
      model: DEFAULT_OPEN_AI_MODEL,
      saved: false,
      modelSaved: false,
      modelOptions: OPEN_AI_MODEL_OPTIONS.map(m => ({
        value: m.value,
        text: m.label,
      })),
    };
  },

  created(): void {
    this.apiKey = this.$store.state.options.openAiApiKey;
    this.model =
      this.$store.state.options.openAiModel || DEFAULT_OPEN_AI_MODEL;
  },

  methods: {
    saveApiKey(): void {
      this.$store.dispatch('setOption', {
        name: 'openAiApiKey',
        value: this.apiKey.trim(),
      });
      this.saved = true;
    },

    saveModel(): void {
      this.$store.dispatch('setOption', {
        name: 'openAiModel',
        value: this.model,
      });
      this.modelSaved = true;
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

.model-select {
  max-width: 300px;
}

.saved-message {
  color: #16804f;
  font-size: 13px;
}
</style>
