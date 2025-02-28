import { Message } from '../../types';

export interface ToolMessage {
  type: 'progress_steps' | 'tool_ui';
  steps?: Step[];
  tool?: {
    type: 'trial' | 'site' | 'date' | 'button' | 'progresstree';
    message: string;
    options?: {
      value?: unknown;
      buttonText?: string;
    };
  };
}

export interface AgentWindowProps {
  messages: Message[];
  userInput: string;
  updateUserInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  trials: string[];
  sites: {
    [key: string]: Array<{ id: string; status: string }>;
  };
  onInputComplete: (data: {
    selectedTrial: string;
    selectedSite: string;
    dateRange: { from: Date | undefined; to: Date | undefined };
  }) => void;
  handleRunClick: () => void;
  addAgentMessage: (message: string, toolType?: 'trial' | 'site' | 'date' | 'button' | 'progresstree') => void;
}

export interface MessageInputProps {
  userInput: string;
  updateUserInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  disabled?: boolean;
}
