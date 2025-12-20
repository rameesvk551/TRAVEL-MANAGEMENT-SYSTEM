import { Lead, LeadProps } from '../../domain/entities/Lead.js';
import { LeadRepository } from '../../infrastructure/repositories/LeadRepository.js';
import { ContactService } from './ContactService.js';
import { PipelineService } from './PipelineService.js';
import { BookingService, CreateBookingDTO } from './BookingService.js';
import { LeadFilters } from '../../domain/interfaces/ILeadRepository.js';

export class LeadService {
    constructor(
        private leadRepository: LeadRepository,
        private contactService: ContactService,
        private pipelineService: PipelineService,
        private bookingService: BookingService // Inject Booking Service
    ) { }

    async convertToBooking(leadId: string, tenantId: string, bookingDetails: Partial<CreateBookingDTO>): Promise<void> {
        const lead = await this.leadRepository.findById(leadId, tenantId);
        if (!lead) throw new Error('Lead not found');

        // 1. Create Booking
        // Map Lead details to Booking if missing
        await this.bookingService.createBooking({
            tenantId,
            leadId: lead.id,
            createdById: lead.assignedToId || 'system', // TODO: Pass user ID from context
            source: lead.source || 'CRM',
            status: 'CONFIRMED', // Default for conversion
            resourceId: bookingDetails.resourceId!, // Required
            startDate: bookingDetails.startDate!, // Required
            endDate: bookingDetails.endDate!, // Required
            baseAmount: bookingDetails.baseAmount || lead.score * 10, // Dummy fallback
            totalAmount: bookingDetails.totalAmount || lead.score * 10,
            currency: 'USD',
            guestName: lead.name,
            ...bookingDetails
        } as CreateBookingDTO);

        // 2. Mark Lead as WON (Move to WON stage)
        const pipelines = await this.pipelineService.getPipelines(tenantId);
        const pipeline = pipelines.find(p => p.id === (lead.pipelineId || pipelines[0].id));
        if (pipeline) {
            const wonStage = pipeline.stages.find(s => s.type === 'WON');
            if (wonStage) {
                await this.moveStage(leadId, tenantId, wonStage.id);
            }
        }
    }

    async createLead(props: LeadProps): Promise<Lead> {
        // 1. Ensure Contact Exists
        let contactId = props.contactId;
        if (!contactId && (props.email || props.phone)) {
            // Auto-create/find contact
            const contact = await this.contactService.createOrUpdateContact({
                tenantId: props.tenantId,
                firstName: props.name.split(' ')[0],
                lastName: props.name.split(' ').slice(1).join(' '),
                email: props.email,
                phone: props.phone,
                // Add default tags/preferences if needed
            });
            contactId = contact.id;
        }

        // 2. Ensure Pipeline & Stage
        let pipelineId = props.pipelineId;
        let stageId = props.stageId;

        if (!pipelineId) {
            const pipelines = await this.pipelineService.getPipelines(props.tenantId);
            const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0];
            pipelineId = defaultPipeline.id;
            if (!stageId) {
                stageId = defaultPipeline.stages[0].id; // First stage
            }
        }

        // 3. Create Lead
        const lead = Lead.create({
            ...props,
            contactId,
            pipelineId,
            stageId
        });

        return this.leadRepository.save(lead);
    }

    async updateLead(id: string, tenantId: string, updates: Partial<LeadProps>): Promise<Lead> {
        const existing = await this.leadRepository.findById(id, tenantId);
        if (!existing) throw new Error('Lead not found');

        // Allow updates
        // Reconstruct for now (cleaner would be setters on Entity)
        const updated = Lead.fromPersistence({
            ...existing, // Explode generic props. In real code, explicit mapping is safer.
            ...updates,
            id: existing.id,
            tenantId: existing.tenantId, // Immutable
            updatedAt: new Date()
        } as any);

        return this.leadRepository.save(updated);
    }

    async moveStage(id: string, tenantId: string, stageId: string): Promise<Lead> {
        return this.updateLead(id, tenantId, { stageId });
    }

    async getLeads(tenantId: string, filters: LeadFilters) {
        return this.leadRepository.findAll(tenantId, filters);
    }

    async getBoard(tenantId: string, pipelineId: string) {
        return this.leadRepository.findByPipeline(pipelineId, tenantId);
    }
}
