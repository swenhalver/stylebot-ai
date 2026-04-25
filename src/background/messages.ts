import * as postcss from 'postcss';

import {
  set,
  disable,
  enable,
  getAll,
  setAll,
  move,
  getStylesForPage,
  updateIcon,
  setReadability,
  getImportCss,
  applyStylesToAllTabs,
} from './styles';

import {
  get as getOption,
  getAll as getAllOptions,
  set as setOption,
} from './options';

import {
  GetOption as GetOptionType,
  SetOption as SetOptionType,
  DisableStyle as DisableStyleType,
  EnableStyle as EnableStyleType,
  SetStyle as SetStyleType,
  GetStylesForPage as GetStylesForPageType,
  GetStylesForIframe as GetStylesForIframeType,
  MoveStyle as MoveStyleType,
  SetAllStyles as SetAllStylesType,
  SetCommands as SetCommandsType,
  SetReadability as SetReadabilityType,
  SetReadabilitySettings as SetReadabilitySettingsType,
  GetImportCss as GetImportCssType,
  RunGoogleDriveSync as RunGoogleDriveSyncType,
  GenerateCssWithOpenAi as GenerateCssWithOpenAiType,
  GetCommandsResponse,
  GetAllOptionsResponse,
  GetAllStylesResponse,
  GetOptionResponse,
  GetStylesForPageResponse,
  GetReadabilitySettingsResponse,
  GetImportCssResponse,
  RunGoogleDriveSyncResponse,
  GenerateCssWithOpenAiResponse,
} from '@stylebot/types';
import { runGoogleDriveSync } from '@stylebot/sync';

import {
  get as getReadabilitySettings,
  set as setReadabilitySettings,
} from './readability-settings';

import { get as getCommands, set as setCommands } from './commands';

const OPEN_AI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPEN_AI_MODEL = 'gpt-5.4-mini';
const OPEN_AI_SYSTEM_PROMPT =
  'You are Stylebot, an assistant that helps users change website styles. Return only JSON with this shape: {"message":"short helpful response","css":"complete updated Stylebot stylesheet"}. The css field is required and must not be empty. Do not use markdown. The context includes the user\'s current Stylebot stylesheet under `context.existingCss`. You MUST return the COMPLETE updated Stylebot stylesheet that will REPLACE the existing one: copy all of the existing rules verbatim, then add, modify, or remove only the rules needed to fulfill the user\'s request. Never return just a diff or just the new rules - always return the full final stylesheet the user should end up with. Use selectors that are likely to work on the current page. Preserve existing behavior unless asked to change it. If a previous attempt produced no visible change, the user will say "no change" or similar - in that case, try a different approach in the updated rules: use more specific selectors, add !important where needed, target different elements, or override inherited styles more aggressively. Never repeat CSS that already failed.';

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  choices?: Array<{ message?: { content?: string } }>;
};

type OpenAiErrorResponse = {
  error?: {
    message?: string;
  };
};

type StylebotAiResponsePayload = {
  message: string;
  css: string;
};

export const DisableStyle = async (
  message: DisableStyleType
): Promise<void> => {
  await disable(message.url);
  return applyStylesToAllTabs();
};

export const EnableStyle = async (message: EnableStyleType): Promise<void> => {
  await enable(message.url);
  return applyStylesToAllTabs();
};

export const SetStyle = (message: SetStyleType): Promise<void> =>
  set(message.url, message.css, message.readability);

export const GetAllStyles = async (
  sendResponse: (response: GetAllStylesResponse) => void
): Promise<void> => {
  const styles = await getAll();
  sendResponse(styles);
};

export const SetAllStyles = async (
  message: SetAllStylesType
): Promise<void> => {
  await setAll(message.styles);
  return applyStylesToAllTabs();
};

export const GetStylesForIframe = async (
  message: GetStylesForIframeType,
  sendResponse: (response: GetStylesForPageResponse) => void
): Promise<void> => {
  const styles = await getAll();
  const pageStyles = getStylesForPage(message.url, styles, message.important);

  sendResponse(pageStyles);
};

export const GetStylesForPage = async (
  message: GetStylesForPageType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetStylesForPageResponse) => void
): Promise<void> => {
  const tab = sender.tab || message.tab;

  if (!tab || !tab.url) {
    sendResponse({ styles: [] });
    return;
  }

  const styles = await getAll();
  const response = getStylesForPage(tab.url, styles, message.important);

  updateIcon(tab, response.styles, response.defaultStyle);
  sendResponse(response);
};

export const MoveStyle = (message: MoveStyleType): void => {
  move(message.sourceUrl, message.destinationUrl);
};

export const GetOption = async (
  message: GetOptionType,
  sendResponse: (response: GetOptionResponse) => void
): Promise<void> => {
  const option = await getOption(message.optionName);
  sendResponse(option);
};

