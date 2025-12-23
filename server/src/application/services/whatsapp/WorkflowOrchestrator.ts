// application/services/whatsapp/WorkflowOrchestrator.ts
// Orchestrates WhatsApp workflows by calling existing services

import { ConversationContext, ActiveWorkflow } from '../../../domain/entities/whatsapp/index.js';
import { ConversationService } from './ConversationService.js';
import { MessageService } from './MessageService.js';
import { TimelineService } from './TimelineService.js';

// EXISTING SERVICES - NO MODIFICATIONS
import { LeadService } from '../LeadService.js';
import { BookingService, CreateBookingDTO } from '../BookingService.js';
import { InventoryService } from '../InventoryService.js';
import { HoldService } from '../HoldService.js';

/**
 * WorkflowStep - Represents a step in a multi-step WhatsApp flow
 */
interface WorkflowStep {
  name: string;
  prompt: string;
  fieldName: string;
  validator?: (value: string) => boolean;
  transformer?: (value: string) => unknown;
  buttons?: Array<{ id: string; title: string }>;
}

/**
 * WorkflowDefinition - Defines a complete workflow
 */
interface WorkflowDefinition {
  workflow: ActiveWorkflow;
  steps: WorkflowStep[];
  onComplete: (data: Record<string, unknown>, context: WorkflowContext) => Promise<void>;
}

interface WorkflowContext {
  tenantId: string;
  conversationId: string;
  phoneNumber: string;
  userId?: string;
}

/**
 * WorkflowOrchestrator - Manages multi-step WhatsApp workflows
 * 
 * CRITICAL: This orchestrator ONLY coordinates. Business logic 
 * remains in existing services (LeadService, BookingService, etc.)
 */
