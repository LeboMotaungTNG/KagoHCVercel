export interface CreateDisciplinaryCaseDto {
  employeeId: string;
  reportedBy: string;
  incidentDate: Date;
  category: string;
  severity: string;
  description: string;
  evidence?: any[];
  witnesses?: any[];
  investigationOfficer?: string;
  hrOfficer?: string;
}

export interface UpdateDisciplinaryCaseDto {
  category?: string;
  severity?: string;
  description?: string;
  status?: string;
  investigationOfficer?: string;
  investigationReport?: string;
  recommendedAction?: string;
  hrOfficer?: string;
}

export interface ScheduleHearingDto {
  caseId: string;
  hearingDate: Date;
  hearingTime: string;
  venue: string;
  chairperson: string;
  employeeRepresentative?: string;
  employerRepresentative?: string;
  witnesses?: any[];
}

export interface UpdateHearingDto {
  hearingDate?: Date;
  hearingTime?: string;
  venue?: string;
  status?: string;
  minutes?: string;
  outcome?: string;
  decision?: string;
  decisionDate?: Date;
  communicatedToEmployee?: boolean;
}

export interface CreateSanctionDto {
  caseId: string;
  hearingId: string;
  type: string;
  severity: string;
  description: string;
  effectiveDate: Date;
  expiryDate?: Date;
  details?: any;
  conditions?: string[];
}

export interface CreateAppealDto {
  caseId: string;
  sanctionId: string;
  grounds: string[];
  reason: string;
  supportingDocuments?: any[];
}

export interface DisciplinaryReportFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  category?: string;
  severity?: string;
  status?: string;
  employeeId?: string;
}
