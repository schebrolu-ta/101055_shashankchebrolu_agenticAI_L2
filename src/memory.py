"""
Conversation Memory Module
Stack AI Foundation – Agentic AI Explorer – Level 2
Retains recent conversation context to support follow-up business queries
(e.g., "Now show only online channel", "Filter by North region only").
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ConversationTurn(BaseModel):
    turn_id: int
    user_query: str
    generated_sql: Optional[str] = None
    row_count: int = 0
    business_summary: Optional[str] = None
    active_filters: Dict[str, Any] = Field(default_factory=dict)

class AgentMemory:
    def __init__(self, max_turns: int = 5):
        self.max_turns = max_turns
        self.history: List[ConversationTurn] = []

    def add_turn(
        self,
        user_query: str,
        generated_sql: Optional[str],
        row_count: int,
        business_summary: Optional[str],
        active_filters: Optional[Dict[str, Any]] = None
    ) -> ConversationTurn:
        turn = ConversationTurn(
            turn_id=len(self.history) + 1,
            user_query=user_query,
            generated_sql=generated_sql,
            row_count=row_count,
            business_summary=business_summary,
            active_filters=active_filters or {}
        )
        self.history.append(turn)
        if len(self.history) > self.max_turns:
            self.history.pop(0)
        return turn

    def get_last_turn(self) -> Optional[ConversationTurn]:
        return self.history[-1] if self.history else None

    def get_context_prompt(self) -> str:
        """Formats recent history into a structured prompt section for SQL generation."""
        if not self.history:
            return "No previous conversation context. This is the first question in the session."

        context_lines = ["RECENT CONVERSATION HISTORY & PRIOR SQL CONTEXT:"]
        for turn in self.history[-3:]:  # Last 3 turns for focused context
            context_lines.append(f"- Turn {turn.turn_id}:")
            context_lines.append(f"  User Question: \"{turn.user_query}\"")
            if turn.generated_sql:
                context_lines.append(f"  Prior SQL: {turn.generated_sql}")
            if turn.business_summary:
                context_lines.append(f"  Prior Answer Summary: {turn.business_summary[:150]}...")
        
        context_lines.append(
            "\nNote: If the current user query is a follow-up (e.g., 'Now show only online channel', 'Filter by North'), "
            "refine the PRIOR SQL query by adding or modifying the relevant WHERE / GROUP BY clauses while preserving existing filters."
        )
        return "\n".join(context_lines)

    def clear(self):
        self.history.clear()

# Global memory instance
conversation_memory = AgentMemory()