export class WorkflowOrchestrator {
  private workflows: Map<ActiveWorkflow, WorkflowDefinition>;

  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
    private timelineService: TimelineService,
    private leadService: LeadService,
    private bookingService: BookingService,
    private inventoryService: InventoryService,
    private holdService: HoldService
  ) {
    this.workflows = new Map();
    this.registerWorkflows();
  }

  /**
   * Register all workflow definitions
   */
  private registerWorkflows(): void {
    // NEW INQUIRY WORKFLOW
    this.workflows.set('NEW_INQUIRY', {
      workflow: 'NEW_INQUIRY',
      steps: [
        {
          name: 'name',
          prompt: 'Welcome! 👋 I\'d love to help you plan your trip. May I have your name?',
          fieldName: 'guestName',
        },
        {
          name: 'destination',
          prompt: 'Great to meet you, {{name}}! Which destination are you interested in?',
          fieldName: 'destination',
          buttons: [
            { id: 'ebc', title: 'Everest Base Camp' },
            { id: 'abc', title: 'Annapurna Circuit' },
            { id: 'other', title: 'Other' },
          ],
        },
        {
          name: 'dates',
          prompt: 'When are you planning to travel? (e.g., March 2025)',
          fieldName: 'travelDates',
        },
        {
          name: 'group_size',
          prompt: 'How many travelers will be in your group?',
          fieldName: 'groupSize',
          validator: (v) => !isNaN(parseInt(v)) && parseInt(v) > 0,
          transformer: (v) => parseInt(v),
        },
        {
          name: 'email',
          prompt: 'Almost done! What\'s the best email to send you a detailed itinerary?',
          fieldName: 'email',
          validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        },
      ],
      onComplete: async (data, ctx) => {
        // CREATE LEAD via existing LeadService
        await this.leadService.createLead({
          tenantId: ctx.tenantId,
          name: data.guestName as string,
          email: data.email as string,
          phone: ctx.phoneNumber,
          source: 'WhatsApp',
          sourcePlatform: 'WHATSAPP',
          travelPreferences: {
            interestedActivities: [data.destination as string],
            groupSizeAdults: data.groupSize as number,
          },
          notes: `Inquiry via WhatsApp. Dates: ${data.travelDates}`,
        });
      },
    });

    // QUOTE REQUEST WORKFLOW
    this.workflows.set('QUOTE_REQUEST', {
      workflow: 'QUOTE_REQUEST',
      steps: [
        {
          name: 'package',
          prompt: 'Which package would you like a quote for?',
          fieldName: 'packageId',
          buttons: [
            { id: 'basic', title: 'Basic Package' },
            { id: 'standard', title: 'Standard Package' },
            { id: 'premium', title: 'Premium Package' },
          ],
        },
        {
          name: 'dates',
          prompt: 'What\'s your preferred start date?',
          fieldName: 'startDate',
        },
        {
          name: 'confirm',
          prompt: 'I\'ll prepare a quote for {{package}} starting {{dates}}. Shall I proceed?',
          fieldName: 'confirmed',
          buttons: [
            { id: 'yes', title: 'Yes, send quote' },
            { id: 'no', title: 'Change details' },
          ],
        },
      ],
      onComplete: async (data, ctx) => {
        // Quote logic - would call existing quote service
        // For now, log the intent
        console.log('Quote requested:', data);
      },
    });

    // STATUS CHECK WORKFLOW
    this.workflows.set('STATUS_CHECK', {
      workflow: 'STATUS_CHECK',
      steps: [
        {
          name: 'booking_ref',
          prompt: 'Please provide your booking reference number:',
          fieldName: 'bookingRef',
        },
      ],
      onComplete: async (data, ctx) => {
        // Lookup booking via existing BookingService
        const booking = await this.bookingService.getBooking(
          data.bookingRef as string,
          ctx.tenantId
        );
        
        if (booking) {
          await this.messageService.sendText({
            tenantId: ctx.tenantId,
            recipientPhone: ctx.phoneNumber,
            text: `📋 Booking Status\n\n` +
              `Reference: ${booking.id}\n` +
              `Status: ${booking.status}\n` +
              `Dates: ${booking.startDate.toDateString()} - ${booking.endDate.toDateString()}\n` +
              `Amount: ${booking.currency} ${booking.totalAmount}`,
            senderUserId: 'SYSTEM',
          });
        } else {
          await this.messageService.sendText({
            tenantId: ctx.tenantId,
            recipientPhone: ctx.phoneNumber,
            text: 'Sorry, I couldn\'t find a booking with that reference. Please check and try again.',
            senderUserId: 'SYSTEM',
          });
        }
      },
    });
  }

  /**
   * Start a new workflow
   */
  async startWorkflow(
    conversationId: string,
    tenantId: string,
    workflow: ActiveWorkflow,
    phoneNumber: string
  ): Promise<void> {
    const definition = this.workflows.get(workflow);
    if (!definition) {
      throw new Error(`Unknown workflow: ${workflow}`);
    }

    // Update conversation state
    await this.conversationService.startWorkflow(
      conversationId,
      tenantId,
      workflow,
      definition.steps.length
    );

    // Send first step prompt
    const firstStep = definition.steps[0];
    if (firstStep.buttons) {
      await this.messageService.sendInteractive({
        tenantId,
        recipientPhone: phoneNumber,
        bodyText: firstStep.prompt,
        buttons: firstStep.buttons,
        senderUserId: 'SYSTEM',
      });
    } else {
      await this.messageService.sendText({
        tenantId,
        recipientPhone: phoneNumber,
        text: firstStep.prompt,
        senderUserId: 'SYSTEM',
      });
    }
  }

  /**
   * Process user input for active workflow
   */
  async processWorkflowInput(
    context: ConversationContext,
    input: string
  ): Promise<{ completed: boolean; error?: string }> {
    if (!context.workflowProgress) {
      return { completed: false, error: 'No active workflow' };
    }

    const definition = this.workflows.get(context.workflowProgress.workflow);
    if (!definition) {
      return { completed: false, error: 'Unknown workflow' };
    }

    const currentStep = definition.steps[context.workflowProgress.stepIndex];
    
    // Validate input
    if (currentStep.validator && !currentStep.validator(input)) {
      await this.messageService.sendText({
        tenantId: context.tenantId,
        recipientPhone: context.primaryActor.phoneNumber,
        text: 'That doesn\'t look right. Please try again.',
        senderUserId: 'SYSTEM',
      });
      return { completed: false };
    }

    // Transform and store input
    const value = currentStep.transformer 
      ? currentStep.transformer(input)
      : input;
    
    const newData = {
      ...context.workflowProgress.collectedData,
      [currentStep.fieldName]: value,
    };

    const nextStepIndex = context.workflowProgress.stepIndex + 1;

    // Check if workflow is complete
    if (nextStepIndex >= definition.steps.length) {
      // Execute completion handler
      await definition.onComplete(newData, {
        tenantId: context.tenantId,
        conversationId: context.id,
        phoneNumber: context.primaryActor.phoneNumber,
        userId: context.primaryActor.userId,
      });

      // Mark workflow complete
      await this.conversationService.completeWorkflow(
        context.id,
        context.tenantId
      );

      // Send completion message
      await this.messageService.sendText({
        tenantId: context.tenantId,
        recipientPhone: context.primaryActor.phoneNumber,
        text: '✅ All done! Our team will get back to you shortly.',
        senderUserId: 'SYSTEM',
      });

      return { completed: true };
    }

    // Update progress and send next step
    await this.conversationService.updateWorkflowStep(
      context.id,
      context.tenantId,
      definition.steps[nextStepIndex].name,
      nextStepIndex,
      newData
    );

    const nextStep = definition.steps[nextStepIndex];
    let prompt = nextStep.prompt;
    
    // Replace placeholders in prompt
    Object.entries(newData).forEach(([key, val]) => {
      prompt = prompt.replace(`{{${key}}}`, String(val));
    });

    if (nextStep.buttons) {
      await this.messageService.sendInteractive({
        tenantId: context.tenantId,
        recipientPhone: context.primaryActor.phoneNumber,
        bodyText: prompt,
        buttons: nextStep.buttons,
        senderUserId: 'SYSTEM',
      });
    } else {
      await this.messageService.sendText({
        tenantId: context.tenantId,
        recipientPhone: context.primaryActor.phoneNumber,
        text: prompt,
        senderUserId: 'SYSTEM',
      });
    }

    return { completed: false };
  }

  /**
   * Cancel active workflow
   */
  async cancelWorkflow(
    conversationId: string,
    tenantId: string,
    phoneNumber: string
  ): Promise<void> {
    await this.conversationService.completeWorkflow(conversationId, tenantId);
    
    await this.messageService.sendText({
      tenantId,
      recipientPhone: phoneNumber,
      text: 'No problem! Feel free to start over whenever you\'re ready.',
      senderUserId: 'SYSTEM',
    });
  }
}
