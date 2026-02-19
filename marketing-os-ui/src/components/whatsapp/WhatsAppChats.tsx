import React, { useState, useEffect, useRef } from 'react';
import { Layout, List, Typography, Button, Input, Space, Avatar, Badge, Tag, Tooltip, message as antMessage, Empty, Spin } from 'antd';
import {
    SendOutlined,
    UserOutlined,
    PhoneOutlined,
    WhatsAppOutlined,
    CheckOutlined,
    RobotOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '../../api/modules';
import axios from 'axios';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WhatsAppChats: React.FC = () => {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Fetch conversations
    const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => whatsappApi.getConversations({ limit: 20 }),
        refetchInterval: 5000, // Poll for new messages
    });

    // Fetch messages for selected conversation
    const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['messages', selectedConversationId],
        queryFn: () => whatsappApi.getMessages(selectedConversationId!),
        enabled: !!selectedConversationId,
        refetchInterval: 3000, // Poll for new messages in active chat
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: (text: string) => whatsappApi.sendMessage(selectedConversationId!, text),
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Update last message snippet
        },
        onError: (error: any) => {
            antMessage.error(`Failed to send message: ${error.message}`);
        },
    });

    // Start demo mutation
    const startDemoMutation = useMutation({
        mutationFn: (phone: string) => axios.post('http://localhost:5000/api/v1/whatsapp/demo/start', { phone }),
        onSuccess: () => {
            antMessage.success('Demo conversation started!');
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => {
            antMessage.error(`Failed to start demo: ${error.message}`);
        },
    });

    // Scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messagesData, selectedConversationId]);

    const handleSendMessage = () => {
        if (!messageText.trim() || !selectedConversationId) return;
        sendMessageMutation.mutate(messageText);
    };

    const handleStartDemo = () => {
        // For demo purposes, using a fixed phone number or prompting user
        // ideally getting from a modal, but simplifying for now
        const phone = '919605734995'; // Example phone
        startDemoMutation.mutate(phone);
    };

    const conversations = conversationsData?.data || [];
    const messages = messagesData?.data || [];
    const activeConversation = conversations.find((c: any) => c.id === selectedConversationId);

    return (
        <Layout style={{ height: 'calc(100vh - 110px)', background: '#fff' }}>
            <Sider width={350} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}><WhatsAppOutlined style={{ color: '#25D366' }} /> Chats</Title>
                    <Button type="primary" size="small" onClick={handleStartDemo} loading={startDemoMutation.isPending}>
                        Start Demo
                    </Button>
                </div>
                <div style={{ overflowY: 'auto', height: 'calc(100% - 65px)' }}>
                    {isLoadingConversations ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
                    ) : conversations.length === 0 ? (
                        <Empty description="No conversations" style={{ marginTop: '20px' }}>
                            <Button type="primary" onClick={handleStartDemo}>Start Demo Flow</Button>
                        </Empty>
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={conversations}
                            renderItem={(item: any) => (
                                <List.Item
                                    className={`conversation-item ${selectedConversationId === item.id ? 'active' : ''}`}
                                    onClick={() => setSelectedConversationId(item.id)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: selectedConversationId === item.id ? '#e6f7ff' : 'transparent',
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge count={item.unreadCount} size="small">
                                                <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
                                            </Badge>
                                        }
                                        title={
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text strong>{item.contactName || item.phoneNumber}</Text>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </Text>
                                            </div>
                                        }
                                        description={
                                            <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0, color: '#8c8c8c', fontSize: '13px' }}>
                                                {item.lastMessagePreview || 'No messages yet'}
                                            </Paragraph>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            </Sider>

            <Content style={{ display: 'flex', flexDirection: 'column' }}>
                {selectedConversationId ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', background: '#f5f5f5' }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068', marginRight: '12px' }} />
                            <div>
                                <Title level={5} style={{ margin: 0 }}>{activeConversation?.contactName || activeConversation?.phoneNumber}</Title>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <PhoneOutlined /> {activeConversation?.phoneNumber}
                                    {activeConversation?.state && <Tag style={{ marginLeft: '8px' }}>{activeConversation.state}</Tag>}
                                </Text>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <Tooltip title="AI Assistant Active">
                                    <RobotOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: '16px' }} />
                                </Tooltip>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#e5ddd5', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
                            {isLoadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {messages.map((msg: any) => {
                                        const isOutbound = msg.direction === 'OUTBOUND';
                                        return (
                                            <div
                                                key={msg.id}
                                                style={{
                                                    maxWidth: '70%',
                                                    alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        backgroundColor: isOutbound ? '#dcf8c6' : '#fff',
                                                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Text style={{ fontSize: '14px' }}>
                                                        {msg.type === 'TEXT' ? (
                                                            msg.content?.body || msg.body // Handle different structures
                                                        ) : msg.type === 'TEMPLATE' ? (
                                                            `[Template: ${msg.metadata?.templateName}]`
                                                        ) : (
                                                            `[${msg.type}]`
                                                        )}
                                                    </Text>
                                                    <div style={{ textAlign: 'right', marginTop: '4px' }}>
                                                        <Text type="secondary" style={{ fontSize: '10px' }}>
                                                            {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {isOutbound && (
                                                                <span style={{ marginLeft: '4px' }}>
                                                                    {msg.status === 'read' ? <CheckOutlined style={{ color: '#53bdeb' }} /> : <CheckOutlined style={{ color: '#aaa' }} />}
                                                                </span>
                                                            )}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '16px', background: '#f0f0f0', borderTop: '1px solid #d9d9d9' }}>
                            <Space style={{ width: '100%' }}>
                                <TextArea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onPressEnter={(e) => {
                                        if (!e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    style={{ borderRadius: '20px', padding: '8px 16px' }}
                                />
                                <Button
                                    type="primary"
                                    shape="circle"
                                    icon={<SendOutlined />}
                                    size="large"
                                    onClick={handleSendMessage}
                                    loading={sendMessageMutation.isPending}
                                />
                            </Space>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
                        <Empty description="Select a conversation to start chatting" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                )}
            </Content>
        </Layout>
    );
};

export default WhatsAppChats;