export const GetAllOptions = async (
  sendResponse: (response: GetAllOptionsResponse) => void
): Promise<void> => {
  const options = await getAllOptions();
  sendResponse(options);
};

export const OpenOptionsPage = (): void => {
  chrome.runtime.openOptionsPage();
};

export const OpenDonatePage = (): void => {
  chrome.tabs.create({ url: 'https://ko-fi.com/stylebot' });
};

export const SetOption = (message: SetOptionType): void => {
  setOption(message.option.name, message.option.value);
};

export const GetCommands = async (
  sendResponse: (response: GetCommandsResponse) => void
): Promise<void> => {
  const commands = await getCommands();
  sendResponse(commands);
};

export const SetCommands = (message: SetCommandsType): void => {
  setCommands(message.value);
};

export const SetReadability = (message: SetReadabilityType): void => {
  setReadability(message.url, message.value);
};

export const GetReadabilitySettings = async (
  sendResponse: (response: GetReadabilitySettingsResponse) => void
): Promise<void> => {
  const settings = await getReadabilitySettings();
  sendResponse(settings);
};

export const SetReadabilitySettings = (
  message: SetReadabilitySettingsType
): void => {
  setReadabilitySettings(message.value);
};

export const GetImportCss = async (
  message: GetImportCssType,

  sendResponse: (response: GetImportCssResponse) => void
): Promise<void> => {
  const css = await getImportCss(message.url);
  sendResponse(css);
};

export const RunGoogleDriveSync = async (
  _message: RunGoogleDriveSyncType,
  sendResponse: (response: RunGoogleDriveSyncResponse) => void
): Promise<void> => {
  await runGoogleDriveSync();
  sendResponse();
};

const getTextFromOpenAiResponse = (response: unknown): string => {
  const openAiResponse = response as OpenAiResponse;

  if (openAiResponse.output_text) {
    return openAiResponse.output_text.trim();
  }

  const outputs = openAiResponse.output || [];
  for (const item of outputs) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    const textPart = content.find(
      c => c && typeof c.text === 'string' && c.text.length > 0
    );
    if (textPart?.text) return textPart.text.trim();
  }

  return (openAiResponse.choices?.[0]?.message?.content || '').trim();
};

const getResponsePayload = (response: unknown): StylebotAiResponsePayload => {
  const text = getTextFromOpenAiResponse(response)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const payload = JSON.parse(text) as Partial<StylebotAiResponsePayload>;

    return {
      message: payload.message || '',
      css: payload.css || '',
    };
  } catch (e) {
    const stripped = text
      .replace(/^```css\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const looksLikeCss = /\{[\s\S]*\}/.test(stripped);

    return {
      message: looksLikeCss ? '' : stripped,
      css: looksLikeCss ? stripped : '',
    };
  }
};

export const GenerateCssWithOpenAi = async (
  message: GenerateCssWithOpenAiType,
  sendResponse: (response: GenerateCssWithOpenAiResponse) => void
): Promise<void> => {
  const apiKey = await getOption('openAiApiKey');
  const openAiModel = await getOption('openAiModel');
  const model =
    typeof openAiModel === 'string' ? openAiModel : DEFAULT_OPEN_AI_MODEL;

  if (!apiKey || typeof apiKey !== 'string') {
    sendResponse({ css: '', message: '', error: 'Missing OpenAI API key.' });
    return;
  }

  try {
    const response = await fetch(OPEN_AI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: OPEN_AI_SYSTEM_PROMPT,
        reasoning: { effort: 'none' },
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  request: message.prompt,
                  chatHistory: message.chatHistory,
                  context: message.styleContext,
                }),
              },
            ],
          },
        ],
      }),
    });

    const rawBody = await response.text();
    let body: unknown = {};
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      body = {};
    }

    if (!response.ok) {
      const errorBody = body as OpenAiErrorResponse;
      const error =
        errorBody.error?.message ||
        `OpenAI request failed (${response.status}).`;
      sendResponse({
        css: '',
        message: `[OpenAI raw response ${response.status}]\n${rawBody}`,
        error,
      });
      return;
    }

    const payload = getResponsePayload(body);

    if (payload.css) {
      postcss.parse(payload.css);
    }

    if (!payload.css && !payload.message) {
      sendResponse({
        css: '',
        message: `[OpenAI raw response]\n${rawBody}`,
        error: 'OpenAI returned an empty response.',
      });
      return;
    }

    sendResponse({
      ...payload,
      message:
        payload.message ||
        (payload.css ? 'I generated CSS for that change.' : ''),
    });
  } catch (e) {
    sendResponse({
      css: '',
      message: '',
      error: e instanceof Error ? e.message : 'Unknown OpenAI error.',
    });
  }
};
