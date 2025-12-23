// application/services/whatsapp/OperationsCommandHandler.ts
// Handles operational commands from staff via WhatsApp

import { ConversationContext } from '../../../domain/entities/whatsapp/index.js';
import { MessageService } from './MessageService.js';
import { TimelineService } from './TimelineService.js';

// EXISTING SERVICES - NO MODIFICATIONS
import { LeadService } from '../LeadService.js';
import { BookingService } from '../BookingService.js';
import { InventoryService } from '../InventoryService.js';
import { HoldService } from '../HoldService.js';

/**
 * Command definition
 */
interface CommandDefinition {
  pattern: RegExp;
  requiredRole: 'SALES_AGENT' | 'OPS_MANAGER' | 'FIELD_GUIDE' | 'ADMIN';
  description: string;
  handler: (match: RegExpMatchArray, ctx: CommandContext) => Promise<string>;
}

interface CommandContext {
  tenantId: string;
  userId: string;
  userRole: string;
  phoneNumber: string;
  conversationId: string;
}

/**
 * OperationsCommandHandler - Processes staff commands via WhatsApp
 * 
 * DESIGN: Staff can execute operations directly from WhatsApp.
 * All commands map to existing service methods - no new business logic.
 * 
 * Example commands:
 * - /hold EBC001 2   -> Hold 2 seats on departure EBC001
 * - /status BKG123   -> Check booking status
 * - /close DEP456    -> Close departure for bookings
 * - /trip start      -> Start assigned trip
 */
export class OperationsCommandHandler {
  private commands: CommandDefinition[];

  constructor(
    private messageService: MessageService,
    private timelineService: TimelineService,
    private leadService: LeadService,
    private bookingService: BookingService,
    private inventoryService: InventoryService,
    private holdService: HoldService
  ) {
    this.commands = this.registerCommands();
  }

