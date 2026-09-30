"""
Interactive CLI Application for Evaluator Testing
Stack AI Foundation – Agentic AI Explorer – Level 2
Run this CLI to evaluate the LangGraph Retail SQL Data Analyst Agent.
"""

import os
import sys
from tabulate import tabulate
from src.graph import retail_agent_app
from src.memory import conversation_memory

def print_banner():
    print("=" * 80)
    print("  STACK AI FOUNDATION – AGENTIC AI EXPLORER – LEVEL 2")
    print("  Retail SQL Data Analyst Agent (LangGraph + MySQL + Tiger AI Gateway)")
    print("=" * 80)
    print("  Commands:")
    print("    - Type any business question in natural language.")
    print("    - Test follow-ups: 'Now show only online channel', 'Filter by North'.")
    print("    - Type 'clear' to reset conversation memory.")
    print("    - Type 'history' to inspect memory turns.")
    print("    - Type 'exit' or 'quit' to terminate.")
    print("=" * 80 + "\n")

def run_query(question: str):
    print(f"\n[USER QUESTION]: {question}")
    print("-" * 80)
    
    initial_state = {
        "user_query": question,
        "memory_context": "",
        "generated_sql": None,
        "is_safe": False,
        "safety_reason": None,
        "query_data": None,
        "business_summary": None,
        "error": None
    }

    try:
        final_state = retail_agent_app.invoke(initial_state)

        # 1. Show Generated SQL & Safety Status
        sql = final_state.get("generated_sql")
        is_safe = final_state.get("is_safe", False)
        
        print("\n[GENERATED MYSQL SELECT]:")
        if sql:
            print(f"  {sql}")
        else:
            print("  (None generated)")
            
        print(f"\n[SQL SAFETY VALIDATION]: {'PASSED (Read-only SELECT)' if is_safe else 'BLOCKED'}")
        if not is_safe:
            print(f"  Reason: {final_state.get('safety_reason')}")

        # 2. Show Query Output Stats
        query_data = final_state.get("query_data")
        if query_data and query_data.get("success"):
            row_count = query_data.get("row_count", 0)
            print(f"\n[MYSQL TOOL EXECUTION]: Success ({row_count} rows retrieved)")
            if row_count > 0:
                sample_rows = query_data["data"][:5]
                print(tabulate(sample_rows, headers="keys", tablefmt="grid"))
                if row_count > 5:
                    print(f"  ... and {row_count - 5} more rows.")
            else:
                print("  [Notice]: No records matched the search criteria.")
        elif query_data and not query_data.get("success"):
            print(f"\n[MYSQL EXECUTION ERROR]: {query_data.get('error')}")

        # 3. Grounded Business Summary
        summary = final_state.get("business_summary")
        print("\n[GROUNDED BUSINESS SUMMARY]:")
        print(f"  {summary}")
        print("-" * 80 + "\n")

    except Exception as e:
        print(f"\n[AGENT EXECUTION ERROR]: {str(e)}\n")

def main():
    print_banner()
    while True:
        try:
            user_input = input("RetailAgent> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit"]:
                print("Exiting Retail SQL Agent. Goodbye!")
                break
            elif user_input.lower() == "clear":
                conversation_memory.clear()
                print("[Memory]: Conversation context cleared.")
                continue
            elif user_input.lower() == "history":
                if not conversation_memory.history:
                    print("[Memory]: No stored history.")
                else:
                    for t in conversation_memory.history:
                        print(f"Turn {t.turn_id}: Query='{t.user_query}' -> SQL={t.generated_sql}")
                continue

            run_query(user_input)

        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

if __name__ == "__main__":
    main()
