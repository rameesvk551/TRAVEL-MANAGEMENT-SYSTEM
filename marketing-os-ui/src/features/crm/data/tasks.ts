export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface CrmTask {
    id: string;
    leadId: string | null;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;        // ISO date
    assignedTo: string;
}

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
export const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

export const tasks: CrmTask[] = [
    { id: 'T-001', leadId: 'LD-1001', title: 'Send revised family trip quote', priority: 'High', status: 'To Do', dueDate: '2026-03-05', assignedTo: 'Riya Sharma' },
    { id: 'T-002', leadId: 'LD-1002', title: 'Follow up on Europe tour visa docs', priority: 'Medium', status: 'In Progress', dueDate: '2026-03-03', assignedTo: 'Kabir Anand' },
    { id: 'T-003', leadId: 'LD-1003', title: 'Prepare corporate offsite proposal deck', priority: 'High', status: 'To Do', dueDate: '2026-03-07', assignedTo: 'Riya Sharma' },
    { id: 'T-004', leadId: 'LD-1004', title: 'Confirm Bali hotel availability', priority: 'Medium', status: 'In Progress', dueDate: '2026-03-02', assignedTo: 'Arjun Das' },
    { id: 'T-005', leadId: 'LD-1005', title: 'Book Ladakh trek permits', priority: 'High', status: 'To Do', dueDate: '2026-03-10', assignedTo: 'Kabir Anand' },
    { id: 'T-006', leadId: 'LD-1006', title: 'Send Thailand visa checklist', priority: 'Low', status: 'Done', dueDate: '2026-02-28', assignedTo: 'Meera Joshi' },
    { id: 'T-007', leadId: 'LD-1007', title: 'Generate final invoice — Kashmir', priority: 'Low', status: 'Done', dueDate: '2026-02-25', assignedTo: 'Arjun Das' },
    { id: 'T-008', leadId: 'LD-1008', title: 'Arrange airport transfer for Dubai trip', priority: 'Medium', status: 'In Progress', dueDate: '2026-03-04', assignedTo: 'Meera Joshi' },
    { id: 'T-009', leadId: null, title: 'Update CRM lead source tags', priority: 'Low', status: 'To Do', dueDate: '2026-03-12', assignedTo: 'Riya Sharma' },
    { id: 'T-010', leadId: 'LD-1011', title: 'Negotiate Thailand hotel group rate', priority: 'High', status: 'To Do', dueDate: '2026-03-06', assignedTo: 'Meera Joshi' },
    { id: 'T-011', leadId: 'LD-1012', title: 'Email student group parents consent forms', priority: 'Medium', status: 'To Do', dueDate: '2026-03-08', assignedTo: 'Arjun Das' },
    { id: 'T-012', leadId: null, title: 'Weekly pipeline review meeting', priority: 'Low', status: 'In Progress', dueDate: '2026-03-01', assignedTo: 'Riya Sharma' },
];
