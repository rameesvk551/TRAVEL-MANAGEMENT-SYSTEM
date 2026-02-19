import React, { useState } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Card,
    Typography,
    Tag,
    Tooltip,
    Dropdown,
    Badge,
    Statistic,
    Row,
    Col,
    message,
    Drawer,
    Timeline,
    Avatar,
    Popconfirm,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    MoreOutlined,
    WhatsAppOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../../../api/modules';
import type { Lead, LeadFilters } from '../../../api/modules';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const leadStatusColors: Record<string, string> = {
    new: 'blue',
    contacted: 'cyan',
    qualified: 'green',
    interested: 'lime',
    negotiating: 'orange',
    converted: 'success',
    lost: 'red',
    inactive: 'default',
};

const leadSourceIcons: Record<string, React.ReactNode> = {
    whatsapp: <WhatsAppOutlined style={{ color: '#25D366' }} />,
    website: <span>🌐</span>,
    referral: <span>👥</span>,
    social_media: <span>📱</span>,
    advertisement: <span>📢</span>,
    manual: <UserOutlined />,
    api: <span>🔗</span>,
    other: <span>❓</span>,
};

const LeadsList: React.FC = () => {
    const [filters, setFilters] = useState<LeadFilters>({});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Fetch leads
    const { data: leadsResponse, isLoading } = useQuery({
        queryKey: ['leads', filters],
        queryFn: () => leadApi.getLeads(filters),
    });

    const leads = leadsResponse?.data?.leads || [];
    const pagination = leadsResponse?.data?.pagination || { total: 0 };

    // Fetch stats
    const { data: statsResponse } = useQuery({
        queryKey: ['leads-stats'],
        queryFn: leadApi.getStats,
    });

    const stats = statsResponse?.data || {};

    // Fetch activities for selected lead
    const { data: activitiesResponse } = useQuery({
        queryKey: ['lead-activities', selectedLead?.id],
        queryFn: () => selectedLead ? leadApi.getActivities(selectedLead.id) : Promise.resolve({ data: [] }),
        enabled: !!selectedLead,
    });

    const activities = activitiesResponse?.data || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: leadApi.createLead,
        onSuccess: () => {
            message.success('Lead created successfully');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
        },
        onError: () => message.error('Failed to create lead'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => leadApi.updateLead(id, data),
        onSuccess: () => {
            message.success('Lead updated successfully');
            setIsModalVisible(false);
            setEditingLead(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: () => message.error('Failed to update lead'),
    });

    const deleteMutation = useMutation({
        mutationFn: leadApi.deleteLead,
        onSuccess: () => {
            message.success('Lead deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
        },
        onError: () => message.error('Failed to delete lead'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) => leadApi.updateStatus(id, status),
        onSuccess: () => {
            message.success('Status updated');
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: () => message.error('Failed to update status'),
    });

    const bulkAddTagsMutation = useMutation({
        mutationFn: ({ leadIds, tags }: { leadIds: string[]; tags: string[] }) => leadApi.bulkAddTags(leadIds, tags),
        onSuccess: () => {
            message.success('Tags added to selected leads');
            setSelectedRowKeys([]);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: () => message.error('Failed to add tags'),
    });

    const handleSubmit = async (values: any) => {
        if (editingLead) {
            updateMutation.mutate({ id: editingLead.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const handleEdit = (lead: Lead) => {
        setEditingLead(lead);
        form.setFieldsValue(lead);
        setIsModalVisible(true);
    };

    const handleViewDetails = (lead: Lead) => {
        setSelectedLead(lead);
        setIsDrawerVisible(true);
    };

    const columns = [
        {
            title: 'Lead',
            key: 'lead',
            render: (_: any, record: Lead) => (
                <Space>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                        {record.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Text strong style={{ display: 'block' }}>{record.name || 'Unknown'}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <PhoneOutlined /> {record.phone}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: Lead) => (
                <Select
                    value={status}
                    size="small"
                    style={{ width: 120 }}
                    onChange={(newStatus) => updateStatusMutation.mutate({ id: record.id, status: newStatus as Lead['status'] })}
                >
                    {Object.keys(leadStatusColors).map(s => (
                        <Option key={s} value={s}>
                            <Tag color={leadStatusColors[s]} style={{ margin: 0 }}>{s.toUpperCase()}</Tag>
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            sorter: true,
            render: (score: number) => (
                <Badge
                    count={score}
                    showZero
                    style={{
                        backgroundColor: score >= 80 ? '#52c41a' : score >= 50 ? '#faad14' : '#1890ff',
                    }}
                />
            ),
        },
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (source: string) => (
                <Space size={4}>
                    {leadSourceIcons[source]}
                    <Text>{source}</Text>
                </Space>
            ),
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags: string[]) => (
                <Space size={[0, 4]} wrap>
                    {tags?.slice(0, 3).map(tag => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                    {tags?.length > 3 && <Tag>+{tags.length - 3}</Tag>}
                </Space>
            ),
        },
        {
            title: 'Orders',
            key: 'orders',
            render: (_: any, record: Lead) => (
                <div>
                    <Text>{record.totalOrders} orders</Text>
                    <br />
                    <Text type="secondary">₹{record.totalSpent?.toFixed(2)}</Text>
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Lead) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button icon={<HistoryOutlined />} size="small" onClick={() => handleViewDetails(record)} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this lead?"
                        onConfirm={() => deleteMutation.mutate(record.id)}
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Leads"
                            value={stats.total || 0}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="New Leads"
                            value={stats.byStatus?.new || 0}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Qualified"
                            value={stats.byStatus?.qualified || 0}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Converted"
                            value={stats.byStatus?.converted || 0}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters & Actions */}
            <Card style={{ marginBottom: 16 }}>
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap>
                        <Search
                            placeholder="Search leads..."
                            allowClear
                            style={{ width: 200 }}
                            onSearch={(value) => setFilters(f => ({ ...f, search: value }))}
                        />
                        <Select
                            placeholder="Status"
                            allowClear
                            style={{ width: 120 }}
                            onChange={(value) => setFilters(f => ({ ...f, status: value }))}
                        >
                            {Object.keys(leadStatusColors).map(s => (
                                <Option key={s} value={s}>{s}</Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Source"
                            allowClear
                            style={{ width: 120 }}
                            onChange={(value) => setFilters(f => ({ ...f, source: value }))}
                        >
                            {Object.keys(leadSourceIcons).map(s => (
                                <Option key={s} value={s}>{s}</Option>
                            ))}
                        </Select>
                    </Space>
                    <Space>
                        {selectedRowKeys.length > 0 && (
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'add-tags',
                                            label: 'Add Tags',
                                            onClick: () => {
                                                Modal.confirm({
                                                    title: 'Add Tags',
                                                    content: (
                                                        <Select
                                                            mode="tags"
                                                            style={{ width: '100%', marginTop: 8 }}
                                                            placeholder="Enter tags"
                                                            id="bulk-tags-select"
                                                        />
                                                    ),
                                                    onOk: () => {
                                                        const select = document.getElementById('bulk-tags-select') as any;
                                                        const tags = select?.value || [];
                                                        if (tags.length > 0) {
                                                            bulkAddTagsMutation.mutate({
                                                                leadIds: selectedRowKeys as string[],
                                                                tags,
                                                            });
                                                        }
                                                    },
                                                });
                                            },
                                        },
                                    ],
                                }}
                            >
                                <Button>
                                    Bulk Actions ({selectedRowKeys.length}) <MoreOutlined />
                                </Button>
                            </Dropdown>
                        )}
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingLead(null);
                                form.resetFields();
                                setIsModalVisible(true);
                            }}
                        >
                            Add Lead
                        </Button>
                    </Space>
                </Space>
            </Card>

            {/* Leads Table */}
            <Card>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={leads}
                    loading={isLoading}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    pagination={{
                        total: pagination.total,
                        pageSize: filters.limit || 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} leads`,
                    }}
                    onChange={(p) => {
                        setFilters(f => ({
                            ...f,
                            limit: p.pageSize,
                            offset: ((p.current || 1) - 1) * (p.pageSize || 20),
                        }));
                    }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingLead ? 'Edit Lead' : 'Create Lead'}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingLead(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Name">
                                <Input prefix={<UserOutlined />} placeholder="Full name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Phone"
                                rules={[{ required: true, message: 'Phone is required' }]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="email" label="Email">
                                <Input prefix={<MailOutlined />} placeholder="email@example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="source" label="Source" initialValue="manual">
                                <Select>
                                    {Object.keys(leadSourceIcons).map(s => (
                                        <Option key={s} value={s}>{s}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="tags" label="Tags">
                        <Select mode="tags" placeholder="Add tags" />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} placeholder="Add notes about this lead..." />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                                {editingLead ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Lead Details Drawer */}
            <Drawer
                title="Lead Details"
                placement="right"
                width={480}
                open={isDrawerVisible}
                onClose={() => {
                    setIsDrawerVisible(false);
                    setSelectedLead(null);
                }}
            >
                {selectedLead && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                                {selectedLead.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                                {selectedLead.name || 'Unknown'}
                            </Title>
                            <Tag color={leadStatusColors[selectedLead.status]}>
                                {selectedLead.status.toUpperCase()}
                            </Tag>
                            <div style={{ marginTop: 8 }}>
                                <Badge count={selectedLead.score} showZero style={{ backgroundColor: '#52c41a' }} />
                                <Text type="secondary" style={{ marginLeft: 8 }}>Lead Score</Text>
                            </div>
                        </div>

                        <Card size="small" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div><PhoneOutlined /> {selectedLead.phone}</div>
                                {selectedLead.email && <div><MailOutlined /> {selectedLead.email}</div>}
                                <div>Source: {leadSourceIcons[selectedLead.source]} {selectedLead.source}</div>
                                <div>Orders: {selectedLead.totalOrders} (₹{selectedLead.totalSpent?.toFixed(2)})</div>
                            </Space>
                        </Card>

                        {selectedLead.tags?.length > 0 && (
                            <Card size="small" title="Tags" style={{ marginBottom: 16 }}>
                                <Space wrap>
                                    {selectedLead.tags.map(tag => (
                                        <Tag key={tag} color="blue">{tag}</Tag>
                                    ))}
                                </Space>
                            </Card>
                        )}

                        <Card size="small" title="Activity Timeline">
                            <Timeline
                                items={activities.map((activity: any) => ({
                                    color: activity.type === 'order_created' ? 'green' : activity.type === 'payment_received' ? 'blue' : 'gray',
                                    children: (
                                        <div>
                                            <Text strong>{activity.type.replace(/_/g, ' ')}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(activity.createdAt).toLocaleString()}
                                            </Text>
                                            {activity.description && <div>{activity.description}</div>}
                                        </div>
                                    ),
                                }))}
                            />
                            {activities.length === 0 && (
                                <Text type="secondary">No activity yet</Text>
                            )}
                        </Card>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default LeadsList;
