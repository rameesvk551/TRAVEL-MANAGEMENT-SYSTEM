import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Spin, Typography, Space, Button, Modal, Form, Input, Select, InputNumber, Tabs, Empty, message } from 'antd';
import { BellOutlined, PlusOutlined, HistoryOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../api/modules';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

export default function MonitoringDashboard() {
    const [showAddRule, setShowAddRule] = useState(false);
    const [showAddReport, setShowAddReport] = useState(false);
    const queryClient = useQueryClient();
    const { isMobile } = useResponsive();

    const { data: rules, isLoading } = useQuery({ queryKey: ['monitoring-rules'], queryFn: monitoringApi.getRules });
    const { data: history } = useQuery({ queryKey: ['monitoring-history'], queryFn: monitoringApi.getHistory });
    const { data: reports } = useQuery({ queryKey: ['monitoring-reports'], queryFn: monitoringApi.getReports });
    const { data: dashboards } = useQuery({ queryKey: ['monitoring-dashboards'], queryFn: monitoringApi.getDashboards });

    const addRuleMutation = useMutation({
        mutationFn: (values: any) => monitoringApi.createRule(values),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['monitoring-rules'] }); setShowAddRule(false); message.success('Alert rule created'); },
    });

    const addReportMutation = useMutation({
        mutationFn: (values: any) => monitoringApi.createReport(values),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['monitoring-reports'] }); setShowAddReport(false); message.success('Report scheduled'); },
    });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

    const ruleCols = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Metric', dataIndex: 'metric', key: 'metric', render: (v: string) => <Tag color="blue">{v}</Tag> },
        { title: 'Condition', key: 'cond', render: (_: any, r: any) => <Text code>{r.condition} {r.threshold}</Text>, responsive: ['md'] as any },
        { title: 'Channel', dataIndex: 'channel', key: 'channel', render: (v: string) => <Tag>{v}</Tag>, responsive: ['sm'] as any },
        { title: 'Active', dataIndex: 'is_active', key: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Off'}</Tag> },
    ];

    const historyCols = [
        { title: 'Rule', dataIndex: 'rule_name', key: 'rule' },
        { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (v: string) => <Tag color={v === 'critical' ? 'red' : v === 'warning' ? 'orange' : 'blue'}>{v}</Tag> },
        { title: 'Message', dataIndex: 'message', key: 'msg', ellipsis: true, responsive: ['sm'] as any },
        { title: 'Triggered', dataIndex: 'created_at', key: 'time', render: (v: string) => v ? new Date(v).toLocaleString() : '-', responsive: ['md'] as any },
        { title: 'Status', dataIndex: 'resolved_at', key: 'resolved', render: (v: string) => v ? <Tag color="green">Resolved</Tag> : <Tag color="red">Open</Tag> },
    ];

    const reportCols = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', dataIndex: 'report_type', key: 'type', render: (v: string) => <Tag color="purple">{v}</Tag>, responsive: ['sm'] as any },
        { title: 'Schedule', dataIndex: 'schedule', key: 'schedule', render: (v: string) => <Tag color="blue">{v}</Tag> },
        { title: 'Active', dataIndex: 'is_active', key: 'active', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Off'}</Tag> },
    ];

    const tabItems = [
        {
            key: 'rules', label: <Space><BellOutlined /> {!isMobile && 'Alert Rules'}</Space>,
            children: (
                <>
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddRule(true)} size={isMobile ? 'middle' : 'large'}>{isMobile ? 'Add' : 'Add Alert Rule'}</Button>
                    </div>
                    <div className="responsive-table-wrapper">
                        <Table dataSource={Array.isArray(rules) ? rules : []} columns={ruleCols} rowKey="id" pagination={{ pageSize: 10 }} size="small" locale={{ emptyText: <Empty description="No alert rules" /> }} />
                    </div>
                </>
            ),
        },
        {
            key: 'history', label: <Space><HistoryOutlined /> {!isMobile && 'Alert History'}</Space>,
            children: <div className="responsive-table-wrapper"><Table dataSource={Array.isArray(history) ? history : []} columns={historyCols} rowKey="id" pagination={{ pageSize: 10 }} size="small" locale={{ emptyText: <Empty description="No alerts triggered" /> }} /></div>,
        },
        {
            key: 'reports', label: <Space><FileTextOutlined /> {!isMobile && 'Reports'}</Space>,
            children: (
                <>
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddReport(true)} size={isMobile ? 'middle' : 'large'}>{isMobile ? 'Schedule' : 'Schedule Report'}</Button>
                    </div>
                    <div className="responsive-table-wrapper">
                        <Table dataSource={Array.isArray(reports) ? reports : []} columns={reportCols} rowKey="id" pagination={{ pageSize: 10 }} size="small" locale={{ emptyText: <Empty description="No reports" /> }} />
                    </div>
                </>
            ),
        },
    ];

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>🔔 Monitoring & Alerts</Title>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 12 : 14 }}>Alert Rules</div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 22 : 28, fontWeight: 'bold' }}>{Array.isArray(rules) ? rules.length : 0}</div>
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 12 : 14 }}>Alerts Triggered</div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 22 : 28, fontWeight: 'bold' }}>{Array.isArray(history) ? history.length : 0}</div>
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 12 : 14 }}>Scheduled Reports</div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 22 : 28, fontWeight: 'bold' }}>{Array.isArray(reports) ? reports.length : 0}</div>
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 12 : 14 }}>Custom Dashboards</div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 22 : 28, fontWeight: 'bold' }}>{Array.isArray(dashboards) ? dashboards.length : 0}</div>
                    </Card>
                </Col>
            </Row>

            <Card style={{ borderRadius: 12 }}>
                <Tabs items={tabItems} size={isMobile ? 'small' : 'middle'} />
            </Card>

            {/* Add Rule Modal */}
            <Modal title="Create Alert Rule" open={showAddRule} onCancel={() => setShowAddRule(false)} footer={null} width={isMobile ? '100%' : 520}>
                <Form layout="vertical" onFinish={(v) => addRuleMutation.mutate(v)}>
                    <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="metric" label="Metric" rules={[{ required: true }]}>
                        <Select options={[{ value: 'conversion_rate' }, { value: 'ad_spend' }, { value: 'churn_rate' }, { value: 'mrr' }, { value: 'cpl' }, { value: 'response_time' }]} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
                                <Select options={[{ value: 'gt', label: '>' }, { value: 'lt', label: '<' }, { value: 'gte', label: '>=' }, { value: 'lte', label: '<=' }, { value: 'eq', label: '=' }]} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}><Form.Item name="threshold" label="Threshold" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="channel" label="Notification Channel">
                        <Select options={[{ value: 'email' }, { value: 'slack' }, { value: 'webhook' }, { value: 'sms' }]} defaultValue="email" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={addRuleMutation.isPending} block>Create Rule</Button>
                </Form>
            </Modal>

            {/* Add Report Modal */}
            <Modal title="Schedule Report" open={showAddReport} onCancel={() => setShowAddReport(false)} footer={null} width={isMobile ? '100%' : 520}>
                <Form layout="vertical" onFinish={(v) => addReportMutation.mutate(v)}>
                    <Form.Item name="name" label="Report Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="reportType" label="Report Type" rules={[{ required: true }]}>
                        <Select options={[{ value: 'growth_summary' }, { value: 'revenue_report' }, { value: 'campaign_performance' }, { value: 'full_analytics' }]} />
                    </Form.Item>
                    <Form.Item name="schedule" label="Schedule" rules={[{ required: true }]}>
                        <Select options={[{ value: 'daily' }, { value: 'weekly' }, { value: 'monthly' }]} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={addReportMutation.isPending} block>Schedule Report</Button>
                </Form>
            </Modal>
        </div>
    );
}