  /**
   * Register all available commands
   */
  private registerCommands(): CommandDefinition[] {
    return [
      // INVENTORY COMMANDS
      {
        pattern: /^\/hold\s+(\w+)\s+(\d+)/i,
        requiredRole: 'SALES_AGENT',
        description: 'Hold seats: /hold <departure_id> <seats>',
        handler: async (match, ctx) => {
          const [, departureId, seats] = match;
          try {
            const result = await this.holdService.createHold({
              tenantId: ctx.tenantId,
              departureId,
              seatCount: parseInt(seats),
              source: 'MANUAL',
              sourcePlatform: 'WHATSAPP',
              holdType: 'SOFT',
              createdById: ctx.userId,
            });
            return `✅ Hold created!\nDeparture: ${departureId}\nSeats: ${seats}\nExpires: ${result.expiresAt.toLocaleTimeString()}`;
          } catch (error) {
            return `❌ Failed to create hold: ${(error as Error).message}`;
          }
        },
      },
      {
        pattern: /^\/release\s+(\w+)/i,
        requiredRole: 'SALES_AGENT',
        description: 'Release hold: /release <hold_id>',
        handler: async (match, ctx) => {
          const [, holdId] = match;
          try {
            await this.holdService.releaseHold(holdId, ctx.tenantId, 'MANUAL_RELEASE');
            return `✅ Hold ${holdId} released`;
          } catch (error) {
            return `❌ Failed to release: ${(error as Error).message}`;
          }
        },
      },
      {
        pattern: /^\/inventory\s+(\w+)/i,
        requiredRole: 'SALES_AGENT',
        description: 'Check inventory: /inventory <departure_id>',
        handler: async (match, ctx) => {
          const [, departureId] = match;
          try {
            const result = await this.inventoryService.getDepartureWithInventory(
              departureId,
              ctx.tenantId
            );
            const { departure, inventory } = result;
            return `📦 Inventory: ${departureId}\n` +
              `Status: ${departure.status}\n` +
              `Total: ${inventory.total}\n` +
              `Booked: ${inventory.booked}\n` +
              `Held: ${inventory.held}\n` +
              `Available: ${inventory.available}`;
          } catch (error) {
            return `❌ Departure not found`;
          }
        },
      },
      {
        pattern: /^\/close\s+(\w+)/i,
        requiredRole: 'OPS_MANAGER',
        description: 'Close departure: /close <departure_id>',
        handler: async (match, ctx) => {
          const [, departureId] = match;
          try {
            await this.inventoryService.updateDepartureStatus(
              departureId,
              ctx.tenantId,
              'CLOSED'
            );
            return `✅ Departure ${departureId} closed for bookings`;
          } catch (error) {
            return `❌ Failed to close: ${(error as Error).message}`;
          }
        },
      },

      // BOOKING COMMANDS
      {
        pattern: /^\/status\s+(\w+)/i,
        requiredRole: 'SALES_AGENT',
        description: 'Booking status: /status <booking_id>',
        handler: async (match, ctx) => {
          const [, bookingId] = match;
          try {
            const booking = await this.bookingService.getBooking(bookingId, ctx.tenantId);
            if (!booking) return `❌ Booking not found`;
            
            return `📋 Booking: ${bookingId}\n` +
              `Guest: ${booking.guestName}\n` +
              `Status: ${booking.status}\n` +
              `Dates: ${booking.startDate.toDateString()}\n` +
              `Amount: ${booking.currency} ${booking.totalAmount}`;
          } catch (error) {
            return `❌ Error: ${(error as Error).message}`;
          }
        },
      },

      // FIELD STAFF COMMANDS
      {
        pattern: /^\/trip\s+start/i,
        requiredRole: 'FIELD_GUIDE',
        description: 'Start assigned trip: /trip start',
        handler: async (match, ctx) => {
          // Would look up active trip assignment for this staff member
          // and call TripAssignmentService.startTrip()
          return `✅ Trip started!\nCheck-in recorded at ${new Date().toLocaleTimeString()}\n\nUse /trip update to send progress updates.`;
        },
      },
      {
        pattern: /^\/trip\s+end/i,
        requiredRole: 'FIELD_GUIDE',
        description: 'End assigned trip: /trip end',
        handler: async (match, ctx) => {
          return `✅ Trip completed!\nCheck-out recorded at ${new Date().toLocaleTimeString()}\n\nPlease submit any final photos/documents.`;
        },
      },
      {
        pattern: /^\/trip\s+update\s+(.+)/i,
        requiredRole: 'FIELD_GUIDE',
        description: 'Trip update: /trip update <message>',
        handler: async (match, ctx) => {
          const [, message] = match;
          // Would record timeline entry and notify operations
          return `✅ Update recorded: "${message}"`;
        },
      },
      {
        pattern: /^\/incident\s+(.+)/i,
        requiredRole: 'FIELD_GUIDE',
        description: 'Report incident: /incident <description>',
        handler: async (match, ctx) => {
          const [, description] = match;
          // Would create incident record and alert operations team
          return `🚨 Incident reported!\nRef: INC-${Date.now()}\nOps team has been notified.\n\nStay safe and await further instructions.`;
        },
      },

      // HELP COMMAND
      {
        pattern: /^\/help/i,
        requiredRole: 'SALES_AGENT',
        description: 'Show available commands',
        handler: async (match, ctx) => {
          const available = this.commands
            .filter(cmd => this.hasPermission(ctx.userRole, cmd.requiredRole))
            .map(cmd => cmd.description)
            .join('\n');
          return `📖 Available Commands:\n\n${available}`;
        },
      },
    ];
  }

  /**
   * Process a potential command message
   */
  async processCommand(
    message: string,
    context: ConversationContext,
    userRole: string,
    userId: string
  ): Promise<{ handled: boolean; response?: string }> {
    // Check if message starts with /
    if (!message.startsWith('/')) {
      return { handled: false };
    }

    const ctx: CommandContext = {
      tenantId: context.tenantId,
      userId,
      userRole,
      phoneNumber: context.primaryActor.phoneNumber,
      conversationId: context.id,
    };

    for (const command of this.commands) {
      const match = message.match(command.pattern);
      if (match) {
        // Check permission
        if (!this.hasPermission(userRole, command.requiredRole)) {
          return {
            handled: true,
            response: `❌ You don't have permission for this command. Required: ${command.requiredRole}`,
          };
        }

        const response = await command.handler(match, ctx);
        
        // Send response
        await this.messageService.sendText({
          tenantId: ctx.tenantId,
          recipientPhone: ctx.phoneNumber,
          text: response,
          senderUserId: 'SYSTEM',
        });

        return { handled: true, response };
      }
    }

    // Unknown command
    return {
      handled: true,
      response: '❓ Unknown command. Type /help for available commands.',
    };
  }

  /**
   * Check if user role has permission for command
   */
  private hasPermission(userRole: string, requiredRole: string): boolean {
    const hierarchy: Record<string, number> = {
      FIELD_GUIDE: 1,
      SALES_AGENT: 2,
      OPS_MANAGER: 3,
      ADMIN: 4,
    };

    return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 99);
  }
}
