// application/services/whatsapp/NotificationService.ts
// Proactive notifications via WhatsApp templates

import { MessageService } from './MessageService.js';
import { TimelineService } from './TimelineService.js';
import { IConversationRepository } from '../../../domain/interfaces/whatsapp/index.js';

/**
 * NotificationPayload - Data for rendering templates
 */
interface NotificationPayload {
  tenantId: string;
  recipientPhone: string;
  linkTo?: {
    type: 'LEAD' | 'BOOKING' | 'DEPARTURE';
    entityId: string;
  };
  triggeredBy?: string;
}

interface BookingConfirmationPayload extends NotificationPayload {
  bookingRef: string;
  guestName: string;
  tripName: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  currency: string;
}

interface PaymentReminderPayload extends NotificationPayload {
  bookingRef: string;
  guestName: string;
  amountDue: string;
  currency: string;
  dueDate: string;
  paymentLink: string;
}

interface TripReminderPayload extends NotificationPayload {
  bookingRef: string;
  guestName: string;
  tripName: string;
  startDate: string;
  meetingPoint: string;
  meetingTime: string;
  guideName: string;
  guidePhone: string;
}

interface StaffAssignmentPayload extends NotificationPayload {
  employeeName: string;
  tripName: string;
  role: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
}

/**
 * NotificationService - Sends proactive WhatsApp notifications
 * 
 * Uses pre-approved templates for transactional messages.
 * All triggers come from existing system events.
 */
export class NotificationService {
  constructor(
    private messageService: MessageService,
    private timelineService: TimelineService,
    private conversationRepo: IConversationRepository
  ) {}

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(payload: BookingConfirmationPayload): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId: payload.tenantId,
      recipientPhone: payload.recipientPhone,
      templateName: 'booking_confirmation',
      variables: {
        '1': payload.guestName,
        '2': payload.bookingRef,
        '3': payload.tripName,
        '4': payload.startDate,
        '5': payload.endDate,
        '6': `${payload.currency} ${payload.totalAmount}`,
      },
      linkTo: payload.linkTo,
      senderUserId: payload.triggeredBy || 'SYSTEM',
    });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(payload: PaymentReminderPayload): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId: payload.tenantId,
      recipientPhone: payload.recipientPhone,
      templateName: 'payment_reminder',
      variables: {
        '1': payload.guestName,
        '2': payload.bookingRef,
        '3': `${payload.currency} ${payload.amountDue}`,
        '4': payload.dueDate,
        '5': payload.paymentLink,
      },
      linkTo: payload.linkTo,
      senderUserId: payload.triggeredBy || 'SYSTEM',
    });

    // Record in timeline
    if (payload.linkTo?.type === 'BOOKING') {
      await this.timelineService.recordPaymentEvent(
        payload.tenantId,
        payload.linkTo.entityId,
        'PAYMENT_LINK_SENT',
        parseFloat(payload.amountDue),
        payload.currency,
        'System',
        'SYSTEM'
      );
    }
  }

  /**
   * Send trip reminder (1-2 days before)
   */
  async sendTripReminder(payload: TripReminderPayload): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId: payload.tenantId,
      recipientPhone: payload.recipientPhone,
      templateName: 'trip_reminder',
      variables: {
        '1': payload.guestName,
        '2': payload.tripName,
        '3': payload.startDate,
        '4': payload.meetingPoint,
        '5': payload.meetingTime,
        '6': payload.guideName,
        '7': payload.guidePhone,
      },
      linkTo: payload.linkTo,
      senderUserId: payload.triggeredBy || 'SYSTEM',
    });
  }

  /**
   * Send staff assignment notification
   */
  async sendStaffAssignment(payload: StaffAssignmentPayload): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId: payload.tenantId,
      recipientPhone: payload.recipientPhone,
      templateName: 'staff_assignment',
      variables: {
        '1': payload.employeeName,
        '2': payload.tripName,
        '3': payload.role,
        '4': payload.startDate,
        '5': payload.endDate,
        '6': payload.meetingPoint,
      },
      senderUserId: payload.triggeredBy || 'SYSTEM',
    });
  }

  /**
   * Send payment received confirmation
   */
  async sendPaymentReceived(
    tenantId: string,
    recipientPhone: string,
    bookingRef: string,
    guestName: string,
    amount: string,
    currency: string,
    bookingId: string
  ): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId,
      recipientPhone,
      templateName: 'payment_received',
      variables: {
        '1': guestName,
        '2': bookingRef,
        '3': `${currency} ${amount}`,
      },
      linkTo: { type: 'BOOKING', entityId: bookingId },
      senderUserId: 'SYSTEM',
    });

    await this.timelineService.recordPaymentEvent(
      tenantId,
      bookingId,
      'PAYMENT_RECEIVED',
      parseFloat(amount),
      currency,
      'System',
      'SYSTEM'
    );
  }

  /**
   * Send trip started notification to customer
   */
  async sendTripStartedToCustomer(
    tenantId: string,
    recipientPhone: string,
    guestName: string,
    tripName: string,
    guideName: string,
    bookingId: string
  ): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId,
      recipientPhone,
      templateName: 'trip_started',
      variables: {
        '1': guestName,
        '2': tripName,
        '3': guideName,
      },
      linkTo: { type: 'BOOKING', entityId: bookingId },
      senderUserId: 'SYSTEM',
    });
  }

  /**
   * Send incident notification to operations
   */
  async sendIncidentAlert(
    tenantId: string,
    recipientPhone: string,
    tripName: string,
    guideName: string,
    incidentDescription: string,
    location?: string
  ): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId,
      recipientPhone,
      templateName: 'incident_alert',
      variables: {
        '1': tripName,
        '2': guideName,
        '3': incidentDescription,
        '4': location || 'Unknown',
      },
      senderUserId: 'SYSTEM',
    });
  }

  /**
   * Send feedback request after trip completion
   */
  async sendFeedbackRequest(
    tenantId: string,
    recipientPhone: string,
    guestName: string,
    tripName: string,
    feedbackLink: string,
    bookingId: string
  ): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId,
      recipientPhone,
      templateName: 'feedback_request',
      variables: {
        '1': guestName,
        '2': tripName,
        '3': feedbackLink,
      },
      linkTo: { type: 'BOOKING', entityId: bookingId },
      senderUserId: 'SYSTEM',
    });
  }

  /**
   * Send waitlist confirmation
   */
  async sendWaitlistConfirmation(
    tenantId: string,
    recipientPhone: string,
    guestName: string,
    tripName: string,
    departureDate: string,
    position: number
  ): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId,
      recipientPhone,
      templateName: 'waitlist_confirmation',
      variables: {
        '1': guestName,
        '2': tripName,
        '3': departureDate,
        '4': position.toString(),
      },
      senderUserId: 'SYSTEM',
    });
  }

  /**
   * Send waitlist to confirmed notification
   */
  async sendWaitlistToConfirmed(
    tenantId: string,
    recipientPhone: string,
    guestName: string,
    tripName: string,
    departureDate: string,
    paymentLink: string,
    bookingId: string
  ): Promise<void> {
    await this.messageService.sendTemplate({
      tenantId,
      recipientPhone,
      templateName: 'waitlist_confirmed',
      variables: {
        '1': guestName,
        '2': tripName,
        '3': departureDate,
        '4': paymentLink,
      },
      linkTo: { type: 'BOOKING', entityId: bookingId },
      senderUserId: 'SYSTEM',
    });
  }
}
