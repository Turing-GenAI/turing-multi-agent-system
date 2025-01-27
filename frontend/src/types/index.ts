export interface Message {
  id: string;
  agent: string;
  content: string;
  timestamp: Date;
  isUser?: boolean;
}

export interface Finding {
  id: string;
  subjectId: string;
  siteId: string;
  category: string;
  severity: string;
  description: string;
  comments: string;
  protocolName: string;
  country: string;
  principalInvestigator: string;
  deviation: string;
  actionTaken: string;
  createdDate: Date;
  startDate: Date;
  endDate: Date | null;
  daysOutstanding: number;
  daysToVisit: number;
  subjectAge: number;
  reasonForVisitExclusion: string;
  inForPDS: boolean;
}export interface Message {
  id: string;
  agent: string;
  content: string;
  timestamp: Date;
  isUser?: boolean;
}

export interface Finding {
  id: string;
  subjectId: string;
  siteId: string;
  category: string;
  severity: string;
  description: string;
  comments: string;
  protocolName: string;
  country: string;
  principalInvestigator: string;
  deviation: string;
  actionTaken: string;
  createdDate: Date;
  startDate: Date;
  endDate: Date | null;
  daysOutstanding: number;
  daysToVisit: number;
  subjectAge: number;
  reasonForVisitExclusion: string;
  inForPDS: boolean;
}