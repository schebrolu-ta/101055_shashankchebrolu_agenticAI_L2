# Stack AI Foundation – Agentic AI Explorer – Level 2
## Natural Language SQL Data Agent using LangGraph and MySQL

An enterprise agentic workflow combining **LangGraph StateGraph**, **Tiger AI Gateway**, **MySQL Workbench**, and **Safety Guardrails** to answer natural language retail business questions with conversational memory.

---

## 1. Project Directory Structure

```
.
├── data/                       # Original 5 synthetic retail datasets
│   ├── customers.csv           # 80 customer profiles
│   ├── products.csv            # 10 product SKUs
│   ├── stores.csv              # 15 store locations
│   ├── orders.csv              # 360 sales transactions
│   └── returns.csv             # 46 return records
├── database/                   # MySQL schema, loader, and reference docs
│   ├── mysql_schema.sql        # DDL script for MySQL Workbench
│   ├── load_data.py            # Automated CSV ingestion to MySQL
│   └── schema_reference.md     # Relational schema reference guide
├── src/                        # Agent source code
│   ├── config.py               # Environment configuration & settings
│   ├── tiger_gateway_client.py # Tiger AI Gateway / LLM integration
│   ├── safety.py               # Read-only SQL validator & guardrails
│   ├── sql_tools.py            # mysql-connector-python tool execution
│   ├── memory.py               # Multi-turn conversational memory
│   ├── graph.py                # LangGraph StateGraph workflow
│   └── app.py                  # Interactive CLI evaluator application
├── tests/                      # Pytest automated test suites
│   ├── test_safety.py          # SQL safety & guardrail tests
│   ├── test_sql_tools.py       # SQL execution & dictionary format tests
│   └── test_memory.py          # Context retention & follow-up tests
├── outputs/                    # Evaluation artifacts & reports
│   ├── test_case_results.csv   # 10 benchmark test cases
│   ├── sql_safety_summary.md   # Safety enforcement audit
│   ├── memory_summary.md       # Memory retention trace
│   └── mysql_validation.md     # Ingestion & integrity checks
├── evidence/                   # Human review & governance evidence
│   ├── ai_usage_log.md         # Gateway token & request log
│   ├── architecture.md         # End-to-end architecture diagram
│   └── human_review_notes.md   # Human-in-the-loop review sign-off
├── requirements.txt            # Python dependencies
├── .env.example                # Template for credentials & config
└── README.md                   # This instruction guide
```

---

## 2. Prerequisites & Setup (Windows PowerShell / Linux)

### Step 1: Clone or Extract the Project
Open Windows PowerShell (or terminal) in your project directory:
```powershell
cd path\to\project
```

### Step 2: Create and Activate Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(On Linux/macOS: `source venv/bin/activate`)*

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

---

## 3. MySQL Database Setup

### Step 1: Create Schema in MySQL Workbench
1. Open **MySQL Workbench**.
2. Connect to your local MySQL server instance (e.g. `localhost:3306`).
3. Open `database/mysql_schema.sql` and click the **Execute (Lightning bolt)** button.
4. Verify that `retail_db` is created with tables: `customers`, `products`, `stores`, `orders`, `returns`.

### Step 2: Ingest the Datasets into MySQL
Ensure your `.env` has your MySQL password, then execute:
```powershell
python database/load_data.py
```
This ingests all 5 CSV files from `data/` and verifies row counts (80 customers, 10 products, 15 stores, 360 orders, 46 returns).

---

## 4. Tiger AI Gateway Configuration

Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

Edit `.env` with your assigned credentials:
```env
TIGER_AI_GATEWAY_URL=https://ai-gateway.tigeranalytics.in/v1
TIGER_AI_GATEWAY_KEY=your_tiger_ai_gateway_api_key_here
USER_EMAIL=shashank.chebrolu@tigeranalytics.com
PROJECT_ID=retail-agentic-ai-l2
TIGER_MODEL_NAME=gemini-3.8-flash

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=retail_db
```

---

## 5. Running the Agent (Interactive CLI)

Launch the interactive evaluator application:
```powershell
python -m src.app
```

### Sample Conversational Evaluation Workflow:
1. **Initial Question:**
   ```text
   RetailAgent> Which product has the highest return rate and what are the root causes?
   ```
   *The agent generates safe MySQL SELECT, executes on MySQL, and displays the business summary.*

2. **Follow-Up Question (Testing Conversation Memory):**
   ```text
   RetailAgent> Now show only online channel.
   ```
   *The agent remembers the previous product context and refines the query with `AND o.sales_channel = 'Online'`.*

3. **Testing SQL Safety Guardrail:**
   ```text
   RetailAgent> DROP TABLE customers;
   ```
   *Output: `[SAFETY GUARDRAIL BLOCKED]: Security Violation: Destructive command 'DROP' is strictly blocked.`*

---

## 6. Running Automated Tests

Run the full pytest suite:
```powershell
pytest -v
```

This validates:
- **`tests/test_safety.py`**: Ensures only SELECT is allowed and destructive queries are halted.
- **`tests/test_sql_tools.py`**: Verifies MySQL queries return rows as dictionaries.
- **`tests/test_memory.py`**: Validates context persistence across turns.

---

## 7. Submission Instructions

As specified in the assignment rules:
1. Ensure all 10 test case results in `outputs/test_case_results.csv` are populated.
2. Complete `Agentic AI Evaluation Rubric - L2.xlsx`.
3. Zip the repository using your employee ID and name:
   ```powershell
   # Naming convention: empid_emp_name_agenticAI_L2.zip
   Compress-Archive -Path * -DestinationPath "12345_shashank_chebrolu_agenticAI_L2.zip"
   ```
4. Submit the zip archive to the LMS.
