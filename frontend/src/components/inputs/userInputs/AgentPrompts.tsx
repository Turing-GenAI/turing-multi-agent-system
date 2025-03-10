import React, { useState } from 'react';

interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  documentTemplate?: string;
  siteDataTemplate?: string;
}

const AgentPrompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: 'prompt1',
      name: 'Planner Agent',
      description: 'Responsible for creating a plan of action based on user query',
      template: `**Task Overview:**
You will be provided with a main question related to the inspection of clinical trial sites.
Your task is to break down the main question into step-by-step sub-questions that guide the user
in addressing the main query comprehensively, similar to how an expert would approach it.

**Input Specifications:**
- You will receive a main question as a string.
- The main question will focus on a specific aspect of the site review, such as criteria matching,
  management timelines, or compliance checks.

**Output Specifications:**
- Your output must be a valid Python list.

**Execution Instructions:**
- Try to keep the sub questions as calculative as possible. Avoid descriptive sub-questions unless necessary.
- Begin by identifying the core elements of the main question.
- Break down the question into smaller, more specific sub-questions (typically 2-3 sub-questions). Do not use any abbreviations.
- Focus on sub-questions that can be answered with data rather than theoretical answers.
- Ensure the sub-questions follow a logical sequence, leading the user from understanding
  the requirements to performing the necessary checks.
- Avoid unnecessary steps or overly broad questions that do not directly contribute
  to solving the main query.
- Avoid generating sub-activities that focus on providing definitions or locating data types; instead, prioritize actionable tasks that drive analysis and decision-making.
- If the question requires a simple yes/no answer, directly check the data without breaking it down further. Avoid generic full forms if unsure.
- In case the main question is asking about trends, generate a sub-question which will lead the model to simply go through the data and identify any interesting trends/patterns

**Input:** {activity}

**Output:** A valid Python list of sub-questions.

**Examples:**

**Input:**
Ensure criteria (e.g., severity, compliance, etc.) at site matches the agreed Site Review Assessment Plan.

**Output:**
python
[
    "What is the Site Review Assessment Plan and where can it be found?",
    "What are the criteria at the site?",
    "How do you determine the criteria as per the Site Review Assessment Plan?",
    "Do these determined values match the assessment plan?"
]

**Input:**
Check the management of the reported issues at the site, and have they been resolved/closed
within an acceptable time frame?

**Output:**
python
[
    "What are the specific reported issues at the site?",
    "What is the acceptable time frame for resolving/closing these issues?",
    "Check if the time taken to resolve/close each issue is within the acceptable time range.",
    "Were any issues left unresolved, and why?"
]

**Input:**
Have patients consented to the correct initial ICF versions at screening (no older versions used)?

**Output:**
python
[
    "What is the correct initial ICF version?",
    "Have patients consented correctly at screening?"
]

**Input:**
How many unique sites are there?

**Output:**
python
[
    "How many sites are there in total?",
    "How many of these sites are unique?"
]`
    },
    {
      id: 'prompt2',
      name: 'Critique Agent',
      description: 'Reviews and provides critical feedback on generated content',
      template: `You are a senior clinical trial inspector reviewing a set of sub-questions (\`$$\` separated)
generated for a main inspection-related query.
Provide a detailed critique for improvement, ensuring that the sub-questions are comprehensive,
logically sequenced, and focused on key aspects of the inspection process. Do not use any abbreviations.
Highlight any areas where the sub-questions may need to be more specific or actionable.
If sub-queries are fine (i.e., no need to modify), mark Feedback_Status as \`False\`, else \`True\`.`
    },
    {
      id: 'prompt3',
      name: 'RAG Agent',
      description: 'Retrieves and analyzes relevant information from knowledge base',
      template: `You are an intelligent robot which can decide if a question requires analytical data for answering,
or if it needs information from relevant guidelines or SOPs. If you think a question is best
answered using information from guidelines or SOPs, then use guidelines_retriever tool. If you think
a question is best answered using actual data, then return site_data_retriever tool.
You only need to choose and execute the tool. You dont need to check if the data is captured correctly or not.
You also dont need to provide any analysis as that will be done in later steps of the graph network you are part of.`,

      // Document-based answer generation template (empty for you to fill)
      documentTemplate: `You'll be given a question, a set of relevant documents, and some context. You have to provide accurate answer to the question.

        Here is the question you need to answer:
        \n --- \n {question} \n --- \n

        Here is any available background question and answer pairs:
        \n --- \n {q_a_pairs} \n --- \n

        Here is additional context relevant to the question:
        \n --- \n {context} \n --- \n

        ** Instructions: **
        - Use the correct columns based on the column description provided. Consider the column definitions as the only reference and not assume things based on column names.
        - Extract/Use only the required columns for analysis.
        - Do not compromise on the number of rows. Use all if needed.
        - The question: {question} has been generated as a sub-question to answer the main question : {main_question}
        - Use the above context and any background question-answer pairs to answer the question: {question}.
        - If the fetched context contains a data table, ensure that you understand all the columns and rows of the table before answering any questions related to it.

        ** Additional context - **
        - This question : {question} is related to the site area : {site_area} of a clinical trial.
        - Some information on how to deal with questions related to this site area is as follows: {additional_context}

        **Output Specification:**
        - Ensure that the answer is concise and accurate. Avoid unnecessary details.
        - Try to keep the answer short.
        - Do not truncate any data as it will lead to erroneous results.`,
      
      // Site data-based answer generation template (empty for you to fill)
      siteDataTemplate: `You'll be given a question, a set of relevant documents, and some context. You have to provide accurate answer to the question.

        Question:
        \n --- \n {question} \n --- \n

        Context:
        \n --- \n {context} \n --- \n

        Background Q&A pairs:
        \n --- \n {q_a_pairs} \n --- \n

        File information: {file_summary}

        ** Instructions: **
        - USE ALL THE ROWS FROM THE CONTEXT UNLESS FILTER IS REQUIRED. Filter only if required.
        - Use the context and Q&A pairs to answer {question}.
        - If a data table is included, ensure you fully understand the rows and columns.
        - Discrepancies: Anything violating clinical trial control practices is a discrepancy (e.g., unresolved protocol deviations beyond acceptable timeframes).
        - Do not give generic/broad answers, be specific and databacked.
        - Try to include all the columns to generate the final answer. Should have description of row as well as calculated information.
        - Discrepancy handling: {DISCREPANCY_HANDLING_INSTRUCTIONS_PROMPT}

        **Output Specification:**
        - Provide the final answer to the given questions, Ensure that the answer is concise and accurate. Avoid unnecessary details.
        - Try to answer the question in brief by highlighting any discrepancies in a concise and conclusive manner. `
    },
    {
      id: 'prompt4',
      name: 'Self-Reflection Agent',
      description: 'Evaluates the quality and completeness of its own responses',
      template: `You are a grader assessing the relevance of a retrieved document to a user's question.

        Here is the retrieved document:
        \n {context} \n

        Here is the user's question: {question}

        ** Instructions: **
        - The question: {question} has been generated as a sub-question to answer the main question : {main_question}
        - The retrieved document should be able to serve the purpose of helping in answering the original main question
        - If the document contains keywords or semantic meaning related to the user's question, grade it as relevant.

        ** Additional context - **
        - This question : {question} is related to the site area : {site_area} of a clinical trial.
        - Some information on how to deal with questions related to this site area is as follows: {additional_context}

        ** Output specifications: **
        - Provide a binary score ('yes' or 'no') to indicate whether the document is relevant to the question.`
    },
    {
      id: 'prompt5',
      name: 'Generate Findings Agent',
      description: 'Synthesizes information and generates comprehensive findings',
      template: `Provide a concise analytical conclusion based on the findings from the main question and sub-questions.
Prioritize special instructions, if applicable, in the conclusion.
Ensure the summary is 1-3 lines covering all important conclusion which derived from QnA Summaries without excessive detail.
Do not miss important details such as timeliness, site names, and specific details.
Do not miss information about identities of the respective findings.

**IMPORTANT INFORMATION**:
- DO NOT MISS ANY KEY INFORMATION SINCE THIS IS RELATED TO MEDICAL TRIALS.
- WRONG INFORMATION SUCH AS INCORRECT COUNTS OR INCORRECT SUBJECT IDs IS NOT TOLERATED.

- **QnA Summary**: {QnA_Summary}
        - **Special Instruction**: {Special_instruction}; Give precedence to special instructions.""",
    "choose_discrepance_function": """
        You'll be given a list of functions with their descriptions and a main question. You have to choose the function that will be used to generate the data for the main question.
        If none of the functions are applicable, then you have to return "None".

        **Instructions:**
        - Return the function name or "None" only.
        - Give a reason for choosing the function.

        Input:

        MAIN QUESTION: {main_question}

        FUNCTIONS:
        \n --- \n
        {function_list}
        \n --- \n

        Output Format:
        {{
            "function_name": "function_name",
            "reason": "reason"
        }}

        YOUR JSON OUTPUT:`
    }
  ]);

  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, Record<string, boolean>>>({});

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
  };

  const handleUpdatePrompt = () => {
    if (editingPrompt) {
      setPrompts(prompts.map(p => p.id === editingPrompt.id ? editingPrompt : p));
      setEditingPrompt(null);
    }
  };

  const togglePromptExpansion = (promptId: string) => {
    setExpandedPrompts({
      ...expandedPrompts,
      [promptId]: !expandedPrompts[promptId]
    });
  };

  const toggleTemplateExpansion = (promptId: string, templateType: string) => {
    setExpandedTemplates({
      ...expandedTemplates,
      [promptId]: {
        ...(expandedTemplates[promptId] || {}),
        [templateType]: !(expandedTemplates[promptId]?.[templateType] || false)
      }
    });
  };

  const getTemplatePreview = (template: string, maxLines = 3) => {
    if (!template) return '';
    const lines = template.split('\n');
    if (lines.length <= maxLines) return template;
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Agent Prompts</h2>
      
      {editingPrompt ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Edit Prompt</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="edit-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrompt.name}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="edit-description"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrompt.description}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edit-template" className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <textarea
                id="edit-template"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editingPrompt.template}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, template: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use curly braces to denote variables, e.g., {'{variable_name}'}
              </p>
            </div>
            {editingPrompt.documentTemplate !== undefined && (
              <div>
                <label htmlFor="edit-document-template" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Template
                </label>
                <textarea
                  id="edit-document-template"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editingPrompt.documentTemplate}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, documentTemplate: e.target.value })}
                />
              </div>
            )}
            {editingPrompt.siteDataTemplate !== undefined && (
              <div>
                <label htmlFor="edit-site-data-template" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Data Template
                </label>
                <textarea
                  id="edit-site-data-template"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editingPrompt.siteDataTemplate}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, siteDataTemplate: e.target.value })}
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePrompt}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{prompt.name}</h3>
                  <p className="text-sm text-gray-500">{prompt.description}</p>
                </div>
                <button
                  onClick={() => handleEditPrompt(prompt)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Edit prompt"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-t-md cursor-pointer" 
                     onClick={() => toggleTemplateExpansion(prompt.id, 'main')}>
                  <h4 className="text-sm font-medium text-gray-700">Main Prompt:</h4>
                  <button className="text-gray-500">
                    {expandedTemplates[prompt.id]?.main ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                      </svg>
                    )}
                  </button>
                </div>
                {expandedTemplates[prompt.id]?.main ? (
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-b-md">{prompt.template}</pre>
                ) : (
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-b-md">{getTemplatePreview(prompt.template)}</pre>
                )}
              </div>

              {prompt.documentTemplate && (
                <div className="mt-3">
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-t-md cursor-pointer"
                       onClick={() => toggleTemplateExpansion(prompt.id, 'document')}>
                    <h4 className="text-sm font-medium text-gray-700">Document Template:</h4>
                    <button className="text-gray-500">
                      {expandedTemplates[prompt.id]?.document ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {expandedTemplates[prompt.id]?.document ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-b-md">{prompt.documentTemplate}</pre>
                  ) : (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-b-md">{getTemplatePreview(prompt.documentTemplate)}</pre>
                  )}
                </div>
              )}

              {prompt.siteDataTemplate && (
                <div className="mt-3">
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-t-md cursor-pointer"
                       onClick={() => toggleTemplateExpansion(prompt.id, 'siteData')}>
                    <h4 className="text-sm font-medium text-gray-700">Site Data Template:</h4>
                    <button className="text-gray-500">
                      {expandedTemplates[prompt.id]?.siteData ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {expandedTemplates[prompt.id]?.siteData ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-b-md">{prompt.siteDataTemplate}</pre>
                  ) : (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-b-md">{getTemplatePreview(prompt.siteDataTemplate)}</pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentPrompts;
