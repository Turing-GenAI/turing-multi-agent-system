selfrag_prompts = {
    "RETRIEVER_ROUTER_PROMPT": """
        You are an intelligent robot which can decide if a question requires analytical data for answering,
        or if it needs information from relevant guidelines or SOPs. If you think a question is best
        answered using information from guidelines or SOPs, then use guidelines_retriever tool. If you think
        a question is best answered using actual data, then return site_data_retriever tool.
        You only need to choose and execute the tool. You dont need to check if the data is captured correctly or not.
        You also dont need to provide any analysis as that will be done in later steps of the graph network you are part of.
    """,
    "GRADE_FETCHED_DOCUMENTS_PROMPT": """
        You are a grader assessing the relevance of a retrieved document to a user's question.

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
        - Provide a binary score ('yes' or 'no') to indicate whether the document is relevant to the question.

    """,
    "REWRITE_SUB_ACTIVITY_PROMPT": """
        Analyze the input and reason about the underlying semantic intent or meaning.

        Here is the initial question:
        \n ------- \n
        {question}
        \n ------- \n

        Formulate an improved version of the question.

        ** Additional Instructions: **
        - The question: {question} has been generated as a sub-question to answer the main question : {main_question}
        - The rewritten version should be able to serve the purpose of helping in answering the original main question

        ** Additional context - **
        - This question : {question} is related to the site area : {site_area} of a clinical trial.
        - Some information on how to deal with questions related to this site area is as follows: {additional_context}

        **Output Specification:**
        - Return only the re-written (improved) question.
    """,
    "GENERATE_SUB_ACTIVITY_ANSWER_USING_DOC_PROMPT": """
        You'll be given a question, a set of relevant documents, and some context. You have to provide accurate answer to the question.

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
        - Do not truncate any data as it will lead to erroneous results

    """,
    "GENERATE_SUB_ACTIVITY_ANSWER_USING_SITE_DATE_PROMPT": """
        You'll be given a question, a set of relevant documents, and some context. You have to provide accurate answer to the question.

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
        - Try to answer the question in brief by highlighting any discrepancies in a concise and conclusive manner.
    """,
    "GENERATE_ANSWER_USING_SITE_DATA_VARIATION_PROMPT": """
        You'll be given a main question, a sub question, q_a_pairs, some context and some file information. The purpose here is to get as much information as possible from the context in a structured way. Information should answer the sub question with respect to main question.

        ** SPECIAL INSTRUCTIONS: **
        - **USE ALL ROWS UNLESS FILTERING IS REQUIRED.**
        - **Use ONLY USEFUL COLUMNS IN THE ANSWER**
        - THIS IS A MEDICAL TRIAL QUESTION HENCE IT IS NOT OKAY TO SKIP INFORMATION.
        - WRONG INFORMATION SUCH AS INCORRECT COUNTS OR INCORRECT SUBJECT IDs IS NOT TOLERATED.


        ** Instructions: **
        - Filter the data and give proper reasoning for filtering.
        - Try to generate a summarized and precise answer without compromising on the information.
        - Avoid very detailed explanations.
        - Always include the identity of the subject (Not row number) whenever possible.
        - Do not use row ID as the identity of the subject.

        ** Additional context - **
        - The bigger purpose is the answer the main question which is related to clinical trials. Hence, it is important that *NO INFORMATION SHOULD BE SKIPPED** while answering the sub question.

        **Output Specification:**
        - Try to keep the answer structured.

        Here is the main question you need to answer:
        \n --- \n {main_question} \n --- \n

        Here is any available background question and answer pairs:
        \n --- \n {q_a_pairs} \n --- \n

        File information: {file_summary}

        Here is additional context relevant to the question:
        \n --- \n {context} \n --- \n

        Here is the sub question you need to answer:
        \n --- \n {question} \n --- \n

        Output Format: Output should not contain table. If tabular data is present, try to present it in a concise listed manner. Give separate reasoning for the answer.

        ** Your Answer: **

    """,
    "DISCREPANCY_HANDLING_INSTRUCTIONS_PROMPT": """
        - Carefully review all rows and columns of the data.
        - Identify any discrepancies/non-compliances based on the main question. (e.g., if asked whether events were resolved on time, flag any delays or unresolved issues).
        - Do not truncate data as it can cause errors.

       """,
    "RELEVANT_COLUMNS_SELECTION_PROMPT": """
        You will be given a file description containing a list of columns and their descriptions and a question. You have to choose the columns that are relevant to the question.

        Note: Always keep columns that define the identity of a row even if they are not required to answer the question.

        BE VERY SELECTIVE WHILE CHOOSING THE COLUMNS AND GIVE PROPER REASONING
        GIVE REASONING ONLY IF FILTERING IS REQUIRED AND APPLIED

        File Description:
        \n --- \n {file_summary} \n --- \n

        Question:
        \n --- \n {question} \n --- \n

        Output Format:
        \n --- \n
        {{
            "columns": list
            "reason": Optional[str]
        }} \n --- \n
    """,
}
