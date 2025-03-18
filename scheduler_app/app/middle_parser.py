from enum import unique
import re
import os
import json
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

load_dotenv()


def parse_ai_messages(full_text: str):
    """
    Parses the entire text into a list of message blocks.
    Each block is delimited by:
        ================================== Ai Message ==================================
    
    Returns a list of dicts, each with:
    - id (int)
    - name (str)
    - fields (dict of Key: Value lines)
    - subActivity (str)
    - subActivityOutcome (str)
    - otherLines (list of any leftover lines)
    """

    # 1. Split on the known delimiter
    delimiter = "================================== Ai Message =================================="
    # delimiter = "==================================^[[1m Ai Message ^[[0m=================================="
    raw_chunks = full_text.split(delimiter)

    # Clean and filter out empty chunks
    chunks = [chunk.strip() for chunk in raw_chunks if chunk.strip()]

    parsed_results = []
    
    # Regex for lines like "Key: Value"
    key_val_regex = re.compile(r"^(?P<key>[^:]+):\s*(?P<value>.+)$")
    # Regex for "* Sub-Activity:" lines
    sub_activity_regex = re.compile(r"^\*?\s*Sub-Activity:\s*(?P<value>.+)$", re.IGNORECASE)
    # Regex for "* Sub-Activity outcome:" lines
    sub_activity_outcome_regex = re.compile(r"^\*?\s*Sub-Activity Outcome:\s*(?P<value>.+)$", re.IGNORECASE)
    
    for idx, chunk in enumerate(chunks, start=1):
        lines = [line.strip() for line in chunk.split('\n') if line.strip()]
        
        # Default structured object
        message_obj = {
            "id": idx,
            "name": "Unknown",
            "fields": {},
            "subActivity": "",
            "subActivityOutcome": "",
            "otherLines": []
        }

        # 2. Check if first line is "Name: something"
        if lines and lines[0].startswith("Name:"):
            name_line = lines[0].replace("Name:", "").strip()
            if name_line.endswith(":"):
                name_line = name_line[:-1].strip()
            message_obj["name"] = name_line
            # Remove that line
            lines = lines[1:]

        # 3. Now parse each of the remaining lines
        for line in lines:
            # A) Try Key: Value
            kv_match = key_val_regex.match(line)
            if kv_match:
                key = kv_match.group("key").strip()
                value = kv_match.group("value").strip()
                message_obj["fields"][key] = value
                continue

            # B) Try sub-activity
            sa_match = sub_activity_regex.match(line)
            if sa_match:
                message_obj["subActivity"] = sa_match.group("value").strip()
                continue

            # C) Try sub-activity outcome
            sao_match = sub_activity_outcome_regex.match(line)
            if sao_match:
                message_obj["subActivityOutcome"] = sao_match.group("value").strip()
                continue

            # D) If it doesn't match anything else, store in otherLines
            message_obj["otherLines"].append(line)

        parsed_results.append(message_obj)

    return parsed_results

def add_content(data):
    """
    Takes either a single JSON object or a list of JSON objects and concatenates values from 
    fields, subActivity, subActivityOutcome, and otherLines into a single string. 
    The concatenated string is added back to each object with key 'content'.
    
    Args:
        data (dict or list): Single JSON object or list of JSON objects containing fields, 
                            subActivity, subActivityOutcome, and otherLines
        
    Returns:
        dict or list: The input object(s) with additional 'content' field
    """
    def process_single_item(item):
        content_parts = []
        
        # Process fields dictionary
        if 'fields' in item and item['fields']:
            for key, value in item['fields'].items():
                content_parts.append(f"{key}: {value}")
        
        # Add subActivity if present and not empty
        if 'subActivity' in item and item['subActivity']:
            content_parts.append(item['subActivity'])
        
        # Add subActivityOutcome if present and not empty
        if 'subActivityOutcome' in item and item['subActivityOutcome']:
            content_parts.append(item['subActivityOutcome'])
        
        # Add otherLines if present
        if 'otherLines' in item and item['otherLines']:
            content_parts.extend(item['otherLines'])
        
        # Join all parts with newlines and add to the data
        item['content'] = '\n'.join(content_parts)
        return item

    # Handle both single dictionary and list of dictionaries
    if isinstance(data, list):
        return [process_single_item(item) for item in data]
    else:
        return process_single_item(data)

