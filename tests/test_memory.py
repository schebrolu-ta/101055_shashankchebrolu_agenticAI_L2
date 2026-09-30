"""
Pytest Test Suite: Memory & Follow-up Context
Stack AI Foundation – Agentic AI Explorer – Level 2
Tests conversation context retention and follow-up prompt formation.
"""

from src.memory import AgentMemory

def test_memory_add_and_retrieve():
    mem = AgentMemory(max_turns=3)
    mem.add_turn(
        user_query="Which product has highest returns?",
        generated_sql="SELECT product_id, COUNT(*) FROM orders WHERE delivery_status = 'Returned' GROUP BY product_id;",
        row_count=10,
        business_summary="P-007 has 21.6% return rate."
    )
    assert len(mem.history) == 1
    last = mem.get_last_turn()
    assert last.user_query == "Which product has highest returns?"

def test_memory_prompt_formatting_for_followup():
    mem = AgentMemory(max_turns=3)
    mem.add_turn(
        user_query="Show sales by product category",
        generated_sql="SELECT p.category, SUM(o.units_sold) FROM products p JOIN orders o ON p.product_id = o.product_id GROUP BY p.category;",
        row_count=5,
        business_summary="Groceries and Household lead volume."
    )
    prompt = mem.get_context_prompt()
    assert "RECENT CONVERSATION HISTORY" in prompt
    assert "Show sales by product category" in prompt
    assert "Prior SQL:" in prompt

def test_memory_max_turns_eviction():
    mem = AgentMemory(max_turns=2)
    mem.add_turn("Q1", "SQL1", 1, "A1")
    mem.add_turn("Q2", "SQL2", 2, "A2")
    mem.add_turn("Q3", "SQL3", 3, "A3")
    assert len(mem.history) == 2
    assert mem.history[0].user_query == "Q2"
    assert mem.history[1].user_query == "Q3"
