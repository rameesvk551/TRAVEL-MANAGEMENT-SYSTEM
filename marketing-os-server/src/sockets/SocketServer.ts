import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '@config/env.js';

export class SocketServer {
    private io: Server;
    private static instance: SocketServer;

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: config.socket.corsOrigin,
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.io.on('connection', (socket: Socket) => {
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

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });

        SocketServer.instance = this;
    }

    public static getInstance(): SocketServer {
        if (!SocketServer.instance) {
            throw new Error("SocketServer not initialized!");
        }
        return SocketServer.instance;
    }

    public getIO(): Server {
        return this.io;
    }

    public emitToTenant(tenantId: string, event: string, data: any): void {
        this.io.to(`tenant:${tenantId}`).emit(event, data);
    }

    public emitToUser(userId: string, event: string, data: any): void {
        this.io.to(`user:${userId}`).emit(event, data);
    }
}
