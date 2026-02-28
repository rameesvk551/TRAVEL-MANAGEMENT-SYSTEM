// sockets/SocketServer.ts
// Function-based Socket.io server — no classes

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '@config/env.js';

let io: Server | null = null;

/**
 * Initialise Socket.io on the given HTTP server.
 * Call once at startup — subsequent calls return the existing instance.
 */
export function initSocketServer(httpServer: HttpServer): Server {
    if (io) return io;

    io = new Server(httpServer, {
        cors: {
            origin: config.socket.corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on('join_tenant', (tenantId: string) => {
            if (tenantId) {
                socket.join(`tenant:${tenantId}`);
                console.log(`Socket ${socket.id} joined tenant:${tenantId}`);
            }
        });

        socket.on('join_user', (userId: string) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined user:${userId}`);
            }
        });

        // WhatsApp: join/leave a conversation room for real-time chat
        socket.on('join_conversation', (conversationId: string) => {
            if (conversationId) {
                socket.join(`conversation:${conversationId}`);
            }
        });

        socket.on('leave_conversation', (conversationId: string) => {
            if (conversationId) {
                socket.leave(`conversation:${conversationId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

/** Get the Socket.io Server instance (must call initSocketServer first). */
export function getIO(): Server {
    if (!io) throw new Error('SocketServer not initialised! Call initSocketServer() first.');
    return io;
}

/** Emit an event to every socket in a tenant room. */
export function emitToTenant(tenantId: string, event: string, data: any): void {
    if (!io) return;
    io.to(`tenant:${tenantId}`).emit(event, data);
}

/** Emit an event to a specific user room. */
export function emitToUser(userId: string, event: string, data: any): void {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
}

/** Emit an event to a specific conversation room. */
export function emitToConversation(conversationId: string, event: string, data: any): void {
    if (!io) return;
    io.to(`conversation:${conversationId}`).emit(event, data);
}
