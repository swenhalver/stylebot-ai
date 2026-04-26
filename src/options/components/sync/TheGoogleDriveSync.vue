<template>
  <div>
    <b-row no-gutters class="description mb-2">
      {{ t('google_drive_client_id_description') }}
    </b-row>

    <label class="client-id-label" for="stylebot-options-google-client-id">
      {{ t('google_drive_client_id') }}
    </label>

    <div class="client-id-row mb-3">
      <b-form-input
        id="stylebot-options-google-client-id"
        v-model="googleDriveClientId"
        type="password"
        autocomplete="off"
        placeholder="...apps.googleusercontent.com"
      />

      <app-button
        class="ml-2"
        :disabled="syncInProgress"
        @click="saveGoogleDriveClientId"
      >
        {{ t('save_google_drive_client_id') }}
      </app-button>
    </div>

    <b-row v-if="clientIdSaved" no-gutters class="saved-message mb-3">
      {{ t('google_drive_client_id_saved') }}
    </b-row>

    <b-alert v-model="showSyncError" variant="danger" dismissible>
      {{ syncError }}
    </b-alert>

    <b-row no-gutters class="description mb-1">
      <div v-if="googleDriveSyncLastModifiedTime && !syncInProgress">
        {{
          t('synced_at_time', [googleDriveSyncLastModifiedTime])
        }}&nbsp;·&nbsp;

        <a :href="googleDriveSyncViewLink" target="_blank">
          {{ t('view_synced_file') }}
        </a>

        &nbsp;·&nbsp;
        <a :href="googleDriveSyncDownloadLink" target="_blank">
          {{ t('download_synced_file') }}
        </a>
      </div>

      <div v-if="googleDriveSyncLastModifiedTime && syncInProgress">
        {{ t('sync_in_progress') }}&nbsp;·&nbsp;
        <a :href="googleDriveSyncViewLink" target="_blank">
          {{ t('view_synced_file') }}
        </a>
        &nbsp;·&nbsp;

        <a :href="googleDriveSyncDownloadLink" target="_blank">
          {{ t('download_synced_file') }}
        </a>
      </div>
    </b-row>

    <b-row v-if="googleDriveSyncEnabled" no-gutters class="description mb-4">
      {{ t('sync_description') }}
    </b-row>

    <b-row no-gutters>
      <app-button
        v-if="googleDriveSyncEnabled"
        class="mr-4"
        variant="primary"
        :disabled="syncInProgress"
        @click="syncWithGoogleDrive"
      >
        <b-icon
          icon="arrow-repeat"
          :animation="syncInProgress ? 'spin' : undefined"
        />

        <span class="pl-2">
          {{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}
        </span>
      </app-button>

      <app-button
        v-if="googleDriveSyncEnabled"
        class="mr-4"
        variant="secondary"
        @click="googleDriveSyncEnabled = false"
      >
        {{ t('disable_google_drive_sync') }}
      </app-button>

      <app-button
        v-if="!googleDriveSyncEnabled"
        class="mr-4"
        variant="primary"
        @click="googleDriveSyncEnabled = true"
      >
        {{ t('enable_google_drive_sync') }}
      </app-button>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'TheGoogleDriveSync',

  components: {
    AppButton,
  },

  data(): {
    syncInProgress: boolean;
    googleDriveClientId: string;
    clientIdSaved: boolean;
    showSyncError: boolean;
    syncError: string;
  } {
    return {
      syncInProgress: false,
      googleDriveClientId: '',
      clientIdSaved: false,
      showSyncError: false,
      syncError: '',
    };
  },

  computed: {
    googleDriveSyncEnabled: {
      get(): boolean {
        return this.$store.state.googleDriveSyncEnabled;
      },

      set(val: boolean) {
        this.$store.dispatch('setGoogleDriveSyncEnabled', val);
      },
    },

    googleDriveSyncViewLink(): string {
      if (this.$store.state.googleDriveSyncMetadata) {
        return this.$store.state.googleDriveSyncMetadata.webViewLink;
      }

      return '';
    },

    googleDriveSyncDownloadLink(): string {
      if (this.$store.state.googleDriveSyncMetadata) {
        return this.$store.state.googleDriveSyncMetadata.webContentLink;
      }

      return '';
    },

    googleDriveSyncLastModifiedTime(): string {
      if (this.$store.state.googleDriveSyncMetadata) {
        return formatDistanceToNow(
          new Date(this.$store.state.googleDriveSyncMetadata.modifiedTime),
          { addSuffix: true }
        );
      }

      return '';
    },
  },

  created(): void {
    this.googleDriveClientId = this.$store.state.options.googleDriveClientId;
  },

  methods: {
    async saveGoogleDriveClientId(): Promise<void> {
      await this.$store.dispatch('setOption', {
        name: 'googleDriveClientId',
        value: this.googleDriveClientId.trim(),
      });
      this.clientIdSaved = true;
    },

    async syncWithGoogleDrive() {
      this.syncInProgress = true;
      this.showSyncError = false;

      try {
        await this.$store.dispatch('syncWithGoogleDrive');
      } catch (e) {
        this.syncError = e instanceof Error ? e.message : String(e);
        this.showSyncError = true;
      } finally {
        this.syncInProgress = false;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.description {
  color: #555;
  font-size: 15px;
}

.client-id-label {
  color: #555;
  font-size: 13px;
  font-weight: 600;
}

.client-id-row {
  display: flex;
  align-items: center;
}

.saved-message {
  color: #16804f;
  font-size: 13px;
}
</style>
