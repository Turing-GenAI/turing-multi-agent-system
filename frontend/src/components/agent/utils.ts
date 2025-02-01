import { Message } from '../../types';

export const getMessageBackgroundColor = (message: Message) => {
  if (message.isUser) return 'bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900';
  
  switch (message.nodeName) {
    case 'critique_agent':
      return 'bg-gradient-to-br from-red-50 to-red-100 text-gray-900 border-red-200';
    case 'reflection_agent':
      return 'bg-gradient-to-br from-green-50 to-green-100 text-gray-900 border-green-200';
    case 'feedback_agent':
      return 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-900 border-yellow-200';
    default:
      return 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900 border-slate-200';
  }
};
