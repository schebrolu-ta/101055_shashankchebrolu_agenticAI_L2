# Human Review & Verification Notes

**Project:** Stack AI Foundation – Agentic AI Explorer – Level 2  
**Reviewer:** Shashank Chebrolu (`shashank.chebrolu@tigeranalytics.com`)  
**Date of Review:** September 30, 2026

## Human-in-the-Loop Review Summary

As mandated by Section 8 (*Responsible AI and Human Review*) of the assignment brief:
> "All AI-generated SQL, code, summaries, and business interpretations must be reviewed by a human before final submission. Check for incorrect SQL, unsupported assumptions, missing context, unsafe queries, and misleading summaries."

### 1. Verification of SQL Logic
- **Product Return Calculations:**
  - Verified that return rate is computed as:
    `COUNT(CASE WHEN delivery_status = 'Returned' THEN 1 END) * 100.0 / COUNT(order_id)`.
  - Confirmed that joining `orders` with `products` on `product_id` avoids Cartesian products.
- **Customer Segmentation Calculations:**
  - Verified that customer lifetime spend sums `(units_sold * unit_price)` per `customer_id`.
  - Checked that `Wholesale` segment revenue calculation correctly matches the raw total (₹106k gross, ₹94k net realized).

### 2. SQL Safety & Injection Defense
- Tested injection vectors such as `' OR 1=1; DROP TABLE products; --`.
- Verified that `src/safety.py` detects both the semicolon multi-statement syntax and the forbidden `DROP` keyword, intercepting the query before any database connection is created.

### 3. Factual Grounding of Summaries
- Audited model summaries against the raw CSV numbers in `/data/`:
  - Verified that the reported top return product (P-007 Detergent, 21.6%) and top return volume product (P-003 Rice 5kg, 13 orders) match the database facts.
  - Confirmed that the model does not hallucinate fictional customer names or unrecorded return reasons.

**Sign-off:** All components and outputs verified compliant with assignment rubric.
