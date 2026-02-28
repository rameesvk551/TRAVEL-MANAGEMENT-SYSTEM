// ── SettingsSidebar ──
// Left-side navigation for settings pages.

import React from 'react';
import { Menu } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  WhatsAppOutlined,
  ApiOutlined,
  KeyOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { SettingsSection } from '../types';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

const menuItems = [
  {
    key: 'general',
    icon: <SettingOutlined />,
    label: 'General',
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
  },
  {
    key: 'notifications',
    icon: <BellOutlined />,
    label: 'Notifications',
  },
  { type: 'divider' as const },
  {
    key: 'whatsapp',
    icon: <WhatsAppOutlined />,
    label: 'WhatsApp API',
  },
  {
    key: 'integrations',
    icon: <ApiOutlined />,
    label: 'Integrations',
  },
  { type: 'divider' as const },
  {
    key: 'api-keys',
    icon: <KeyOutlined />,
    label: 'API Keys',
  },
  {
    key: 'billing',
    icon: <DollarOutlined />,
    label: 'Billing',
  },
  {
    key: 'team',
    icon: <TeamOutlined />,
    label: 'Team',
  },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onChange,
}) => {
  return (
    <Menu
      mode="inline"
      selectedKeys={[activeSection]}
      onClick={({ key }) => onChange(key as SettingsSection)}
      items={menuItems}
      style={{
        border: 'none',
        borderRadius: 12,
        background: 'transparent',
      }}
    />
  );
};

export default SettingsSidebar;
