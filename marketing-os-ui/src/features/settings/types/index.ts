// ── Settings Module Types ──

// ============================
// WhatsApp Connection Types
// ============================

export type WhatsAppConnectionMethod = 'manual' | 'embedded';

export type WhatsAppConnectionStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'expired';

/** Payload for manual WhatsApp Business API connection */
export interface WhatsAppManualConfig {
  whatsappBusinessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl?: string;
  displayPhoneNumber?: string;
  businessName?: string;
}

/** Payload returned by the embedded signup flow */
export interface WhatsAppEmbeddedSignupPayload {
  code: string; // Authorization code from Facebook
  state?: string;
}

/** Full WhatsApp connection state from the backend */
export interface WhatsAppConnection {
  id: string;
  tenantId: string;
  connectionMethod: WhatsAppConnectionMethod;
  status: WhatsAppConnectionStatus;
  whatsappBusinessAccountId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  businessName: string | null;
  accessTokenLast4: string | null; // only last 4 chars for security
  webhookUrl: string | null;
  verifyToken: string | null;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response from test-connection endpoint */
export interface WhatsAppTestResult {
  success: boolean;
  phoneNumber?: string;
  businessName?: string;
  qualityRating?: string;
  messagingLimit?: string;
  error?: string;
}

/** Response from embedded signup completion */
export interface WhatsAppEmbeddedResult {
  success: boolean;
  connection: WhatsAppConnection;
}

// ============================
// General Settings Types
// ============================

export interface GeneralSettings {
  businessName: string;
  businessEmail: string;
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  whatsappAlerts: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  alertOnNewLead: boolean;
  alertOnConversation: boolean;
}

export interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyLast4: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

// ============================
// Settings Page Navigation
// ============================

export type SettingsSection =
  | 'general'
  | 'profile'
  | 'notifications'
  | 'whatsapp'
  | 'integrations'
  | 'api-keys'
  | 'billing'
  | 'team';
