// ── useWhatsAppConnection ──
// Hook that encapsulates all React-Query logic for the WhatsApp Settings feature.
// Pages/components call this hook — ZERO fetch / mutation logic in UI layer.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { whatsappSettingsApi } from '../services';
import type {
  WhatsAppManualConfig,
  WhatsAppEmbeddedSignupPayload,
} from '../types';

// ── Query keys ──
export const WA_SETTINGS_KEYS = {
  connection: ['settings', 'whatsapp', 'connection'] as const,
  embeddedConfig: ['settings', 'whatsapp', 'embedded-config'] as const,
};

/**
 * Provides all data + mutations for the WhatsApp connection settings page.
 */
export function useWhatsAppConnection() {
  const qc = useQueryClient();

  // ── Queries ──

  const connectionQuery = useQuery({
    queryKey: WA_SETTINGS_KEYS.connection,
    queryFn: whatsappSettingsApi.getConnection,
    staleTime: 30_000,
  });

  const embeddedConfigQuery = useQuery({
    queryKey: WA_SETTINGS_KEYS.embeddedConfig,
    queryFn: whatsappSettingsApi.getEmbeddedSignupConfig,
    enabled: false, // only fetch on demand
  });

  // ── Mutations ──

  const saveManualMutation = useMutation({
    mutationFn: (config: WhatsAppManualConfig) =>
      whatsappSettingsApi.saveManualConfig(config),
    onSuccess: () => {
      message.success('WhatsApp connected successfully!');
      qc.invalidateQueries({ queryKey: WA_SETTINGS_KEYS.connection });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to save configuration');
    },
  });

  const updateManualMutation = useMutation({
    mutationFn: ({
      connectionId,
      updates,
    }: {
      connectionId: string;
      updates: Partial<WhatsAppManualConfig>;
    }) => whatsappSettingsApi.updateManualConfig(connectionId, updates),
    onSuccess: () => {
      message.success('Configuration updated');
      qc.invalidateQueries({ queryKey: WA_SETTINGS_KEYS.connection });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update configuration');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => whatsappSettingsApi.testConnection(),
    onSuccess: (result) => {
      if (result.success) {
        message.success(`Connection verified — ${result.businessName} (${result.phoneNumber})`);
      } else {
        message.error(result.error || 'Connection test failed');
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Connection test failed');
    },
  });

  const completeEmbeddedMutation = useMutation({
    mutationFn: (payload: WhatsAppEmbeddedSignupPayload) =>
      whatsappSettingsApi.completeEmbeddedSignup(payload),
    onSuccess: () => {
      message.success('WhatsApp connected via Facebook!');
      qc.invalidateQueries({ queryKey: WA_SETTINGS_KEYS.connection });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Embedded signup failed');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => whatsappSettingsApi.disconnect(),
    onSuccess: () => {
      message.info('WhatsApp disconnected');
      qc.invalidateQueries({ queryKey: WA_SETTINGS_KEYS.connection });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to disconnect');
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: () => whatsappSettingsApi.regenerateVerifyToken(),
    onSuccess: () => {
      message.success('Verify token regenerated');
      qc.invalidateQueries({ queryKey: WA_SETTINGS_KEYS.connection });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to regenerate token');
    },
  });

  return {
    // state
    connection: connectionQuery.data ?? null,
    isLoading: connectionQuery.isLoading,
    isError: connectionQuery.isError,
    error: connectionQuery.error,

    embeddedConfig: embeddedConfigQuery.data ?? null,
    fetchEmbeddedConfig: embeddedConfigQuery.refetch,
    isEmbeddedConfigLoading: embeddedConfigQuery.isFetching,

    // mutations
    saveManual: saveManualMutation.mutate,
    isSavingManual: saveManualMutation.isPending,

    updateManual: updateManualMutation.mutate,
    isUpdatingManual: updateManualMutation.isPending,

    testConnection: testConnectionMutation.mutate,
    isTesting: testConnectionMutation.isPending,
    testResult: testConnectionMutation.data ?? null,

    completeEmbedded: completeEmbeddedMutation.mutate,
    isCompletingEmbedded: completeEmbeddedMutation.isPending,

    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,

    regenerateVerifyToken: regenerateTokenMutation.mutate,
    isRegenerating: regenerateTokenMutation.isPending,
  };
}
