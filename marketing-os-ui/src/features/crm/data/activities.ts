export type ActivityType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';

export interface Activity {
    id: string;
    leadId: string;
    type: ActivityType;
    description: string;
    timestamp: string;
    agent: string;
}

export const activities: Activity[] = [
    { id: 'A-001', leadId: 'LD-1001', type: 'call', description: 'Introductory call — discussed family trip options', timestamp: '2026-02-20T10:30:00', agent: 'Riya Sharma' },
    { id: 'A-002', leadId: 'LD-1001', type: 'email', description: 'Sent brochure for summer destinations', timestamp: '2026-02-20T14:00:00', agent: 'Riya Sharma' },
    { id: 'A-003', leadId: 'LD-1002', type: 'whatsapp', description: 'Shared Europe tour itinerary PDF', timestamp: '2026-02-18T11:15:00', agent: 'Kabir Anand' },
    { id: 'A-004', leadId: 'LD-1003', type: 'call', description: 'Follow-up on corporate group booking inquiry', timestamp: '2026-02-24T09:00:00', agent: 'Riya Sharma' },
    { id: 'A-005', leadId: 'LD-1003', type: 'meeting', description: 'On-site meeting at Zenit office for group proposal', timestamp: '2026-02-25T15:00:00', agent: 'Riya Sharma' },
    { id: 'A-006', leadId: 'LD-1004', type: 'whatsapp', description: 'Sent Bali honeymoon package details', timestamp: '2026-02-25T12:30:00', agent: 'Arjun Das' },
    { id: 'A-007', leadId: 'LD-1005', type: 'call', description: 'Discussed trek options — interested in Ladakh', timestamp: '2026-02-26T10:00:00', agent: 'Kabir Anand' },
    { id: 'A-008', leadId: 'LD-1005', type: 'email', description: 'Sent cost breakdown for Ladakh adventure trek', timestamp: '2026-02-26T16:00:00', agent: 'Kabir Anand' },
    { id: 'A-009', leadId: 'LD-1006', type: 'whatsapp', description: 'Visa support documents checklist sent', timestamp: '2026-02-27T09:30:00', agent: 'Meera Joshi' },
    { id: 'A-010', leadId: 'LD-1007', type: 'call', description: 'Booking confirmed — Kashmir package finalised', timestamp: '2026-02-22T11:00:00', agent: 'Arjun Das' },
    { id: 'A-011', leadId: 'LD-1007', type: 'note', description: 'Payment received via bank transfer', timestamp: '2026-02-22T17:30:00', agent: 'Arjun Das' },
    { id: 'A-012', leadId: 'LD-1008', type: 'meeting', description: 'Luxury Dubai package walkthrough at office', timestamp: '2026-02-21T14:00:00', agent: 'Meera Joshi' },
    { id: 'A-013', leadId: 'LD-1008', type: 'email', description: 'Invoice and payment link sent', timestamp: '2026-02-21T18:00:00', agent: 'Meera Joshi' },
    { id: 'A-014', leadId: 'LD-1009', type: 'call', description: 'Budget too low — offered domestic alternatives', timestamp: '2026-02-15T10:00:00', agent: 'Riya Sharma' },
    { id: 'A-015', leadId: 'LD-1009', type: 'note', description: 'Marked as lost — no response after 2 follow-ups', timestamp: '2026-02-18T09:00:00', agent: 'Riya Sharma' },
    { id: 'A-016', leadId: 'LD-1010', type: 'whatsapp', description: 'Goa weekend pricing shared', timestamp: '2026-02-17T13:00:00', agent: 'Kabir Anand' },
    { id: 'A-017', leadId: 'LD-1011', type: 'call', description: 'Thailand package discussion — keen on quick close', timestamp: '2026-02-27T10:30:00', agent: 'Meera Joshi' },
    { id: 'A-018', leadId: 'LD-1012', type: 'email', description: 'Sent student group Europe tour proposal', timestamp: '2026-02-23T11:00:00', agent: 'Arjun Das' },
];
