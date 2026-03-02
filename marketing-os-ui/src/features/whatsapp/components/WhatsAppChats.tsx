// WhatsAppChats.tsx — pure render shell.
// All logic lives in hooks/useChats.ts

import React, { useState } from 'react';
import { Input, Avatar, Badge, Tag, Tooltip, Spin, Modal } from 'antd';
import {
    SendOutlined,
    PhoneOutlined,
    WhatsAppOutlined,
    CheckOutlined,
    RobotOutlined,
    SearchOutlined,
    SmileOutlined,
    PaperClipOutlined,
    MoreOutlined,
    MessageOutlined,
    PlusOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { useChats, pickColor, initials, formatTime } from '../hooks/useChats';

const WhatsAppChats: React.FC = () => {
    const {
        selectedConversationId, setSelectedConversationId,
        messageText, setMessageText,
        searchQuery, setSearchQuery,
        messagesEndRef,
        newChatModalOpen, setNewChatModalOpen,
        templatePickerOpen, setTemplatePickerOpen,
        isConnected,
        isLoadingConversations, isLoadingMessages, isSending, isNewChatLoading,
        isLoadingTemplates, isSendingTemplate,
        conversations, messages, activeConv, filteredConversations,
        templates,
        handleSend, handleStartNewChat, handleSendTemplate,
    } = useChats();

    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');

    const onNewChatSubmit = () => {
        if (!newChatPhone.trim()) return;
        handleStartNewChat(newChatPhone.trim(), newChatName.trim() || undefined);
        setNewChatPhone('');
        setNewChatName('');
    };

    return (
        <div style={S.root}>
            {/* ─────────── LEFT PANEL ─────────── */}
            <div style={S.leftPanel}>
                <div style={S.leftHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WhatsAppOutlined style={{ fontSize: 22, color: '#00a884' }} />
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#111b21' }}>Chats</span>
                        <Tooltip title={isConnected ? 'Live — real-time updates active' : 'Offline — using polling fallback'}>
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: isConnected ? '#00a884' : '#f5222d',
                                display: 'inline-block', marginLeft: 4,
                                boxShadow: isConnected ? '0 0 6px rgba(0,168,132,0.6)' : 'none',
                                transition: 'background 0.3s, box-shadow 0.3s',
                            }} />
                        </Tooltip>
                    </div>
                    <Tooltip title="Start New Chat">
                        <button onClick={() => setNewChatModalOpen(true)} style={S.newChatBtn}>
                            <PlusOutlined style={{ fontSize: 14 }} /> New Chat
                        </button>
                    </Tooltip>
                </div>

                <div style={S.searchWrap}>
                    <Input
                        placeholder="Search or start new chat"
                        prefix={<SearchOutlined style={{ color: '#8696a0' }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={S.searchInput}
                        allowClear
                    />
                </div>

                <div style={S.chatList}>
                    {isLoadingConversations ? (
                        <div style={S.centered}><Spin /></div>
                    ) : filteredConversations.length === 0 ? (
                        <div style={S.emptyList}>
                            <MessageOutlined style={{ fontSize: 48, color: '#8696a0', marginBottom: 12 }} />
                            <div style={{ color: '#8696a0', fontSize: 14 }}>
                                {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
                            </div>
                            {conversations.length === 0 && (
                                <button onClick={() => setNewChatModalOpen(true)} style={{ ...S.newChatBtn, marginTop: 12 }}>
                                    <PlusOutlined /> Start a Conversation
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredConversations.map((conv: any) => {
                            const name = conv.displayName || conv.contactName || conv.phoneNumber || 'Unknown';
                            const isActive = selectedConversationId === conv.id;
                            const color = pickColor(name);
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversationId(conv.id)}
                                    style={{ ...S.chatItem, background: isActive ? '#f0f2f5' : 'transparent' }}
                                >
                                    <Badge count={conv.unreadCount} size="small" offset={[-4, 4]}>
                                        <Avatar size={49} style={{ backgroundColor: color, fontSize: 16, fontWeight: 600, flexShrink: 0 }}>
                                            {initials(name)}
                                        </Avatar>
                                    </Badge>
                                    <div style={S.chatMeta}>
                                        <div style={S.chatMetaTop}>
                                            <span style={S.chatName}>{name}</span>
                                            <span style={{ ...S.chatTime, color: conv.unreadCount ? '#00a884' : '#8696a0' }}>
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div style={S.chatPreview}>{conv.lastMessagePreview || 'No messages yet'}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─────────── RIGHT PANEL ─────────── */}
            <div style={S.rightPanel}>
                {selectedConversationId && activeConv ? (
                    <>
                        <div style={S.chatHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <Avatar size={40} style={{ backgroundColor: pickColor(activeConv.displayName || activeConv.contactName || activeConv.phoneNumber || '?'), fontWeight: 600 }}>
                                    {initials(activeConv.displayName || activeConv.contactName || activeConv.phoneNumber || '?')}
                                </Avatar>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 16, color: '#111b21' }}>
                                        {activeConv.displayName || activeConv.contactName || activeConv.phoneNumber}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8696a0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <PhoneOutlined /> {activeConv.phoneNumber}
                                        {activeConv.state && (
                                            <Tag color={activeConv.state === 'ESCALATED' ? 'red' : activeConv.state === 'COLLECTING_INFO' ? 'blue' : 'default'}
                                                style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>
                                                {activeConv.state}
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <Tooltip title="AI Bot Active">
                                    <RobotOutlined style={{ fontSize: 20, color: '#00a884', cursor: 'pointer' }} />
                                </Tooltip>
                                <MoreOutlined style={{ fontSize: 20, color: '#54656f', cursor: 'pointer' }} />
                            </div>
                        </div>

                        <div style={S.messagesArea}>
                            {isLoadingMessages ? (
                                <div style={S.centered}><Spin /></div>
                            ) : messages.length === 0 ? (
                                <div style={S.centered}>
                                    <div style={{ textAlign: 'center', color: '#8696a0' }}>
                                        <WhatsAppOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                                        <div>No messages yet. Send one below!</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
                                    {messages.map((msg: any) => {
                                        const isOut = msg.direction === 'OUTBOUND';
                                        const msgType = msg.messageType || msg.type || 'TEXT';
                                        const body = (msgType === 'TEXT' || msgType === 'text')
                                            ? (msg.textContent?.body || msg.content?.body || msg.textBody || msg.body || '')
                                            : (msgType === 'TEMPLATE' || msgType === 'template')
                                                ? `📋 Template: ${msg.templateContent?.templateName || msg.metadata?.templateName || 'Unknown'}`
                                                : `📎 ${msgType}`;
                                        return (
                                            <div key={msg.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
                                                <div style={{
                                                    ...S.bubble,
                                                    backgroundColor: isOut ? '#d9fdd3' : '#fff',
                                                    borderTopLeftRadius: isOut ? 8 : 0,
                                                    borderTopRightRadius: isOut ? 0 : 8,
                                                }}>
                                                    <div style={{ fontSize: 14, color: '#111b21', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {body}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                        <span style={{ fontSize: 11, color: '#8696a0' }}>
                                                            {formatTime(msg.timestamp || msg.createdAt || msg.providerTimestamp)}
                                                        </span>
                                                        {isOut && (
                                                            <span>
                                                                {msg.status === 'READ' || msg.status === 'read'
                                                                    ? <CheckOutlined style={{ fontSize: 12, color: '#53bdeb' }} />
                                                                    : <CheckOutlined style={{ fontSize: 12, color: '#8696a0' }} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div style={S.inputArea}>
                            <SmileOutlined style={{ fontSize: 24, color: '#8696a0', cursor: 'pointer', flexShrink: 0 }} />
                            <PaperClipOutlined style={{ fontSize: 24, color: '#8696a0', cursor: 'pointer', flexShrink: 0 }} />
                            <Tooltip title="Send Template">
                                <FileTextOutlined
                                    onClick={() => setTemplatePickerOpen(true)}
                                    style={{ fontSize: 24, color: '#8696a0', cursor: 'pointer', flexShrink: 0, transition: 'color 0.2s' }}
                                />
                            </Tooltip>
                            <input
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Type a message"
                                style={S.textInput}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!messageText.trim() || isSending}
                                style={{ ...S.sendBtn, opacity: messageText.trim() ? 1 : 0.5 }}
                            >
                                <SendOutlined style={{ fontSize: 20, color: '#fff' }} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={S.emptyState}>
                        <div style={S.emptyStateInner}>
                            <div style={S.emptyIcon}>
                                <WhatsAppOutlined style={{ fontSize: 64, color: '#00a884' }} />
                            </div>
                            <h2 style={{ fontSize: 28, fontWeight: 300, color: '#41525d', margin: '24px 0 12px' }}>
                                WhatsApp Conversations
                            </h2>
                            <p style={{ fontSize: 14, color: '#8696a0', maxWidth: 460, textAlign: 'center', lineHeight: 1.6 }}>
                                Send and receive messages from your customers. Select a conversation
                                from the list to start chatting, or click <b>+ New Chat</b> to start a new conversation.
                            </p>
                            <div style={{ width: 400, height: 1, background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)', margin: '24px 0' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8696a0', fontSize: 13 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00a884' }} />
                                End-to-end encrypted
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─────────── NEW CHAT MODAL ─────────── */}
            <Modal
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><WhatsAppOutlined style={{ color: '#00a884' }} /> New Conversation</span>}
                open={newChatModalOpen}
                onCancel={() => { setNewChatModalOpen(false); setNewChatPhone(''); setNewChatName(''); }}
                onOk={onNewChatSubmit}
                okText={isNewChatLoading ? 'Creating...' : 'Start Chat'}
                okButtonProps={{ disabled: !newChatPhone.trim() || isNewChatLoading, style: { background: '#00a884', borderColor: '#00a884' } }}
                destroyOnClose
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
                    <div>
                        <label style={{ fontWeight: 600, fontSize: 13, color: '#111b21', display: 'block', marginBottom: 6 }}>
                            Phone Number <span style={{ color: '#f5222d' }}>*</span>
                        </label>
                        <Input
                            placeholder="e.g. +91 98765 43210"
                            prefix={<PhoneOutlined style={{ color: '#8696a0' }} />}
                            value={newChatPhone}
                            onChange={(e) => setNewChatPhone(e.target.value)}
                            onPressEnter={onNewChatSubmit}
                            size="large"
                            style={{ borderRadius: 8 }}
                        />
                        <div style={{ fontSize: 12, color: '#8696a0', marginTop: 4 }}>
                            Include country code (e.g. +91 for India)
                        </div>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, fontSize: 13, color: '#111b21', display: 'block', marginBottom: 6 }}>
                            Contact Name <span style={{ color: '#8696a0', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <Input
                            placeholder="e.g. John Doe"
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            onPressEnter={onNewChatSubmit}
                            size="large"
                            style={{ borderRadius: 8 }}
                        />
                    </div>
                </div>
            </Modal>

            {/* ─────────── TEMPLATE PICKER MODAL ─────────── */}
            <Modal
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileTextOutlined style={{ color: '#00a884' }} /> Send Template Message</span>}
                open={templatePickerOpen}
                onCancel={() => setTemplatePickerOpen(false)}
                footer={null}
                destroyOnClose
                width={520}
            >
                <div style={{ padding: '8px 0' }}>
                    <p style={{ color: '#8696a0', fontSize: 13, marginBottom: 16 }}>
                        Select an approved template to send. Templates allow you to start conversations without opt-in.
                    </p>
                    {isLoadingTemplates ? (
                        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                    ) : templates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: '#8696a0' }}>
                            <FileTextOutlined style={{ fontSize: 40, marginBottom: 8 }} />
                            <div>No approved templates found</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Create and approve templates in the Templates tab</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                            {templates.map((tpl: any) => (
                                <div
                                    key={tpl.id}
                                    onClick={() => !isSendingTemplate && handleSendTemplate(tpl.template_name || tpl.templateName, tpl.language)}
                                    style={{
                                        padding: '12px 16px', borderRadius: 8, border: '1px solid #e9edef',
                                        cursor: isSendingTemplate ? 'wait' : 'pointer', transition: 'all 0.2s',
                                        background: '#fff',
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f0f9f4'; (e.currentTarget as HTMLDivElement).style.borderColor = '#00a884'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fff'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e9edef'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 600, color: '#111b21', fontSize: 14 }}>
                                            {tpl.template_name || tpl.templateName}
                                        </span>
                                        <Tag color="green" style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>
                                            {tpl.language || 'en'}
                                        </Tag>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#667781', lineHeight: 1.4 }}>
                                        {tpl.body_content || tpl.bodyContent || 'No preview available'}
                                    </div>
                                    {tpl.category && (
                                        <Tag style={{ marginTop: 6, fontSize: 10 }}>{tpl.category}</Tag>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

/* ── STYLES ── */
const S: Record<string, React.CSSProperties> = {
    root: { display: 'flex', height: 'calc(100vh - 180px)', minHeight: 500, background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e9edef' },
    leftPanel: { width: 340, minWidth: 300, borderRight: '1px solid #e9edef', display: 'flex', flexDirection: 'column', background: '#fff' },
    leftHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', height: 59, background: '#f0f2f5' },
    searchWrap: { padding: '8px 12px', background: '#f0f2f5' },
    searchInput: { borderRadius: 8, border: 'none', background: '#fff', height: 35 },
    chatList: { flex: 1, overflowY: 'auto' as const },
    chatItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5', transition: 'background 0.15s' },
    chatMeta: { flex: 1, minWidth: 0 },
    chatMetaTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
    chatName: { fontSize: 16, fontWeight: 500, color: '#111b21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    chatTime: { fontSize: 12, flexShrink: 0, marginLeft: 8 },
    chatPreview: { fontSize: 13, color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    emptyList: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 },
    rightPanel: {
        flex: 1, display: 'flex', flexDirection: 'column' as const, background: '#efeae2', position: 'relative' as const,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z\' fill=\'%23d6cec2\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
    },
    chatHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', height: 59, background: '#f0f2f5', borderBottom: '1px solid #e0e0e0' },
    messagesArea: { flex: 1, overflowY: 'auto' as const, padding: '16px 60px' },
    bubble: { maxWidth: '65%', padding: '6px 8px 4px 9px', borderRadius: 8, boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)' },
    inputArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#f0f2f5' },
    textInput: { flex: 1, border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 15, outline: 'none', background: '#fff', color: '#111b21' },
    sendBtn: { width: 42, height: 42, borderRadius: '50%', border: 'none', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s' },
    newChatBtn: { padding: '5px 14px', borderRadius: 6, border: 'none', background: '#00a884', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
    emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' },
    emptyStateInner: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
    emptyIcon: { width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #e8f8e8 0%, #d5f5e3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' },
};

export default WhatsAppChats;
