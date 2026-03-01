export type DealStage = 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export const DEAL_STAGES: DealStage[] = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export interface Deal {
    id: string;
    leadId: string;
    title: string;
    value: number;          // INR
    stage: DealStage;
    probability: number;    // 0–100
    expectedClose: string;  // ISO date
    assignedTo: string;
}

export const deals: Deal[] = [
    { id: 'DL-001', leadId: 'LD-1001', title: 'Patel Family Summer Trip', value: 185000, stage: 'Proposal', probability: 60, expectedClose: '2026-04-10', assignedTo: 'Riya Sharma' },
    { id: 'DL-002', leadId: 'LD-1002', title: 'Singh Europe Tour', value: 420000, stage: 'Negotiation', probability: 75, expectedClose: '2026-03-28', assignedTo: 'Kabir Anand' },
    { id: 'DL-003', leadId: 'LD-1003', title: 'Zenit Corp Offsite', value: 750000, stage: 'Discovery', probability: 30, expectedClose: '2026-05-15', assignedTo: 'Riya Sharma' },
    { id: 'DL-004', leadId: 'LD-1004', title: 'Bali Honeymoon Package', value: 210000, stage: 'Proposal', probability: 55, expectedClose: '2026-04-05', assignedTo: 'Arjun Das' },
    { id: 'DL-005', leadId: 'LD-1005', title: 'Ladakh Adventure Trek', value: 95000, stage: 'Negotiation', probability: 80, expectedClose: '2026-03-20', assignedTo: 'Kabir Anand' },
    { id: 'DL-006', leadId: 'LD-1006', title: 'Thailand Family Getaway', value: 265000, stage: 'Discovery', probability: 25, expectedClose: '2026-05-01', assignedTo: 'Meera Joshi' },
    { id: 'DL-007', leadId: 'LD-1007', title: 'Kashmir Houseboat Booking', value: 148000, stage: 'Closed Won', probability: 100, expectedClose: '2026-03-01', assignedTo: 'Arjun Das' },
    { id: 'DL-008', leadId: 'LD-1008', title: 'Luxury Dubai Package', value: 520000, stage: 'Closed Won', probability: 100, expectedClose: '2026-03-05', assignedTo: 'Meera Joshi' },
    { id: 'DL-009', leadId: 'LD-1009', title: 'Budget Maldives Trip', value: 110000, stage: 'Closed Lost', probability: 0, expectedClose: '2026-02-28', assignedTo: 'Riya Sharma' },
    { id: 'DL-010', leadId: 'LD-1010', title: 'Goa Weekend Escape', value: 42000, stage: 'Discovery', probability: 20, expectedClose: '2026-04-20', assignedTo: 'Kabir Anand' },
    { id: 'DL-011', leadId: 'LD-1011', title: 'Thailand Beach Retreat', value: 195000, stage: 'Proposal', probability: 50, expectedClose: '2026-04-15', assignedTo: 'Meera Joshi' },
    { id: 'DL-012', leadId: 'LD-1012', title: 'Student Group Europe Tour', value: 880000, stage: 'Negotiation', probability: 65, expectedClose: '2026-06-01', assignedTo: 'Arjun Das' },
];
