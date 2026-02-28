// ── WhatsApp Settings API Service ──
// All API calls for WhatsApp connection management.
// No business logic here — just HTTP transport.

import client from '../../../api/client';
import type {
  WhatsAppManualConfig,
  WhatsAppEmbeddedSignupPayload,
  WhatsAppConnection,
  WhatsAppTestResult,
  WhatsAppEmbeddedResult,
} from '../types';

const BASE = '/whatsapp/settings';

export const whatsappSettingsApi = {
  /** Fetch the current WhatsApp connection for this tenant */
  getConnection: async (): Promise<WhatsAppConnection | null> => {
    const { data } = await client.get(BASE);
    return data?.data ?? null;
  },

  /** Save manual WAB credentials (WAB ID, Phone Number ID, Token, etc.) */
  saveManualConfig: async (config: WhatsAppManualConfig): Promise<WhatsAppConnection> => {
    const { data } = await client.post(`${BASE}/manual`, config);
    return data.data;
  },

  /** Update an existing manual connection */
  updateManualConfig: async (
    connectionId: string,
    updates: Partial<WhatsAppManualConfig>,
  ): Promise<WhatsAppConnection> => {
    const { data } = await client.put(`${BASE}/manual/${connectionId}`, updates);
    return data.data;
  },

  /** Test the current connection (verifies token + phone) */
  testConnection: async (): Promise<WhatsAppTestResult> => {
    const { data } = await client.post(`${BASE}/test`);
    return data.data;
  },

  /** Complete the Facebook Embedded Signup flow */
  completeEmbeddedSignup: async (
    payload: WhatsAppEmbeddedSignupPayload,
  ): Promise<WhatsAppEmbeddedResult> => {
    const { data } = await client.post(`${BASE}/embedded/complete`, payload);
    return data.data;
  },

  /** Get the URL / config needed to launch embedded signup */
  getEmbeddedSignupConfig: async (): Promise<{
    appId: string;
    configId: string;
    redirectUri: string;
  }> => {
    const { data } = await client.get(`${BASE}/embedded/config`);
    return data.data;
  },

  /** Disconnect the WhatsApp integration */
  disconnect: async (): Promise<void> => {
    await client.delete(BASE);
  },

  /** Regenerate the webhook verify-token */
  regenerateVerifyToken: async (): Promise<{ verifyToken: string }> => {
    const { data } = await client.post(`${BASE}/regenerate-verify-token`);
    return data.data;
  },
};
