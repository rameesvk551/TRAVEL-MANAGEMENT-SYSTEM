import {
  AlertOutlined,
  ApiOutlined,
  AppstoreAddOutlined,
  AuditOutlined,
  BellOutlined,
  ClusterOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Input,
  Layout,
  List,
  Menu,
  Space,
  Switch,
  Tag,
  Typography,
  type MenuProps,
} from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMarkNotificationReadMutation, useAdminNotifications } from '../hooks/useAdminQueries';
import { useAdminUiStore } from '../store/AdminUiStore';
import { useAuth } from '../../context/AuthContext';

const { Content, Header, Sider } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const adminNavItems: MenuItem[] = [
  { key: '/admin/overview', icon: <DashboardOutlined />, label: 'Overview' },
  { key: '/admin/tenants', icon: <ClusterOutlined />, label: 'Tenants' },
  { key: '/admin/users', icon: <TeamOutlined />, label: 'Users' },
  { key: '/admin/billing', icon: <CreditCardOutlined />, label: 'Subscriptions & Billing' },
  { key: '/admin/integrations', icon: <ApiOutlined />, label: 'Integrations' },
  { key: '/admin/automation-logs', icon: <AlertOutlined />, label: 'Automation Logs' },
  { key: '/admin/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs' },
  { key: '/admin/system-health', icon: <AppstoreAddOutlined />, label: 'System Health' },
  { key: '/admin/feature-management', icon: <SettingOutlined />, label: 'Feature Management' },
  { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, globalSearch, setGlobalSearch, themeMode, setThemeMode } =
    useAdminUiStore();

  const { data: notifications = [] } = useAdminNotifications();
  const markNotificationRead = useMarkNotificationReadMutation();

  const selectedKey = useMemo(() => {
    const exact = adminNavItems.find((item) => item?.key === location.pathname);
    if (exact) {
      return String(exact.key);
    }

    const prefix = adminNavItems
      .filter((item) => typeof item?.key === 'string')
      .sort((first, second) => String(second?.key).length - String(first?.key).length)
      .find((item) => location.pathname.startsWith(String(item?.key)));

    return String(prefix?.key ?? '/admin/overview');
  }, [location.pathname]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const notificationMenu: MenuProps = {
    items: [
      {
        key: 'notifications',
        label: (
          <List
            dataSource={notifications}
            locale={{ emptyText: 'No notifications' }}
            style={{ width: 340 }}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                actions={
                  notification.read
                    ? undefined
                    : [
                        <Button
                          key="mark-read"
                          type="link"
                          size="small"
                          onClick={() => markNotificationRead.mutate(notification.id)}
                        >
                          Mark read
                        </Button>,
                      ]
                }
              >
                <Space direction="vertical" size={0}>
                  <Text style={{ fontWeight: notification.read ? 400 : 600 }}>{notification.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        ),
      },
    ],
  };

  const profileMenu: MenuProps = {
    items: [
      {
        key: 'identity',
        label: (
          <Space direction="vertical" size={0}>
            <Text strong>{user?.name || 'Platform Admin'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email || 'admin@platform.local'}
            </Text>
            <Tag color="blue" style={{ width: 'fit-content', marginTop: 4 }}>
              {user?.role || 'super_admin'}
            </Tag>
          </Space>
        ),
      },
      { type: 'divider' },
      {
        key: 'theme',
        label: (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text>Dark mode</Text>
            <Switch
              size="small"
              checked={themeMode === 'dark'}
              onChange={(checked) => setThemeMode(checked ? 'dark' : 'light')}
            />
          </Space>
        ),
      },
      {
        key: 'logout',
        label: 'Log out',
        danger: true,
        onClick: logout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        width={280}
        collapsedWidth={80}
        breakpoint="lg"
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        trigger={null}
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          borderRight: '1px solid rgba(148, 163, 184, 0.2)',
          background:
            themeMode === 'dark'
              ? 'linear-gradient(180deg, #001529 0%, #001f2f 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <div
          style={{
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            padding: sidebarCollapsed ? '0 16px' : '0 20px',
            gap: 10,
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #1677ff 0%, #13c2c2 100%)',
            }}
          />
          {!sidebarCollapsed ? (
            <Space direction="vertical" size={0}>
              <Text strong style={{ lineHeight: 1.2 }}>
                Platform Admin
              </Text>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.2 }}>
                Multi-Tenant Control Plane
              </Text>
            </Space>
          ) : null}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={adminNavItems}
          onClick={({ key }) => navigate(String(key))}
          style={{
            borderInlineEnd: 'none',
            marginTop: 12,
            background: 'transparent',
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            height: 64,
            paddingInline: 20,
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: themeMode === 'dark' ? '#001529' : '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <Space>
            <Button icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={toggleSidebar} />
            <Input
              allowClear
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Search tenants, users, logs..."
              style={{ width: 360, maxWidth: '60vw' }}
            />
          </Space>

          <Space size={16}>
            <Dropdown menu={notificationMenu} trigger={['click']} placement="bottomRight">
              <Badge count={unreadCount} size="small">
                <Button shape="circle" icon={<BellOutlined />} />
              </Badge>
            </Dropdown>

            <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }}>
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </Avatar>
                {!sidebarCollapsed ? (
                  <Space direction="vertical" size={0}>
                    <Text>{user?.name || 'Admin'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {user?.role || 'super_admin'}
                    </Text>
                  </Space>
                ) : null}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            padding: 24,
            background:
              themeMode === 'dark'
                ? 'radial-gradient(circle at 12% 12%, rgba(19,194,194,0.12), transparent 35%), #000f1f'
                : 'radial-gradient(circle at 12% 12%, rgba(22,119,255,0.08), transparent 35%), #f5f7fb',
          }}
        >
          <div style={{ maxWidth: 1600, marginInline: 'auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
