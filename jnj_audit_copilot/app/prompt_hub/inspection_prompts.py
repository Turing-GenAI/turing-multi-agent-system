inspection_prompts = {
    "GENERATE_SUB_ACTIVITIES_PROMPT": """
        **Task Overview:**
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
        ]
    """,
    "SUB_ACTIVITY_CREATION_NODE": """
        You are a query decomposition specialist focused on clinical trial inspections.
        Generate a detailed list of sub-questions (typically 2-3) that comprehensively break down
        the main inspection-related question.
        These sub-questions should help guide the user in conducting a thorough inspection review.  Do not use any abbreviations.
        In case the main question is asking about trends, generate a sub-question which will lead the model to simply go through the data and identify any interesting trends/patterns
    """,
    "REFLECTION_PROMPT": """
        You are a senior clinical trial inspector reviewing a set of sub-questions (`$$` separated)
        generated for a main inspection-related query.
        Provide a detailed critique for improvement, ensuring that the sub-questions are comprehensive,
        logically sequenced, and focused on key aspects of the inspection process.  Do not use any abbreviations.
        Highlight any areas where the sub-questions may need to be more specific or actionable.
        If sub-queries are fine (i.e., no need to modify), mark Feedback_Status as `False`, else `True`.
    """,
    "RESEARCH_CRITIQUE_PROMPT": """
        You are a senior clinical trial inspector tasked with refining the list of sub-questions
        (typically 2-3 sub-questions unless specified) based on user feedback.
        Generate a list of refined sub-questions that will further break down the main inspection-related query
        into actionable components, make sure you are fixing all the feedbacks,
        focusing on areas that were previously overlooked or need more detailed examination.
        For more context, here is the main question: {activity}

        **Special Instructions:**
        - Do not generate more than 3 sub-questions unless specifically asked to do so.
        -  Do not use any abbreviations.
        - Focus on sub-questions that can be answered with data rather than theoretical answers.
        - Ensure the sub-questions follow a logical sequence, leading the user from understanding
          the requirements to performing the necessary checks.
        - Avoid unnecessary steps or overly broad questions that do not directly contribute
          to solving the main query.
        - In case the main question is asking about trends, generate a sub-question which will lead the model to simply go through the data and identify any interesting trends/patterns
    """,
    "SUMMARY_PROMPT": """
        Put the findings of the main question to form a conclusion in the form of a report.
        These findings are related to Protocol Deviations (PDs) & AE/SAE,
        including the main question, sub-questions, and answers.

        The conclusion should highlight whether the findings are available, specifying key details such as
        timeliness, site names, and specific details.
        Avoid verbosity and focus on actionable insights.
        The conclusion should also include analytical and actionable insights.

        {QnA_Summary}
    """,
    "GENERATE_FINDINGS_SUMMARY_PROMPT": """
        Provide a concise analytical conclusion based on the findings from the main question and sub-questions,
        Prioritize special instructions, if applicable, in the conclusion.
        Ensure the summary is 1-3 lines covering all imporant conclusion which derived from QnA Summaries without excessive detail.
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

        YOUR JSON OUTPUT:
    """,
    "RELEVANT_COLUMNS_FOR_OUTPUT_TABLE": """
You will be given a file description containing a list of columns and their descriptions and a question with it's answer. You have to choose the columns that are relevant to answer the ANALYTICAL part of the question.

Note: Always keep columns that define the identity of a row even if they are not required to answer the question.

BE VERY SELECTIVE WHILE CHOOSING THE COLUMNS AND GIVE PROPER REASONING FOR THE PURPOSE OF EACH COLUMN IN THE ANALYSIS.
** Column names must strictly match those specified in the file description. Additionally, column names are case-sensitive, so ensure they are not altered or converted to a different case.

File Description:
\n --- \n {file_summary} \n --- \n

Question:
\n --- \n {question} \n --- \n

Answer to the question:
\n --- \n {answer} \n --- \n

Output Format:
\n --- \n
{{
    "columns": list
    "reason": Optional[str]
}} \n --- \n
""",
    "RELEVANT_ROWS_FOR_OUTPUT_TABLE_FIRST_ITERATION": """
You will receive a question, an answer to that question, and related data. Your task is to filter and return only the data rows that directly support the claims in the answer.

### IMPORTANT POINTS:
1. **Focus on Discrepancy**: Only select rows that strictly and clearly support the discrepancy claims made in the answer. If the question involves discrepancies, include only rows relevant to those discrepancies. Return empty list if no discrepancy.
2. **Return Requirements**: If no rows meet the criteria precisely, return an empty list. Do not attempt to include data by compromising on accuracy.
3. **Clinical Trial Standards**: Given that this is for clinical trial inspection, accuracy is critical. Avoid any inclusion of irrelevant or incorrect data, and verify that each row selected is fully aligned with the question and answer details.

**OUTPUT FORMAT:**
\n --- \n
{{
    "row_ids": {{
        "row_id": int,
        "reason": str
    }}
}} \n --- \n

**INPUT:**
Question:
\n --- \n {question} \n --- \n

Answer to the question:
\n --- \n {answer} \n --- \n

Column Descriptions:
\n --- \n {column_descriptions} \n --- \n

Data:
\n --- \n {data} \n --- \n
""",
    "RELEVANT_ROWS_FOR_OUTPUT_TABLE_SECOND_ITERATION": """
**OBJECTIVE:**
SELECT ROWS FROM THE DATA THAT SUPPORTS THE DISCREPANCY CLAIMED IN THE ANSWER WITH RESPECT TO THE QUESTION. PROVIDE REASON FOR EACH SELECTION.

**SPECIAL INSTRUCTIONS**:
1. DUPLICATES SHOULD CONSIDERED AS CORRECT.

**INPUT:**
Question:
{question}

Answer to the question:
{answer}

Data:
{data}

Column Definitions if applicable:
{column_descriptions}
"Date of Report": "This is the date when the issue was reported. Investigator should be informed as soon as possible after this."
"Date of Report Date Investigator/ Investigational Staff became aware": "Date when the reported issue is informed to the Investigator/ Investigational Staff."

**OUTPUT FORMAT:**
{{
    "correct_row_ids": {{
        "correct_row_id": int,
        "reason": str
    }}
}}

**YOUR RESPONSE:**
""",
}
