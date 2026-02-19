import { useState } from 'react';
import { Table, Button, Card, Modal, Form, Input, Select, Space, Typography, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '../api/modules';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function EmailTemplates() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const { isMobile } = useResponsive();

    const { data: templates, isLoading } = useQuery({
        queryKey: ['email-templates'],
        queryFn: emailApi.getTemplates
    });

    const createMutation = useMutation({
        mutationFn: emailApi.createTemplate,
        onSuccess: () => {
            message.success('Template created successfully');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
        onError: () => message.error('Failed to create template')
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => emailApi.updateTemplate(editingTemplate.id, data),
        onSuccess: () => {
            message.success('Template updated successfully');
            setIsModalVisible(false);
            setEditingTemplate(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
        onError: () => message.error('Failed to update template')
    });

    const deleteMutation = useMutation({
        mutationFn: emailApi.deleteTemplate,
        onSuccess: () => {
            message.success('Template deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
        onError: () => message.error('Failed to delete template')
    });

    const handleCreate = () => {
        setEditingTemplate(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record: any) => {
        setEditingTemplate(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this template?',
            onOk: () => deleteMutation.mutate(id),
        });
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            if (editingTemplate) {
                updateMutation.mutate(values);
            } else {
                createMutation.mutate(values);
            }
        });
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Subject',
            dataIndex: 'subject',
            key: 'subject',
            responsive: ['md'] as any,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (cat: string) => (
                <Tag color={cat === 'promotional' ? 'blue' : cat === 'transactional' ? 'green' : 'orange'}>
                    {cat.toUpperCase()}
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

    const [previewMode, setPreviewMode] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');

    const insertTag = (tag: string) => {
        const textarea = document.getElementById('template-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newText = before + tag + after;

        setHtmlContent(newText);
        form.setFieldsValue({ htmlContent: newText });

        // Restore focus and cursor (simplified)
        setTimeout(() => textarea.focus(), 0);
    };

    return (
        <div>
            <div className="page-header">
                <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>Email Templates</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size={isMobile ? 'middle' : 'large'}>
                    {isMobile ? 'New' : 'New Template'}
                </Button>
            </div>

            <Card style={{ borderRadius: 12 }}>
                <div className="responsive-table-wrapper">
                    <Table
                        dataSource={Array.isArray(templates) ? templates : []}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 10 }}
                        size={isMobile ? 'small' : 'middle'}
                    />
                </div>
            </Card>

            <Modal
                title={editingTemplate ? 'Edit Template' : 'New Template'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                width={isMobile ? '100%' : 900}
            >
                <Form form={form} layout="vertical" onValuesChange={(changed) => {
                    if (changed.htmlContent !== undefined) setHtmlContent(changed.htmlContent);
                }}>
                    <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Please enter a name' }]}>
                        <Input placeholder="e.g. Welcome Series Email 1" />
                    </Form.Item>
                    <Form.Item name="category" label="Category" initialValue="promotional">
                        <Select>
                            <Option value="promotional">Promotional</Option>
                            <Option value="transactional">Transactional</Option>
                            <Option value="newsletter">Newsletter</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="subject" label="Email Subject" rules={[{ required: true, message: 'Please enter a subject' }]}>
                        <Input placeholder="Welcome to our platform!" />
                    </Form.Item>

                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Text strong>Content</Text>
                            <Space size={4}>
                                <Button size="small" onClick={() => insertTag('<b></b>')}>Bold</Button>
                                <Button size="small" onClick={() => insertTag('<i></i>')}>Italic</Button>
                                <Button size="small" onClick={() => insertTag('<a href="#">Link</a>')}>Link</Button>
                                <Button size="small" onClick={() => insertTag('<br/>')}>Line Break</Button>
                                <Button size="small" onClick={() => insertTag('{{name}}')}>{`{{name}}`}</Button>
                            </Space>
                        </Space>
                        <Button
                            size="small"
                            type={previewMode ? 'primary' : 'default'}
                            onClick={() => setPreviewMode(!previewMode)}
                        >
                            {previewMode ? 'Edit Mode' : 'Preview Mode'}
                        </Button>
                    </div>

                    {!previewMode ? (
                        <Form.Item name="htmlContent" rules={[{ required: true, message: 'Please enter HTML content' }]}>
                            <TextArea
                                id="template-editor"
                                rows={12}
                                placeholder="<html><body><h1>Hello <%= name %>!</h1></body></html>"
                                style={{ fontFamily: 'monospace', fontSize: 13 }}
                                onChange={(e) => setHtmlContent(e.target.value)}
                            />
                        </Form.Item>
                    ) : (
                        <div style={{
                            border: '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 20,
                            minHeight: 300,
                            background: '#f5f5f5'
                        }}>
                            <div style={{ background: 'white', padding: 20, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div dangerouslySetInnerHTML={{ __html: htmlContent.replace(/{{/g, '&#123;&#123;').replace(/}}/g, '&#125;&#125;').replace(/<%=/g, '&lt;%=').replace(/%>/g, '%&gt;') }} />
                            </div>
                            <Text type="secondary" style={{ display: 'block', marginTop: 10, textAlign: 'center', fontSize: 12 }}>
                                Variables are not substituted in preview.
                            </Text>
                        </div>
                    )}

                    <div style={{ marginTop: 10 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Supported Variables: <code>{'<%= name %>'}</code>, <code>{'<%= email %>'}</code>.
                        </Text>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
