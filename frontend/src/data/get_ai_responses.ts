// Import JSON responses
import aiMessages1Raw from './mock_responses/ai_messages_1.json';
import aiMessages2Raw from './mock_responses/ai_messages_2.json';

// Export as strings for compatibility with existing code
export const get_ai_messages1 = JSON.stringify(aiMessages1Raw);
export const get_ai_message2 = JSON.stringify(aiMessages2Raw);