"""
SQL Safety & Guardrails Module
Stack AI Foundation – Agentic AI Explorer – Level 2
Enforces strict read-only SELECT permissions and blocks destructive queries.
"""

import re
from typing import Tuple
from src.config import config

FORBIDDEN_KEYWORDS = [
    r"\bdrop\b",
    r"\bdelete\b",
    r"\binsert\b",
    r"\bupdate\b",
    r"\balter\b",
    r"\btruncate\b",
    r"\bcreate\b",
    r"\breplace\b",
    r"\bgrant\b",
    r"\brevoke\b",
    r"\bexecute\b",
    r"\bexec\b",
    r"\bcall\b",
    r"\bload\b",
    r"\binto\s+outfile\b",
    r"\binto\s+dumpfile\b"
]

class SQLSafetyError(Exception):
    """Raised when an unsafe or non-SELECT SQL statement is detected."""
    pass

def sanitize_and_validate_sql(sql_query: str) -> Tuple[bool, str, str]:
    """
    Validates that the SQL query is safe and strictly read-only.
    
    Returns:
        (is_valid: bool, sanitized_sql: str, reason: str)
    """
    if not sql_query or not sql_query.strip():
        return False, "", "Empty SQL query provided."

    cleaned_sql = sql_query.strip()
    
    # Remove markdown code fences if LLM wrapped it in ```sql ... ```
    if cleaned_sql.startswith("```"):
        cleaned_sql = re.sub(r"^```(?:sql)?\s*", "", cleaned_sql, flags=re.IGNORECASE)
        cleaned_sql = re.sub(r"\s*```$", "", cleaned_sql)
        cleaned_sql = cleaned_sql.strip()

    # Block multiple statements delimited by semicolons
    statements = [s.strip() for s in cleaned_sql.split(";") if s.strip()]
    if len(statements) > 1:
        return False, cleaned_sql, "Multiple statements delimited by semicolon are forbidden."

    # Must start with SELECT or WITH (for CTEs)
    first_keyword_match = re.match(r"^\s*(select|with)\b", cleaned_sql, flags=re.IGNORECASE)
    if not first_keyword_match:
        return False, cleaned_sql, "Only read-only SELECT or WITH (CTE) queries are permitted."

    # Check for forbidden write/mutating keywords
    lower_sql = cleaned_sql.lower()
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, lower_sql):
            matched = re.search(pattern, lower_sql).group(0)
            return False, cleaned_sql, f"Security Violation: Mutating/Destructive command '{matched.upper()}' is strictly blocked."

    # Check if LIMIT exists; append default limit if missing to prevent DoS
    if not re.search(r"\blimit\b\s+\d+", lower_sql):
        cleaned_sql = f"{cleaned_sql.rstrip(';')} LIMIT {config.max_sql_rows}"

    return True, cleaned_sql, "Safe read-only SELECT statement."

def enforce_safety(sql_query: str) -> str:
    """Helper that raises SQLSafetyError if invalid, otherwise returns sanitized SQL."""
    is_valid, sanitized_sql, reason = sanitize_and_validate_sql(sql_query)
    if not is_valid:
        raise SQLSafetyError(f"[SQL Safety Guardrail Triggered] {reason}")
    return sanitized_sql
