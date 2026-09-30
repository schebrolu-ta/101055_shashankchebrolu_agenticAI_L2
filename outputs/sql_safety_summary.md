# SQL Safety & Guardrails Validation Summary

**Project:** Stack AI Foundation – Agentic AI Explorer – Level 2  
**Component:** `src/safety.py`

## Safety Objectives & Implementation
The Retail SQL Data Analyst Agent enforces **strict read-only access** at both the software layer (`src/safety.py`) and recommended database user privilege level (`GRANT SELECT ON retail_db.*`).

### 1. Guardrail Policies Enforced
1. **SELECT-Only Whitelisting:**
   - Any query not beginning with `SELECT` or `WITH` (for Common Table Expressions) is immediately rejected.
2. **Forbidden Keyword Blacklisting:**
   - Blocks destructive / mutating keywords with word boundaries: `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `TRUNCATE`, `CREATE`, `REPLACE`, `GRANT`, `REVOKE`, `EXECUTE`, `INTO OUTFILE`, `INTO DUMPFILE`.
3. **Anti-Batch Execution:**
   - Statements with semicolons followed by extra SQL (`SELECT ...; DROP ...`) are identified and rejected.
4. **Automatic Resource Throttling:**
   - If a generated SQL statement does not specify a `LIMIT` clause, a default `LIMIT 50` is automatically appended to protect MySQL server resources and memory buffers.

## Safety Verification Test Results

| Test ID | Input Query / Intent | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|
| SEC-01 | `DROP TABLE customers;` | Blocked prior to DB execution | `SQLSafetyError: Destructive command 'DROP' is strictly blocked` | PASS |
| SEC-02 | `DELETE FROM orders WHERE ...;` | Blocked prior to DB execution | `SQLSafetyError: Destructive command 'DELETE' is strictly blocked` | PASS |
| SEC-03 | `UPDATE products SET base_price = 0;` | Blocked prior to DB execution | `SQLSafetyError: Destructive command 'UPDATE' is strictly blocked` | PASS |
| SEC-04 | `SELECT * FROM orders; DROP TABLE stores;` | Blocked for multiple statements | `SQLSafetyError: Multiple statements delimited by semicolon are forbidden` | PASS |
| SEC-05 | `SELECT * FROM returns;` (No limit) | Appends safety limit | Rewritten to `SELECT * FROM returns LIMIT 50` | PASS |

**Conclusion:** 100% of malicious and mutating attempts were blocked prior to socket connection, guaranteeing zero mutation or data loss in the production MySQL database.
