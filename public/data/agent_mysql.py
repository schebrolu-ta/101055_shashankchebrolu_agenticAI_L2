"""
Agentic AI Assignment - Level 2 (L2) Solution
Production Implementation with MySQL Database & Tiger's AI Gateway
"""

import os
import json
import pandas as pd
from sqlalchemy import create_engine, text
from openai import OpenAI

# -------------------------------------------------------------
# 1. TIGER AI GATEWAY CONFIGURATION
# -------------------------------------------------------------
TIGER_GATEWAY_URL = os.environ.get("TIGER_AI_GATEWAY_URL", "https://ai-gateway.tigeranalytics.in/v1")
TIGER_GATEWAY_KEY = os.environ.get("TIGER_AI_GATEWAY_KEY", "your-tiger-api-key")
USER_EMAIL = os.environ.get("USER_EMAIL", "shashank.chebrolu@tigeranalytics.com")
PROJECT_ID = os.environ.get("PROJECT_ID", "retail-agentic-ai-l2")
MODEL_NAME = os.environ.get("TIGER_MODEL_NAME", "gemini-3.8-flash")

client = OpenAI(
    base_url=TIGER_GATEWAY_URL,
    api_key=TIGER_GATEWAY_KEY,
    default_headers={
        "X-User-Email": USER_EMAIL,
        "X-Project-Id": PROJECT_ID,
        "X-Gateway-Route": "retail-operations"
    }
)

# -------------------------------------------------------------
# 2. MYSQL DATABASE CONNECTION
# -------------------------------------------------------------
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "password")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT = os.environ.get("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "retail_db")

MYSQL_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
db_engine = create_engine(MYSQL_URI, pool_pre_ping=True, pool_size=5)

# -------------------------------------------------------------
# 3. SUGGESTED TOOLS OVER MYSQL (ONLY THE 5 DESIGNATED TOOLS)
# -------------------------------------------------------------
class MySQLRetailTools:
    def __init__(self, engine):
        self.engine = engine

    def execute_sql_query(self, query: str) -> str:
        """Tool 1: Read-only SQL query execution over MySQL."""
        # AI Gateway Read-Only Guardrail
        forbidden = ["drop", "delete", "insert", "update", "alter", "truncate", "create", "grant", "revoke"]
        if any(f in query.lower().split() for f in forbidden):
            return json.dumps({"error": "AI Gateway Policy Error: Write/mutating SQL operations are strictly forbidden."})
        
        try:
            with self.engine.connect() as conn:
                df = pd.read_sql(text(query), conn)
                return df.head(50).to_json(orient="records")
        except Exception as e:
            return json.dumps({"error": str(e)})

    def get_product_metrics(self, product_identifier: str) -> str:
        """Tool 2: Aggregate sales, revenue, and returns for a product in MySQL."""
        query = """
            SELECT p.product_id, p.product_name, p.category, p.base_price,
                   COUNT(o.order_id) as total_orders,
                   COALESCE(SUM(o.units_sold), 0) as total_units_sold,
                   ROUND(COALESCE(SUM(o.units_sold * o.unit_price), 0), 2) as gross_revenue,
                   SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) as returned_orders,
                   ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
            FROM products p
            LEFT JOIN orders o ON p.product_id = o.product_id
            WHERE p.product_id = :identifier OR p.product_name LIKE :name_like
            GROUP BY p.product_id, p.product_name, p.category, p.base_price
        """
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params={"identifier": product_identifier, "name_like": f"%{product_identifier}%"})
            return df.to_json(orient="records")

    def get_customer_profile(self, customer_id: str) -> str:
        """Tool 3: Customer lifetime spend and return history in MySQL."""
        query = """
            SELECT c.customer_id, c.customer_segment, c.signup_date, c.preferred_channel, c.city,
                   COUNT(o.order_id) as total_orders,
                   ROUND(COALESCE(SUM(o.units_sold * o.unit_price), 0), 2) as lifetime_spend,
                   SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) as returned_orders
            FROM customers c
            LEFT JOIN orders o ON c.customer_id = o.customer_id
            WHERE c.customer_id = :cid
            GROUP BY c.customer_id, c.customer_segment, c.signup_date, c.preferred_channel, c.city
        """
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params={"cid": customer_id})
            return df.to_json(orient="records")

    def get_store_performance(self, store_identifier: str) -> str:
        """Tool 4: Store sales, revenue, and returns in MySQL."""
        query = """
            SELECT s.store_id, s.store_name, s.region, s.city, s.store_type,
                   COUNT(o.order_id) as total_orders,
                   ROUND(COALESCE(SUM(o.units_sold * o.unit_price), 0), 2) as gross_revenue,
                   SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) as returned_orders
            FROM stores s
            LEFT JOIN orders o ON s.store_id = o.store_id
            WHERE s.store_id = :identifier OR s.city LIKE :city_like
            GROUP BY s.store_id, s.store_name, s.region, s.city, s.store_type
        """
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params={"identifier": store_identifier, "city_like": f"%{store_identifier}%"})
            return df.to_json(orient="records")

    def analyze_returns(self, dimension: str = "reason") -> str:
        """Tool 5: Diagnostic returns root cause analysis in MySQL."""
        if dimension == "reason":
            query = """
                SELECT r.return_reason, COUNT(*) as return_count,
                       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM returns), 1) as pct_of_returns
                FROM returns r
                GROUP BY r.return_reason
                ORDER BY return_count DESC
            """
        elif dimension == "channel":
            query = """
                SELECT o.sales_channel, COUNT(r.return_id) as return_count,
                       ROUND(COUNT(r.return_id) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
                FROM orders o
                LEFT JOIN returns r ON o.order_id = r.order_id
                GROUP BY o.sales_channel
                ORDER BY return_count DESC
            """
        else:
            query = "SELECT * FROM returns LIMIT 20"
            
        with self.engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            return df.to_json(orient="records")

