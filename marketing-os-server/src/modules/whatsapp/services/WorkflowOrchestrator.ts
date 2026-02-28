// application/services/whatsapp/WorkflowOrchestrator.ts
// Orchestrates WhatsApp workflows by calling existing services

export function createWorkflowOrchestrator(
    conversationService: any, messageService: any, timelineService: any,
    leadService: any, bookingService: any, inventoryService: any, holdService: any
) {
    const workflows: Map<string, any> = new Map();

    function registerWorkflows() {
        workflows.set('NEW_INQUIRY', {
            workflow: 'NEW_INQUIRY',
            steps: [
                { name: 'name', prompt: 'Welcome! 👋 I\'d love to help you plan your trip. May I have your name?', fieldName: 'guestName' },
                { name: 'destination', prompt: 'Great to meet you, {{name}}! Which destination are you interested in?', fieldName: 'destination', buttons: [{ id: 'ebc', title: 'Everest Base Camp' }, { id: 'abc', title: 'Annapurna Circuit' }, { id: 'other', title: 'Other' }] },
                { name: 'dates', prompt: 'When are you planning to travel? (e.g., March 2025)', fieldName: 'travelDates' },
                { name: 'group_size', prompt: 'How many travelers will be in your group?', fieldName: 'groupSize', validator: (v: string) => !isNaN(parseInt(v)) && parseInt(v) > 0, transformer: (v: string) => parseInt(v) },
                { name: 'email', prompt: 'Almost done! What\'s the best email to send you a detailed itinerary?', fieldName: 'email', validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
            ],
            onComplete: async (data: any, ctx: any) => {
                await leadService.createLead({
                    tenantId: ctx.tenantId, name: data.guestName, email: data.email, phone: ctx.phoneNumber,
                    source: 'WhatsApp', sourcePlatform: 'WHATSAPP',
                    travelPreferences: { interestedActivities: [data.destination], groupSizeAdults: data.groupSize },
                    notes: `Inquiry via WhatsApp. Dates: ${data.travelDates}`,
                });
            },
        });

        workflows.set('QUOTE_REQUEST', {
            workflow: 'QUOTE_REQUEST',
            steps: [
                { name: 'package', prompt: 'Which package would you like a quote for?', fieldName: 'packageId', buttons: [{ id: 'basic', title: 'Basic Package' }, { id: 'standard', title: 'Standard Package' }, { id: 'premium', title: 'Premium Package' }] },
                { name: 'dates', prompt: 'What\'s your preferred start date?', fieldName: 'startDate' },
                { name: 'confirm', prompt: 'I\'ll prepare a quote for {{package}} starting {{dates}}. Shall I proceed?', fieldName: 'confirmed', buttons: [{ id: 'yes', title: 'Yes, send quote' }, { id: 'no', title: 'Change details' }] },
            ],
            onComplete: async (data: any, ctx: any) => { console.log('Quote requested:', data); },
        });

        workflows.set('STATUS_CHECK', {
            workflow: 'STATUS_CHECK',
            steps: [{ name: 'booking_ref', prompt: 'Please provide your booking reference number:', fieldName: 'bookingRef' }],
            onComplete: async (data: any, ctx: any) => {
                const booking = await bookingService.getBooking(data.bookingRef, ctx.tenantId);
                if (booking) {
                    await messageService.sendText({
                        tenantId: ctx.tenantId, recipientPhone: ctx.phoneNumber,
                        text: `📋 Booking Status\n\nReference: ${booking.id}\nStatus: ${booking.status}\nDates: ${booking.startDate.toDateString()} - ${booking.endDate.toDateString()}\nAmount: ${booking.currency} ${booking.totalAmount}`,
                        senderUserId: 'SYSTEM',
                    });
                } else {
                    await messageService.sendText({
                        tenantId: ctx.tenantId, recipientPhone: ctx.phoneNumber,
                        text: 'Sorry, I couldn\'t find a booking with that reference. Please check and try again.',
                        senderUserId: 'SYSTEM',
                    });
                }
            },
        });
    }

    registerWorkflows();

    async function startWorkflow(conversationId: string, tenantId: string, workflow: string, phoneNumber: string) {
        const definition = workflows.get(workflow);
        if (!definition) throw new Error(`Unknown workflow: ${workflow}`);
        await conversationService.startWorkflow(conversationId, tenantId, workflow, definition.steps.length);
        const firstStep = definition.steps[0];
        if (firstStep.buttons) {
            await messageService.sendInteractive({ tenantId, recipientPhone: phoneNumber, bodyText: firstStep.prompt, buttons: firstStep.buttons, senderUserId: 'SYSTEM' });
        } else {
            await messageService.sendText({ tenantId, recipientPhone: phoneNumber, text: firstStep.prompt, senderUserId: 'SYSTEM' });
        }
    }

    async function processWorkflowInput(context: any, input: string) {
        if (!context.workflowProgress) return { completed: false, error: 'No active workflow' };
        const definition = workflows.get(context.workflowProgress.workflow);
        if (!definition) return { completed: false, error: 'Unknown workflow' };
        const currentStep = definition.steps[context.workflowProgress.stepIndex];
        if (currentStep.validator && !currentStep.validator(input)) {
            await messageService.sendText({ tenantId: context.tenantId, recipientPhone: context.primaryActor.phoneNumber, text: 'That doesn\'t look right. Please try again.', senderUserId: 'SYSTEM' });
            return { completed: false };
        }
        const value = currentStep.transformer ? currentStep.transformer(input) : input;
        const newData = { ...context.workflowProgress.collectedData, [currentStep.fieldName]: value };
        const nextStepIndex = context.workflowProgress.stepIndex + 1;
        if (nextStepIndex >= definition.steps.length) {
            await definition.onComplete(newData, { tenantId: context.tenantId, conversationId: context.id, phoneNumber: context.primaryActor.phoneNumber, userId: context.primaryActor.userId });
            await conversationService.completeWorkflow(context.id, context.tenantId);
            await messageService.sendText({ tenantId: context.tenantId, recipientPhone: context.primaryActor.phoneNumber, text: '✅ All done! Our team will get back to you shortly.', senderUserId: 'SYSTEM' });
            return { completed: true };
        }
        await conversationService.updateWorkflowStep(context.id, context.tenantId, definition.steps[nextStepIndex].name, nextStepIndex, newData);
        const nextStep = definition.steps[nextStepIndex];
        let prompt = nextStep.prompt;
        Object.entries(newData).forEach(([key, val]) => { prompt = prompt.replace(`{{${key}}}`, String(val)); });
        if (nextStep.buttons) {
            await messageService.sendInteractive({ tenantId: context.tenantId, recipientPhone: context.primaryActor.phoneNumber, bodyText: prompt, buttons: nextStep.buttons, senderUserId: 'SYSTEM' });
        } else {
            await messageService.sendText({ tenantId: context.tenantId, recipientPhone: context.primaryActor.phoneNumber, text: prompt, senderUserId: 'SYSTEM' });
        }
        return { completed: false };
    }

    async function cancelWorkflow(conversationId: string, tenantId: string, phoneNumber: string) {
        await conversationService.completeWorkflow(conversationId, tenantId);
        await messageService.sendText({ tenantId, recipientPhone: phoneNumber, text: 'No problem! Feel free to start over whenever you\'re ready.', senderUserId: 'SYSTEM' });
    }

    return { startWorkflow, processWorkflowInput, cancelWorkflow };
}
