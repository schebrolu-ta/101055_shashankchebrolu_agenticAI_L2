# Retail Database Schema Reference (MySQL)

This document provides schema definitions, data types, primary/foreign key relationships, and query notes for the `retail_db` database.

## Table Relationships Overview

```
customers (customer_id) ────┐
                            │ (1:N)
stores (store_id) ──────────┼───> orders / sales_transactions (order_id) <──── returns (order_id)
                            │                                                     (1:1 or 1:N)
products (product_id) ──────┘
```

---

## 1. Table: `customers`
Stores customer master demographic and registration data.
- **`customer_id`** (`VARCHAR(10)`, PK): Unique identifier (e.g. `C-0001` to `C-0080`).
- **`customer_segment`** (`ENUM('Regular', 'Budget', 'Premium', 'Wholesale')`): Classification tier.
- **`signup_date`** (`DATE`): Date the customer created their account.
- **`preferred_channel`** (`VARCHAR(30)`): Preferred shopping channel (`Mobile App`, `Online`, `In-store`, `Partner`).
- **`city`** (`VARCHAR(50)`): Customer residence city.
- **Row count**: 80 rows.

---

## 2. Table: `products`
Stores product catalog information and pricing.
- **`product_id`** (`VARCHAR(10)`, PK): Unique SKU identifier (`P-001` to `P-010`).
- **`product_name`** (`VARCHAR(100)`): Human-readable product name.
- **`category`** (`VARCHAR(50)`): Category (`Beverages`, `Groceries`, `Personal Care`, `Household`, `Snacks`).
- **`sub_category`** (`VARCHAR(50)`): Sub-category classification.
- **`base_price`** (`DECIMAL(10,2)`): Catalog unit price (from ₹49 to ₹599).
- **Row count**: 10 rows.

---

## 3. Table: `stores`
Stores physical retail store and fulfillment center master data.
- **`store_id`** (`VARCHAR(10)`, PK): Store ID (`ST-001` to `ST-015`).
- **`store_name`** (`VARCHAR(100)`): Outlet name.
- **`region`** (`ENUM('North', 'South', 'East', 'West', 'Central')`): Geographic territory.
- **`city`** (`VARCHAR(50)`): Physical store city.
- **`store_type`** (`ENUM('Supermarket', 'Convenience', 'Express')`): Outlet operating format.
- **Row count**: 15 rows.

---

## 4. Table: `orders` (aliased as `sales_transactions`)
Stores individual sales transaction records.
- **`order_id`** (`VARCHAR(15)`, PK): Order number (`O-00001` to `O-00360`).
- **`order_date`** (`DATE`): Transaction timestamp date.
- **`store_id`** (`VARCHAR(10)`, FK → `stores.store_id`).
- **`product_id`** (`VARCHAR(10)`, FK → `products.product_id`).
- **`customer_id`** (`VARCHAR(10)`, FK → `customers.customer_id`).
- **`sales_channel`** (`VARCHAR(30)`): Purchase route (`Mobile App`, `Online`, `In-store`, `Partner`).
- **`units_sold`** (`INT`): Quantity purchased (1 to 9).
- **`unit_price`** (`DECIMAL(10,2)`): Actual transaction price per unit.
- **`discount_pct`** (`DECIMAL(5,2)`): Applied discount percentage (0%, 5%, 10%, 15%, 20%).
- **`payment_status`** (`ENUM('Paid', 'Pending')`).
- **`delivery_status`** (`ENUM('Delivered', 'Returned', 'Processing')`).
- **Row count**: 360 rows.

---

## 5. Table: `returns`
Stores product return events and diagnostic reasons.
- **`return_id`** (`VARCHAR(15)`, PK): Return number (`R-0001` to `R-0046`).
- **`order_id`** (`VARCHAR(15)`, FK → `orders.order_id`): Corresponding transaction.
- **`return_date`** (`DATE`): Date return was received.
- **`return_reason`** (`VARCHAR(100)`): Root cause reason (`Wrong Item`, `Customer Changed Mind`, `Late Delivery`, `Damaged`, `Quality Issue`).
- **Row count**: 46 rows.

---

## Key SQL Aggregations & Formulas

- **Gross Revenue**: `SUM(units_sold * unit_price)`
- **Net Realized Revenue**: `SUM(CASE WHEN delivery_status != 'Returned' THEN units_sold * unit_price ELSE 0 END)`
- **Lost Revenue (Returns)**: `SUM(CASE WHEN delivery_status = 'Returned' THEN units_sold * unit_price ELSE 0 END)`
- **Return Rate (%)**: `ROUND(COUNT(CASE WHEN delivery_status = 'Returned' THEN 1 END) * 100.0 / COUNT(*), 1)`
