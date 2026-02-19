import React, { useState } from 'react';
import {
    Button,
    Modal,
    Form,
    Input,
    Select,
    Typography,
    message,
    Card,
    Tooltip,
    Row,
    Col,
    Badge,
    Empty
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SendOutlined,
    FileTextOutlined,
    GlobalOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '../../api/modules';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const WhatsAppTemplates: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();


    // Fetch templates
    const { data: templatesData, isLoading } = useQuery({
        queryKey: ['whatsapp-templates'],
        queryFn: () => whatsappApi.getTemplates(),
    });

    const templates = templatesData?.data || [];

    // Create mutation
    const createTemplateMutation = useMutation({
        mutationFn: whatsappApi.createTemplate,
        onSuccess: () => {
            message.success('Template created successfully');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: () => message.error('Failed to create template'),
    });

    // Delete mutation
    const deleteTemplateMutation = useMutation({
        mutationFn: whatsappApi.deleteTemplate,
        onSuccess: () => {
            message.success('Template deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: () => message.error('Failed to delete template'),
    });

    // Submit mutation (Placeholder for now)
    const submitTemplateMutation = useMutation({
        mutationFn: whatsappApi.submitTemplate,
        onSuccess: () => {
            message.success('Template submitted for approval');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
        },
        onError: () => message.error('Failed to submit template'),
    });

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            const templateData = {
                name: values.name,
                category: values.category,
                language: values.language,
                components: [
                    {
                        type: 'BODY',
                        text: values.body,
                    },
                ],
                status: 'DRAFT',
            };
            createTemplateMutation.mutate(templateData);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Template',
            content: 'Are you sure you want to delete this template? This cannot be undone.',
            okText: 'Delete',
            okButtonProps: { danger: true },
            onOk: () => deleteTemplateMutation.mutate(id),
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'PENDING': return 'processing';
            default: return 'default';
        }
    };



    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Message Templates</Title>
                    <Text type="secondary">Create and manage your WhatsApp message templates for campaigns</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    size="large"
                    style={{ borderRadius: 8 }}
                >
                    New Template
                </Button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Loading templates...</Text></div>
            ) : templates.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            No templates found. <a onClick={() => setIsModalVisible(true)}>Create one now</a>
                        </span>
                    }
                />
            ) : (
                <Row gutter={[24, 24]}>
                    {templates.map((template: any) => (
                        <Col xs={24} sm={12} lg={8} key={template.id}>
                            <Badge.Ribbon
                                text={template.status}
                                color={getStatusColor(template.status) === 'processing' ? 'gold' : getStatusColor(template.status) === 'default' ? 'purple' : getStatusColor(template.status)}
                            >
                                <Card
                                    hoverable
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid #f0f0f0' }}
                                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}
                                    actions={[
                                        <Tooltip title="View Details">
                                            <FileTextOutlined key="view" />
                                        </Tooltip>,
                                        template.status === 'DRAFT' ? (
                                            <Tooltip title="Submit for Approval">
                                                <SendOutlined key="submit" onClick={() => submitTemplateMutation.mutate(template.id)} />
                                            </Tooltip>
                                        ) : <span key="placeholder" />,
                                        <Tooltip title="Delete">
                                            <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(template.id)} />
                                        </Tooltip>,
                                    ]}
                                >
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Title level={5} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                                {template.name}
                                            </Title>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <AppstoreOutlined /> {template.category} • <GlobalOutlined /> {template.language}
                                        </Text>
                                    </div>

                                    <div style={{
                                        background: '#e5ddd5',
                                        padding: 12,
                                        borderRadius: 8,
                                        flex: 1,
                                        position: 'relative',
                                        marginBottom: 8
                                    }}>
                                        <div style={{ background: 'white', padding: '8px 12px', borderRadius: '0 8px 8px 8px', fontSize: 13, color: '#333' }}>
                                            <Paragraph ellipsis={{ rows: 4, expandable: false, symbol: '...' }} style={{ margin: 0 }}>
                                                {template.components.find((c: any) => c.type === 'BODY')?.text || <Text type="secondary" italic>No content</Text>}
                                            </Paragraph>
                                        </div>
                                    </div>
                                </Card>
                            </Badge.Ribbon>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="Create New Template"
                open={isModalVisible}
                onOk={handleCreate}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={createTemplateMutation.isPending}
                width={600}
                centered
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item
                        name="name"
                        label="Template Name"
                        rules={[{ required: true }, { pattern: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers and underscores allowed' }]}
                        help="Unique name for your template (e.g. welcome_offer_v1)"
                    >
                        <Input placeholder="welcome_message" size="large" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="MARKETING">Marketing</Option>
                                    <Option value="UTILITY">Utility</Option>
                                    <Option value="AUTHENTICATION">Authentication</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="language" label="Language" rules={[{ required: true }]}>
                                <Select defaultValue="en_US" size="large">
                                    <Option value="en_US">English (US)</Option>
                                    <Option value="es">Spanish</Option>
                                    <Option value="fr">French</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="body"
                        label="Message Body"
                        rules={[{ required: true }]}
                        help={<span>Use <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code> for dynamic variables.</span>}
                    >
                        <TextArea
                            rows={6}
                            placeholder="Hello {{1}}, check out our latest offers at {{2}}!"
                            style={{ borderRadius: 8 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default WhatsAppTemplates;
