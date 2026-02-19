import { ConfigProvider, theme, type ThemeConfig } from 'antd';
import type { FC, ReactNode } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminUiStoreProvider, useAdminUiStore } from '../store/AdminUiStore';

const adminThemeConfig = (mode: 'light' | 'dark'): ThemeConfig => ({
  algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    colorInfo: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 10,
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Layout: {
      bodyBg: mode === 'dark' ? '#000f1f' : '#f5f7fb',
      headerBg: mode === 'dark' ? '#001529' : '#ffffff',
      siderBg: mode === 'dark' ? '#001529' : '#ffffff',
    },
    Card: {
      borderRadiusLG: 14,
    },
    Menu: {
      itemBorderRadius: 8,
      activeBarWidth: 0,
    },
  },
});

const AdminThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { themeMode } = useAdminUiStore();

  return <ConfigProvider theme={adminThemeConfig(themeMode)}>{children}</ConfigProvider>;
};

export const AdminShell = () => (
  <AdminUiStoreProvider>
    <AdminThemeProvider>
      <AdminLayout />
    </AdminThemeProvider>
  </AdminUiStoreProvider>
);
