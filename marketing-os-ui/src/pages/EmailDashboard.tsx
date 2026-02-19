import { Card, Row, Col, Statistic, Table, Tag, Spin, Typography, Space, Empty, Button } from 'antd';
import { MailOutlined, SendOutlined, EyeOutlined, LinkOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { emailApi } from '../api/modules';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

export default function EmailDashboard() {
    const navigate = useNavigate();
    const { isMobile } = useResponsive();
    const { data: dashboard, isLoading } = useQuery({ queryKey: ['email-dashboard'], queryFn: () => emailApi.getDashboard() });
    const { data: campaigns } = useQuery({ queryKey: ['email-campaigns'], queryFn: emailApi.getCampaigns });
    const { data: templates } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.getTemplates });
    const { data: drips } = useQuery({ queryKey: ['email-drips'], queryFn: emailApi.getDripSequences });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

    const campaignCols = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true, responsive: ['md'] as any },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'sent' ? 'green' : v === 'draft' ? 'default' : 'blue'}>{v}</Tag> },
        { title: 'Sent', dataIndex: 'sent_count', key: 'sent', render: (v: number) => (v || 0).toLocaleString(), responsive: ['sm'] as any },
        { title: 'Opened', dataIndex: 'opened_count', key: 'opened', render: (v: number) => (v || 0).toLocaleString(), responsive: ['md'] as any },
        { title: 'Clicked', dataIndex: 'clicked_count', key: 'clicked', render: (v: number) => (v || 0).toLocaleString(), responsive: ['lg'] as any },
    ];

    return (
        <div>
            <div className="page-header">
                <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>📧 Email & Engagement Hub</Title>
                <Space wrap>
                    <Button icon={<FileTextOutlined />} onClick={() => navigate('/email/templates')}>{!isMobile && 'Templates'}</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/email/create')}>{isMobile ? 'New' : 'New Campaign'}</Button>
                </Space>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Sent</span>} value={dashboard?.total_sent || 0} prefix={<SendOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Open Rate</span>} value={dashboard?.openRate || 0} suffix="%" prefix={<EyeOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Click Rate</span>} value={dashboard?.clickRate || 0} suffix="%" prefix={<LinkOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Campaigns</span>} value={dashboard?.total_campaigns || 0} prefix={<MailOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={16}>
                    <Card title={<Space><MailOutlined /> Email Campaigns</Space>} style={{ borderRadius: 12 }}>
                        <div className="responsive-table-wrapper">
                            <Table dataSource={Array.isArray(campaigns) ? campaigns : []} columns={campaignCols} rowKey="id" pagination={{ pageSize: 8 }} size="small" locale={{ emptyText: <Empty description="No campaigns yet" /> }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="📝 Templates" style={{ borderRadius: 12, marginBottom: 16 }}>
                        {Array.isArray(templates) && templates.length > 0 ? templates.map((t: any) => (
                            <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <Text strong>{t.name}</Text><br />
                                <Text type="secondary" style={{ fontSize: 12 }}>{t.category}</Text>
                            </div>
                        )) : <Empty description="No templates" />}
                    </Card>
                    <Card title="🔄 Drip Sequences" style={{ borderRadius: 12 }}>
                        {Array.isArray(drips) && drips.length > 0 ? drips.map((d: any) => (
                            <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <Space><Text strong>{d.name}</Text><Tag color={d.is_active ? 'green' : 'default'}>{d.is_active ? 'Active' : 'Paused'}</Tag></Space>
                            </div>
                        )) : <Empty description="No sequences" />}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
