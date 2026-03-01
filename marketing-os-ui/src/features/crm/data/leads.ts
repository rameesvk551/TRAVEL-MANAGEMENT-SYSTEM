export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';
export type LeadSource = 'Website' | 'WhatsApp' | 'Referral';

export interface LeadRecord {
    id: string;
    name: string;
    phone: string;
    email: string;
    status: LeadStatus;
    source: LeadSource;
    assignedTo: string;
    lastContact: string;
    tags: string[];
}

export const LEAD_STATUS_ORDER: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
export const DEFAULT_LEAD_NOTES = ['Called customer', 'Interested in package', 'Follow up tomorrow'];

export const leads: LeadRecord[] = [
    {
        id: 'LD-1001',
        name: 'Aarav Mehta',
        phone: '+91 98765 43210',
        email: 'aarav.mehta@skyline.io',
        status: 'New',
        source: 'Website',
        assignedTo: 'Riya Sharma',
        lastContact: '2026-02-20',
        tags: ['family trip', 'summer'],
    },
    {
        id: 'LD-1002',
        name: 'Neha Kapoor',
        phone: '+91 98111 22334',
        email: 'neha.kapoor@outlook.com',
        status: 'New',
        source: 'Referral',
        assignedTo: 'Kabir Anand',
        lastContact: '2026-02-18',
        tags: ['europe', 'premium'],
    },
    {
        id: 'LD-1003',
        name: 'Vikram Singh',
        phone: '+91 99000 12000',
        email: 'vikram.singh@zenit.in',
        status: 'Contacted',
        source: 'WhatsApp',
        assignedTo: 'Riya Sharma',
        lastContact: '2026-02-24',
        tags: ['corporate', 'group booking'],
    },
    {
        id: 'LD-1004',
        name: 'Ishita Rao',
        phone: '+91 98220 55667',
        email: 'ishita.rao@gmail.com',
        status: 'Contacted',
        source: 'Website',
        assignedTo: 'Arjun Das',
        lastContact: '2026-02-25',
        tags: ['honeymoon', 'bali'],
    },
    {
        id: 'LD-1005',
        name: 'Rahul Nair',
        phone: '+91 98888 77665',
        email: 'rahul.nair@bluepeak.net',
        status: 'Qualified',
        source: 'Referral',
        assignedTo: 'Kabir Anand',
        lastContact: '2026-02-26',
        tags: ['adventure', 'trek'],
    },
    {
        id: 'LD-1006',
        name: 'Priya Bansal',
        phone: '+91 97771 88990',
        email: 'priya.bansal@yahoo.com',
        status: 'Qualified',
        source: 'WhatsApp',
        assignedTo: 'Meera Joshi',
        lastContact: '2026-02-27',
        tags: ['international', 'visa support'],
    },
    {
        id: 'LD-1007',
        name: 'Omkar Patil',
        phone: '+91 99123 45678',
        email: 'omkar.patil@gmail.com',
        status: 'Won',
        source: 'Website',
        assignedTo: 'Arjun Das',
        lastContact: '2026-02-22',
        tags: ['kashmir', 'family'],
    },
    {
        id: 'LD-1008',
        name: 'Sana Ali',
        phone: '+91 99345 11223',
        email: 'sana.ali@northstar.com',
        status: 'Won',
        source: 'Referral',
        assignedTo: 'Meera Joshi',
        lastContact: '2026-02-21',
        tags: ['luxury', 'dubai'],
    },
    {
        id: 'LD-1009',
        name: 'Karan Verma',
        phone: '+91 98989 66778',
        email: 'karan.verma@zylinx.com',
        status: 'Lost',
        source: 'Website',
        assignedTo: 'Riya Sharma',
        lastContact: '2026-02-15',
        tags: ['budget', 'domestic'],
    },
    {
        id: 'LD-1010',
        name: 'Ananya Das',
        phone: '+91 97000 44556',
        email: 'ananya.das@gmail.com',
        status: 'Lost',
        source: 'WhatsApp',
        assignedTo: 'Kabir Anand',
        lastContact: '2026-02-17',
        tags: ['goa', 'weekend'],
    },
    {
        id: 'LD-1011',
        name: 'Dev Malhotra',
        phone: '+91 97654 33221',
        email: 'dev.malhotra@fino.in',
        status: 'Qualified',
        source: 'Website',
        assignedTo: 'Meera Joshi',
        lastContact: '2026-02-27',
        tags: ['thailand', 'quick close'],
    },
    {
        id: 'LD-1012',
        name: 'Tanya Sen',
        phone: '+91 99555 77889',
        email: 'tanya.sen@avion.co',
        status: 'Contacted',
        source: 'Referral',
        assignedTo: 'Arjun Das',
        lastContact: '2026-02-23',
        tags: ['students', 'europe'],
    },
];
