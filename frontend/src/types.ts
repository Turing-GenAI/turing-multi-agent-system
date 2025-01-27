export type FindingSeverity = 'Critical' | 'Major' | 'Minor';
export type FindingStatus = 'Open' | 'Resolved' | 'In Progress';
export type FindingCategory = 'Protocol Deviation' | 'Adverse Event' | 'Site Generated Report';

export interface Finding {
  id: string;
  subjectId: string;
  description:string;
  severity: FindingSeverity;
  status: FindingStatus;
  category: FindingCategory;
  comments: string;
  protocolName: string;
  principalInvestigator: string;
  startDate: Date;
  endDate: Date | null;
  daysOutstanding: number;
  siteId: string;
  studyId: string;
  assignedTo?: string;
  lastUpdated: Date;
  attachments?: string[];
}
