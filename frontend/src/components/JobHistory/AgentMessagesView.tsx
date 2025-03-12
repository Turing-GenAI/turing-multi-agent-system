import React from 'react';
import { MessageSquare } from 'lucide-react';
import { agentName } from '../../data/agentNames';

interface AgentMessagesViewProps {
  messages: string[] | string | any;
  loading: boolean;
}

const AgentMessagesView: React.FC<AgentMessagesViewProps> = ({ messages, loading }) => {
  // Helper function to clean subactivity values
  const cleanSubactivityValue = (value: string | undefined) => {
    if (!value) return '';
    
    // Extract activity ID if present
    const activityIdMatch = value.match(/<activity_id#([^>]+)>/);
    const activityId = activityIdMatch ? activityIdMatch[1] : '';
    
    // Remove the activity ID tag, hash marks, and trim
    const cleanedText = value
      .replace(/<activity_id#[^>]+>/, '')
      .replace(/###/, '')
      .trim()
      .replace(/^\d+_/, '') // Remove numeric prefixes (e.g., "1_")
      .replace(/^(sub[-_\s]?activity|activity)[:;]?\s*/i, ''); // Remove activity/subactivity prefix
    
    // Return formatted string with activity ID if available
    return activityId ? `${activityId} - ${cleanedText}` : cleanedText;
  };

  // Format agent messages for display
  const formatAgentMessage = (message: string) => {
    if (!message || typeof message !== 'string') {
      console.error("Invalid message format:", message);
      return <div className="text-red-500">Error: Invalid message format</div>;
    }
    
    try {
      // Split the message by "================================== Ai Message =================================="
      const parts = message.split(/==+ Ai Message ==+/);
      
      return parts.filter(part => part.trim()).map((part, idx) => {
        // Extract agent name if present
        const nameMatch = part.match(/Name: ([^:]+):/);
        const rawAgentName = nameMatch ? nameMatch[1].trim() : "Unknown";
        
        // Use the direct agentName mapping from agentNames.ts
        const displayName = rawAgentName in agentName 
          ? agentName[rawAgentName as keyof typeof agentName] 
          : rawAgentName;
        
        // Clean up the content
        let content = part.replace(/Name: [^:]+:/, '').trim();
        
        // Extract and format activity and subactivity information
        const activityMatch = content.match(/Activity: ([^\n]+)/i);
        const subActivityMatch = content.match(/Subactivity: ([^\n]+)/i);
        
        // Format activity and subactivity if present
        if (activityMatch || subActivityMatch) {
          let formattedMetadata = '';
          
          if (activityMatch) {
            const activityValue = cleanSubactivityValue(activityMatch[1]);
            if (activityValue) {
              formattedMetadata += `<div class="text-sm text-blue-600 mb-1">Activity: ${activityValue}</div>`;
            }
          }
          
          if (subActivityMatch) {
            const subActivityValue = cleanSubactivityValue(subActivityMatch[1]);
            if (subActivityValue) {
              formattedMetadata += `<div class="text-sm text-blue-600 mb-1">Sub-Activity: ${subActivityValue}</div>`;
            }
          }
          
          if (formattedMetadata) {
            content = `${formattedMetadata}<div class="mt-2">${content}</div>`;
          }
        }
        
        // Convert HTML-like formatting to markdown but using normal text formatting instead of ReactMarkdown
        content = content.replace(/Input X\d+: ([^\s]+)/g, 'Input: $1');
        content = content.replace(/<activity_id#([^>]+)>/g, 'Activity #$1');
        content = content.replace(/-> ([^:]+):/g, '→ $1:');
        
        // Bold important information such as trial ID, site ID, date ranges using HTML tags
        content = content.replace(/([Tt]rial ID:?)\s+([^,\s]+)/g, '$1 <strong>$2</strong>');
        content = content.replace(/([Ss]ite ID:?)\s+([^,\s]+)/g, '$1 <strong>$2</strong>');
        content = content.replace(/(\d{4}-\d{2}-\d{2}\s*-\s*\d{4}-\d{2}-\d{2})/g, '<strong>$1</strong>');
        
        return (
          <div key={`part-${idx}`} className="border-b border-gray-200 last:border-0 py-3">
            <div className="font-medium text-blue-600 mb-1">{displayName}</div>
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
      });
    } catch (error) {
      console.error("Error formatting agent message:", error, message);
      return <div className="text-red-500">Error displaying message</div>;
    }
  };

  // Normalize messages to ensure we're working with an array
  const normalizeMessages = () => {
    if (!messages) return [];
    
    if (Array.isArray(messages)) {
      return messages.filter(m => m && typeof m === 'string');
    }
    
    if (typeof messages === 'string') {
      return [messages];
    }
    
    console.warn('Unexpected messages format:', messages);
    return [];
  };

  const messageArray = normalizeMessages();

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2" />
        Agent Messages
      </h3>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !messageArray || messageArray.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No agent messages found for this job</p>
        </div>
      ) : (
        <div className="space-y-2 bg-gray-50 rounded-lg p-4">
          {messageArray.map((message, index) => (
            <div key={`message-${index}`} className="mb-4">
              {formatAgentMessage(message)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentMessagesView;
