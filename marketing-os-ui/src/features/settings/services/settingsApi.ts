// ── General Settings API Service ──

import client from '../../../api/client';
import type {
  GeneralSettings,
  NotificationSettings,
  ProfileSettings,
  ApiKeyInfo,
} from '../types';

const BASE = '/settings';

export const settingsApi = {
  // ── General ──
  getGeneral: async (): Promise<GeneralSettings> => {
    const { data } = await client.get(`${BASE}/general`);
    return data.data;
  },
  updateGeneral: async (settings: Partial<GeneralSettings>): Promise<GeneralSettings> => {
    const { data } = await client.put(`${BASE}/general`, settings);
    return data.data;
  },

  // ── Profile ──
  getProfile: async (): Promise<ProfileSettings> => {
    const { data } = await client.get(`${BASE}/profile`);
    return data.data;
  },
  updateProfile: async (profile: Partial<ProfileSettings>): Promise<ProfileSettings> => {
    const { data } = await client.put(`${BASE}/profile`, profile);
    return data.data;
  },

  // ── Notifications ──
  getNotifications: async (): Promise<NotificationSettings> => {
    const { data } = await client.get(`${BASE}/notifications`);
    return data.data;
  },
  updateNotifications: async (
    settings: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> => {
    const { data } = await client.put(`${BASE}/notifications`, settings);
    return data.data;
  },

  // ── API Keys ──
  getApiKeys: async (): Promise<ApiKeyInfo[]> => {
    const { data } = await client.get(`${BASE}/api-keys`);
    return data.data;
  },
  createApiKey: async (name: string): Promise<{ key: string; info: ApiKeyInfo }> => {
    const { data } = await client.post(`${BASE}/api-keys`, { name });
    return data.data;
  },
  revokeApiKey: async (id: string): Promise<void> => {
    await client.delete(`${BASE}/api-keys/${id}`);
  },
};
