// WhatsAppAutomation.tsx — pure render shell.
// All logic lives in hooks/useAutomation.ts

import React from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, AppstoreOutlined } from '@ant-design/icons';
import FlowEditor from './flow/FlowEditor';
import { useAutomation } from '../hooks/useAutomation';

const { Title, Text } = Typography;
const { Option } = Select;

const WhatsAppAutomation: React.FC = () => {
    const {
        form,
        isFlowEditorVisible, isModalVisible, setIsModalVisible,
        editingRule, selectedFlowId, flowEditorRef,
        rules, isRulesLoading, flows, isFlowsLoading,
        isRuleSaving,
        handleEditRule, handleDeleteRule, handleSaveRule,
        handleEditFlow, handleCreateFlow, handleDeleteFlow,
        handleBackFromEditor, handleSaveFlow,
    } = useAutomation();

    /* ── Table column definitions (pure presentation config) ── */
    const ruleColumns = [
        { title: 'Rule Name', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Trigger', dataIndex: ['trigger', 'type'], key: 'trigger', render: (text: string) => <Tag color="blue">{text}</Tag> },
        { title: 'Action', key: 'action', render: (_: any, record: any) => <Tag color="green">{record.actions?.[0]?.type || 'NO ACTION'}</Tag> },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag> },
        {
            title: 'Actions', key: 'actions', render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEditRule(record)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDeleteRule(record.id)} />
                </Space>
            ),
        },
    ];

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
            ),
        },
    ];

    /* ── Flow editor full-screen view ── */
    if (isFlowEditorVisible) {
        return (
            <div style={{ padding: '0px', height: 'calc(100vh - 64px)', background: '#fff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <Button onClick={handleBackFromEditor}>Back</Button>
                        <Title level={4} style={{ margin: 0 }}>{selectedFlowId ? 'Edit Flow' : 'New Automation Flow'}</Title>
                    </Space>
                    <Button type="primary" onClick={handleSaveFlow}>Save Flow</Button>
                </div>
                <div style={{ height: 'calc(100% - 65px)' }}>
                    <FlowEditor ref={flowEditorRef} flowId={selectedFlowId} />
                </div>
            </div>
        );
    }

    /* ── Main view ── */
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <Title level={4}><ThunderboltOutlined /> Automation</Title>
                    <Text type="secondary">Manage your automation flows and rules</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateFlow}>New Flow</Button>
                </Space>
            </div>

            <Card title="Automation Flows" extra={<Button icon={<AppstoreOutlined />} onClick={handleCreateFlow}>Visual Builder</Button>}>
                <Table columns={flowColumns} dataSource={flows} rowKey="_id" loading={isFlowsLoading} pagination={{ pageSize: 10 }} />
            </Card>

            <div style={{ marginTop: 24 }}>
                <Title level={5}>Legacy Rules</Title>
                <Table columns={ruleColumns} dataSource={rules} rowKey="id" loading={isRulesLoading} pagination={{ pageSize: 5 }} />
            </div>

            <Modal
                title={editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                open={isModalVisible}
                onOk={handleSaveRule}
                onCancel={() => setIsModalVisible(false)}
                width={700}
                confirmLoading={isRuleSaving}
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

                        <Form.Item noStyle shouldUpdate={(prev, current) => prev.actionType !== current.actionType}>
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
