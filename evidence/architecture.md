# Architecture Diagram & System Workflow

**Project:** Stack AI Foundation – Agentic AI Explorer – Level 2  
**System:** Retail SQL Data Analyst Agent using LangGraph and MySQL

## End-to-End System Architecture

```
                    ┌─────────────────────────┐
                    │  User Question (Prompt) │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Conversation Memory     │ ◄─── (Recent turns context)
                    │ (src/memory.py)         │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   LANGGRAPH STATEGRAPH WORKFLOW                        │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ [1] generate_sql Node                                        │     │
│   │ Calls Tiger AI Gateway (gemini-3.8-flash)                    │     │
│   │ Prompt = Schema Context + Memory + User Query                │     │
│   └──────────────────────────────┬───────────────────────────────┘     │
│                                  │                                     │
│                                  ▼                                     │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ [2] validate_safety Node (src/safety.py)                     │     │
│   │ Regex & Keyword Parser: Allows ONLY read-only SELECT / CTE   │     │
│   │ Blocks DROP, DELETE, INSERT, UPDATE, ALTER, TRUNCATE         │     │
│   └───────────────────────┬──────────────┬───────────────────────┘     │
│                           │              │                             │
│                  (Is Safe: True)    (Is Safe: False)                   │
│                           │              │                             │
│                           ▼              ▼                             │
│   ┌────────────────────────┐    ┌──────────────────────────────────┐   │
│   │ [3] execute_sql Node   │    │ [3b] safety_violation Node       │   │
│   │ Uses mysql.connector   │    │ Formats security warning         │   │
│   │ Queries MySQL Database │    │ Zero DB execution                │   │
│   └───────────┬────────────┘    └────────────────┬─────────────────┘   │
│               │                                  │                     │
│               ▼                                  │                     │
│   ┌────────────────────────┐                     │                     │
│   │ [4] summarize_result   │                     │                     │
│   │ Calls Tiger AI Gateway │                     │                     │
│   │ Grounded business text │                     │                     │
│   └───────────┬────────────┘                     │                     │
│               │                                  │                     │
│               ▼                                  ▼                     │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ [5] update_memory Node                                       │     │
│   │ Appends (Query, SQL, Row Count, Summary) to Agent Memory     │     │
│   └──────────────────────────────┬───────────────────────────────┘     │
│                                  │                                     │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────┐
                    │ Final Executive Answer  │
                    │ + Executed SQL Display  │
                    └─────────────────────────┘
```

## Architectural Highlights
1. **Separation of Concerns:**
   - LLM does NOT directly query the database socket.
   - LLM generates structured text $\to$ safety filter inspects $\to$ native Python driver queries $\to$ LLM formats the response.
2. **Deterministic Security Layer:**
   - Safety validation does not rely on LLM self-evaluation; it is strictly deterministic in Python (`src/safety.py`).
3. **Conversational Coherence:**
   - Follow-up queries (e.g., *"Now show only online channel"*) reuse active filters from the state graph's memory context.
