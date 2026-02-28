// hooks/useWhatsAppSocket.ts
// Function-based hook — connects to Socket.io, joins tenant room,
// and pushes live WhatsApp events into React Query cache.

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

/**
 * Subscribe to real-time WhatsApp events.
 *
 * @param selectedConversationId  Currently open conversation (or null).
 * @returns {{ isConnected: boolean }} connection status for UI indicator
 */
export function useWhatsAppSocket(selectedConversationId: string | null) {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId') || 'default';

        // Connect once
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WS] Connected:', socket.id);
            setIsConnected(true);
            socket.emit('join_tenant', tenantId);
        });

        // ── Incoming / outgoing message ──
        socket.on('whatsapp:message', (msg: any) => {
            // Append to messages cache for the relevant conversation
            const convId = msg.conversationId;
            queryClient.setQueryData(['messages', convId], (old: any) => {
                if (!old) return old;
                const existing = old?.data || [];
                // Deduplicate by id
                if (existing.some((m: any) => m.id === msg.id)) return old;
                return { ...old, data: [msg, ...existing] };
            });
        });

        // ── Conversation list update (new message preview, unread bump) ──
        socket.on('whatsapp:conversation_updated', (_payload: any) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        // ── Status updates (sent → delivered → read) ──
        socket.on('whatsapp:status', (update: any) => {
            const convId = update.conversationId;
            queryClient.setQueryData(['messages', convId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: (old.data || []).map((m: any) =>
                        m.id === update.messageId ? { ...m, status: update.status } : m
                    ),
                };
            });
        });

        socket.on('disconnect', (reason: string) => {
            console.log('[WS] Disconnected:', reason);
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, []); // connect once on mount

    // ── Join / leave conversation rooms for granular events ──
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !selectedConversationId) return;

        socket.emit('join_conversation', selectedConversationId);

        return () => {
            socket.emit('leave_conversation', selectedConversationId);
        };
    }, [selectedConversationId]);

    return { isConnected };
}
