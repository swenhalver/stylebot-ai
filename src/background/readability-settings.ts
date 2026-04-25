import { defaultReadabilitySettings } from '@stylebot/settings';
import { ReadabilitySettings, UpdateReader } from '@stylebot/types';

import { sendTabMessage } from './send-tab-message';

export const get = (): Promise<ReadabilitySettings> => {
  return new Promise(resolve => {
    chrome.storage.local.get('readability-settings', items => {
      const settings = items['readability-settings'];

      if (settings) {
        resolve(settings);
        return;
      }

      resolve(defaultReadabilitySettings);
    });
  });
};

export const set = (value: ReadabilitySettings): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.set({ 'readability-settings': value }, () => {
      resolve();

      chrome.tabs.query({ active: true }, ([tab]) => {
        if (tab && tab.url && tab.id) {
          const message: UpdateReader = {
            name: 'UpdateReader',
            value,
          };

          sendTabMessage(tab.id, message);
        }
      });
    });
  });
};
