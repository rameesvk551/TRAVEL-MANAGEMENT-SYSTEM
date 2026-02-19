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
    message,
    Tooltip,
    Row,
    Col,
    Statistic,
    Popconfirm,
    Collapse,
    InputNumber,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ThunderboltOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smartAutomationApi } from '../../../api/modules';
import type { AutomationRule, AutomationTriggerType, AutomationActionType } from '../../../api/modules';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const triggerTypeLabels: Record<AutomationTriggerType, { label: string; description: string; icon: string }> = {
    no_reply: { label: 'No Reply', description: 'Customer hasn\'t replied', icon: '⏰' },
    cart_abandoned: { label: 'Cart Abandoned', description: 'Cart left inactive', icon: '🛒' },
    payment_pending: { label: 'Payment Pending', description: 'Payment not received', icon: '💳' },
    order_completed: { label: 'Order Completed', description: 'Order marked complete', icon: '✅' },
    scheduled: { label: 'Scheduled', description: 'Run at specific time', icon: '📅' },
    lead_score_changed: { label: 'Score Changed', description: 'Lead score threshold', icon: '📊' },
    status_changed: { label: 'Status Changed', description: 'Lead status updated', icon: '🔄' },
    tag_added: { label: 'Tag Added', description: 'Specific tag added', icon: '🏷️' },
    flow_completed: { label: 'Flow Completed', description: 'Flow execution done', icon: '✔️' },
    custom: { label: 'Custom', description: 'Custom webhook trigger', icon: '🔗' },
};

const actionTypeLabels: Record<AutomationActionType, { label: string; icon: string }> = {
    send_message: { label: 'Send Message', icon: '💬' },
    send_template: { label: 'Send Template', icon: '📄' },
    trigger_flow: { label: 'Trigger Flow', icon: '🔀' },
    assign_agent: { label: 'Assign Agent', icon: '👤' },
    update_lead_status: { label: 'Update Status', icon: '🔄' },
    update_lead_score: { label: 'Update Score', icon: '📊' },
    add_tag: { label: 'Add Tag', icon: '➕' },
    remove_tag: { label: 'Remove Tag', icon: '➖' },
    webhook: { label: 'Call Webhook', icon: '🔗' },
    create_task: { label: 'Create Task', icon: '📝' },
};

