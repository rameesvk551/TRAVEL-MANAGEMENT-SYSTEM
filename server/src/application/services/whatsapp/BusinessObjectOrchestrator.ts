// application/services/whatsapp/BusinessObjectOrchestrator.ts
// Orchestrates WhatsApp operations with core business services

import { LeadService } from '../LeadService.js';
import { BookingService } from '../BookingService.js';
import { ConversationContextService } from './ConversationContextService.js';
import { TimelineService } from './TimelineService.js';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';

export interface CreateLeadFromWhatsAppInput {
  phoneNumber: string;
  name: string;
  email?: string;
  interestedIn?: string;
  notes?: string;
  tenantId: string;
  source?: string;
}

export interface GetBookingStatusInput {
  bookingId: string;
  tenantId: string;
}

export class BusinessObjectOrchestrator {
  constructor(
    private leadService: LeadService,
    private bookingService: BookingService,
    private conversationService: ConversationContextService,
    private timelineService: TimelineService,
    private userRepo: IUserRepository
  ) {}

  /**
   * Create lead from WhatsApp enquiry
   */
  async createLeadFromWhatsApp(
    input: CreateLeadFromWhatsAppInput,
    conversationId: string
  ): Promise<{ leadId: string; message: string }> {
    try {
      // Create lead using existing LeadService
      const lead = await this.leadService.createLead(
        {
          name: input.name,
          email: input.email,
          phone: input.phoneNumber,
          source: input.source || 'WhatsApp',
          sourcePlatform: 'WhatsApp Business',
          priority: 'MEDIUM',
          notes: input.notes,
          travelPreferences: {
            interestedActivities: input.interestedIn ? [input.interestedIn] : [],
          },
        },
        { tenantId: input.tenantId } as any
      );

      // Bind conversation to lead
      await this.conversationService.bindToObject(
        conversationId,
        'LEAD',
        lead.id,
        input.tenantId
      );

      // Add to timeline
      await this.timelineService.addEntry({
        objectType: 'LEAD',
        objectId: lead.id,
        eventType: 'SYSTEM',
        source: 'WHATSAPP',
        actorPhone: input.phoneNumber,
        content: {
          action: 'LEAD_CREATED',
          message: 'Lead created from WhatsApp enquiry',
        },
      }, input.tenantId);

      return {
        leadId: lead.id,
        message: `Thank you ${input.name}! Your enquiry has been registered (ID: ${lead.id.substring(0, 8)}). Our sales team will contact you shortly.`,
      };

    } catch (error) {
      console.error('Error creating lead from WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Get booking status for customer
   */
  async getBookingStatus(
    input: GetBookingStatusInput
  ): Promise<string> {
    try {
      const booking = await this.bookingService.getBookingById(
        input.bookingId,
        { tenantId: input.tenantId } as any
      );

      if (!booking) {
        return 'Booking not found. Please check your booking ID.';
      }

      const status = this.formatBookingStatus(booking);
      return status;

    } catch (error) {
      console.error('Error getting booking status:', error);
      return 'Unable to retrieve booking status at this time.';
    }
  }

  /**
   * Request payment link for booking
   */
  async requestPaymentLink(
    bookingId: string,
    phoneNumber: string,
    tenantId: string
  ): Promise<string> {
    try {
      // This would integrate with existing payment service
      // For now, return a placeholder message
      
      await this.timelineService.addEntry({
        objectType: 'BOOKING',
        objectId: bookingId,
        eventType: 'MESSAGE',
        source: 'WHATSAPP',
        actorPhone: phoneNumber,
        content: {
          action: 'PAYMENT_LINK_REQUESTED',
        },
      }, tenantId);

      return `Payment link for booking ${bookingId.substring(0, 8)} will be sent to you shortly.`;

    } catch (error) {
      console.error('Error requesting payment link:', error);
      return 'Unable to generate payment link at this time.';
    }
  }

  /**
   * Report field staff issue
   */
  async reportFieldIssue(
    tripId: string,
    staffId: string,
    description: string,
    tenantId: string,
    phoneNumber: string
  ): Promise<string> {
    try {
      // Add issue to timeline
      await this.timelineService.addIssueReport(
        'TRIP',
        tripId,
        description,
        staffId,
        tenantId
      );

      // This would trigger notification to operations manager
      // Implementation would depend on notification service

      return `Issue reported for trip ${tripId.substring(0, 8)}. Operations team has been notified and will assist shortly.`;

    } catch (error) {
      console.error('Error reporting field issue:', error);
      return 'Unable to report issue at this time. Please contact operations directly.';
    }
  }

  /**
   * Check in to trip (field staff)
   */
  async checkInToTrip(
    tripId: string,
    staffId: string,
    tenantId: string,
    location?: { lat: number; lng: number }
  ): Promise<string> {
    try {
      // This would integrate with HRMS attendance service
      // For now, add to timeline
      
      await this.timelineService.addEntry({
        objectType: 'TRIP',
        objectId: tripId,
        eventType: 'SYSTEM',
        source: 'WHATSAPP',
        actorId: staffId,
        content: {
          action: 'TRIP_CHECKIN',
          timestamp: new Date(),
          location,
        },
      }, tenantId);

      return `✓ Checked in to trip ${tripId.substring(0, 8)}. Have a safe journey!`;

    } catch (error) {
      console.error('Error checking in to trip:', error);
      return 'Unable to check in at this time.';
    }
  }

  /**
   * Check out from trip (field staff)
   */
  async checkOutFromTrip(
    tripId: string,
    staffId: string,
    tenantId: string
  ): Promise<string> {
    try {
      await this.timelineService.addEntry({
        objectType: 'TRIP',
        objectId: tripId,
        eventType: 'SYSTEM',
        source: 'WHATSAPP',
        actorId: staffId,
        content: {
          action: 'TRIP_CHECKOUT',
          timestamp: new Date(),
        },
      }, tenantId);

      return `✓ Checked out from trip ${tripId.substring(0, 8)}. Thank you for your service!`;

    } catch (error) {
      console.error('Error checking out from trip:', error);
      return 'Unable to check out at this time.';
    }
  }

  /**
   * Format booking status for display
   */
  private formatBookingStatus(booking: any): string {
    const lines = [
      `📋 Booking: ${booking.id.substring(0, 8)}`,
      `👤 Guest: ${booking.guestName}`,
      `📅 Dates: ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`,
      `💰 Amount: ${booking.currency} ${booking.totalAmount}`,
      `✓ Status: ${this.formatStatus(booking.status)}`,
    ];

    if (booking.status === 'pending') {
      lines.push('\n💳 Payment pending. Reply "PAYMENT" to get payment link.');
    }

    return lines.join('\n');
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '⏳ Payment Pending',
      confirmed: '✅ Confirmed',
      checked_in: '🏁 Checked In',
      checked_out: '✓ Completed',
      cancelled: '❌ Cancelled',
      no_show: '⚠️ No Show',
    };

    return statusMap[status] || status;
  }
}
