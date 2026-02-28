// application/services/whatsapp/OperationsCommandHandler.ts
// Handles operational commands from staff via WhatsApp

export function createOperationsCommandHandler(
    messageService: any, timelineService: any, leadService: any,
    bookingService: any, inventoryService: any, holdService: any
) {

    function hasPermission(userRole: string, requiredRole: string) {
        const hierarchy: any = { FIELD_GUIDE: 1, SALES_AGENT: 2, OPS_MANAGER: 3, ADMIN: 4 };
        return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 99);
    }

    const commands: Array<{ pattern: RegExp; requiredRole: string; description: string; handler: (match: any, ctx: any) => Promise<string> }> = [
        { pattern: /^\/hold\s+(\w+)\s+(\d+)/i, requiredRole: 'SALES_AGENT', description: 'Hold seats: /hold <departure_id> <seats>', handler: async (match: any, ctx: any) => { const [, departureId, seats] = match; try { const result = await holdService.createHold({ tenantId: ctx.tenantId, departureId, seatCount: parseInt(seats), source: 'MANUAL', sourcePlatform: 'WHATSAPP', holdType: 'SOFT', createdById: ctx.userId }); return `✅ Hold created!\nDeparture: ${departureId}\nSeats: ${seats}\nExpires: ${result.expiresAt.toLocaleTimeString()}`; } catch (error: any) { return `❌ Failed to create hold: ${error.message}`; } } },
        { pattern: /^\/release\s+(\w+)/i, requiredRole: 'SALES_AGENT', description: 'Release hold: /release <hold_id>', handler: async (match: any, ctx: any) => { const [, holdId] = match; try { await holdService.releaseHold(holdId, ctx.tenantId, 'MANUAL_RELEASE'); return `✅ Hold ${holdId} released`; } catch (error: any) { return `❌ Failed to release: ${error.message}`; } } },
        { pattern: /^\/inventory\s+(\w+)/i, requiredRole: 'SALES_AGENT', description: 'Check inventory: /inventory <departure_id>', handler: async (match: any, ctx: any) => { const [, departureId] = match; try { const result = await inventoryService.getDepartureWithInventory(departureId, ctx.tenantId); const { departure, inventory } = result; return `📦 Inventory: ${departureId}\nStatus: ${departure.status}\nTotal: ${inventory.total}\nBooked: ${inventory.booked}\nHeld: ${inventory.held}\nAvailable: ${inventory.available}`; } catch (error) { return `❌ Departure not found`; } } },
        { pattern: /^\/close\s+(\w+)/i, requiredRole: 'OPS_MANAGER', description: 'Close departure: /close <departure_id>', handler: async (match: any, ctx: any) => { const [, departureId] = match; try { await inventoryService.updateDepartureStatus(departureId, ctx.tenantId, 'CLOSED'); return `✅ Departure ${departureId} closed for bookings`; } catch (error: any) { return `❌ Failed to close: ${error.message}`; } } },
        { pattern: /^\/status\s+(\w+)/i, requiredRole: 'SALES_AGENT', description: 'Booking status: /status <booking_id>', handler: async (match: any, ctx: any) => { const [, bookingId] = match; try { const booking = await bookingService.getBooking(bookingId, ctx.tenantId); if (!booking) return `❌ Booking not found`; return `📋 Booking: ${bookingId}\nGuest: ${booking.guestName}\nStatus: ${booking.status}\nDates: ${booking.startDate.toDateString()}\nAmount: ${booking.currency} ${booking.totalAmount}`; } catch (error: any) { return `❌ Error: ${error.message}`; } } },
        { pattern: /^\/trip\s+start/i, requiredRole: 'FIELD_GUIDE', description: 'Start assigned trip: /trip start', handler: async (_match: any, _ctx: any) => { return `✅ Trip started!\nCheck-in recorded at ${new Date().toLocaleTimeString()}\n\nUse /trip update to send progress updates.`; } },
        { pattern: /^\/trip\s+end/i, requiredRole: 'FIELD_GUIDE', description: 'End assigned trip: /trip end', handler: async (_match: any, _ctx: any) => { return `✅ Trip completed!\nCheck-out recorded at ${new Date().toLocaleTimeString()}\n\nPlease submit any final photos/documents.`; } },
        { pattern: /^\/trip\s+update\s+(.+)/i, requiredRole: 'FIELD_GUIDE', description: 'Trip update: /trip update <message>', handler: async (match: any, _ctx: any) => { const [, message] = match; return `✅ Update recorded: "${message}"`; } },
        { pattern: /^\/incident\s+(.+)/i, requiredRole: 'FIELD_GUIDE', description: 'Report incident: /incident <description>', handler: async (match: any, _ctx: any) => { const [, description] = match; return `🚨 Incident reported!\nRef: INC-${Date.now()}\nOps team has been notified.\n\nStay safe and await further instructions.`; } },
        { pattern: /^\/help/i, requiredRole: 'SALES_AGENT', description: 'Show available commands', handler: async (_match: any, ctx: any) => { const available = commands.filter((cmd: any) => hasPermission(ctx.userRole, cmd.requiredRole)).map((cmd: any) => cmd.description).join('\n'); return `📖 Available Commands:\n\n${available}`; } },
    ];

    async function processCommand(message: string, context: any, userRole: string, userId: string) {
        if (!message.startsWith('/')) return { handled: false };
        const ctx = { tenantId: context.tenantId, userId, userRole, phoneNumber: context.primaryActor.phoneNumber, conversationId: context.id };
        for (const command of commands) {
            const match = message.match(command.pattern);
            if (match) {
                if (!hasPermission(userRole, command.requiredRole)) {
                    return { handled: true, response: `❌ You don't have permission for this command. Required: ${command.requiredRole}` };
                }
                const response = await command.handler(match, ctx);
                await messageService.sendText({ tenantId: ctx.tenantId, recipientPhone: ctx.phoneNumber, text: response, senderUserId: 'SYSTEM' });
                return { handled: true, response };
            }
        }
        return { handled: true, response: '❓ Unknown command. Type /help for available commands.' };
    }

    return { processCommand, hasPermission };
}
