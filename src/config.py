"""
Configuration Module for Retail SQL Data Analyst Agent
Stack AI Foundation – Agentic AI Explorer – Level 2
"""

import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class AppConfig(BaseModel):
    # Tiger AI Gateway Settings
    tiger_gateway_url: str = Field(
        default_factory=lambda: os.environ.get("TIGER_AI_GATEWAY_URL", "https://ai-gateway.tigeranalytics.in/v1")
    )
    tiger_gateway_key: str = Field(
        default_factory=lambda: os.environ.get("TIGER_AI_GATEWAY_KEY", "")
    )
    user_email: str = Field(
        default_factory=lambda: os.environ.get("USER_EMAIL", "shashank.chebrolu@tigeranalytics.com")
    )
    project_id: str = Field(
        default_factory=lambda: os.environ.get("PROJECT_ID", "retail-agentic-ai-l2")
    )
    model_name: str = Field(
        default_factory=lambda: os.environ.get("TIGER_MODEL_NAME", "gemini-2.0-flash")
    )

    # MySQL Settings
    mysql_host: str = Field(
        default_factory=lambda: os.environ.get("MYSQL_HOST", "localhost")
    )
    mysql_port: int = Field(
        default_factory=lambda: int(os.environ.get("MYSQL_PORT", 3306))
    )
    mysql_user: str = Field(
        default_factory=lambda: os.environ.get("MYSQL_USER", "root")
    )
    mysql_password: str = Field(
        default_factory=lambda: os.environ.get("MYSQL_PASSWORD", "")
    )
    mysql_database: str = Field(
        default_factory=lambda: os.environ.get("MYSQL_DATABASE", "retail_db")
    )

    # Agent Guardrails
    max_sql_rows: int = Field(
        default_factory=lambda: int(os.environ.get("MAX_SQL_ROW_LIMIT", 50))
    )
    allow_mutating_sql: bool = Field(
        default_factory=lambda: os.environ.get("ALLOW_MUTATING_SQL", "false").lower() == "true"
    )

config = AppConfig()
