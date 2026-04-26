import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  StylebotEditorCommands,
} from '@stylebot/types';

export const defaultOptions: StylebotOptions = {
  mode: 'code',
  contextMenu: true,
  fonts: [
    'Helvetica',
    'Montserrat',
    'Droid Sans',
    'Droid Serif',
    'Merriweather',
    'Playfair Display',
    'Fira Code',
    'Inconsolata',
  ],
  basicModeSections: {
    text: true,
    colors: true,
    layout: true,
    border: false,
  },
  layout: {
    width: 350,
    adjustPageLayout: false,
    dockLocation: 'right',
  },
  colorPalette: 'basic',
  openAiApiKey: '',
  openAiModel: 'gpt-5.4-mini',
  googleDriveClientId: '',
};

export const defaultCommands: StylebotCommands = {
  style: 'alt+shift+t',
  stylebot: 'alt+shift+m',
  grayscale: '',
  readability: '',
};

export const defaultEditorCommands: StylebotEditorCommands = {
  inspect: 'i',
  basic: 'b',
  magic: 'm',
  code: 'c',
  chat: 'a',
  help: '?',
  hide: 'h',
  resize: 's',
  dockLeft: 'l',
  dockRight: 'r',
  pageLayout: 'p',
  close: 'Escape',
};

export const DEFAULT_OPEN_AI_MODEL = 'gpt-5.4-mini';

export const OPEN_AI_MODEL_OPTIONS: Array<{ label: string; value: string }> = [
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

export const defaultReadabilitySettings: ReadabilitySettings = {
  size: 16,
  width: 36,
  theme: 'light',
  lineHeight: 1.6,
  font: 'Helvetica',
};
