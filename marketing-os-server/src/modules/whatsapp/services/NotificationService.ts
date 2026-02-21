// application/services/whatsapp/NotificationService.ts
// Proactive notifications via WhatsApp templates

export class NotificationService {
    constructor(
        private messageService: any,
        private timelineService: any,
        private conversationRepo: any
    ) { }

    async sendTriggerNotification(trigger: string, entityId: string, entityType: string, tenantId: string, data: any) {
        if (data.templateName) {
            await this.messageService.sendTemplate({ tenantId, recipientPhone: data.recipientPhone, templateName: data.templateName, language: 'en', variables: data.variables || {}, senderUserId: 'SYSTEM' });
        }
    }

    async sendBookingConfirmation(payload: any) {
        await this.messageService.sendTemplate({ tenantId: payload.tenantId, recipientPhone: payload.recipientPhone, templateName: 'booking_confirmation', variables: { '1': payload.guestName, '2': payload.bookingRef, '3': payload.tripName, '4': payload.startDate, '5': payload.endDate, '6': `${payload.currency} ${payload.totalAmount}` }, linkTo: payload.linkTo, senderUserId: payload.triggeredBy || 'SYSTEM' });
    }

    async sendPaymentReminder(payload: any) {
        await this.messageService.sendTemplate({ tenantId: payload.tenantId, recipientPhone: payload.recipientPhone, templateName: 'payment_reminder', variables: { '1': payload.guestName, '2': payload.bookingRef, '3': `${payload.currency} ${payload.amountDue}`, '4': payload.dueDate, '5': payload.paymentLink }, linkTo: payload.linkTo, senderUserId: payload.triggeredBy || 'SYSTEM' });
        if (payload.linkTo?.type === 'BOOKING') { await this.timelineService.recordPaymentEvent(payload.tenantId, payload.linkTo.entityId, 'PAYMENT_LINK_SENT', parseFloat(payload.amountDue), payload.currency, 'System', 'SYSTEM'); }
    }

    async sendTripReminder(payload: any) {
        await this.messageService.sendTemplate({ tenantId: payload.tenantId, recipientPhone: payload.recipientPhone, templateName: 'trip_reminder', variables: { '1': payload.guestName, '2': payload.tripName, '3': payload.startDate, '4': payload.meetingPoint, '5': payload.meetingTime, '6': payload.guideName, '7': payload.guidePhone }, linkTo: payload.linkTo, senderUserId: payload.triggeredBy || 'SYSTEM' });
    }

    async sendStaffAssignment(payload: any) {
        await this.messageService.sendTemplate({ tenantId: payload.tenantId, recipientPhone: payload.recipientPhone, templateName: 'staff_assignment', variables: { '1': payload.employeeName, '2': payload.tripName, '3': payload.role, '4': payload.startDate, '5': payload.endDate, '6': payload.meetingPoint }, senderUserId: payload.triggeredBy || 'SYSTEM' });
    }

    async sendPaymentReceived(tenantId: string, recipientPhone: string, bookingRef: string, guestName: string, amount: string, currency: string, bookingId: string) {
        await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName: 'payment_received', variables: { '1': guestName, '2': bookingRef, '3': `${currency} ${amount}` }, linkTo: { type: 'BOOKING', entityId: bookingId }, senderUserId: 'SYSTEM' });
        await this.timelineService.recordPaymentEvent(tenantId, bookingId, 'PAYMENT_RECEIVED', parseFloat(amount), currency, 'System', 'SYSTEM');
    }

    async sendTripStartedToCustomer(tenantId: string, recipientPhone: string, guestName: string, tripName: string, guideName: string, bookingId: string) {
        await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName: 'trip_started', variables: { '1': guestName, '2': tripName, '3': guideName }, linkTo: { type: 'BOOKING', entityId: bookingId }, senderUserId: 'SYSTEM' });
    }

    async sendIncidentAlert(tenantId: string, recipientPhone: string, tripName: string, guideName: string, incidentDescription: string, location?: string) {
        await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName: 'incident_alert', variables: { '1': tripName, '2': guideName, '3': incidentDescription, '4': location || 'Unknown' }, senderUserId: 'SYSTEM' });
    }

    async sendFeedbackRequest(tenantId: string, recipientPhone: string, guestName: string, tripName: string, feedbackLink: string, bookingId: string) {
        await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName: 'feedback_request', variables: { '1': guestName, '2': tripName, '3': feedbackLink }, linkTo: { type: 'BOOKING', entityId: bookingId }, senderUserId: 'SYSTEM' });
    }

    async sendWaitlistConfirmation(tenantId: string, recipientPhone: string, guestName: string, tripName: string, departureDate: string, position: number) {
        await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName: 'waitlist_confirmation', variables: { '1': guestName, '2': tripName, '3': departureDate, '4': position.toString() }, senderUserId: 'SYSTEM' });
    }

    async sendWaitlistToConfirmed(tenantId: string, recipientPhone: string, guestName: string, tripName: string, departureDate: string, paymentLink: string, bookingId: string) {
        await this.messageService.sendTemplate({ tenantId, recipientPhone, templateName: 'waitlist_confirmed', variables: { '1': guestName, '2': tripName, '3': departureDate, '4': paymentLink }, linkTo: { type: 'BOOKING', entityId: bookingId }, senderUserId: 'SYSTEM' });
    }
}
