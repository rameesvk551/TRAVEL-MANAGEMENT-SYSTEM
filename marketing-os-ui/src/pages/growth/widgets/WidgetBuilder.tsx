import React, { useEffect, useState } from 'react';
import { Form, Input, Switch, Select, Button, Card, Row, Col, ColorPicker, message, Typography, Space } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { widgetApi } from '../../../api/widgets';
import type { IWidgetConfig } from '../../../api/widgets';
import LivePreview from '../../../components/growth/widgets/LivePreview';
import { useResponsive } from '../../../hooks/useResponsive';

const { Option } = Select;
const { Title } = Typography;

const defaultConfig: IWidgetConfig = {
    greetingMessage: 'Hi there! How can we help you?',
    btnLabel: 'Chat with us',
    brandColor: '#25D366',
    position: 'right',
    showOfflineMessage: false,
    offlineMessage: 'We are currently offline. Leave a message!',
    agents: []
};

const WidgetBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<IWidgetConfig>(defaultConfig);
    const { isMobile } = useResponsive();

    useEffect(() => {
        if (id) {
            loadWidget(id);
        }
    }, [id]);

    const loadWidget = async (widgetId: string) => {
        try {
            setLoading(true);
            const data = await widgetApi.getById(widgetId);
            form.setFieldsValue({
                ...data,
                brandColor: data.config.brandColor // Lift for form binding if needed
            });
            setConfig(data.config);
        } catch (error) {
            message.error('Failed to load widget');
        } finally {
            setLoading(false);
        }
    };

    const handleValuesChange = (_changedValues: any, allValues: any) => {
        // Merge form values into config for preview
        const newConfig: IWidgetConfig = {
            ...config,
            ...allValues.config,
            // Handle agents separately if they are in the form
        };
        setConfig(newConfig);
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const payload = {
                name: values.name,
                isActive: values.isActive,
                config: {
                    ...config, // Use current config state which includes agents
                    ...values.config,
                }
            };

            if (id) {
                await widgetApi.update(id, payload);
                message.success('Widget updated successfully');
            } else {
                await widgetApi.create(payload);
                message.success('Widget created successfully');
                navigate('/growth/widgets');
            }
        } catch (error) {
            message.error('Failed to save widget');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            <div className="page-header" style={{ marginBottom: isMobile ? 16 : 24 }}>
                <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>{id ? 'Edit Widget' : 'Create New Widget'}</Title>
                <Space>
                    <Button onClick={() => navigate('/growth/widgets')}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => form.submit()}>
                        {isMobile ? 'Save' : 'Save Widget'}
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ isActive: true, config: defaultConfig }}
                        onValuesChange={handleValuesChange}
                    >
                        <Card title="General Settings" bordered={false} style={{ marginBottom: 24 }}>
                            <Form.Item name="name" label="Widget Name" rules={[{ required: true }]}>
                                <Input placeholder="My Website Widget" />
                            </Form.Item>
                            <Form.Item name="isActive" label="Status" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </Card>

                        <Card title="Design & Content" bordered={false} style={{ marginBottom: 24 }}>
                            <Form.Item name={['config', 'greetingMessage']} label="Greeting Message">
                                <Input.TextArea rows={2} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name={['config', 'btnLabel']} label="Button Label">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name={['config', 'position']} label="Position">
                                        <Select>
                                            <Option value="right">Bottom Right</Option>
                                            <Option value="left">Bottom Left</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name={['config', 'brandColor']} label="Brand Color">
                                <ColorPicker
                                    showText
                                    onChange={(value) => {
                                        const hex = value.toHexString();
                                        setConfig(prev => ({ ...prev, brandColor: hex }));
                                        form.setFieldValue(['config', 'brandColor'], hex);
                                    }}
                                />
                            </Form.Item>
                        </Card>

                        <Card title="Agents" bordered={false} style={{ marginBottom: 24 }}>
                            <Form.List name={['config', 'agents']}>
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'name']}
                                                    rules={[{ required: true, message: 'Missing name' }]}
                                                    style={{ flex: 1, marginBottom: 0 }}
                                                >
                                                    <Input placeholder="Agent Name" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'role']}
                                                    style={{ flex: 1, marginBottom: 0 }}
                                                >
                                                    <Input placeholder="Role (e.g. Sales)" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'phone']}
                                                    rules={[{ required: true, message: 'Missing phone' }]}
                                                    style={{ flex: 1, marginBottom: 0 }}
                                                >
                                                    <Input placeholder="WhatsApp Number" />
                                                </Form.Item>
                                                <DeleteOutlined onClick={() => remove(name)} style={{ marginTop: 8 }} />
                                            </div>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Add Agent
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Card>
                    </Form>
                </Col>

                <Col xs={24} lg={12}>
                    <div style={{ position: 'sticky', top: 24 }}>
                        <Card title="Live Preview" bordered={false}>
                            <LivePreview config={config} />
                        </Card>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default WidgetBuilder;
