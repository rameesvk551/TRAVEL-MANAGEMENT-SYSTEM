// ── useSettingsData ──
// Generic settings hook for general / profile / notifications / api-keys pages.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { settingsApi } from '../services';
import type { GeneralSettings, NotificationSettings, ProfileSettings } from '../types';

export const SETTINGS_KEYS = {
  general: ['settings', 'general'] as const,
  profile: ['settings', 'profile'] as const,
  notifications: ['settings', 'notifications'] as const,
  apiKeys: ['settings', 'api-keys'] as const,
};

export function useGeneralSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEYS.general,
    queryFn: settingsApi.getGeneral,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<GeneralSettings>) => settingsApi.updateGeneral(updates),
    onSuccess: () => {
      message.success('General settings saved');
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.general });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to save');
    },
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export function useProfileSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEYS.profile,
    queryFn: settingsApi.getProfile,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<ProfileSettings>) => settingsApi.updateProfile(updates),
    onSuccess: () => {
      message.success('Profile updated');
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.profile });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update profile');
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export function useNotificationSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEYS.notifications,
    queryFn: settingsApi.getNotifications,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationSettings>) =>
      settingsApi.updateNotifications(updates),
    onSuccess: () => {
      message.success('Notification preferences saved');
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.notifications });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to save');
    },
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export function useApiKeys() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEYS.apiKeys,
    queryFn: settingsApi.getApiKeys,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => settingsApi.createApiKey(name),
    onSuccess: () => {
      message.success('API key created');
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.apiKeys });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create key');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => settingsApi.revokeApiKey(id),
    onSuccess: () => {
      message.info('API key revoked');
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.apiKeys });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to revoke key');
    },
  });

  return {
    keys: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    revoke: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending,
  };
}
