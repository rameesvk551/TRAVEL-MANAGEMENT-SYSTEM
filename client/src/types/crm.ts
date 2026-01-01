export interface PipelineStage {
    id: string;
    name: string;
    color: string;
    type: 'OPEN' | 'WON' | 'LOST' | 'IDLE';
    order: number;
}

export interface Pipeline {
    id: string;
    name: string;
    isDefault: boolean;
    stages: PipelineStage[];
}

export interface LeadTravelPreferences {
    startDate?: string;
    endDate?: string;
    budget?: number; // min or max?
    destination?: string;
    travelStyle?: string; // Luxury, Budget, Adv
}

export interface Lead {
    id: string;
    tenantId: string;
    pipelineId?: string;
    stageId?: string;
    contactId?: string;
    name: string;
    email?: string;
    phone?: string;
    assignedToId?: string;
    source?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: string;
    score: number;
    tags: string[]; // ['vip', 'honeymoon']
    travelPreferences?: LeadTravelPreferences;
    createdAt: string;
    updatedAt: string;
}

export interface Contact {
    id: string;
    tenantId: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    tags: string[];
    travelHistory: Record<string, unknown>;
    preferences: Record<string, unknown>;
    socialHandles: Record<string, string>;
}

export interface Activity {
    id: string;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'NOTE' | 'TASK';
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    outcome?: string;
    subject: string;
    description?: string;
    scheduledAt?: string;
    completedAt?: string;
    createdAt: string;
    leadId?: string;
    createdBy?: string;
    createdByName?: string;
}

export interface LeadNote {
    id: string;
    leadId: string;
    content: string;
    createdAt: string;
    createdBy: string;
    createdByName?: string;
}

export interface FollowUp {
    id: string;
    leadId: string;
    type: 'CALL' | 'EMAIL' | 'VISIT' | 'MEETING' | 'WHATSAPP';
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
    scheduledDate: string;
    scheduledTime?: string;
    note?: string;
    createdAt: string;
    createdBy: string;
    createdByName?: string;
}

export interface LeadAssignee {
    id: string;
    name: string;
    email?: string;
}

export interface TimelineEvent {
    id: string;
    type: 'NOTE_ADDED' | 'FOLLOWUP_SCHEDULED' | 'FOLLOWUP_COMPLETED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'STAGE_CHANGED' | 'CREATED';
    description: string;
    metadata?: {
        from?: string;
        to?: string;
        fromLabel?: string;
        toLabel?: string;
    };
    createdAt: string;
    createdBy?: string;
    createdByName?: string;
}
