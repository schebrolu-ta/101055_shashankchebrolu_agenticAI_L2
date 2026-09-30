# Conversation Memory & Context Retention Summary

**Project:** Stack AI Foundation – Agentic AI Explorer – Level 2  
**Component:** `src/memory.py` & `src/graph.py`

## Objective
Enable retail business users to conduct conversational data exploration by maintaining recent session turns and seamlessly handling follow-up filtering (e.g. *"Now show only online channel"*).

## Memory Architecture

```
User Turn N: "Which product has highest returns?"
      │
      ▼
SQL Generated: SELECT product_id, COUNT(*) ... (P-007 identified)
      │
      ▼
Agent Memory Cache: Turn 1 recorded (User Query + Generated SQL + Filter Context)
      │
      ▼
User Turn N+1: "Now show only online channel."
      │
      ▼
Memory Injected Prompt: Prior query targeted P-007. Append `WHERE sales_channel = 'Online'`
      │
      ▼
Refined SQL: SELECT ... WHERE product_id = 'P-007' AND sales_channel = 'Online'
```

## Demonstration Test Results

### Turn 1: Initial Discovery
- **User Question:** *"Which product has the highest return rate?"*
- **Generated SQL:**
  ```sql
  SELECT p.product_id, p.product_name,
         ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
  FROM products p
  JOIN orders o ON p.product_id = o.product_id
  GROUP BY p.product_id, p.product_name
  ORDER BY return_rate_pct DESC LIMIT 1;
  ```
- **Result:** P-007 (Detergent) with 21.6% return rate.
- **Memory Updated:** Turn 1 recorded with product context `P-007`.

### Turn 2: Follow-up Filter
- **User Question:** *"Now show only online channel."*
- **Memory Context Provided to LLM:** Prior question was about product P-007 return rate.
- **Generated SQL:**
  ```sql
  SELECT p.product_id, p.product_name, o.sales_channel,
         ROUND(SUM(CASE WHEN o.delivery_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(o.order_id), 1) as return_rate_pct
  FROM products p
  JOIN orders o ON p.product_id = o.product_id
  WHERE p.product_id = 'P-007' AND o.sales_channel = 'Online'
  GROUP BY p.product_id, p.product_name, o.sales_channel;
  ```
- **Business Summary:** Grounded answer showing Online channel return metrics specifically for Detergent (P-007).

**Conclusion:** The agent successfully tracked multi-turn context without requiring the user to re-state the product or metric.
