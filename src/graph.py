"""
LangGraph StateGraph Workflow
Stack AI Foundation – Agentic AI Explorer – Level 2
Retail SQL Data Analyst Agent combining:
User Question -> Generate MySQL SELECT -> SQL Safety Validation -> SQL Tool Execution -> Summarize Result -> Update Memory -> Final Answer
"""

import json
from typing import Dict, Any, Optional, TypedDict
from langgraph.graph import StateGraph, START, END

from src.tiger_gateway_client import gateway_client
from src.safety import sanitize_and_validate_sql
from src.sql_tools import sql_tool
from src.memory import conversation_memory

# -------------------------------------------------------------
# 1. AGENT STATE DEFINITION
# -------------------------------------------------------------
class AgentState(TypedDict):
    user_query: str
    memory_context: str
    generated_sql: Optional[str]
    is_safe: bool
    safety_reason: Optional[str]
    query_data: Optional[Dict[str, Any]]
    business_summary: Optional[str]
    error: Optional[str]

# -------------------------------------------------------------
# 2. SCHEMA PROMPT PROMPT CONTEXT
# -------------------------------------------------------------
MYSQL_SCHEMA_CONTEXT = """
You are an expert MySQL Data Analyst for a retail enterprise.
Target Database: MySQL (database: retail_db).

TABLES AND SCHEMAS:
1. customers (customer_id PK, customer_segment ENUM('Regular','Budget','Premium','Wholesale'), signup_date DATE, preferred_channel VARCHAR, city VARCHAR)
2. products (product_id PK, product_name VARCHAR, category VARCHAR, sub_category VARCHAR, base_price DECIMAL(10,2))
3. stores (store_id PK, store_name VARCHAR, region ENUM('North','South','East','West','Central'), city VARCHAR, store_type ENUM('Supermarket','Convenience','Express'))
4. orders (order_id PK, order_date DATE, store_id FK, product_id FK, customer_id FK, sales_channel VARCHAR, units_sold INT, unit_price DECIMAL(10,2), discount_pct DECIMAL(5,2), payment_status ENUM('Paid','Pending'), delivery_status ENUM('Delivered','Returned','Processing'))
   - Note: 'sales_transactions' is a direct alias for 'orders'.
5. returns (return_id PK, order_id FK, return_date DATE, return_reason VARCHAR)

RULES FOR SQL GENERATION:
- ONLY generate read-only SELECT statements. Never generate DROP, DELETE, INSERT, UPDATE, ALTER, etc.
- Use explicit JOINs using primary and foreign keys.
- For return rate calculations: COUNT(CASE WHEN delivery_status = 'Returned' THEN 1 END) * 100.0 / COUNT(*)
- Return ONLY the executable SQL query. Do not include markdown commentary.
"""

# -------------------------------------------------------------
# 3. GRAPH NODE FUNCTIONS
# -------------------------------------------------------------
def generate_sql_node(state: AgentState) -> AgentState:
    """Node 1: Generates MySQL SELECT statement using prompt, schema, and memory."""
    user_query = state["user_query"]
    memory_context = conversation_memory.get_context_prompt()

    messages = [
        {"role": "system", "content": MYSQL_SCHEMA_CONTEXT},
        {
            "role": "user",
            "content": f"{memory_context}\n\nUSER QUESTION: {user_query}\n\nProvide the MySQL SELECT query:"
        }
    ]

    try:
        raw_sql = gateway_client.generate_completion(messages, temperature=0.0)
        return {
            **state,
            "memory_context": memory_context,
            "generated_sql": raw_sql.strip(),
            "error": None
        }
    except Exception as e:
        return {
            **state,
            "memory_context": memory_context,
            "generated_sql": None,
            "error": f"SQL Generation Failed: {str(e)}"
        }

def validate_safety_node(state: AgentState) -> AgentState:
    """Node 2: Validates that generated SQL is strictly read-only and safe."""
    sql = state.get("generated_sql")
    if not sql:
        return {
            **state,
            "is_safe": False,
            "safety_reason": "No SQL was generated."
        }

    is_safe, sanitized_sql, reason = sanitize_and_validate_sql(sql)
    return {
        **state,
        "is_safe": is_safe,
        "generated_sql": sanitized_sql if is_safe else sql,
        "safety_reason": reason
    }

