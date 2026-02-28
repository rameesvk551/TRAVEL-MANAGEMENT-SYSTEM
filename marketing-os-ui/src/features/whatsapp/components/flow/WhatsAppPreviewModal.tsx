import React from 'react';
import { Modal, Button, Avatar, Typography, Space, Card, Divider } from 'antd';
import {
    ArrowLeftOutlined,
    MoreOutlined,
    PhoneOutlined,
    VideoCameraOutlined,
    UserOutlined,
    SmileOutlined,
    AudioOutlined,
    PlusOutlined,
    CameraOutlined,
    CheckOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface WhatsAppPreviewModalProps {
    visible: boolean;
    onClose: () => void;
    data: any;
    nodeType: string;
}

const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({ visible, onClose, data, nodeType }) => {

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessageContent = () => {
        switch (nodeType) {
            case 'message':
            case 'start': // Often start node has a welcome message
                return (
                    <div style={{ padding: '4px 0' }}>
                        {data.mediaUrl && (
                            <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={data.mediaUrl} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        )}
                        <Text style={{ fontSize: '14px', color: '#111b21', whiteSpace: 'pre-wrap' }}>
                            {data.text || data.label || "Hello! How can we help you today?"}
                        </Text>
                    </div>
                );

            case 'buttons':
                return (
                    <div style={{ padding: '4px 0' }}>
                        {data.mediaUrl && (
                            <div style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={data.mediaUrl} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        )}
                        <Text style={{ fontSize: '14px', color: '#111b21', whiteSpace: 'pre-wrap', display: 'block', marginBottom: '8px' }}>
                            {data.text || "Please select an option:"}
                        </Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            {(data.buttons || []).map((btn: string, idx: number) => (
                                <div key={idx} style={{
                                    background: '#fff',
                                    color: '#00a884',
                                    textAlign: 'center',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    fontWeight: 500,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    cursor: 'pointer'
                                }}>
                                    {btn}
                                </div>
                            ))}
                            {(!data.buttons || data.buttons.length === 0) && (
                                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>[Buttons will appear here]</Text>
                            )}
                        </div>
                    </div>
                );

            case 'product_carousel':
                return (
                    <div style={{ padding: '4px 0' }}>
                        <Text style={{ fontSize: '14px', color: '#111b21', marginBottom: '8px', display: 'block' }}>
                            {data.message_template || "Check out these products:"}
                        </Text>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginTop: '8px' }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} style={{
                                    width: '140px',
                                    flexShrink: 0,
                                    border: '1px solid #e9edef',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    background: '#fff'
                                }}>
                                    <div style={{ height: '100px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '24px' }}>🛍️</div>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>Product Name {i}</div>
                                        <div style={{ fontSize: '12px', color: '#54656f' }}>$99.99</div>
                                        <div style={{ marginTop: '8px', padding: '6px', textAlign: 'center', border: '1px solid #e9edef', borderRadius: '4px', fontSize: '12px', color: '#00a884', fontWeight: 500 }}>
                                            View
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return (
                    <Text style={{ fontSize: '14px', color: '#111b21' }}>
                        Preview not available for this node type ({nodeType}).
                    </Text>
                );
        }
    };

    return (
        <Modal
            title="WhatsApp Preview"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={400}
            centered
            bodyStyle={{ padding: 0, height: '650px', overflow: 'hidden', borderRadius: '0 0 8px 8px' }}
            styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
        >
            <div style={{
                height: '100%',
                background: '#efeae2',
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundRepeat: 'repeat',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ background: '#008069', padding: '10px 16px', display: 'flex', alignItems: 'center', color: '#fff' }}>
                    <ArrowLeftOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
                    <Avatar icon={<UserOutlined />} style={{ marginRight: '10px' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '16px', lineHeight: '1.2' }}>My Business</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Business Account</div>
                    </div>
                    <Space size={20}>
                        <VideoCameraOutlined style={{ fontSize: '18px' }} />
                        <PhoneOutlined style={{ fontSize: '18px' }} />
                        <MoreOutlined style={{ fontSize: '18px' }} />
                    </Space>
                </div>

                {/* Date Bubble */}
                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                    <span style={{
                        background: '#fff',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#54656f',
                        textTransform: 'uppercase'
                    }}>
                        Today
                    </span>
                </div>

                {/* Message Area */}
                <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
                    {/* Incoming Message (Business) */}
                    <div style={{ display: 'flex', marginBottom: '12px' }}>
                        <div style={{
                            background: '#fff',
                            padding: nodeType === 'product_carousel' ? '8px' : '8px 10px',
                            borderRadius: '0 12px 12px 12px',
                            maxWidth: '85%',
                            boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                            position: 'relative'
                        }}>
                            {/* Node Content */}
                            {renderMessageContent()}

                            {/* Metadata */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                marginTop: '4px',
                                gap: '4px'
                            }}>
                                <span style={{ fontSize: '11px', color: '#8696a0' }}>{getCurrentTime()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mock User Reply */}
                    {(nodeType === 'buttons' || nodeType === 'message') && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', opacity: 0.5 }}>
                            <div style={{
                                background: '#d9fdd3',
                                padding: '6px 10px',
                                borderRadius: '12px 0 12px 12px',
                                maxWidth: '85%',
                                boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                            }}>
                                <Text style={{ fontSize: '14px', color: '#111b21' }}>User reply...</Text>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    marginTop: '2px',
                                    gap: '4px'
                                }}>
                                    <span style={{ fontSize: '11px', color: '#8696a0' }}>{getCurrentTime()}</span>
                                    <CheckOutlined style={{ fontSize: '14px', color: '#53bdeb' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{ background: '#f0f2f5', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SmileOutlined style={{ fontSize: '24px', color: '#54656f' }} />
                    <PlusOutlined style={{ fontSize: '24px', color: '#54656f' }} />
                    <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
                        <Text style={{ color: '#8696a0', fontSize: '15px' }}>Type a message</Text>
                    </div>
                    <CameraOutlined style={{ fontSize: '24px', color: '#54656f' }} />
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#00a884',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AudioOutlined style={{ fontSize: '20px', color: '#fff' }} />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default WhatsAppPreviewModal;
