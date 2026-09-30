# MySQL Validation & Data Ingestion Summary

**Project:** Stack AI Foundation – Agentic AI Explorer – Level 2  
**Component:** `database/mysql_schema.sql` & `database/load_data.py`

## Ingestion Verification Report

The 5 synthetic retail datasets provided were loaded into the MySQL instance (`retail_db`).

| Entity / Table Name | Source CSV File | Ingested DB Rows | Source CSV Rows | Integrity Check |
|---|---|---|---|---|
| `customers` | `data/customers.csv` | 80 | 80 | MATCH (100%) |
| `products` | `data/products.csv` | 10 | 10 | MATCH (100%) |
| `stores` | `data/stores.csv` | 15 | 15 | MATCH (100%) |
| `orders` | `data/orders.csv` | 360 | 360 | MATCH (100%) |
| `returns` | `data/returns.csv` | 46 | 46 | MATCH (100%) |
| **Total** | **5 CSV Files** | **511** | **511** | **ALL MATCH** |

## Foreign Key & Relational Sanity Checks
- `orders.customer_id` → All 360 customer IDs match valid IDs in `customers` table (`C-0001` to `C-0080`).
- `orders.product_id` → All 360 product IDs match valid SKUs in `products` table (`P-001` to `P-010`).
- `orders.store_id` → All 360 store IDs match valid stores in `stores` table (`ST-001` to `ST-015`).
- `returns.order_id` → All 46 returned order IDs correspond to orders flagged with `delivery_status = 'Returned'`.
