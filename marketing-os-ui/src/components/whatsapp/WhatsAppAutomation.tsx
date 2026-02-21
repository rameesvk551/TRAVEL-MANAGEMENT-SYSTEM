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
    Switch,
    message
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, automationApi } from '../../api/modules';

const { Title, Text } = Typography;
const { Option } = Select;

import FlowEditor from './flow/FlowEditor';
import type { FlowEditorRef } from './flow/FlowEditor';
import { AppstoreOutlined } from '@ant-design/icons';

const WhatsAppAutomation: React.FC = () => {
    const [isFlowEditorVisible, setIsFlowEditorVisible] = useState(false);
    const flowEditorRef = React.useRef<FlowEditorRef>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Fetch rules
    const { data: rulesData, isLoading } = useQuery({
        queryKey: ['automation-rules'],
        queryFn: whatsappApi.getRules,
    });

    const rules = rulesData?.data || [];

    // Mutations
    const createRuleMutation = useMutation({
        mutationFn: whatsappApi.createRule,
        onSuccess: () => {
            message.success('Rule created successfully');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
        onError: () => message.error('Failed to create rule'),
    });

    const updateRuleMutation = useMutation({
        mutationFn: (variables: { id: string; data: any }) => whatsappApi.updateRule(variables.id, variables.data),
        onSuccess: () => {
            message.success('Rule updated successfully');
            setIsModalVisible(false);
            setEditingRule(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
        onError: () => message.error('Failed to update rule'),
    });

    const deleteRuleMutation = useMutation({
        mutationFn: whatsappApi.deleteRule,
        onSuccess: () => {
            message.success('Rule deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
        onError: () => message.error('Failed to delete rule'),
    });



    const handleEdit = (record: any) => {
        setEditingRule(record);
        // Transform record to form values if needed
        form.setFieldsValue({
            ...record,
            triggerType: record.trigger.type,
            conditionField: record.conditions[0]?.field,
            conditionOperator: record.conditions[0]?.operator,
            conditionValue: record.conditions[0]?.value,
            actionType: record.actions[0]?.type,
            actionConfig: record.actions[0]?.config,
        });
        setIsModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this rule?',
            onOk: () => deleteRuleMutation.mutate(id),
        });
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            // Construct rule object from form values
            const ruleData = {
                name: values.name,
                isActive: values.isActive !== undefined ? values.isActive : true,
                trigger: {
                    type: values.triggerType,
                },
                conditions: [
                    {
                        field: values.conditionField,
                        operator: values.conditionOperator,
                        value: values.conditionValue,
                    },
                ],
                actions: [
                    {
                        type: values.actionType,
                        config: values.actionConfig || {}, // Simplified; handling generic config
                    },
                ],
            };

            if (editingRule) {
                updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
            } else {
                createRuleMutation.mutate(ruleData);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const columns = [
        {
            title: 'Rule Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Trigger',
            dataIndex: ['trigger', 'type'],
            key: 'trigger',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Tag color="green">{record.actions?.[0]?.type || 'NO ACTION'}</Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];

    // Flow management
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

    // Fetch flows
    const { data: flowsData, isLoading: isFlowsLoading, refetch: refetchFlows } = useQuery({
        queryKey: ['automation-flows'],
        queryFn: automationApi.getFlows,
    });
    const flows = flowsData?.data || [];

    const handleEditFlow = (flowId: string) => {
        setSelectedFlowId(flowId);
        setIsFlowEditorVisible(true);
    };

    const handleCreateFlow = () => {
        setSelectedFlowId(null);
        setIsFlowEditorVisible(true);
    };

    const handleDeleteFlow = async (id: string) => {
        try {
            await automationApi.deleteFlow(id);
            message.success('Flow deleted');
            refetchFlows();
        } catch (e) {
            message.error('Failed to delete flow');
        }
    };

    const flowColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Trigger', dataIndex: ['trigger', 'type'], key: 'trigger', render: (text: string) => <Tag color="blue">{text}</Tag> },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag> },
        {
            title: 'Actions', key: 'actions', render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEditFlow(record._id)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDeleteFlow(record._id)} />
                </Space>
            )
        }
    ];

    if (isFlowEditorVisible) {
        return (
            <div style={{ padding: '0px', height: 'calc(100vh - 64px)', background: '#fff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <Button onClick={() => { setIsFlowEditorVisible(false); refetchFlows(); }}>Back</Button>
                        <Title level={4} style={{ margin: 0 }}>{selectedFlowId ? 'Edit Flow' : 'New Automation Flow'}</Title>
                    </Space>
                    <Button type="primary" onClick={() => flowEditorRef.current?.saveFlow()}>Save Flow</Button>
                </div>
                <div style={{ height: 'calc(100% - 65px)' }}>
                    <FlowEditor ref={flowEditorRef} flowId={selectedFlowId} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <Title level={4}><ThunderboltOutlined /> Automation</Title>
                    <Text type="secondary">Manage your automation flows and rules</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateFlow}>
                        New Flow
                    </Button>
                </Space>
            </div>

            <Card title="Automation Flows" extra={<Button icon={<AppstoreOutlined />} onClick={handleCreateFlow}>Visual Builder</Button>}>
                <Table
                    columns={flowColumns}
                    dataSource={flows}
                    rowKey="_id"
                    loading={isFlowsLoading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <div style={{ marginTop: 24 }}>
                <Title level={5}>Legacy Rules</Title>
                <Table
                    columns={columns}
                    dataSource={rules}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 5 }}
                />
            </div>

            <Modal
                title={editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                open={isModalVisible}
                onOk={handleSave}
                onCancel={() => setIsModalVisible(false)}
                width={700}
                confirmLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
            >
                <Form form={form} layout="vertical" initialValues={{ isActive: true, triggerType: 'MESSAGE_RECEIVED' }}>
                    <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Price Inquiry Auto-reply" />
                    </Form.Item>

                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Card size="small" title="Trigger" style={{ marginBottom: 16 }}>
                        <Form.Item name="triggerType" label="When this happens..." rules={[{ required: true }]}>
                            <Select>
                                <Option value="MESSAGE_RECEIVED">Message Received</Option>
                                <Option value="OPT_IN_STATUS_CHANGED">Opt-in Status Changed</Option>
                            </Select>
                        </Form.Item>
                    </Card>

                    <Card size="small" title="Conditions" style={{ marginBottom: 16 }}>
                        <Space style={{ display: 'flex', width: '100%' }} align="start">
                            <Form.Item name="conditionField" label="Field" style={{ width: 150 }} rules={[{ required: true }]}>
                                <Select>
                                    <Option value="message_body">Message Body</Option>
                                    <Option value="sender_phone">Sender Phone</Option>
                                    <Option value="contact_tag">Contact Tag</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="conditionOperator" label="Operator" style={{ width: 120 }} rules={[{ required: true }]}>
                                <Select>
                                    <Option value="contains">Contains</Option>
                                    <Option value="equals">Equals</Option>
                                    <Option value="starts_with">Starts With</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="conditionValue" label="Value" style={{ flex: 1 }} rules={[{ required: true }]}>
                                <Input placeholder="e.g. price" />
                            </Form.Item>
                        </Space>
                    </Card>

                    <Card size="small" title="Action" style={{ marginBottom: 16 }}>
                        <Form.Item name="actionType" label="Do this..." rules={[{ required: true }]}>
                            <Select>
                                <Option value="SEND_TEXT">Send Text Message</Option>
                                <Option value="SEND_TEMPLATE">Send Template</Option>
                                <Option value="ADD_TAG">Add Tag</Option>
                                <Option value="ASSIGN_AGENT">Assign Agent</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, current) => prev.actionType !== current.actionType}
                        >
                            {({ getFieldValue }) => {
                                const actionType = getFieldValue('actionType');
                                if (actionType === 'SEND_TEXT') {
                                    return (
                                        <Form.Item name={['actionConfig', 'text']} label="Message Text" rules={[{ required: true }]}>
                                            <Input.TextArea rows={3} placeholder="Enter your auto-reply message..." />
                                        </Form.Item>
                                    );
                                }
                                if (actionType === 'SEND_TEMPLATE') {
                                    return (
                                        <Form.Item name={['actionConfig', 'templateName']} label="Template Name" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. welcome_message" />
                                        </Form.Item>
                                    );
                                }
                                if (actionType === 'ADD_TAG') {
                                    return (
                                        <Form.Item name={['actionConfig', 'tag']} label="Tag Name" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. hot_lead" />
                                        </Form.Item>
                                    );
                                }
                                return null;
                            }}
                        </Form.Item>
                    </Card>
                </Form>
            </Modal>
        </div>
    );
};

export default WhatsAppAutomation;
