import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from 'antd';
import { AreaChartOutlined, MessageOutlined, RocketOutlined } from '@ant-design/icons';

export function MarketingLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active tab based on path
    const activeKey = location.pathname.split('/')[2] || 'dashboard';

    const items = [
        {
            key: 'dashboard',
            label: 'Overview',
            icon: <AreaChartOutlined />,
        },
        {
            key: 'campaigns',
            label: 'Campaigns',
            icon: <RocketOutlined />,
        },
        {
            key: 'inbox',
            label: 'Inbox',
            icon: <MessageOutlined />,
            disabled: true, // Upcoming
        },
    ];

    const onChange = (key: string) => {
        if (key === 'dashboard') navigate('/marketing');
        else navigate(`/marketing/${key}`);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-2 rounded-lg shadow-sm">
                <Tabs
                    activeKey={activeKey === 'dashboard' && location.pathname === '/marketing' ? 'dashboard' : activeKey}
                    items={items}
                    onChange={onChange}
                />
            </div>
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
}
