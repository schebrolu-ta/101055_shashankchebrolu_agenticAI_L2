"""
Pytest Test Suite: SQL Tool Behavior
Stack AI Foundation – Agentic AI Explorer – Level 2
Tests that SQL tool executes queries safely and returns dictionary rows.
"""

from unittest.mock import MagicMock, patch
from src.sql_tools import MySQLTool

def test_sql_tool_returns_dictionaries():
    """Mocks MySQL connection to verify output structure matches dictionary format."""
    tool = MySQLTool()
    
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"product_id": "P-001", "product_name": "Tea Premium", "base_price": 399.0}
    ]
    
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    
    with patch.object(tool, "_get_connection", return_value=mock_conn):
        res = tool.execute_query("SELECT product_id, product_name, base_price FROM products;")
        assert res["success"] is True
        assert res["row_count"] == 1
        assert isinstance(res["data"], list)
        assert res["data"][0]["product_id"] == "P-001"
        assert res["error"] is None

def test_sql_tool_blocks_unsafe_execution():
    """Verifies tool halts before attempting DB execution on unsafe queries."""
    tool = MySQLTool()
    res = tool.execute_query("DROP TABLE orders;")
    assert res["success"] is False
    assert "Security Violation" in res["error"] or "Only read-only SELECT" in res["error"]
