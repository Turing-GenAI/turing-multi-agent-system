from typing import List, Literal

from pydantic.v1 import BaseModel, Field


class SubActivityResponse(BaseModel):
    """
    Respond with the sub-activity.
    """

    sub_activities: List[str] = Field(description="Valid List of sub-activities")


class FeedbackResponse(BaseModel):
    """
    Respond with the validation output.
    """

    Need_to_rewrite: bool = Field(description="True if rework is needed, else False")
    Feedback_Value: str = Field(
        description="Feedback of sub-activities, i.e., what needs to be improved if not perfect, else `NA`."
    )


class DiscrepancyFunction(BaseModel):
    function_name: Literal[
        "get_pd_discrepancy",
        "get_site_pd_trending",
        "get_ae_discrepancy",
        "get_sae_delay_by_24hrs",
        "None",
    ]
    reason: str


class RequiredColumns(BaseModel):
    columns: List[str]


# Data model
class retriever_router(BaseModel):
    """Function which decides whether the sub-activity can be answered using guidelines or data"""

    retriever_choice: str = Field(
        description="Choice of Preferred retriever 'guidelines_retriever' or 'site_data_retriever'"
    )


# Data model
class grade(BaseModel):
    """Binary score for relevance check."""

    binary_score: str = Field(description="Relevance score 'yes' or 'no'")


class SelectedColumnsOutputTable(BaseModel):
    columns: List[str]
    reason: str


class RowID(BaseModel):
    row_id: int
    reason: str


class SelectedRowsOutputTable(BaseModel):
    row_ids: List[RowID] = []