# -------------------------------------------------------------
# 4. TIGER AI GATEWAY FUNCTION DECLARATIONS (OPENAI COMPATIBLE)
# -------------------------------------------------------------
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "execute_sql_query",
            "description": "Execute a SELECT SQL query against the MySQL retail database (tables: customers, products, orders, returns, stores).",
            "parameters": {
                "type": "object",
                "properties": { "query": { "type": "string", "description": "The read-only SQL query." } },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_metrics",
            "description": "Get units sold, revenue, return rate and reasons for a product ID (e.g. P-001) or product name.",
            "parameters": {
                "type": "object",
                "properties": { "product_identifier": { "type": "string", "description": "Product ID or Name." } },
                "required": ["product_identifier"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_profile",
            "description": "Get customer lifetime spend, return rate, segment and order history for a customer ID.",
            "parameters": {
                "type": "object",
                "properties": { "customer_id": { "type": "string", "description": "Customer ID (e.g. C-0014)." } },
                "required": ["customer_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_store_performance",
            "description": "Get sales, revenue and return metrics for a retail store by store ID or city.",
            "parameters": {
                "type": "object",
                "properties": { "store_identifier": { "type": "string", "description": "Store ID (e.g. ST-001) or City." } },
                "required": ["store_identifier"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_returns",
            "description": "Aggregate return reasons, category breakdowns, channel return rates, or regional returns.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dimension": { "type": "string", "enum": ["reason", "category", "channel", "region"] }
                },
                "required": ["dimension"]
            }
        }
    }
]

# -------------------------------------------------------------
# 5. AGENT EXECUTION LOOP
# -------------------------------------------------------------
class RetailMySQLAgent:
    def __init__(self, tools: MySQLRetailTools):
        self.tools = tools
        self.tool_map = {
            "execute_sql_query": self.tools.execute_sql_query,
            "get_product_metrics": self.tools.get_product_metrics,
            "get_customer_profile": self.tools.get_customer_profile,
            "get_store_performance": self.tools.get_store_performance,
            "analyze_returns": self.tools.analyze_returns,
        }

    def run(self, user_prompt: str) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert Retail Operations Agentic AI. "
                    "You have access to 5 suggested tools over a MySQL database (retail_db). "
                    "Always use ONLY these suggested tools to retrieve factual ground truth before forming conclusions."
                )
            },
            {"role": "user", "content": user_prompt}
        ]

        print(f"\\n[1] Dispatching prompt to Tiger AI Gateway: {TIGER_GATEWAY_URL}")
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            tools=TOOLS_SCHEMA,
            tool_choice="auto"
        )

        response_msg = response.choices[0].message
        tool_calls = response_msg.tool_calls

        if tool_calls:
            messages.append(response_msg)
            print(f"[2] Gateway returned {len(tool_calls)} Tool Call(s):")
            
            for tool_call in tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                print(f"    -> Invoking MySQL Tool: {fn_name}({fn_args})")

                tool_output = self.tool_map[fn_name](**fn_args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_output
                })

            print("[3] Synthesizing final answer through Tiger AI Gateway...")
            final_res = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages
            )
            return final_res.choices[0].message.content
        else:
            return response_msg.content

if __name__ == "__main__":
    tools = MySQLRetailTools(db_engine)
    agent = RetailMySQLAgent(tools)
    
    # Run test question
    query = "Which product has the highest return rate and what are the root causes?"
    print(f"\\n--- Query: {query} ---")
    answer = agent.run(query)
    print("\\n[FINAL AGENT ANSWER]:\\n", answer)
