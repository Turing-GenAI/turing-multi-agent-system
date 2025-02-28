import { Finding, FindingCategory, FindingSeverity, FindingStatus } from './types';

const generateMockFindings = (): Finding[] => {
  const mockFindings: Finding[] = [
    {
      id: 'PD001',
      subjectId: 'SUB-101',
      severity: 'Critical',
      status: 'Open',
      category: 'Protocol Deviation',
      comments: 'Subject missed two consecutive dosing schedules without proper documentation',
      protocolName: 'PROTO-2024-001',
      principalInvestigator: 'Dr. Sarah Johnson',
      startDate: new Date('2024-01-15'),
      endDate: null,
      daysOutstanding: 9,
      siteId: 'SITE-001',
      studyId: 'STUDY-2024-001',
      assignedTo: 'Jane Smith',
      lastUpdated: new Date('2024-01-23'),
      attachments: ['missed_dose_report.pdf']
    },
    {
      id: 'PD002',
      subjectId: 'SUB-102',
      severity: 'Major',
      status: 'Open',
      category: 'Protocol Deviation',
      comments: 'Incorrect storage temperature for study medication',
      protocolName: 'PROTO-2024-001',
      principalInvestigator: 'Dr. Sarah Johnson',
      startDate: new Date('2024-01-18'),
      endDate: null,
      daysOutstanding: 6,
      siteId: 'SITE-001',
      studyId: 'STUDY-2024-001',
      assignedTo: 'Mike Brown',
      lastUpdated: new Date('2024-01-22'),
      attachments: ['temperature_log.pdf']
    },
    {
      id: 'AE001',
      subjectId: 'SUB-103',
      severity: 'Major',
      status: 'In Progress',
      category: 'Adverse Event',
      comments: 'Subject reported severe headache after medication administration',
      protocolName: 'PROTO-2024-001',
      principalInvestigator: 'Dr. Robert Wilson',
      startDate: new Date('2024-01-20'),
      endDate: null,
      daysOutstanding: 4,
      siteId: 'SITE-002',
      studyId: 'STUDY-2024-001',
      assignedTo: 'Lisa Chen',
      lastUpdated: new Date('2024-01-23'),
      attachments: ['ae_report.pdf']
    },
    {
      id: 'PD003',
      subjectId: 'SUB-104',
      severity: 'Minor',
      status: 'Resolved',
      category: 'Protocol Deviation',
      comments: 'Visit window exceeded by 1 day',
      protocolName: 'PROTO-2024-001',
      principalInvestigator: 'Dr. Sarah Johnson',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-22'),
      daysOutstanding: 12,
      siteId: 'SITE-001',
      studyId: 'STUDY-2024-001',
      assignedTo: 'Jane Smith',
      lastUpdated: new Date('2024-01-22')
    },
    {
      id: 'SGR001',
      subjectId: 'SUB-105',
      severity: 'Minor',
      status: 'Open',
      category: 'Site Generated Report',
      comments: 'Site staff training documentation incomplete',
      protocolName: 'PROTO-2024-001',
      principalInvestigator: 'Dr. Robert Wilson',
      startDate: new Date('2024-01-21'),
      endDate: null,
      daysOutstanding: 3,
      siteId: 'SITE-002',
      studyId: 'STUDY-2024-001',
      assignedTo: 'Mike Brown',
      lastUpdated: new Date('2024-01-23')
    }
  ];

  return mockFindings;
};

export const mockFindings = generateMockFindings();

// Helper functions to filter findings
export const filterFindingsByCategory = (findings: Finding[], category: FindingCategory) => {
  return findings.filter(finding => finding.category === category);
};

export const filterFindingsByStatus = (findings: Finding[], status: FindingStatus) => {
  return findings.filter(finding => finding.status === status);
};

export const filterFindingsBySeverity = (findings: Finding[], severity: FindingSeverity) => {
  return findings.filter(finding => finding.severity === severity);
};
