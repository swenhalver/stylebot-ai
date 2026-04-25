import { TabMessage } from '@stylebot/types';

export const sendTabMessage = (tabId: number, message: TabMessage): void => {
  chrome.tabs.sendMessage(tabId, message, () => {
    // Some tabs do not have Stylebot content scripts, which is expected.
    chrome.runtime.lastError;
  });
};
