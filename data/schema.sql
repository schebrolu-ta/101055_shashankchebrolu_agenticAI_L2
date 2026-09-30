-- Retail Operations Database Schema for MySQL
-- Agentic AI Assignment - Level 2 (L2)

CREATE DATABASE IF NOT EXISTS retail_db;
USE retail_db;

-- 1. Customers Table
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    customer_id VARCHAR(10) PRIMARY KEY,
    customer_segment ENUM('Regular', 'Budget', 'Premium', 'Wholesale') NOT NULL,
    signup_date DATE NOT NULL,
    preferred_channel VARCHAR(30) NOT NULL,
    city VARCHAR(50) NOT NULL,
    INDEX idx_customer_segment (customer_segment),
    INDEX idx_customer_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Products Table
CREATE TABLE products (
    product_id VARCHAR(10) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    INDEX idx_product_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Stores Table
CREATE TABLE stores (
    store_id VARCHAR(10) PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    region ENUM('North', 'South', 'East', 'West', 'Central') NOT NULL,
    city VARCHAR(50) NOT NULL,
    store_type ENUM('Supermarket', 'Convenience', 'Express') NOT NULL,
    INDEX idx_store_region (region),
    INDEX idx_store_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Orders Table
CREATE TABLE orders (
    order_id VARCHAR(15) PRIMARY KEY,
    order_date DATE NOT NULL,
    store_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    customer_id VARCHAR(10) NOT NULL,
    sales_channel VARCHAR(30) NOT NULL,
    units_sold INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_pct DECIMAL(5, 2) DEFAULT 0.00,
    payment_status ENUM('Paid', 'Pending') NOT NULL,
    delivery_status ENUM('Delivered', 'Returned', 'Processing') NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    INDEX idx_order_delivery_status (delivery_status),
    INDEX idx_order_date (order_date),
    INDEX idx_order_channel (sales_channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Returns Table
CREATE TABLE returns (
    return_id VARCHAR(15) PRIMARY KEY,
    order_id VARCHAR(15) NOT NULL,
    return_date DATE NOT NULL,
    return_reason VARCHAR(100) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    INDEX idx_return_reason (return_reason)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: Create Dedicated Read-Only User for AI Gateway Security Guardrail
-- CREATE USER IF NOT EXISTS 'retail_agent'@'%' IDENTIFIED BY 'AgentPass_2026!';
-- GRANT SELECT ON retail_db.* TO 'retail_agent'@'%';
-- FLUSH PRIVILEGES;
