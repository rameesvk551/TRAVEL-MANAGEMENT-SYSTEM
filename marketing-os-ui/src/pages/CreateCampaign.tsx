import { useState } from 'react';
import { Steps, Form, Input, Button, Card, Select, Radio, Typography, Divider, Result, message } from 'antd';
import { UserOutlined, FileTextOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { emailApi } from '../api/modules';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const steps = [
    {
        title: 'Details',
        icon: <FileTextOutlined />,
    },
    {
        title: 'Template',
        icon: <FileTextOutlined />,
    },
    {
        title: 'Audience',
        icon: <UserOutlined />,
    },
    {
        title: 'Review',
        icon: <CheckCircleOutlined />,
    },
];

export default function CreateCampaign() {
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [campaignData, setCampaignData] = useState<any>({});
    const navigate = useNavigate();
    const { isMobile } = useResponsive();

    const { data: templates } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.getTemplates });

    const createMutation = useMutation({
        mutationFn: emailApi.createCampaign,
        onSuccess: (data) => {
            setCampaignData({ ...campaignData, id: data.id });
            message.success('Campaign draft created');
            next();
        },
        onError: () => message.error('Failed to create draft')
    });

    const sendMutation = useMutation({
        mutationFn: (id: string) => emailApi.sendCampaign(id),
        onSuccess: (data) => {
            message.success(`Campaign sent to ${data.sentCount} recipients!`);
            navigate('/email');
        },
        onError: () => message.error('Failed to send campaign')
    });

    const next = () => {
        setCurrent(current + 1);
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const handleDetailsSubmit = (values: any) => {
        setCampaignData({ ...campaignData, ...values });
        // Create draft on server if not exists
        if (!campaignData.id) {
            createMutation.mutate(values);
        } else {
            next(); // Update logic could go here
        }
    };

    const handleTemplateSelect = (values: any) => {
        setCampaignData({ ...campaignData, ...values });
        next();
    };

    const handleAudienceSelect = (values: any) => {
        setCampaignData({ ...campaignData, ...values });
        next();
    };

    const handleSend = () => {
        if (campaignData.id) {
            sendMutation.mutate(campaignData.id);
        }
    };

    const TemplatePreview = ({ templateId }: { templateId: string }) => {
        const template = templates?.find((t: any) => t.id === templateId);
        if (!template) return null;
        return (
            <Card title="Preview" size="small" style={{ marginTop: 16 }}>
                <iframe
                    title="preview"
                    srcDoc={template.html_content}
                    style={{ width: '100%', height: 300, border: 'none' }}
                />
            </Card>
        );
    };

    return (
        <div style={{ padding: isMobile ? 12 : 24, maxWidth: 800, margin: '0 auto' }}>
            <Title level={isMobile ? 4 : 2}>Create New Campaign</Title>
            <Steps current={current} items={steps} style={{ marginBottom: isMobile ? 24 : 40 }} size={isMobile ? 'small' : 'default'} />

            <Card>
                {current === 0 && (
                    <Form form={form} layout="vertical" onFinish={handleDetailsSubmit} initialValues={campaignData}>
                        <Form.Item name="name" label="Campaign Name" rules={[{ required: true }]}>
                            <Input placeholder="e.g. Monthly Newsletter" />
                        </Form.Item>
                        <Form.Item name="subject" label="Email Subject" rules={[{ required: true }]}>
                            <Input placeholder="What recipients will see" />
                        </Form.Item>
                        <Form.Item name="fromName" label="From Name" rules={[{ required: true }]}>
                            <Input placeholder="Your Company Name" />
                        </Form.Item>
                        <Form.Item name="fromEmail" label="From Email" rules={[{ required: true }]}>
                            <Input placeholder="newsletter@company.com" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                            Next: Select Template
                        </Button>
                    </Form>
                )}

                {current === 1 && (
                    <Form onFinish={handleTemplateSelect} initialValues={campaignData}>
                        <Form.Item name="templateId" label="Select Template" rules={[{ required: true }]}>
                            <Select placeholder="Choose a template" onChange={(val) => setCampaignData({ ...campaignData, templateId: val })}>
                                {templates?.map((t: any) => (
                                    <Option key={t.id} value={t.id}>{t.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {campaignData.templateId && <TemplatePreview templateId={campaignData.templateId} />}
                        <div style={{ marginTop: 24 }}>
                            <Button style={{ marginRight: 8 }} onClick={prev}>Previous</Button>
                            <Button type="primary" htmlType="submit">Next: Audience</Button>
                        </div>
                    </Form>
                )}

                {current === 2 && (
                    <Form onFinish={handleAudienceSelect}>
                        <Form.Item name="segmentId" label="Select Segment" initialValue="all">
                            <Radio.Group>
                                <Radio value="all">All Subscribers</Radio>
                                <Radio value="active" disabled>Active Users (Last 30 days) - Coming Soon</Radio>
                                <Radio value="customers" disabled>Paying Customers - Coming Soon</Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Divider />
                        <Title level={5}>Estimated Recipients: 2 (Test Mode)</Title>
                        <div style={{ marginTop: 24 }}>
                            <Button style={{ marginRight: 8 }} onClick={prev}>Previous</Button>
                            <Button type="primary" htmlType="submit">Next: Review</Button>
                        </div>
                    </Form>
                )}

                {current === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <Result
                            icon={<SendOutlined />}
                            title="Ready to Send!"
                            subTitle={`You are about to send "${campaignData.name}" to the selected audience.`}
                            extra={[
                                <Button key="back" onClick={prev}>Previous</Button>,
                                <Button type="primary" size="large" onClick={handleSend} loading={sendMutation.isPending}>
                                    Send Campaign Now
                                </Button>,
                            ]}
                        />
                        <div style={{ textAlign: 'left', marginTop: 20, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                            <Paragraph><strong>Subject:</strong> {campaignData.subject}</Paragraph>
                            <Paragraph><strong>From:</strong> {campaignData.fromName} &lt;{campaignData.fromEmail}&gt;</Paragraph>
                            <Paragraph><strong>Template:</strong> {templates?.find((t: any) => t.id === campaignData.templateId)?.name}</Paragraph>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
