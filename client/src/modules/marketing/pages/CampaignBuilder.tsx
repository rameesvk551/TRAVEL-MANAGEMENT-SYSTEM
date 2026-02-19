import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, DatePicker, Card, Steps, message, Alert } from 'antd';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi, CreateCampaignDTO } from '../../services/marketing.api';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

export default function CampaignBuilder() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();

    const createMutation = useMutation({
        mutationFn: marketingApi.createCampaign,
        onSuccess: () => {
            message.success('Campaign created successfully!');
            queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
            navigate('/marketing/campaigns');
        },
        onError: (error: any) => {
            message.error(`Failed to create campaign: ${error.message}`);
        },
    });

    const onFinish = (values: any) => {
        const campaignData: CreateCampaignDTO = {
            name: values.name,
            type: values.type,
            channel: values.channel,
            segmentId: values.segmentId, // TODO: Add Segment Selection
            content: values.content,
            scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
        };
        createMutation.mutate(campaignData);
    };

    const steps = [
        {
            title: 'Details',
            content: (
                <div className="space-y-4">
                    <Form.Item
                        name="name"
                        label="Campaign Name"
                        rules={[{ required: true, message: 'Please enter campaign name' }]}
                    >
                        <Input placeholder="e.g., Summer Sale Blast" />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Campaign Type"
                        initialValue="BROADCAST"
                    >
                        <Select>
                            <Option value="BROADCAST">Broadcast</Option>
                            <Option value="DRIP" disabled>Drip Sequence (Pro)</Option>
                            <Option value="TRIGGERED" disabled>Triggered (Pro)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="channel"
                        label="Channel"
                        initialValue="WHATSAPP"
                    >
                        <Select>
                            <Option value="WHATSAPP">WhatsApp</Option>
                            <Option value="EMAIL" disabled>Email (Coming Soon)</Option>
                            <Option value="SMS" disabled>SMS (Coming Soon)</Option>
                        </Select>
                    </Form.Item>
                </div>
            ),
        },
        {
            title: 'Audience',
            content: (
                <div className="space-y-4">
                    <Alert
                        message="Audience Selection"
                        description="For this version, all messages will be sent to the 'All Leads' segment."
                        type="info"
                        showIcon
                    />
                    <Form.Item
                        name="segmentId"
                        label="Target Segment"
                    // initialValue="all-leads" // Placeholder ID
                    >
                        <Select placeholder="Select a segment" disabled>
                            <Option value="all-leads">All Leads</Option>
                            <Option value="vip-customers">VIP Customers</Option>
                        </Select>
                    </Form.Item>
                </div>
            ),
        },
        {
            title: 'Message',
            content: (
                <div className="space-y-4">
                    <Form.Item
                        name="content"
                        label="Message Content"
                        rules={[{ required: true, message: 'Please enter message content' }]}
                        help="Variables: {{name}}, {{company}}"
                    >
                        <TextArea rows={6} placeholder="Hello {{name}}, check out our latest offers!" />
                    </Form.Item>
                    <Form.Item
                        name="scheduledAt"
                        label="Schedule (Optional)"
                    >
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" />
                    </Form.Item>
                </div>
            ),
        },
    ];

    const next = () => {
        form.validateFields()
            .then(() => {
                setCurrentStep(currentStep + 1);
            })
            .catch(() => {
                // Validation failed, stay on step
            });
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Create Campaign</h2>
                <Button onClick={() => navigate('/marketing/campaigns')}>Cancel</Button>
            </div>

            <Card>
                <Steps current={currentStep} className="mb-8">
                    {steps.map((item) => (
                        <Step key={item.title} title={item.title} />
                    ))}
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ type: 'BROADCAST', channel: 'WHATSAPP' }}
                >
                    <div className="min-h-[300px]">
                        {steps[currentStep].content}
                    </div>

                    <div className="flex justify-end pt-4 border-t mt-4 space-x-2">
                        {currentStep > 0 && (
                            <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                                Previous
                            </Button>
                        )}
                        {currentStep < steps.length - 1 && (
                            <Button type="primary" onClick={() => next()}>
                                Next
                            </Button>
                        )}
                        {currentStep === steps.length - 1 && (
                            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={createMutation.isPending}>
                                Create Campaign
                            </Button>
                        )}
                    </div>
                </Form>
            </Card>
        </div>
    );
}
