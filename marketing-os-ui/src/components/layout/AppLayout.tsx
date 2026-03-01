import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Badge, Tooltip, Drawer } from 'antd';
import {
    RocketOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BellOutlined,
    SearchOutlined,
    TeamOutlined,
    WhatsAppOutlined,
    MenuOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { Dropdown } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const navItems: MenuItem[] = [
    {
        key: '/crm',
        icon: <TeamOutlined />,
        label: 'Leads',
    },
    {
        key: '/whatsapp',
        icon: <WhatsAppOutlined />,
        label: 'WhatsApp',
    },
    {
        type: 'divider',
    },
    {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
    },
];

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isMobile, isTablet } = useResponsive();

    // Auto-collapse sidebar on tablet
    useEffect(() => {
        if (isTablet) setCollapsed(true);
        if (!isMobile && !isTablet) setCollapsed(false);
    }, [isMobile, isTablet]);

    // Close drawer on route change
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    // Match the active menu key based on current path
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/') return '/';
        const exact = navItems.find((item: any) => item?.key === path);
        if (exact) return path;
        const prefix = navItems
            .filter((item: any) => item?.key && item.key !== '/')
            .sort((a: any, b: any) => (b?.key?.length || 0) - (a?.key?.length || 0))
            .find((item: any) => path.startsWith(item.key));
        return (prefix as any)?.key || '/';
    };

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        navigate(key);
        if (isMobile) setMobileDrawerOpen(false);
    };

    // Sidebar content (reused in both Sider and Drawer)
    const sidebarContent = (
        <>
            {/* Logo */}
            <div
                style={{
                    height: 'var(--header-height, 64px)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: collapsed && !isMobile ? '0 20px' : '0 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onClick={() => {
                    navigate('/');
                    if (isMobile) setMobileDrawerOpen(false);
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <RocketOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                {(!collapsed || isMobile) && (
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                        <Text strong style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap', display: 'block', lineHeight: 1.2 }}>
                            Marketing OS
                        </Text>
                        <Text style={{ color: '#64748B', fontSize: 11, whiteSpace: 'nowrap', display: 'block' }}>
                            Growth Platform
                        </Text>
                    </div>
                )}
                {isMobile && (
                    <CloseOutlined
                        style={{ color: '#94A3B8', fontSize: 18, marginLeft: 'auto', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setMobileDrawerOpen(false); }}
                    />
                )}
            </div>

            {/* Menu */}
            <Menu
                mode="inline"
                selectedKeys={[getSelectedKey()]}
                onClick={handleMenuClick}
                items={navItems}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '12px 8px',
                }}
                theme="dark"
            />

            {/* Collapse Toggle — desktop only */}
            {!isMobile && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 16,
                        width: '100%',
                        padding: '0 16px',
                    }}
                >
                    <div
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            color: '#94A3B8',
                            transition: 'all 0.2s',
                        }}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        {!collapsed && <span style={{ fontSize: 13 }}>Collapse</span>}
                    </div>
                </div>
            )}
        </>
    );

    const sidebarWidth = collapsed ? 72 : 260;

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Mobile Drawer Sidebar */}
            {isMobile ? (
                <Drawer
                    open={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    placement="left"
                    width={280}
                    className="mobile-sidebar-drawer"
                    styles={{ body: { padding: 0, background: '#0F172A' } }}
                >
                    <div style={{ background: '#0F172A', minHeight: '100vh', position: 'relative' }}>
                        {sidebarContent}
                    </div>
                </Drawer>
            ) : (
                /* Desktop/Tablet Sidebar */
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    trigger={null}
                    width={260}
                    collapsedWidth={72}
                    style={{
                        background: '#0F172A',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                    }}
                >
                    {sidebarContent}
                </Sider>
            )}

            {/* Main Content */}
            <Layout
                style={{
                    marginLeft: isMobile ? 0 : sidebarWidth,
                    transition: 'margin-left 0.2s',
                    minHeight: '100vh',
                    background: '#F8FAFC',
                }}
            >
                {/* Top Header Bar */}
                <Header
                    style={{
                        background: '#FFFFFF',
                        padding: isMobile ? '0 16px' : '0 32px',
                        height: 'var(--header-height, 64px)',
                        lineHeight: 'var(--header-height, 64px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #E2E8F0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 50,
                        gap: 12,
                    }}
                >
                    {/* Left side: Hamburger (mobile) + Search */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        {isMobile && (
                            <MenuOutlined
                                onClick={() => setMobileDrawerOpen(true)}
                                style={{
                                    fontSize: 20,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            />
                        )}

                        {/* Search — full on desktop, icon-only on mobile */}
                        {!isMobile ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#F1F5F9',
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    width: isTablet ? 200 : 320,
                                    color: '#94A3B8',
                                    cursor: 'pointer',
                                    transition: 'width 0.2s',
                                }}
                            >
                                <SearchOutlined />
                                <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Search campaigns, analytics...
                                </span>
                                {!isTablet && (
                                    <span style={{ marginLeft: 'auto', fontSize: 11, background: '#E2E8F0', padding: '2px 6px', borderRadius: 4, color: '#64748B' }}>⌘K</span>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: '#F1F5F9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94A3B8',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <SearchOutlined style={{ fontSize: 16 }} />
                            </div>
                        )}
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20, flexShrink: 0 }}>
                        <Tooltip title="Notifications">
                            <Badge count={3} size="small">
                                <BellOutlined style={{ fontSize: 18, color: '#64748B', cursor: 'pointer' }} />
                            </Badge>
                        </Tooltip>

                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'profile',
                                        label: (
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{user?.name || 'User'}</div>
                                                <div style={{ fontSize: 11, color: '#64748B' }}>{user?.email}</div>
                                                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{user?.tenantName}</div>
                                            </div>
                                        )
                                    },
                                    { type: 'divider' },
                                    {
                                        key: 'logout',
                                        icon: <LogoutOutlined />,
                                        label: 'Logout',
                                        onClick: logout,
                                        danger: true
                                    }
                                ]
                            }}
                            placement="bottomRight"
                            arrow
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Avatar
                                    style={{
                                        background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                                        cursor: 'pointer',
                                    }}
                                    size={isMobile ? 32 : 36}
                                >
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </Avatar>
                                {!isMobile && (
                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{user?.name || 'User'}</span>
                                        <span style={{ fontSize: 11, color: '#64748B' }}>{user?.role || 'Admin'}</span>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                {/* Page Content */}
                <Content
                    style={{
                        padding: 'var(--page-padding, 16px)',
                        minHeight: 'calc(100vh - var(--header-height, 64px))',
                    }}
                >
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
