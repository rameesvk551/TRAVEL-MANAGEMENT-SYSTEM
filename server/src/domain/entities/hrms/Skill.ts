// domain/entities/hrms/Skill.ts
// Skills, certifications, and competencies

export type SkillCategory = 
  | 'TECHNICAL' 
  | 'SOFT' 
  | 'LANGUAGE' 
  | 'CERTIFICATION' 
  | 'LICENSE'
  | 'MEDICAL'
  | 'SAFETY';

export type ProficiencyLevel = 
  | 'BEGINNER' 
  | 'INTERMEDIATE' 
  | 'ADVANCED' 
  | 'EXPERT';

export interface Skill {
  id: string;
  tenantId: string;
  
  code: string;
  name: string;
  description?: string;
  category: SkillCategory;
  
  // For certifications/licenses
  requiresExpiry: boolean;
  requiresVerification: boolean;
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSkill {
  id: string;
  tenantId: string;
  employeeId: string;
  skillId: string;
  
  proficiency: ProficiencyLevel;
  
  // For certifications
  certificationNumber?: string;
  issuedBy?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Document proof
  documentUrl?: string;
  
  // Notes
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Pre-defined skills for travel industry
export const TRAVEL_SKILLS = {
  // Certifications
  FIRST_AID: 'FIRST_AID',
  WILDERNESS_FIRST_RESPONDER: 'WFR',
  HIGH_ALTITUDE_TRAINED: 'HAT',
  
  // Licenses
  DRIVING_LICENSE: 'DL',
  COMMERCIAL_VEHICLE: 'CV',
  MOUNTAINEERING_CERT: 'MC',
  
  // Languages
  HINDI: 'LANG_HI',
  ENGLISH: 'LANG_EN',
  FRENCH: 'LANG_FR',
  GERMAN: 'LANG_DE',
  
  // Technical
  ROCK_CLIMBING: 'ROCK',
  ICE_CLIMBING: 'ICE',
  RAFTING_GUIDE: 'RAFT',
  SKIING_INSTRUCTOR: 'SKI',
} as const;

export function createEmployeeSkill(
  params: Omit<EmployeeSkill, 'id' | 'createdAt' | 'updatedAt' | 'isVerified'>
): Omit<EmployeeSkill, 'id'> {
  return {
    ...params,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function isSkillExpiring(skill: EmployeeSkill, daysThreshold = 30): boolean {
  if (!skill.expiryDate) return false;
  
  const now = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  
  return skill.expiryDate <= threshold && skill.expiryDate > now;
}

export function isSkillExpired(skill: EmployeeSkill): boolean {
  if (!skill.expiryDate) return false;
  return skill.expiryDate < new Date();
}

export function getProficiencyScore(level: ProficiencyLevel): number {
  const scores: Record<ProficiencyLevel, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  };
  return scores[level];
}
