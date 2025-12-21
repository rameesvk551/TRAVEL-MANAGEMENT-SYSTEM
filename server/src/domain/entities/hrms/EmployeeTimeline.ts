// domain/entities/hrms/EmployeeTimeline.ts
// Immutable history log for employee events

export type TimelineEventType =
  | 'JOINED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'DEPARTMENT_CHANGED'
  | 'BRANCH_CHANGED'
  | 'PROMOTION'
  | 'SALARY_REVISED'
  | 'LEAVE_STARTED'
  | 'LEAVE_ENDED'
  | 'TRIP_ASSIGNED'
  | 'TRIP_COMPLETED'
  | 'DOCUMENT_ADDED'
  | 'SKILL_ADDED'
  | 'TRAINING_COMPLETED'
  | 'WARNING_ISSUED'
  | 'NOTICE_SUBMITTED'
  | 'RESIGNED'
  | 'TERMINATED'
  | 'REHIRED'
  | 'CUSTOM';

export interface TimelineEvent {
  id: string;
  tenantId: string;
  employeeId: string;
  
  eventType: TimelineEventType;
  eventDate: Date;
  
  // Context
  title: string;
  description?: string;
  
  // References
  referenceType?: string;  // 'trip', 'leave', 'document'
  referenceId?: string;
  
  // Change tracking
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  
  // Actor
  createdBy: string;
  createdAt: Date;
  
  // Visibility
  isPrivate: boolean;  // HR-only events
}

export function createTimelineEvent(
  params: Omit<TimelineEvent, 'id' | 'createdAt'>
): Omit<TimelineEvent, 'id'> {
  return {
    ...params,
    createdAt: new Date(),
  };
}

export function formatEventTitle(
  eventType: TimelineEventType,
  context?: Record<string, string>
): string {
  const templates: Record<TimelineEventType, string> = {
    JOINED: 'Joined the team',
    ROLE_ASSIGNED: `Assigned as ${context?.role || 'new role'}`,
    ROLE_REMOVED: `Removed from ${context?.role || 'role'}`,
    DEPARTMENT_CHANGED: `Moved to ${context?.department || 'department'}`,
    BRANCH_CHANGED: `Transferred to ${context?.branch || 'branch'}`,
    PROMOTION: `Promoted to ${context?.position || 'new position'}`,
    SALARY_REVISED: 'Salary revised',
    LEAVE_STARTED: `Started ${context?.leaveType || ''} leave`,
    LEAVE_ENDED: 'Returned from leave',
    TRIP_ASSIGNED: `Assigned to ${context?.trip || 'trip'}`,
    TRIP_COMPLETED: `Completed ${context?.trip || 'trip'}`,
    DOCUMENT_ADDED: `Added ${context?.document || 'document'}`,
    SKILL_ADDED: `Added skill: ${context?.skill || ''}`,
    TRAINING_COMPLETED: `Completed ${context?.training || 'training'}`,
    WARNING_ISSUED: 'Warning issued',
    NOTICE_SUBMITTED: 'Submitted resignation notice',
    RESIGNED: 'Resigned',
    TERMINATED: 'Employment terminated',
    REHIRED: 'Rehired',
    CUSTOM: context?.title || 'Event',
  };
  
  return templates[eventType];
}