const AutomationRules: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Fetch rules
    const { data: rulesResponse, isLoading } = useQuery({
        queryKey: ['automation-rules-v2'],
        queryFn: () => smartAutomationApi.getRules(),
    });

    const rules: AutomationRule[] = rulesResponse?.data || [];

    // Fetch stats
    const { data: statsResponse } = useQuery({
        queryKey: ['automation-stats'],
        queryFn: smartAutomationApi.getStats,
    });

    const stats = statsResponse?.data || {};

    // Mutations
    const createMutation = useMutation({
        mutationFn: smartAutomationApi.createRule,
        onSuccess: () => {
            message.success('Rule created successfully');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['automation-rules-v2'] });
        },
        onError: () => message.error('Failed to create rule'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AutomationRule> }) => 
            smartAutomationApi.updateRule(id, data),
        onSuccess: () => {
            message.success('Rule updated successfully');
            setIsModalVisible(false);
            setEditingRule(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['automation-rules-v2'] });
        },
        onError: () => message.error('Failed to update rule'),
    });

    const deleteMutation = useMutation({
        mutationFn: smartAutomationApi.deleteRule,
        onSuccess: () => {
            message.success('Rule deleted');
            queryClient.invalidateQueries({ queryKey: ['automation-rules-v2'] });
        },
        onError: () => message.error('Failed to delete rule'),
    });

    const activateMutation = useMutation({
        mutationFn: smartAutomationApi.activateRule,
        onSuccess: () => {
            message.success('Rule activated');
            queryClient.invalidateQueries({ queryKey: ['automation-rules-v2'] });
        },
        onError: () => message.error('Failed to activate rule'),
    });

    const deactivateMutation = useMutation({
        mutationFn: smartAutomationApi.deactivateRule,
        onSuccess: () => {
            message.success('Rule deactivated');
            queryClient.invalidateQueries({ queryKey: ['automation-rules-v2'] });
        },
        onError: () => message.error('Failed to deactivate rule'),
    });

    const createDefaultsMutation = useMutation({
        mutationFn: smartAutomationApi.createDefaultRules,
        onSuccess: (data) => {
            message.success(`Created ${data?.data?.created || 0} default rules`);
            queryClient.invalidateQueries({ queryKey: ['automation-rules-v2'] });
        },
        onError: () => message.error('Failed to create default rules'),
    });

    const handleSubmit = async (values: any) => {
        const ruleData: Partial<AutomationRule> = {
            name: values.name,
            description: values.description,
            triggerType: values.triggerType,
            triggerConfig: values.triggerConfig || {},
            actions: values.actions || [],
            cooldownMinutes: values.cooldownMinutes || 60,
            maxExecutionsPerLead: values.maxExecutionsPerLead,
            priority: values.priority || 0,
        };

        // Handle trigger config based on type
        if (values.triggerType === 'no_reply' || values.triggerType === 'cart_abandoned' || values.triggerType === 'payment_pending') {
            ruleData.triggerConfig = { delayMinutes: values.delayMinutes || 30 };
        }

        // Handle simple action
        if (values.actionType) {
            ruleData.actions = [{
                type: values.actionType,
                config: values.actionConfig || {},
            }];

            if (values.actionType === 'send_message') {
                ruleData.actions[0].config = { message: values.actionMessage };
            } else if (values.actionType === 'trigger_flow') {
                ruleData.actions[0].config = { flowId: values.actionFlowId };
            } else if (values.actionType === 'update_lead_status') {
                ruleData.actions[0].config = { status: values.actionStatus };
            } else if (values.actionType === 'add_tag' || values.actionType === 'remove_tag') {
                ruleData.actions[0].config = { tag: values.actionTag };
            }
        }

        if (editingRule) {
            updateMutation.mutate({ id: editingRule.id, data: ruleData });
        } else {
            createMutation.mutate(ruleData);
        }
    };

    const handleEdit = (rule: AutomationRule) => {
        setEditingRule(rule);
        const action = rule.actions?.[0];
        form.setFieldsValue({
            ...rule,
            delayMinutes: rule.triggerConfig?.delayMinutes,
            actionType: action?.type,
            actionMessage: action?.config?.message,
            actionFlowId: action?.config?.flowId,
            actionStatus: action?.config?.status,
            actionTag: action?.config?.tag,
        });
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Rule',
            key: 'rule',
            render: (_: any, record: AutomationRule) => (
                <div>
                    <Space>
                        <Text strong>{record.name}</Text>
                        {record.isActive ? (
                            <Tag color="green">Active</Tag>
                        ) : (
                            <Tag color="default">Inactive</Tag>
                        )}
                    </Space>
                    {record.description && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }} ellipsis>
                            {record.description}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Trigger',
            key: 'trigger',
            render: (_: any, record: AutomationRule) => {
                const trigger = triggerTypeLabels[record.triggerType];
                return (
                    <Tooltip title={trigger?.description}>
                        <Tag icon={<span style={{ marginRight: 4 }}>{trigger?.icon}</span>}>
                            {trigger?.label || record.triggerType}
                        </Tag>
                        {record.triggerConfig?.delayMinutes && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                <br />After {record.triggerConfig.delayMinutes}min
                            </Text>
                        )}
                    </Tooltip>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: AutomationRule) => (
                <Space direction="vertical" size={2}>
                    {record.actions?.map((action, i) => {
                        const actionInfo = actionTypeLabels[action.type];
                        return (
                            <Tag key={i}>
                                {actionInfo?.icon} {actionInfo?.label || action.type}
                            </Tag>
                        );
                    })}
                </Space>
            ),
        },
        {
            title: 'Executions',
            dataIndex: 'totalExecutions',
            key: 'executions',
            render: (count: number) => (
                <Space>
                    <ThunderboltOutlined />
                    {count}
                </Space>
            ),
        },
        {
            title: 'Last Run',
            dataIndex: 'lastExecutedAt',
            key: 'lastRun',
            render: (date: string) => 
                date ? new Date(date).toLocaleDateString() : <Text type="secondary">Never</Text>,
        },
        {
            title: 'Actions',
            key: 'tableActions',
            render: (_: any, record: AutomationRule) => (
                <Space>
                    <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
                        <Button
                            type={record.isActive ? 'default' : 'primary'}
                            size="small"
                            icon={record.isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={() => {
                                if (record.isActive) {
                                    deactivateMutation.mutate(record.id);
                                } else {
                                    activateMutation.mutate(record.id);
                                }
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete this rule?"
                        onConfirm={() => deleteMutation.mutate(record.id)}
                    >
                        <Button size="small" icon={<DeleteOutlined />} danger />
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
                            title="Total Rules"
                            value={stats.totalRules || rules.length}
                            prefix={<ThunderboltOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Active"
                            value={stats.activeRules || rules.filter(r => r.isActive).length}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Executions"
                            value={stats.totalExecutions || rules.reduce((sum, r) => sum + r.totalExecutions, 0)}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Today"
                            value={stats.executionsToday || 0}
                            prefix={<ThunderboltOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Actions */}
            <Card style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Title level={5} style={{ margin: 0 }}>
                        <ThunderboltOutlined /> Automation Rules
                    </Title>
                    <Space>
                        <Button
                            icon={<PlusOutlined />}
                            onClick={() => createDefaultsMutation.mutate()}
                            loading={createDefaultsMutation.isPending}
                        >
                            Create Default Rules
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingRule(null);
                                form.resetFields();
                                setIsModalVisible(true);
                            }}
                        >
                            Create Rule
                        </Button>
                    </Space>
                </Space>
            </Card>

            {/* Rules Table */}
            <Card>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rules}
                    loading={isLoading}
                    pagination={false}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingRule ? 'Edit Rule' : 'Create Automation Rule'}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingRule(null);
                    form.resetFields();
                }}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                name="name"
                                label="Rule Name"
                                rules={[{ required: true, message: 'Name is required' }]}
                            >
                                <Input placeholder="e.g., Cart Abandonment Reminder" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="priority" label="Priority" initialValue={0}>
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} placeholder="What does this rule do?" />
                    </Form.Item>

                    <Collapse defaultActiveKey={['trigger', 'action']}>
                        <Panel header="Trigger" key="trigger">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="triggerType"
                                        label="Trigger Type"
                                        rules={[{ required: true }]}
                                    >
                                        <Select placeholder="Select trigger">
                                            {Object.entries(triggerTypeLabels).map(([key, value]) => (
                                                <Option key={key} value={key}>
                                                    {value.icon} {value.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, curr) => prev.triggerType !== curr.triggerType}
                                    >
                                        {({ getFieldValue }) => {
                                            const type = getFieldValue('triggerType');
                                            if (['no_reply', 'cart_abandoned', 'payment_pending'].includes(type)) {
                                                return (
                                                    <Form.Item name="delayMinutes" label="Delay (minutes)">
                                                        <InputNumber min={1} max={10080} addonAfter="min" style={{ width: '100%' }} />
                                                    </Form.Item>
                                                );
                                            }
                                            return null;
                                        }}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Panel>

                        <Panel header="Action" key="action">
                            <Form.Item
                                name="actionType"
                                label="Action Type"
                                rules={[{ required: true }]}
                            >
                                <Select placeholder="Select action">
                                    {Object.entries(actionTypeLabels).map(([key, value]) => (
                                        <Option key={key} value={key}>
                                            {value.icon} {value.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => prev.actionType !== curr.actionType}
                            >
                                {({ getFieldValue }) => {
                                    const type = getFieldValue('actionType');
                                    switch (type) {
                                        case 'send_message':
                                            return (
                                                <Form.Item name="actionMessage" label="Message">
                                                    <Input.TextArea rows={3} placeholder="Message to send..." />
                                                </Form.Item>
                                            );
                                        case 'trigger_flow':
                                            return (
                                                <Form.Item name="actionFlowId" label="Flow ID">
                                                    <Input placeholder="Flow ID to trigger" />
                                                </Form.Item>
                                            );
                                        case 'update_lead_status':
                                            return (
                                                <Form.Item name="actionStatus" label="New Status">
                                                    <Select>
                                                        {['new', 'contacted', 'qualified', 'interested', 'negotiating', 'converted', 'lost'].map(s => (
                                                            <Option key={s} value={s}>{s}</Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            );
                                        case 'add_tag':
                                        case 'remove_tag':
                                            return (
                                                <Form.Item name="actionTag" label="Tag">
                                                    <Input placeholder="Tag name" />
                                                </Form.Item>
                                            );
                                        default:
                                            return null;
                                    }
                                }}
                            </Form.Item>
                        </Panel>

                        <Panel header="Settings" key="settings">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="cooldownMinutes" label="Cooldown (minutes)" initialValue={60}>
                                        <InputNumber min={0} max={10080} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="maxExecutionsPerLead" label="Max Executions per Lead">
                                        <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="Unlimited" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Panel>
                    </Collapse>

                    <Form.Item style={{ marginTop: 16 }}>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                                {editingRule ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AutomationRules;
