"""
Pytest Test Suite: SQL Safety & Guardrails
Stack AI Foundation – Agentic AI Explorer – Level 2
Tests that destructive SQL statements are blocked and safe SELECTs pass.
"""

import pytest
from src.safety import sanitize_and_validate_sql, SQLSafetyError, enforce_safety

def test_valid_select_queries():
    """Ensures safe SELECT statements pass validation and get LIMIT attached."""
    sql = "SELECT product_name, base_price FROM products WHERE category = 'Groceries'"
    is_valid, sanitized, reason = sanitize_and_validate_sql(sql)
    assert is_valid is True
    assert "LIMIT" in sanitized
    assert "Safe read-only SELECT" in reason

def test_blocked_drop_table():
    """Ensures DROP TABLE queries are blocked."""
    sql = "DROP TABLE customers;"
    is_valid, sanitized, reason = sanitize_and_validate_sql(sql)
    assert is_valid is False
    assert "DROP" in reason or "SELECT" in reason

def test_blocked_delete_statement():
    """Ensures DELETE queries are blocked."""
    sql = "DELETE FROM orders WHERE delivery_status = 'Returned';"
    is_valid, _, reason = sanitize_and_validate_sql(sql)
    assert is_valid is False

def test_blocked_update_statement():
    """Ensures UPDATE queries are blocked."""
    sql = "UPDATE products SET base_price = 999 WHERE product_id = 'P-001';"
    is_valid, _, reason = sanitize_and_validate_sql(sql)
    assert is_valid is False

def test_blocked_multiple_semicolons():
    """Ensures stacked SQL statements separated by semicolons are rejected."""
    sql = "SELECT * FROM orders; DROP TABLE returns;"
    is_valid, _, reason = sanitize_and_validate_sql(sql)
    assert is_valid is False
    assert "Multiple statements" in reason

def test_enforce_safety_raises():
    """Ensures enforce_safety raises SQLSafetyError on violations."""
    with pytest.raises(SQLSafetyError):
        enforce_safety("TRUNCATE TABLE stores;")
