import { Message, Finding } from '../types';

export const trials = [
  'CNTO1275PUC3001',
  'RIVAROXHFA3001',
  '90014496LYM1001'
];

type Site = {
  id: string;
  status: string;
};

type Sites = {
  [K in typeof trials[number]]: Site[];
};

export const sites: Sites = {
  'CNTO1275PUC3001': [
    { id: 'P73-PL10007', status: 'completed' },
    { id: 'P73-PL10008', status: 'pending' },
    { id: 'U4-JP1002', status: 'pending' },
    { id: 'U4-JP1003', status: 'completed' }
  ],
  'RIVAROXHFA3001': [
    { id: 'AR00091', status: 'completed' }
  ],
  '90014496LYM1001': [
    { id: 'BV7-US10007', status: 'pending' }
  ]
};

export const mockResponses = {
  trial_master_agent: {
    initial: [
      {
        id: 'tm1',
        agent: 'trial_master_agent',
        content: 'Initiating trial master review...',
        timestamp: new Date()
      }
    ],
    responses: [
      "Initial assessment complete. Found 3 protocol deviations in the last 30 days.",
      "Visit schedule analysis shows 92% compliance rate.",
      "Data completeness check: 15 queries pending site response."
    ]
  },
  inspection_master_agent: {
    initial: [
      {
        id: 'im1',
        agent: 'inspection_master_agent',
        content: 'Beginning inspection readiness assessment...',
        timestamp: new Date()
      }
    ],
    responses: [
      "Essential document review complete: 3 documents require updating.",
      "Regulatory compliance status: 2 minor findings identified.",
      "Quality metrics show improvement in data entry timeliness."
    ]
  },
  crm_master_agent: {
    initial: [
      {
        id: 'cm1',
        agent: 'crm_master_agent',
        content: 'Starting risk-based monitoring analysis...',
        timestamp: new Date()
      }
    ],
    responses: [
      "Risk assessment updated: Site risk level is moderate.",
      "Performance metrics indicate a need for additional site training.",
      "Resource allocation analysis complete."
    ]
  }
};

export const pdFindings: Finding[] = [
  {
    id: '1',
    subjectId: 'SUBJ-001',
    siteId: 'SITE-001',
    category: 'Protocol Deviation',
    severity: 'Major',
    description: 'Visit window deviation',
    comments: 'Subject visited outside of protocol-specified window',
    protocolName: 'TRIAL-001-2024',
    country: 'United States',
    principalInvestigator: 'Dr. Smith',
    deviation: 'Visit Schedule',
    actionTaken: 'Documentation updated',
    createdDate: new Date(2024, 2, 1),
    startDate: new Date(2024, 2, 1),
    endDate: new Date(2024, 2, 15),
    daysOutstanding: 14,
    daysToVisit: 7,
    subjectAge: 45,
    reasonForVisitExclusion: 'Personal emergency',
    inForPDS: true
  }
];

export const aeFindings: Finding[] = [
  {
    id: '2',
    subjectId: 'SUBJ-002',
    siteId: 'SITE-001',
    category: 'Adverse Event',
    severity: 'Critical',
    description: 'Unreported SAE',
    comments: 'SAE not reported within 24-hour window',
    protocolName: 'TRIAL-001-2024',
    country: 'United States',
    principalInvestigator: 'Dr. Smith',
    deviation: 'Safety Reporting',
    actionTaken: 'Site contacted for immediate reporting',
    createdDate: new Date(2024, 2, 1),
    startDate: new Date(2024, 2, 1),
    endDate: null,
    daysOutstanding: 2,
    daysToVisit: 0,
    subjectAge: 52,
    reasonForVisitExclusion: '',
    inForPDS: true
  }
];

export const sgrFindings: Finding[] = [
  {
    id: '3',
    subjectId: 'SUBJ-003',
    siteId: 'SITE-001',
    category: 'Site Generated Report',
    severity: 'Minor',
    description: 'Missing source documentation',
    comments: 'Source documents not uploaded for recent visit',
    protocolName: 'TRIAL-001-2024',
    country: 'United States',
    principalInvestigator: 'Dr. Smith',
    deviation: 'Documentation',
    actionTaken: 'Follow-up requested',
    createdDate: new Date(2024, 2, 1),
    startDate: new Date(2024, 2, 1),
    endDate: null,
    daysOutstanding: 5,
    daysToVisit: 0,
    subjectAge: 48,
    reasonForVisitExclusion: '',
    inForPDS: false
  }
];