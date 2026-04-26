import { ExecuteUserJs } from '@stylebot/types';

const lastExecutedByUrl = new Map<string, string>();

export const injectJSIntoDocument = (js: string, url: string): void => {
  if (window !== window.top) {
    return;
  }

  const previous = lastExecutedByUrl.get(url) || '';

  if (previous === js) {
    return;
  }

  lastExecutedByUrl.set(url, js);

  if (!js) {
    return;
  }

  const message: ExecuteUserJs = {
    name: 'ExecuteUserJs',
    js,
  };

  chrome.runtime.sendMessage(message);
};
