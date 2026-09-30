# AI Usage Log & Model Interactions

**Project:** Stack AI Foundation – Agentic AI Explorer – Level 2  
**Learner:** Shashank Chebrolu (`shashank.chebrolu@tigeranalytics.com`)  
**Project ID:** `retail-agentic-ai-l2`  
**Gateway Provider:** Tiger AI Gateway (`https://ai-gateway.tigeranalytics.in/v1`)

## Interaction Log

| Session ID | Phase / Node | Model Used | Tokens In | Tokens Out | Latency | Purpose | Human Oversight |
|---|---|---|---|---|---|---|---|
| SES-001 | `generate_sql` | `gemini-3.8-flash` | 420 | 65 | 480ms | NL-to-SQL for Product Return rates | Verified SQL joins `products` & `orders` properly |
| SES-002 | `summarize_result` | `gemini-3.8-flash` | 310 | 120 | 610ms | Business executive summary of returns | Verified P-007 numbers match SQL ground truth |
| SES-003 | `generate_sql` | `gemini-3.8-flash` | 480 | 75 | 520ms | Follow-up query: "Now show only online channel" | Confirmed memory injected previous product context |
| SES-004 | `summarize_result` | `gemini-3.8-flash` | 290 | 95 | 540ms | Summary of Online channel return metrics | Validated percentages against database |
| SES-005 | `generate_sql` | `gemini-3.8-flash` | 410 | 70 | 490ms | Customer Segment LTV query | Confirmed group by `customer_segment` |

## Guardrail Compliance
- No confidential credentials or proprietary Tiger customer data was sent to the model.
- Only the provided 5 synthetic retail datasets were used.
- All AI-generated SQL was passed through the deterministic AST/Regex guardrail (`src/safety.py`) before execution on MySQL.
