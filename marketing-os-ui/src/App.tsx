import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { AppLayout } from './components/layout/AppLayout';
import { LeadsPage as CRMDashboard } from './features/crm';
import { WhatsAppDashboard } from './features/whatsapp';
import { SettingsLayout } from './features/settings';

// Auth Imports
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { AdminShell } from './admin';
import { AdminRoleGuard } from './admin/components/auth/AdminRoleGuard';
import { AdminPrivateRoute } from './admin/components/auth/AdminPrivateRoute';
import AdminLoginPage from './admin/modules/auth/AdminLoginPage';
import OverviewPage from './admin/modules/overview/OverviewPage';
import TenantsPage from './admin/modules/tenants/TenantsPage';
import UsersPage from './admin/modules/users/UsersPage';
import BillingPage from './admin/modules/billing/BillingPage';
import IntegrationsPage from './admin/modules/integrations/IntegrationsPage';
import AutomationLogsPage from './admin/modules/system/AutomationLogsPage';
import AuditLogsPage from './admin/modules/system/AuditLogsPage';
import SystemHealthPage from './admin/modules/system/SystemHealthPage';
import FeatureManagementPage from './admin/modules/feature-management/FeatureManagementPage';
import SettingsPage from './admin/modules/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Ant Design theme configuration
const antTheme = {
  token: {
    colorPrimary: '#4F46E5',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#06B6D4',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8FAFC',
    colorBorder: '#E2E8F0',
    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    borderRadius: 8,
    fontSize: 14,
    controlHeight: 40,
  },
  components: {
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: '#1E293B',
      darkItemHoverBg: '#1E293B',
      darkItemSelectedColor: '#FFFFFF',
      darkItemColor: '#94A3B8',
      itemBorderRadius: 8,
      iconSize: 16,
      itemMarginInline: 4,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: '#F8FAFC',
      headerColor: '#64748B',
      rowHoverBg: '#F1F5F9',
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Tabs: {
      itemColor: '#64748B',
      itemSelectedColor: '#4F46E5',
      inkBarColor: '#4F46E5',
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 28,
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={antTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Super Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminPrivateRoute>
                    <AdminRoleGuard>
                      <AdminShell />
                    </AdminRoleGuard>
                  </AdminPrivateRoute>
                }
              >
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="automation-logs" element={<AutomationLogsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="system-health" element={<SystemHealthPage />} />
                <Route path="feature-management" element={<FeatureManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <AppLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="crm" replace />} />
                <Route path="crm" element={<CRMDashboard />} />
                <Route path="whatsapp" element={<WhatsAppDashboard />} />
                <Route path="settings" element={<SettingsLayout />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
