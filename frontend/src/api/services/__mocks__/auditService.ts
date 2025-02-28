import { 
  AIMessagesRequest, 
  AIMessagesResponse, 
  ApiResponse, 
  ScheduleJobRequest,
  ScheduleJobResponse
} from '../../types';

// Mock response data
const mockAIMessages: AIMessagesResponse = {
  ai_messages: `================================== Ai Message ==================================
Hello! I am your AI assistant. How can I help you analyze the trial data today?

================================= Tool Message =================================
I am ready to help you analyze the data for your selected trial and site.`,
  findings: {
    pd: [
      {
        id: 'pd1',
        agent: 'trial_master',
        content: 'Protocol deviation found: Missing patient data in visit 3',
        timestamp: new Date().toISOString()
      }
    ],
    ae: [
      {
        id: 'ae1',
        agent: 'inspection_master',
        content: 'Adverse event not properly documented within 24 hours',
        timestamp: new Date().toISOString()
      }
    ],
    sgr: [
      {
        id: 'sgr1',
        agent: 'crm_master',
        content: 'Site generated report shows inconsistency in drug administration',
        timestamp: new Date().toISOString()
      }
    ]
  }
};

const mockScheduleJobResponse: ScheduleJobResponse = {
  job_id: 'mock-job-123',
  status: 'scheduled',
  message: 'Job scheduled successfully'
};

// Mock service implementation
export const mockAuditService = {
  getAIMessages: async (
    jobId: string,
    withFindings: boolean = false
  ): Promise<ApiResponse<AIMessagesResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // If withFindings is false, remove findings from response
    const response: AIMessagesResponse = withFindings 
      ? mockAIMessages
      : { ai_messages: mockAIMessages.ai_messages };

    return {
      data: response,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  },

  scheduleJob: async (
    siteId: string,
    trialId: string,
    dateRange: string
  ): Promise<ApiResponse<ScheduleJobResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      data: mockScheduleJobResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  },
};

export default mockAuditService;
