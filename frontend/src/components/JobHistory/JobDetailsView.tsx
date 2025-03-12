import React from 'react';
import { X, MessageSquare, FileWarning, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { ProcessedContext } from './types';
import AgentMessagesView from './AgentMessagesView';
import FindingsView from './FindingsView';
import RetrievedContextView from './RetrievedContextView';

interface JobDetailsViewProps {
  jobId: string;
  onClose: () => void;
  aiMessages: string[];
  findings: any;
  retrievedContext: ProcessedContext | null;
  loadingMessages: boolean;
  loadingFindings: boolean;
  loadingContext: boolean;
  activeTab: 'messages' | 'pd' | 'ae' | 'context';
  onTabChange: (tab: 'messages' | 'pd' | 'ae' | 'context') => void;
}

const JobDetailsView: React.FC<JobDetailsViewProps> = ({
  jobId,
  onClose,
  aiMessages,
  findings,
  retrievedContext,
  loadingMessages,
  loadingFindings,
  loadingContext,
  activeTab,
  onTabChange
}) => {
  return (
    <>
      {/* Detail Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">
          Agent Messages for Job: <span className="font-mono">{jobId}</span>
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
          title="Close panel"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-2">
        <button
          onClick={() => onTabChange('messages')}
          disabled={loadingMessages}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
            activeTab === 'messages' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } ${loadingMessages ? 'opacity-50' : ''}`}
        >
          <MessageSquare className="w-4 h-4" />
          {loadingMessages ? (
            <span className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading Messages...
            </span>
          ) : (
            <span>Agent Messages</span>
          )}
        </button>
        
        <button
          onClick={() => onTabChange('pd')}
          disabled={loadingFindings}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
            activeTab === 'pd' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } ${loadingFindings ? 'opacity-50' : ''}`}
        >
          <FileWarning className="w-4 h-4" />
          {loadingFindings ? (
            <span className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading PD...
            </span>
          ) : (
            <span>Protocol Deviations</span>
          )}
        </button>
        
        <button
          onClick={() => onTabChange('ae')}
          disabled={loadingFindings}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
            activeTab === 'ae' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } ${loadingFindings ? 'opacity-50' : ''}`}
        >
          <AlertCircle className="w-4 h-4" />
          {loadingFindings ? (
            <span className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading AE...
            </span>
          ) : (
            <span>Adverse Events</span>
          )}
        </button>
        
        <button
          onClick={() => onTabChange('context')}
          disabled={loadingContext}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
            activeTab === 'context' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } ${loadingContext ? 'opacity-50' : ''}`}
        >
          <Database className="w-4 h-4" />
          {loadingContext ? (
            <span className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> Loading Context...
            </span>
          ) : (
            <span>Retrieved Context</span>
          )}
        </button>
      </div>
      
      {/* Detail Content */}
      <div className="overflow-y-auto flex-1 p-4">
        {activeTab === 'messages' && (
          <AgentMessagesView 
            messages={aiMessages} 
            loading={loadingMessages} 
          />
        )}
        
        {activeTab === 'pd' && (
          <FindingsView 
            findings={findings} 
            loading={loadingFindings} 
            title="Protocol Deviation Findings"
            icon="warning"
            color="yellow"
          />
        )}
        
        {activeTab === 'ae' && (
          <FindingsView 
            findings={findings} 
            loading={loadingFindings} 
            title="Adverse Event Findings"
            icon="alert"
            color="orange"
          />
        )}
        
        {activeTab === 'context' && (
          <RetrievedContextView 
            context={retrievedContext} 
            loading={loadingContext} 
          />
        )}
      </div>
    </>
  );
};

export default JobDetailsView;
