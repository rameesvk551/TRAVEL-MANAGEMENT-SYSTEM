// hooks/useChats.ts
// All state, queries, mutations and handlers for the WhatsApp chat view.

import { useState, useEffect, useRef } from 'react';
import { message as antMessage } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../services/conversationService';
import { useWhatsAppSocket } from './useWhatsAppSocket';

/* ─── colour / format helpers ─── */
const AVATAR_COLORS = [
    '#00a884', '#5b61b9', '#d4a73a', '#c74a5c', '#7a62c9',
    '#00838f', '#e65100', '#2e7d32', '#6a1b9a', '#1565c0',
];

export const pickColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const formatTime = (d: string | Date | undefined) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000 && now.getDate() === date.getDate())
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/* ─── hook ─── */
export function useChats() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    /* real-time socket */
    const { isConnected } = useWhatsAppSocket(selectedConversationId);

    /* queries (30s fallback poll — sockets handle real-time) */
    const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => conversationService.getConversations({ limit: 50 }),
        refetchInterval: 30000,
    });

    const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['messages', selectedConversationId],
        queryFn: () => conversationService.getMessages(selectedConversationId!),
        enabled: !!selectedConversationId,
        refetchInterval: 30000,
    });

    /* mutations */
    const sendMessageMutation = useMutation({
        mutationFn: (text: string) => conversationService.sendMessage(selectedConversationId!, text),
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => antMessage.error(`Failed to send: ${error.message}`),
    });

    const startDemoMutation = useMutation({
        mutationFn: () => conversationService.seedDemo(),
        onSuccess: () => {
            antMessage.success('Demo conversations loaded!');
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => antMessage.error(`Demo failed: ${error.message}`),
    });

    /* scroll to bottom on new messages */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesData, selectedConversationId]);

    /* handlers */
    const handleSend = () => {
        if (!messageText.trim() || !selectedConversationId) return;
        sendMessageMutation.mutate(messageText);
    };

    const handleStartDemo = () => startDemoMutation.mutate();

    /* derived data */
    const conversations: any[] = conversationsData?.data || [];
    const messages: any[] = (messagesData?.data || []).slice().reverse();
    const activeConv = conversations.find((c: any) => c.id === selectedConversationId);

    const filteredConversations = conversations.filter((c: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (c.displayName || c.contactName || c.phoneNumber || '').toLowerCase();
        return name.includes(q) || (c.phoneNumber || '').includes(q);
    });

    return {
        // state
        selectedConversationId,
        setSelectedConversationId,
        messageText,
        setMessageText,
        searchQuery,
        setSearchQuery,
        messagesEndRef,

        // connection
        isConnected,

        // loading
        isLoadingConversations,
        isLoadingMessages,
        isSending: sendMessageMutation.isPending,
        isDemoLoading: startDemoMutation.isPending,

        // data
        conversations,
        messages,
        activeConv,
        filteredConversations,

        // handlers
        handleSend,
        handleStartDemo,
    };
}
