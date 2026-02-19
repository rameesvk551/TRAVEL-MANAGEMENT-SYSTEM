import React from 'react';
import { Avatar, Button, Space, Typography, Badge } from 'antd';
import { WhatsAppOutlined, CloseOutlined } from '@ant-design/icons';
import type { IWidgetConfig } from '../../../api/widgets';

interface LivePreviewProps {
    config: IWidgetConfig;
}

const { Text } = Typography;

const LivePreview: React.FC<LivePreviewProps> = ({ config }) => {
    const {
        greetingMessage,
        btnLabel,
        brandColor,
        position,
        agents,
        showOfflineMessage,
        offlineMessage
    } = config;

    const isRight = position === 'right';

    return (
        <div style={{
            position: 'relative',
            height: '600px',
            background: '#f0f2f5',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: isRight ? 'flex-end' : 'flex-start',
            padding: 24,
            border: '1px solid #d9d9d9'
        }}>
            {/* Mock Website Content */}
            <div style={{ position: 'absolute', top: 20, left: 20, right: 20, opacity: 0.1 }}>
                <div style={{ height: 40, background: '#000', marginBottom: 20, borderRadius: 4 }}></div>
                <div style={{ height: 200, background: '#000', marginBottom: 20, borderRadius: 4 }}></div>
                <div style={{ height: 20, background: '#000', marginBottom: 10, width: '60%', borderRadius: 4 }}></div>
                <div style={{ height: 20, background: '#000', marginBottom: 10, width: '80%', borderRadius: 4 }}></div>
            </div>

            {/* Chat Box (Expanded State Mock) */}
            <div style={{
                width: 350,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 10
            }}>
                {/* Header */}
                <div style={{
                    background: brandColor,
                    padding: '16px 20px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Space>
                        <WhatsAppOutlined style={{ fontSize: 24 }} />
                        <div>
                            <Text strong style={{ color: '#fff', display: 'block' }}>Chat with us</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Typically replies instantly</Text>
                        </div>
                    </Space>
                    <CloseOutlined style={{ cursor: 'pointer' }} />
                </div>

                {/* Body */}
                <div style={{
                    padding: 20,
                    background: '#e5ddd5',
                    minHeight: 250,
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    <div style={{
                        background: '#fff',
                        padding: '8px 12px',
                        borderRadius: '0 12px 12px 12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        <Text style={{ fontSize: 14 }}>{greetingMessage}</Text>
                        <div style={{ textAlign: 'right', marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>10:00 AM</Text>
                        </div>
                    </div>

                    {showOfflineMessage && (
                        <div style={{ textAlign: 'center', margin: '10px 0' }}>
                            <span style={{ background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                                {offlineMessage}
                            </span>
                        </div>
                    )}
                </div>

                {/* Agents List (if any) */}
                {agents && agents.length > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>Team Members</Text>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {agents.map((agent, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px',
                                    background: '#f9f9f9',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    border: '1px solid #eee'
                                }}>
                                    <Space>
                                        <Badge dot status="success" offset={[-2, 28]}>
                                            <Avatar src={agent.avatarUrl} icon={!agent.avatarUrl && <WhatsAppOutlined />} />
                                        </Badge>
                                        <div>
                                            <Text strong style={{ display: 'block', fontSize: 14 }}>{agent.name}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{agent.role}</Text>
                                        </div>
                                    </Space>
                                    <WhatsAppOutlined style={{ color: '#25D366', fontSize: 20 }} />
                                </div>
                            ))}
                        </Space>
                    </div>
                )}

                {/* Footer Button */}
                <div style={{ padding: 16 }}>
                    <Button type="primary" block style={{ background: brandColor, borderColor: brandColor, height: 40, borderRadius: 20 }} icon={<WhatsAppOutlined />}>
                        Start Chat
                    </Button>
                </div>
            </div>

            {/* Launcher Button (Floating) */}
            <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: brandColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                zIndex: 10
            }}>
                <WhatsAppOutlined style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <div style={{
                background: '#fff',
                padding: '8px 16px',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginRight: isRight ? 16 : 0,
                marginLeft: !isRight ? 16 : 0,
                marginBottom: 10,
                zIndex: 10
            }}>
                <Text strong>{btnLabel}</Text>
            </div>
        </div>
    );
};

export default LivePreview;
