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
