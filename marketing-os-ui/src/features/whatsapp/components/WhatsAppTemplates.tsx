// WhatsAppTemplates.tsx — pure render shell.
// All logic lives in hooks/useTemplates.ts

import React from 'react';
import {
    Button, Form, Input, Select, Typography,
    Card, Tooltip, Row, Col, Badge, Empty, Drawer, Space, Avatar,
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, SendOutlined,
    FileTextOutlined, GlobalOutlined, AppstoreOutlined,
    SyncOutlined, UserOutlined,
} from '@ant-design/icons';
import { useTemplates, getStatusColor, formatWhatsAppBody } from '../hooks/useTemplates';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const WhatsAppTemplates: React.FC = () => {
    const {
        form, isDrawerVisible, setIsDrawerVisible,
        sampleValues, setSampleValues,
        headerContent, bodyContent, footerContent, buttonsContent, detectedVariables,
        templates, isLoading,
        isCreating, isSyncing,
        handleCreate, handleDelete, handleSubmit, handleSync, closeDrawer,
    } = useTemplates();

    /* ── render helper for body with variables ── */
    const renderBody = (text: string) => {
        const parts = formatWhatsAppBody(text, sampleValues);
        if (!parts) return <Text type="secondary" italic>Your message will appear here...</Text>;
        return parts.map((p) => {
            if (p.isVar) {
                if (p.value) return <span key={p.key} style={{ fontWeight: 500 }}>{p.value}</span>;
                return (
                    <span key={p.key} style={{ background: '#e0f2fe', color: '#0284c7', padding: '1px 4px', borderRadius: 4, fontWeight: 600, fontSize: 13, margin: '0 2px' }}>
                        {p.raw}
                    </span>
                );
            }
            return <span key={p.key}>{p.text}</span>;
        });
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Message Templates</Title>
                    <Text type="secondary">Create and manage your WhatsApp message templates for campaigns</Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button icon={<SyncOutlined />} onClick={handleSync} loading={isSyncing} size="large" style={{ borderRadius: 8 }}>Sync Status</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsDrawerVisible(true)} size="large" style={{ borderRadius: 8 }}>New Template</Button>
                </div>
            </div>

            {/* ── Template grid ── */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Loading templates...</Text></div>
            ) : templates.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>No templates found. <a onClick={() => setIsDrawerVisible(true)}>Create one now</a></span>} />
            ) : (
                <Row gutter={[24, 24]}>
                    {templates.map((template: any) => {
                        let safeComponents: any[] = [];
                        try {
                            safeComponents = typeof template.components === 'string' ? JSON.parse(template.components) : (template.components || []);
                        } catch { /* ignore */ }

                        return (
                            <Col xs={24} sm={12} lg={8} key={template.id}>
                                <Badge.Ribbon text={template.status} color={getStatusColor(template.status) === 'processing' ? 'gold' : getStatusColor(template.status) === 'default' ? 'purple' : getStatusColor(template.status)}>
                                    <Card
                                        hoverable
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid #f0f0f0' }}
                                        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 20 } }}
                                        actions={[
                                            <Tooltip title="View Details"><FileTextOutlined key="view" /></Tooltip>,
                                            template.status === 'DRAFT' ? (
                                                <Tooltip title="Submit for Approval"><SendOutlined key="submit" onClick={() => handleSubmit(template.id)} /></Tooltip>
                                            ) : <span key="placeholder" />,
                                            <Tooltip title="Delete"><DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(template.id)} /></Tooltip>,
                                        ]}
                                    >
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Title level={5} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{template.name}</Title>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <AppstoreOutlined /> {template.category} • <GlobalOutlined /> {template.language}
                                            </Text>
                                        </div>

                                        {/* WhatsApp-style card preview */}
                                        <div style={{ background: '#e5ddd5', padding: 12, borderRadius: 8, flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: 8 }}>
                                            <div style={{ background: 'white', padding: '12px', borderRadius: '0 8px 8px 8px', fontSize: 13, color: '#111', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
                                                {safeComponents.find((c: any) => c.type === 'HEADER') && (
                                                    <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
                                                        {safeComponents.find((c: any) => c.type === 'HEADER')?.format === 'TEXT'
                                                            ? safeComponents.find((c: any) => c.type === 'HEADER')?.text
                                                            : <Text type="secondary" italic>[Media Header: {safeComponents.find((c: any) => c.type === 'HEADER')?.format}]</Text>}
                                                    </div>
                                                )}
                                                <Paragraph ellipsis={{ rows: 5, expandable: false, symbol: '...' }} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                    {safeComponents.find((c: any) => c.type === 'BODY')?.text || <Text type="secondary" italic>No content</Text>}
                                                </Paragraph>
                                                {safeComponents.find((c: any) => c.type === 'FOOTER') && (
                                                    <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{safeComponents.find((c: any) => c.type === 'FOOTER')?.text}</div>
                                                )}
                                            </div>
                                            {safeComponents.find((c: any) => c.type === 'BUTTONS') && (
                                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    {safeComponents.find((c: any) => c.type === 'BUTTONS')?.buttons?.slice(0, 3).map((btn: any, idx: number) => (
                                                        <div key={idx} style={{ background: 'white', padding: '8px', borderRadius: 8, textAlign: 'center', color: '#00a884', fontWeight: 500, fontSize: 13, boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
                                                            {btn.type === 'URL' && <GlobalOutlined style={{ marginRight: 6 }} />}
                                                            {btn.type === 'PHONE_NUMBER' && <span style={{ marginRight: 6 }}>📞</span>}
                                                            {btn.text}
                                                        </div>
                                                    ))}
                                                    {safeComponents.find((c: any) => c.type === 'BUTTONS')?.buttons?.length > 3 && (
                                                        <div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginTop: 2 }}>+ {safeComponents.find((c: any) => c.type === 'BUTTONS').buttons.length - 3} more buttons</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </Badge.Ribbon>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* ── Create Template Drawer ── */}
            <Drawer
                title={<div style={{ fontSize: 18, fontWeight: 600 }}>Create New Message Template</div>}
                width={900}
                onClose={closeDrawer}
                open={isDrawerVisible}
                destroyOnClose
                styles={{ body: { padding: 0 } }}
                footer={
                    <div style={{ textAlign: 'right', padding: '12px 0' }}>
                        <Space>
                            <Button onClick={closeDrawer} size="large" style={{ borderRadius: 8 }}>Cancel</Button>
                            <Button onClick={handleCreate} type="primary" loading={isCreating} size="large" style={{ borderRadius: 8 }}>Save Template</Button>
                        </Space>
                    </div>
                }
            >
                <div style={{ display: 'flex', height: '100%' }}>
                    {/* Left Side: Form */}
                    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                        <Form form={form} layout="vertical" initialValues={{ language: 'en_US', category: 'UTILITY' }}>
                            <Form.Item name="name" label={<span style={{ fontWeight: 500 }}>Template Name</span>} rules={[{ required: true }, { pattern: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers and underscores allowed' }]} help="Unique name for your template (e.g. welcome_offer_v1)">
                                <Input placeholder="welcome_message" size="large" style={{ borderRadius: 8 }} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="category" label={<span style={{ fontWeight: 500 }}>Category</span>} rules={[{ required: true }]}>
                                        <Select size="large" style={{ borderRadius: 8 }}>
                                            <Option value="MARKETING">Marketing</Option>
                                            <Option value="UTILITY">Utility</Option>
                                            <Option value="AUTHENTICATION">Authentication</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="language" label={<span style={{ fontWeight: 500 }}>Language</span>} rules={[{ required: true }]}>
                                        <Select size="large" style={{ borderRadius: 8 }}>
                                            <Option value="en_US">English (US)</Option>
                                            <Option value="es">Spanish</Option>
                                            <Option value="fr">French</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="body" label={<span style={{ fontWeight: 500 }}>Message Content</span>} rules={[{ required: true }]} help={<span>Use <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code> for your customized dynamic variables.</span>}>
                                <TextArea rows={8} placeholder="Hello {{1}}, check out our latest offers at {{2}}!" style={{ borderRadius: 8, fontSize: 15, padding: 12 }} />
                            </Form.Item>

                            {detectedVariables.length > 0 && (
                                <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>Test Dynamic Variables</Title>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Enter sample values below to see how they look in the preview.</Text>
                                    <Row gutter={[16, 16]}>
                                        {detectedVariables.map((varNum) => (
                                            <Col span={12} key={varNum}>
                                                <div>
                                                    <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Variable <code>{`{{${varNum}}}`}</code></div>
                                                    <Input
                                                        placeholder={`Sample for {{${varNum}}}`}
                                                        value={sampleValues[varNum] || ''}
                                                        onChange={(e) => setSampleValues({ ...sampleValues, [varNum]: e.target.value })}
                                                        style={{ borderRadius: 6 }}
                                                    />
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            <Title level={5} style={{ marginTop: 32, marginBottom: 16 }}>Advanced Components</Title>

                            <Form.Item name="header" label={<span style={{ fontWeight: 500 }}>Header (Optional)</span>}>
                                <Input placeholder="Brief text to appear at the top" maxLength={60} size="large" style={{ borderRadius: 8 }} />
                            </Form.Item>

                            <Form.Item name="footer" label={<span style={{ fontWeight: 500 }}>Footer (Optional)</span>}>
                                <Input placeholder="Brief text to appear at the bottom" maxLength={60} size="large" style={{ borderRadius: 8 }} />
                            </Form.Item>

                            <div style={{ marginBottom: 16, fontWeight: 500 }}>Buttons (Optional, max 3)</div>
                            <Form.List name="buttons">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                                                <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true }]} style={{ margin: 0, width: 140 }}>
                                                    <Select placeholder="Type" size="large" style={{ borderRadius: 8 }}>
                                                        <Option value="URL">URL</Option>
                                                        <Option value="PHONE_NUMBER">Phone</Option>
                                                        <Option value="QUICK_REPLY">Quick Reply</Option>
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item {...restField} name={[name, 'text']} rules={[{ required: true }]} style={{ margin: 0, flex: 1 }}>
                                                    <Input placeholder="Button Text (max 20)" maxLength={20} size="large" style={{ borderRadius: 8 }} />
                                                </Form.Item>
                                                <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.buttons?.[name]?.type !== currentValues.buttons?.[name]?.type}>
                                                    {({ getFieldValue }) => {
                                                        const type = getFieldValue(['buttons', name, 'type']);
                                                        if (type === 'QUICK_REPLY') return null;
                                                        return (
                                                            <Form.Item {...restField} name={[name, 'value']} rules={[{ required: true, message: 'Required' }]} style={{ margin: 0, flex: 1.5 }}>
                                                                <Input placeholder={type === 'URL' ? "https://example.com" : "+1234567890"} size="large" style={{ borderRadius: 8 }} />
                                                            </Form.Item>
                                                        );
                                                    }}
                                                </Form.Item>
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} style={{ marginTop: 4 }} />
                                            </div>
                                        ))}
                                        {fields.length < 3 && (
                                            <Form.Item>
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large" style={{ borderRadius: 8 }}>Add Action Button</Button>
                                            </Form.Item>
                                        )}
                                    </>
                                )}
                            </Form.List>
                        </Form>
                    </div>

                    {/* Right Side: WhatsApp Preview */}
                    <div style={{
                        width: 380, background: '#efeae2', borderLeft: '1px solid #e0e0e0',
                        display: 'flex', flexDirection: 'column', position: 'relative',
                        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                        backgroundSize: '300px',
                    }}>
                        <div style={{ background: '#075e54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 10 }}>
                            <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#128C7E' }} />
                            <div>
                                <div style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Live Preview</div>
                                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>WhatsApp Chat</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <span style={{ background: '#e1f3fb', color: '#555', padding: '4px 12px', borderRadius: 16, fontSize: 12, boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>Today</span>
                            </div>

                            <div style={{ maxWidth: '90%', alignSelf: 'flex-end', position: 'relative' }}>
                                <div style={{
                                    background: '#dcf8c6', padding: '8px 12px',
                                    borderRadius: buttonsContent.length > 0 ? '8px 8px 0 0' : '8px 8px 0px 8px',
                                    boxShadow: buttonsContent.length > 0 ? 'none' : '0 1px 2px rgba(0,0,0,0.15)',
                                    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                                }}>
                                    <div style={{ position: 'absolute', right: -8, top: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 8px 8px 0', borderColor: 'transparent #dcf8c6 transparent transparent' }} />
                                    {headerContent && <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>{headerContent}</div>}
                                    <div style={{ fontSize: 14, color: '#111', lineHeight: '1.4' }}>{renderBody(bodyContent)}</div>
                                    {footerContent && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>{footerContent}</div>}
                                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textAlign: 'right', marginTop: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <svg viewBox="0 0 16 15" width="16" height="15" fill="none">
                                            <path d="M15.01 3.316l-8.558 8.558-4.665-4.665m9.375 4.665l4.665-4.665" stroke="#4FC3A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {buttonsContent.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '0 0 8px 8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                                        {buttonsContent.map((btn: any, idx: number) => (
                                            <div key={idx} style={{ background: 'white', padding: '10px 12px', textAlign: 'center', color: '#00a884', fontWeight: 500, fontSize: 14, borderTop: '1px solid #e8e8e8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {btn.type === 'URL' && <GlobalOutlined />}
                                                {btn.type === 'PHONE_NUMBER' && <span>📞</span>}
                                                {btn.type === 'QUICK_REPLY' && <span>↩</span>}
                                                {btn.text || 'Action Button'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Drawer>
        </div>
    );
};

export default WhatsAppTemplates;
