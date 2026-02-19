import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Input, Select, Button, Space, Spin, Typography, Badge, Tabs, Modal, Form, message } from 'antd';
import { UserOutlined, DollarOutlined, PhoneOutlined, MailOutlined, PlusOutlined, SearchOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/modules';
import ContactList from './crm/components/ContactList';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
    new: 'blue', contacted: 'cyan', qualified: 'green', proposal: 'purple',
    negotiation: 'orange', won: 'lime', lost: 'red',
};

export default function CRMDashboard() {
    const [activeTab, setActiveTab] = useState('contacts');
    const [search, setSearch] = useState('');
    const [showAddLead, setShowAddLead] = useState(false);
    const queryClient = useQueryClient();
    const { isMobile } = useResponsive();

    const { data: dashboard, isLoading } = useQuery({ queryKey: ['crm-dashboard'], queryFn: crmApi.getDashboard });
    const { data: leadsData } = useQuery({ queryKey: ['crm-leads', search], queryFn: () => crmApi.getLeads({ search, limit: 50 }) });
    const { data: deals } = useQuery({ queryKey: ['crm-deals'], queryFn: () => crmApi.getDeals() });
    const { data: tasks } = useQuery({ queryKey: ['crm-tasks'], queryFn: () => crmApi.getTasks() });

    const addLeadMutation = useMutation({
        mutationFn: crmApi.createLead,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); setShowAddLead(false); message.success('Lead created'); },
    });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

    const leadColumns = [
        { title: 'Name', render: (_: any, r: any) => <Space><UserOutlined />{r.first_name} {r.last_name}</Space>, key: 'name' },
        { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v ? <a href={`mailto:${v}`}>{v}</a> : '-', responsive: ['md'] as any },
        { title: 'Source', dataIndex: 'source', key: 'source', render: (v: string) => <Tag color="blue">{v || 'manual'}</Tag>, responsive: ['lg'] as any },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColors[v] || 'default'}>{v}</Tag> },
        { title: 'Score', dataIndex: 'score', key: 'score', render: (v: number) => <Badge count={v || 0} style={{ backgroundColor: v > 50 ? '#52c41a' : v > 20 ? '#faad14' : '#d9d9d9' }} showZero />, responsive: ['sm'] as any },
    ];

    const dealColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number) => <Text strong>${v?.toLocaleString() || 0}</Text> },
        { title: 'Stage', dataIndex: 'stage_name', key: 'stage', render: (v: string, r: any) => <Tag color={r.stage_color}>{v || 'Unknown'}</Tag> },
        { title: 'Probability', dataIndex: 'probability', key: 'prob', render: (v: number) => `${v}%`, responsive: ['md'] as any },
    ];

    const taskColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag>{v}</Tag>, responsive: ['md'] as any },
        { title: 'Due Date', dataIndex: 'due_date', key: 'due', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'overdue' ? 'red' : 'blue'}>{v}</Tag> },
    ];

    const tabItems = [
        {
            key: 'contacts', label: <Space><TeamOutlined /> {!isMobile && 'Contacts'}</Space>,
            children: <ContactList />,
        },
        {
            key: 'leads', label: <Space><UserOutlined /> {!isMobile && 'Leads'}</Space>,
            children: (
                <>
                    <div style={{ marginBottom: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, justifyContent: 'space-between' }}>
                        <Input prefix={<SearchOutlined />} placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: isMobile ? '100%' : 300 }} allowClear />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddLead(true)} block={isMobile}>Add Lead</Button>
                    </div>
                    <div className="responsive-table-wrapper">
                        <Table dataSource={leadsData?.leads || []} columns={leadColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
                    </div>
                </>
            ),
        },
        {
            key: 'deals', label: <Space><DollarOutlined /> {!isMobile && 'Deals'}</Space>,
            children: <div className="responsive-table-wrapper"><Table dataSource={Array.isArray(deals) ? deals : []} columns={dealColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" /></div>,
        },
        {
            key: 'tasks', label: <Space><ClockCircleOutlined /> {!isMobile && 'Tasks'}</Space>,
            children: <div className="responsive-table-wrapper"><Table dataSource={Array.isArray(tasks) ? tasks : []} columns={taskColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" /></div>,
        },
    ];

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>🎯 CRM & Lead Intelligence</Title>

            {/* Dashboard Stats */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Leads</span>} value={dashboard?.leads?.length || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Deals</span>} value={dashboard?.deals?.total_deals || 0} prefix={<DollarOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Pipeline Value</span>} value={dashboard?.deals?.pipeline_value || 0} prefix="$" valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Overdue Tasks</span>} value={dashboard?.tasks?.overdue || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
            </Row>

            {/* Tabbed content */}
            <Card style={{ borderRadius: 12 }}>
                <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} size={isMobile ? 'small' : 'middle'} />
            </Card>

            {/* Add Lead Modal */}
            <Modal title="Add New Lead" open={showAddLead} onCancel={() => setShowAddLead(false)} footer={null} width={isMobile ? '100%' : 520}>
                <Form layout="vertical" onFinish={(values) => addLeadMutation.mutate(values)}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col xs={24} sm={12}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    <Form.Item name="email" label="Email"><Input prefix={<MailOutlined />} /></Form.Item>
                    <Form.Item name="phone" label="Phone"><Input prefix={<PhoneOutlined />} /></Form.Item>
                    <Form.Item name="company" label="Company"><Input /></Form.Item>
                    <Form.Item name="source" label="Source">
                        <Select options={[{ value: 'website' }, { value: 'referral' }, { value: 'ads' }, { value: 'social' }, { value: 'manual' }]} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={addLeadMutation.isPending} block>Create Lead</Button>
                </Form>
            </Modal>
        </div>
    );
}
