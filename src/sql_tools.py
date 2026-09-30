"""
SQL Tool Execution Module
Stack AI Foundation – Agentic AI Explorer – Level 2
Executes validated read-only SQL queries on MySQL and returns rows as dictionaries.
"""

from typing import List, Dict, Any, Optional
from src.config import config
from src.safety import enforce_safety, SQLSafetyError

class MySQLTool:
    def __init__(self):
        self.host = config.mysql_host
        self.port = config.mysql_port
        self.user = config.mysql_user
        self.password = config.mysql_password
        self.database = config.mysql_database

    def _get_connection(self):
        try:
            import mysql.connector
            return mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database
            )
        except Exception as e:
            # Fallback to pymysql if mysql.connector has environmental binary issues
            import pymysql
            return pymysql.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                cursorclass=pymysql.cursors.DictCursor
            )

    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Executes a safe read-only SQL statement and returns rows as dictionaries.
        
        Returns:
            {
                "success": bool,
                "sanitized_sql": str,
                "row_count": int,
                "data": List[Dict[str, Any]],
                "error": Optional[str]
            }
        """
        try:
            # 1. Enforce strict safety guardrails
            sanitized_sql = enforce_safety(query)
            
            # 2. Execute query on MySQL
            conn = self._get_connection()
            try:
                # Attempt mysql-connector dictionary cursor
                cursor = conn.cursor(dictionary=True)
            except TypeError:
                # pymysql uses DictCursor passed during connect
                cursor = conn.cursor()
                
            cursor.execute(sanitized_sql)
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            # Convert non-serializable objects (Decimals, Dates) to strings/floats
            cleaned_rows = []
            for r in rows:
                item = {}
                for k, v in r.items():
                    if hasattr(v, "__str__") and type(v).__name__ in ["Decimal", "date", "datetime"]:
                        item[k] = str(v)
                    else:
                        item[k] = v
                cleaned_rows.append(item)

            return {
                "success": True,
                "sanitized_sql": sanitized_sql,
                "row_count": len(cleaned_rows),
                "data": cleaned_rows,
                "error": None
            }
        except SQLSafetyError as se:
            return {
                "success": False,
                "sanitized_sql": query,
                "row_count": 0,
                "data": [],
                "error": str(se)
            }
        except Exception as ex:
            return {
                "success": False,
                "sanitized_sql": query,
                "row_count": 0,
                "data": [],
                "error": f"Database Execution Error: {str(ex)}"
            }

sql_tool = MySQLTool()
