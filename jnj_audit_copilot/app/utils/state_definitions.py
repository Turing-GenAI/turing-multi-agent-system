from typing import Annotated, Dict, List, Optional, Sequence, TypedDict, Union, operator

from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

from .response_classes import FeedbackResponse, SubActivityResponse


def merge_identical_trigger_list_index(index1: Optional[int], index2: Optional[int]) -> Optional[int]:
    if index1 == index2:
        return index1  # Return one of them if they are the same
    elif index1 is None:
        return index2  # If one is None, return the other
    elif index2 is None:
        return index1  # If one is None, return the other
    else:
        # raise ValueError("Trigger list indices from branches are not identical")
        return max(index1, index2)


def merge_identical_run_id(index1: Optional[str], index2: Optional[str]) -> Optional[str]:
    if index1 == index2:
        return index1  # Return one of them if they are the same
    elif index1 is None:
        return index2  # If one is None, return the other
    elif index2 is None:
        return index1  # If one is None, return the other
    else:
        # raise ValueError("Trigger list indices from branches are not identical")
        return max(index1, index2)


def trigger_flag_list_reducer(flag_list1: Dict[str, bool], flag_list2: Dict[str, bool]) -> Dict[str, bool]:
    # Create a merged dictionary where the values will be True if encountered,
    # False otherwise
    merged_flag_list = flag_list1.copy()

    # Iterate over the second dictionary and update the values in the merged
    # dictionary
    for key, value in flag_list2.items():
        # If the value is True in either dict, set it to True
        if key in merged_flag_list:
            merged_flag_list[key] = merged_flag_list[key] or value  # Update to True if any is True
        else:
            merged_flag_list[key] = value  # Add new key-value pairs

    return merged_flag_list


def merge_dictionaries(previous_dict: dict, new_dict: dict) -> dict:
    """
    Merges two dictionaries. If a key exists in both the previous_dict and new_dict,
    the value from new_dict will overwrite the value in the result.

    Args:
        previous_dict (dict): The original dictionary.
        new_dict (dict): The new dictionary whose values will overwrite previous_dict for matching keys.

    Returns:
        dict: A new dictionary with merged values.
    """
    # Create a copy of previous_dict to avoid modifying it directly
    result = previous_dict.copy()
    # Update the result dictionary with values from new_dict
    result.update(new_dict)
    return result


class TrialSupervisorAgentState(TypedDict):
    trigger_list: Annotated[List[Dict[str, Union[str, List[str]]]], operator.add]
    trigger_list_index: Annotated[Optional[int], merge_identical_trigger_list_index]
    trigger: Annotated[Dict[str, Union[str, List[str]]], operator.or_]
    trigger_flag_list: Annotated[Dict[str, bool], trigger_flag_list_reducer]

    site_area_activity_list: dict[str, list[str]]
    site_area_activity_list_index: int

    trial_master_messages: Annotated[List[BaseMessage], add_messages]

    all_activities: list[str]
    revision_number: int
    max_revisions: int
    parent_index: int = None

    child_index: int = None
    q_a_pairs: str = ""
    all_answers: Annotated[List[Dict[str, List[Dict[str, str]]]], operator.add] = []

    activity_findings: Dict[str, str]
    master_level_answers: Annotated[List[Dict[str, List[Dict[str, List[Dict[str, str]]]]]], operator.add] = []
    # run_id : str
    run_id: Annotated[str, merge_identical_run_id]
    purpose: str = "get_user_feedback"


class InspectionAgentState(TypedDict):
    trigger_list: Annotated[List[Dict[str, Union[str, List[str]]]], operator.add]
    trigger_list_index: Annotated[Optional[int], merge_identical_trigger_list_index]
    trigger: Annotated[Dict[str, Union[str, List[str]]], operator.or_]
    trigger_flag_list: Annotated[Dict[str, bool], trigger_flag_list_reducer]
    site_area_activity_list: dict[str, list[str]]
    site_area_activity_list_index: int
    site_area: str
    conclusion: str

    all_activities: list[str]
    revision_number: int
    max_revisions: int
    parent_index: int

    activity: str
    sub_activities: SubActivityResponse
    feedback: FeedbackResponse
    work_on_feedback: bool = True

    all_answers: Annotated[List[Dict[str, List[Dict[str, str]]]], operator.add] = []
    activity_findings: Dict[str, str]

    final_sub_activities: SubActivityResponse
    sub_activities_answers: Annotated[List[Dict[str, str]], operator.add] = []
    inspection_messages: Annotated[List[BaseMessage], add_messages]

    q_a_pairs: str = ""
    relevancy_check_counter: int
    child_index: int
    selfrag_messages: Annotated[List[BaseMessage], add_messages]

    add_human_in_the_loop_for_data_ingestion_is_valid: bool
    run_id: Annotated[str, merge_identical_run_id]
    human_feedback: str
    last_node: str
    next_node: str
    purpose: str = "get_user_feedback"
    feedback_from: str


class SelfRAGState(TypedDict):
    trigger_list: Annotated[List[Dict[str, Union[str, List[str]]]], operator.add]
    trigger_list_index: Annotated[Optional[int], merge_identical_trigger_list_index]
    trigger: Annotated[Dict[str, Union[str, List[str]]], operator.or_]
    trigger_flag_list: Annotated[Dict[str, bool], trigger_flag_list_reducer]
    final_sub_activities: SubActivityResponse
    sub_activities_answers: Annotated[List[Dict[str, str]], operator.add] = []
    inspection_messages: Annotated[List[BaseMessage], add_messages]

    site_area_activity_list: dict[str, list[str]]
    site_area_activity_list_index: int
    site_area: str

    parent_index: int
    child_index: int
    sub_activity: str
    activity: str

    q_a_pairs: str = ""
    relevancy_check_counter: int = 0
    context: str = ""
    selfrag_messages: Annotated[List[BaseMessage], add_messages]

    sub_activity_answer: str
    messages: Annotated[Sequence[BaseMessage], add_messages]
    used_site_data_flag: bool
    file_summary: str
    run_id: Annotated[str, merge_identical_run_id]
    chat_history: list[BaseMessage]
    agent_outcome: Union[AgentAction, AgentFinish, None]
    intermediate_steps: Annotated[list[tuple[AgentAction, str]], operator.add]
    tool_call_count: int
    retrieved_context_dict: Annotated[List[Dict[str, Dict[str, str]]], operator.add] = []


class SGRSubGraphState(TypedDict):
    trigger_list: Annotated[List[Dict[str, Union[str, List[str]]]], operator.add]
    trigger_list_index: Annotated[Optional[int], merge_identical_trigger_list_index]
    trigger: Annotated[Dict[str, Union[str, List[str]]], operator.or_]
    trigger_flag_list: Annotated[Dict[str, bool], trigger_flag_list_reducer]
    site_area: str
    site_id: str
    input_filepath: Annotated[Dict[str, str], merge_dictionaries]
    intermediate_files: Annotated[Dict[str, str], merge_dictionaries]
    llm_response: str
    output_files: Annotated[Dict[str, str], merge_dictionaries]
    sgr_agent_messages: Annotated[List[BaseMessage], add_messages]
    sgr_exec_agent_messages: Annotated[List[BaseMessage], add_messages]
    activity_findings: Dict[str, str]
    run_id: Annotated[str, merge_identical_run_id]
