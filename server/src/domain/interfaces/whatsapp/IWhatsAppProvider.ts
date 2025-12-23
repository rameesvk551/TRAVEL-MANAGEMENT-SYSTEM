// domain/interfaces/whatsapp/IWhatsAppProvider.ts
// Provider abstraction for WhatsApp Business API

export interface MessageContent {
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template';
  text?: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

export interface Template {
  name: string;
  language: string;
  components?: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  parameters?: TemplateParameter[];
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: { code: string; amount: number };
  dateTime?: { value: string };
  image?: { link: string };
  document?: { link: string; filename: string };
  video?: { link: string };
}

export interface SendMessageResult {
  messageId: string;
  success: boolean;
  error?: string;
}

export interface MediaUploadResult {
  mediaId: string;
  url?: string;
  success: boolean;
  error?: string;
}

export interface IWhatsAppProvider {
  /**
   * Send a message to a WhatsApp number
   */
  sendMessage(
    to: string,
    content: MessageContent
  ): Promise<SendMessageResult>;

  /**
   * Send a pre-approved template message
   */
  sendTemplate(
    to: string,
    template: Template
  ): Promise<SendMessageResult>;

  /**
   * Upload media file and get media ID
   */
  uploadMedia(
    file: Buffer,
    mimeType: string
  ): Promise<MediaUploadResult>;

  /**
   * Get media URL from media ID
   */
  getMediaUrl(mediaId: string): Promise<string>;

  /**
   * Download media file
   */
  downloadMedia(mediaId: string): Promise<Buffer>;

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): Promise<boolean>;
}
