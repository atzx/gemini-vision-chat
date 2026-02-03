export type MessagePart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded string
  };
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'error';
  parts: MessagePart[];
}

// OpenRouter model options
export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', supportsImages: true },
  { id: 'google/gemini-2.5-flash-image-preview:free', name: 'Gemini 2.5 Flash Image Preview (Free)', supportsImages: true },
  { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', supportsImages: true },
  { id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro Preview', supportsImages: true },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', supportsImages: true },
  { id: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Flash Thinking (Free)', supportsImages: true },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', supportsImages: true },
  { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet (Beta)', supportsImages: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o', supportsImages: true },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', supportsImages: true },
] as const;

export type OpenRouterModelId = typeof OPENROUTER_MODELS[number]['id'];