def execute_sql_node(state: AgentState) -> AgentState:
    """Node 3: Executes safe query on MySQL database."""
    sanitized_sql = state["generated_sql"]
    execution_result = sql_tool.execute_query(sanitized_sql)

    return {
        **state,
        "query_data": execution_result,
        "error": execution_result.get("error")
    }

def summarize_result_node(state: AgentState) -> AgentState:
    """Node 4: Grounded business summary based on MySQL result."""
    user_query = state["user_query"]
    query_data = state.get("query_data", {})
    rows = query_data.get("data", [])
    row_count = query_data.get("row_count", 0)

    if not query_data.get("success"):
        error_msg = query_data.get("error", "Unknown error")
        return {
            **state,
            "business_summary": f"Could not complete request: {error_msg}"
        }

    if row_count == 0:
        return {
            **state,
            "business_summary": "The query executed successfully, but no matching records were found in the database."
        }

    summary_prompt = f"""
USER QUESTION: {user_query}
EXECUTED SQL: {state['generated_sql']}
RETURNED ROWS ({row_count} total, showing sample):
{json.dumps(rows[:10], indent=2)}

TASK: Provide a concise, clear business summary answering the user's question directly.
- Ground all numbers strictly in the returned SQL data.
- Mention key insights (e.g. percentages, totals, leading products/channels).
- Keep it executive and professional.
"""

    messages = [
        {"role": "system", "content": "You are a Senior Retail Business Data Analyst."},
        {"role": "user", "content": summary_prompt}
    ]

    try:
        summary = gateway_client.generate_completion(messages, temperature=0.2)
        return {
            **state,
            "business_summary": summary
        }
    except Exception as e:
        return {
            **state,
            "business_summary": f"Retrieved {row_count} rows from MySQL, but summary generation failed: {str(e)}"
        }

def handle_safety_violation_node(state: AgentState) -> AgentState:
    """Node: Handles queries blocked by safety guardrails."""
    reason = state.get("safety_reason", "Unsafe SQL pattern detected.")
    return {
        **state,
        "business_summary": f"[SAFETY GUARDRAIL BLOCKED]: {reason}\nFor security, only read-only SELECT queries are allowed."
    }

def update_memory_node(state: AgentState) -> AgentState:
    """Node 5: Updates conversation memory with this turn."""
    row_count = 0
    if state.get("query_data"):
        row_count = state["query_data"].get("row_count", 0)

    conversation_memory.add_turn(
        user_query=state["user_query"],
        generated_sql=state.get("generated_sql"),
        row_count=row_count,
        business_summary=state.get("business_summary")
    )
    return state

# -------------------------------------------------------------
# 4. CONDITIONAL ROUTING
# -------------------------------------------------------------
def check_safety_condition(state: AgentState) -> str:
    return "execute_sql" if state.get("is_safe") else "safety_violation"

# -------------------------------------------------------------
# 5. BUILD THE LANGGRAPH WORKFLOW
# -------------------------------------------------------------
def create_retail_agent_graph():
    builder = StateGraph(AgentState)

    # Add Nodes
    builder.add_node("generate_sql", generate_sql_node)
    builder.add_node("validate_safety", validate_safety_node)
    builder.add_node("execute_sql", execute_sql_node)
    builder.add_node("summarize_result", summarize_result_node)
    builder.add_node("safety_violation", handle_safety_violation_node)
    builder.add_node("update_memory", update_memory_node)

    # Add Edges
    builder.add_edge(START, "generate_sql")
    builder.add_edge("generate_sql", "validate_safety")

    builder.add_conditional_edges(
        "validate_safety",
        check_safety_condition,
        {
            "execute_sql": "execute_sql",
            "safety_violation": "safety_violation"
        }
    )

    builder.add_edge("execute_sql", "summarize_result")
    builder.add_edge("summarize_result", "update_memory")
    builder.add_edge("safety_violation", "update_memory")
    builder.add_edge("update_memory", END)

    return builder.compile()

retail_agent_app = create_retail_agent_graph()