def summarize_content(data):
    """
    Takes either a single JSON object or a list of JSON objects and summarizes the 'content' field
    using Azure OpenAI's API. The summary is added back to each object with key 'summary'.
    
    Args:
        data (dict or list): Single JSON object or list of JSON objects containing 'content' field
        
    Returns:
        dict or list: The input object(s) with additional 'summary' field
    """
    def get_summary(content):
        azure_chat_openai_client = AzureChatOpenAI(
            model=os.environ.get("AZURE_OPENAI_API_MODEL_NAME"),
            azure_deployment=os.environ.get("AZURE_OPENAI_API_DEPLOYMENT_NAME"),
            api_version=os.environ.get("AZURE_OPENAI_API_MODEL_VERSION"),
            azure_endpoint=os.environ.get("AZURE_OPENAI_API_ENDPOINT"),
            temperature=0
        )
        
        if not content:
            return "No content available to summarize."
            
        try:
            messages = [
                SystemMessage(content="Summarize the following content in exactly 2 sentences."),
                HumanMessage(content=content)
            ]
            response = azure_chat_openai_client.invoke(messages)
            return response.content.strip()
        except Exception as e:
            return f"Error generating summary: {str(e)}"
    
    def process_single_item(item):
        if 'content' not in item:
            item['summary'] = "No content field found in the data."
            return item
            
        item['summary'] = get_summary(item['content'])
        return item
    
    # Handle both single dictionary and list of dictionaries
    if isinstance(data, list):
        return [process_single_item(item) for item in data]
    else:
        return process_single_item(data)
def merge_selfrag_nodes(data):
    """
    Merges consecutive occurrences of "SelfRAG - retrieval_agent",
    "SelfRAG - execute_retrieval_tools", and "SelfRAG - document_grading_agent"
    into a single node named "SelfRAG - Retrieval tool".
    
    If a different node appears between them, it prevents merging across that node.
    
    Args:
        data (list): List of parsed and processed messages.
        
    Returns:
        list: Modified list with merged nodes.
    """
    merged_data = []
    temp_group = []
    
    # Define target node names to be merged
    target_nodes = {
        "SelfRAG - retrieval_agent",
        "SelfRAG - execute_retrieval_tools",
        "SelfRAG - document_grading_agent"
    }
    
    for message in data:
        if message["name"] in target_nodes:
            # Add to temporary group if it's a target node
            temp_group.append(message)
        else:
            # If a different node appears, process and reset temp_group
            if temp_group:
                merged_data.append(_merge_group(temp_group))
                temp_group = []
            
            # Add the non-matching message as is
            merged_data.append(message)
    
    # Process any remaining grouped nodes at the end
    if temp_group:
        merged_data.append(_merge_group(temp_group))
    
    return merged_data


def _merge_group(messages):
    """
    Merges a group of SelfRAG nodes into a single node with combined content.
    
    Args:
        messages (list): List of SelfRAG-related messages to merge.
    
    Returns:
        dict: A single merged message object.
    """
    merged_content = "\n".join(msg["content"] for msg in messages)
    
    return {
        "id": messages[0]["id"],  # Keep the ID of the first occurrence
        "name": "SelfRAG - Retrieval tool",
        "content": merged_content,
        "summary": "Merged retrieval operations: " + " ".join(msg["summary"] for msg in messages if "summary" in msg)
    }

def filter_parsed_messages_by_name(parsed_messages):
    """
    Removes redundant data from parsed messages
    """
    unique_name = {
        "trial supervisor - inspection_master_agent",
        "inspection - site_area_agent",
        "inspection - site_area_router",
        "inspection - planner_agent",
        "inspection - critique_agent",
        "inspection - feedback_agent node",
        "Unknown",
        "SelfRAG - self_rag_agent",
        "SelfRAG - Retrieval tool",  # New merged SelfRAG node
        "SelfRAG - generate_response_agent",
        "inspection - generate_findings_agent",
        
    }
    

    compressed_data = []
    for message in parsed_messages:
        if message["name"] in unique_name:
            if message["name"] == "SelfRAG - Retrieval tool":
                # If this was previously "SelfRAG - retrieval_agent", check its fields
                fields = message.get("fields", {})
                if fields.get("Name") == "SelfRAG - guidelines_retriever tool":
                    continue
            
            compressed_data.append(message)
    
    return compressed_data

def filter_json_keys(data):
    """
    Takes a JSON object or list of objects and creates a new JSON containing only
    specified keys ('id', 'content', 'summary', 'name'). Saves to a new file if
    output_file is provided.
    
    Args:
        data (dict or list): Input JSON data
        output_file (str, optional): Path to save the filtered JSON. If None, only returns the filtered data
        
    Returns:
        dict or list: Filtered JSON data containing only the specified keys
    """
    KEYS_TO_KEEP = ['id', 'name', 'summary', 'content']
    
    def filter_single_item(item):
        return {key: item[key] for key in KEYS_TO_KEEP if key in item}
    
    # Handle both single dictionary and list of dictionaries
    if isinstance(data, list):
        filtered_data = [filter_single_item(item) for item in data]
    else:
        filtered_data = filter_single_item(data)
    
    return filtered_data
