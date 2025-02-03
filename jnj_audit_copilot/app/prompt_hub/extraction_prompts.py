DETAILED_DATAFRAME_SUMMARY_GENERATOR_PROMPT = """
        **Task Overview:**
        Analyze the pandas dataframe and generate a concise summary for the entire dataframe and for each column.
        The summary will explain the probable purpose for which the data can be used.
        The summary should also  highlight key insights into the data structure and statistics.

        **Input Specifications:**
        - Name of the dataframe : {name}
        - Columns in the dataframe : {col_names}
        - Contents of the dataframe (data):
            ```{dataframe} ```

        **Additional User Column descriptions:**
        {user_column_description}

        **Output Specifications:**
            1. **File Name**: Name of the file.
            2. **Summary**: A brief summary of the dataframe
            (e.g., "Contains participant training details including roles, modules, and completion dates" or
            "Indexes Trial Master File documents with metadata such as IDs, versions, and statuses").
            3. A one line summary for each column in the dataframe explaining it's probable purpose.

        **Execution Instructions:**
        - For all the column description that user provided separately, Use that column description in the output.
        - Ensure that the output is concise, clear, and formatted for easy interpretation.
        - Ensure that there is no hallucination.

    """
