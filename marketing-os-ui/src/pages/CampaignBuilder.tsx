import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, DatePicker, Card, Steps, message, Alert, InputNumber, Space, Radio, Upload, Table, Badge } from 'antd';
import { SendOutlined, PlusOutlined, MinusCircleOutlined, ClockCircleOutlined, UploadOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '../api/marketing';
import * as XLSX from 'xlsx';
import type { CreateCampaignDTO } from '../api/marketing';
import { useResponsive } from '../hooks/useResponsive';

const { Option } = Select;
const { TextArea } = Input;

export default function CampaignBuilder() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const campaignType = Form.useWatch('type', form);
    const { isMobile } = useResponsive();

    // Audience State
    const [audienceMode, setAudienceMode] = useState<'SEGMENT' | 'IMPORT' | 'MANUAL' | 'TAGS'>('SEGMENT');
    const [importedLeads, setImportedLeads] = useState<any[]>([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState<React.Key[]>([]);

    const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
        queryKey: ['crm', 'leads'],
        queryFn: marketingApi.getLeads,
        enabled: audienceMode === 'MANUAL'
    });

    const importMutation = useMutation({
        mutationFn: marketingApi.importLeads,
        onSuccess: (data) => {
            message.success(`Successfully imported ${data.leads.length} leads!`);
            // Auto-select these leads
            const ids = data.leads.map(l => l.id);
            setSelectedLeadIds(ids);
            // Move to next step or confirm?
        },
        onError: (err: any) => message.error(err.message)
    });

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            setImportedLeads(json);
            message.success(`Parsed ${json.length} rows from Excel.`);
        };
        reader.readAsBinaryString(file);
        return false; // Prevent upload
    };

    const processImport = () => {
        if (importedLeads.length === 0) return;
        // Map excel columns to expected format if needed
        // For now assume headers match or are close enough: email, phone, firstName, lastName
        const mapped = importedLeads.map((row: any) => ({
            email: row.email || row.Email || row.EMAIL,
            phone: row.phone || row.Phone || row.PHONE,
            firstName: row.firstName || row['First Name'] || row.Name?.split(' ')[0],
            lastName: row.lastName || row['Last Name'] || row.Name?.split(' ').slice(1).join(' '),
            source: 'import_campaign',
            status: 'new'
        }));
        importMutation.mutate(mapped);
    };

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
            segmentId: audienceMode === 'SEGMENT' ? values.segmentId : undefined,
            tagIds: audienceMode === 'TAGS' ? values.tags : undefined,
            content: values.content,
            scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined,
            metadata: values.channel === 'EMAIL' ? { subject: values.subject } : undefined,
            // Add selected lead IDs if mode is not SEGMENT (or even if it is and we want to override?)
            // If Audience Mode is IMPORT or MANUAL, we use selectedLeadIds
            leadIds: (audienceMode === 'IMPORT' || audienceMode === 'MANUAL') ? (selectedLeadIds as string[]) : undefined,
            steps: values.steps?.map((step: any, index: number) => ({
                stepOrder: index + 1,
                delay: step.delay || 0,
                content: step.content,
                templateId: step.templateId,
                // Pass subject in step metadata too if needed, or rely on campaign metadata
                metadata: values.channel === 'EMAIL' ? { subject: values.subject } : undefined
            })),
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
                            <Option value="DRIP">Drip Sequence (Pro)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="channel"
                        label="Channel"
                        initialValue="WHATSAPP"
                    >
                        <Select>
                            <Option value="WHATSAPP">WhatsApp</Option>
                            <Option value="EMAIL">Email</Option>
                        </Select>
                    </Form.Item>
                </div>
            ),
        },
        {
            title: 'Audience',
            content: (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded border">
                        <Radio.Group
                            value={audienceMode}
                            onChange={e => setAudienceMode(e.target.value)}
                            buttonStyle="solid"
                            className="w-full grid grid-cols-3 gap-4 text-center"
                        >
                            <Radio.Button value="TAGS" className="text-center"><TeamOutlined /> By Tags</Radio.Button>
                            <Radio.Button value="IMPORT" className="text-center"><UploadOutlined /> Import Excel</Radio.Button>
                            <Radio.Button value="MANUAL" className="text-center"><UserOutlined /> Select Leads</Radio.Button>
                        </Radio.Group>
                    </div>

                    {audienceMode === 'TAGS' && (
                        <div className="space-y-4 fade-in">
                            <Alert
                                message="Tag Selection"
                                description="Messages will be sent to all leads that have ANY of the selected tags."
                                type="info"
                                showIcon
                            />
                            <Form.Item
                                name="tags"
                                label="Select Tags"
                                rules={[{ required: true, message: 'Please select at least one tag' }]}
                            >
                                <Select mode="multiple" placeholder="Select tags">
                                    <Option value="vip">VIP</Option>
                                    <Option value="new">New</Option>
                                    <Option value="lead">Lead</Option>
                                    <Option value="customer">Customer</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    )}

                    {audienceMode === 'IMPORT' && (
                        <div className="space-y-4 fade-in">
                            <Alert
                                message="Import Leads from Excel"
                                description="Upload an .xlsx file. Columns should include: email, phone, firstName, lastName."
                                type="info"
                                showIcon
                            />
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-gray-50">
                                <Upload beforeUpload={handleFileUpload} showUploadList={false}>
                                    <Button icon={<UploadOutlined />} size="large">Select Excel File</Button>
                                </Upload>
                                {importedLeads.length > 0 && (
                                    <div className="mt-4 text-center">
                                        <Badge count={importedLeads.length} style={{ backgroundColor: '#52c41a' }} />
                                        <span className="ml-2 font-medium">Rows found</span>
                                        <div className="mt-2 text-xs text-gray-500">
                                            {JSON.stringify(importedLeads[0])}
                                        </div>
                                        <Button
                                            type="primary"
                                            className="mt-4"
                                            onClick={processImport}
                                            loading={importMutation.isPending}
                                            disabled={selectedLeadIds.length > 0}
                                        >
                                            {selectedLeadIds.length > 0 ? 'Leads Imported & Selected' : 'Process & Upload Leads'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {audienceMode === 'MANUAL' && (
                        <div className="space-y-4 fade-in">
                            <Alert
                                message="Manual Selection"
                                description="Select specific leads from your database."
                                type="info"
                                showIcon
                            />
                            <Table
                                dataSource={leadsData?.leads || []}
                                rowKey="id"
                                loading={isLoadingLeads}
                                rowSelection={{
                                    selectedRowKeys: selectedLeadIds,
                                    onChange: (keys) => setSelectedLeadIds(keys)
                                }}
                                scroll={{ y: 300 }}
                                pagination={false}
                                size="small"
                                columns={[
                                    { title: 'Name', dataIndex: 'name', key: 'name' },
                                    { title: 'Email', dataIndex: 'email', key: 'email' },
                                    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                                    { title: 'Source', dataIndex: 'source', key: 'source' },
                                ]}
                            />
                            <div className="text-right">
                                <span className="mr-2">{selectedLeadIds.length} leads selected</span>
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Message',
            content: (
                <div className="space-y-4">
                    {campaignType === 'DRIP' ? (
                        <div className="space-y-6">
                            <Alert
                                message="Drip Sequence Builder"
                                description="Define a sequence of messages. Delays are in minutes from the start of the campaign."
                                type="info"
                                showIcon
                                className="mb-4"
                            />

                            <Form.List name="steps">
                                {(fields, { add, remove }) => (
                                    <div className="space-y-4">
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <Card
                                                key={key}
                                                size="small"
                                                title={`Step ${index + 1}`}
                                                extra={<MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 cursor-pointer" />}
                                                className="bg-gray-50 border-gray-200"
                                            >
                                                <Space className="w-full mb-2" align="baseline">
                                                    <ClockCircleOutlined className="text-gray-400" />
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'delay']}
                                                        label="Delay (minutes)"
                                                        initialValue={0}
                                                        rules={[{ required: true, message: 'Missing delay' }]}
                                                        className="mb-0"
                                                    >
                                                        <InputNumber min={0} placeholder="0" />
                                                    </Form.Item>
                                                    <span className="text-gray-400 text-sm">from start</span>
                                                </Space>

                                                {/* Subject for Drip Step (Email) */}
                                                {form.getFieldValue('channel') === 'EMAIL' && (
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'subject']}
                                                        label="Subject Line"
                                                        rules={[{ required: true, message: 'Missing subject' }]}
                                                    >
                                                        <Input placeholder="Step subject..." />
                                                    </Form.Item>
                                                )}

                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'content']}
                                                    label="Message Content"
                                                    rules={[{ required: true, message: 'Missing content' }]}
                                                >
                                                    <TextArea rows={3} placeholder="Message content..." />
                                                </Form.Item>
                                            </Card>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Add Campaign Step
                                        </Button>
                                    </div>
                                )}
                            </Form.List>
                        </div>
                    ) : (
                        <>
                            {form.getFieldValue('channel') === 'EMAIL' && (
                                <Form.Item
                                    name="subject"
                                    label="Subject Line"
                                    rules={[{ required: true, message: 'Please enter a subject line' }]}
                                >
                                    <Input placeholder="Enter email subject..." />
                                </Form.Item>
                            )}
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
                        </>
                    )}
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
        <div style={{ maxWidth: isMobile ? '100%' : '48rem', margin: '0 auto' }} className="space-y-6">
            <div className="page-header">
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 'bold', letterSpacing: '-0.025em', margin: 0 }}>Create Campaign</h2>
                <Button onClick={() => navigate('/marketing/campaigns')} size={isMobile ? 'middle' : 'large'}>Cancel</Button>
            </div>

            <Card style={{ borderRadius: 12 }}>
                <Steps current={currentStep} className="mb-8" size={isMobile ? 'small' : 'default'} items={steps.map(item => ({ key: item.title, title: isMobile ? '' : item.title }))} />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ type: 'BROADCAST', channel: 'WHATSAPP', steps: [{ delay: 0, content: '' }] }}
                    onValuesChange={() => {
                        // Force re-render when channel changes to show/hide Subject
                    }}
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
