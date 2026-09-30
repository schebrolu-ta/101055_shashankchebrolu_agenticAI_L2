"""
MySQL Ingestion Script for Retail Operations Dataset
Agentic AI Assignment - Level 2 (L2)
"""

import os
import pandas as pd
from sqlalchemy import create_engine, text

# Configuration from environment variables
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "password")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT = os.environ.get("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "retail_db")

DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"

def ingest_to_mysql():
    print(f"[Connecting] MySQL database: {MYSQL_DATABASE} at {MYSQL_HOST}:{MYSQL_PORT}...")
    engine = create_engine(DATABASE_URI)
    
    # Ingest in relational foreign-key dependency order
    files = [
        ("customers", "data/customers.csv"),
        ("products", "data/products.csv"),
        ("stores", "data/stores.csv"),
        ("orders", "data/orders.csv"),
        ("returns", "data/returns.csv"),
    ]
    
    with engine.connect() as conn:
        for table_name, csv_path in files:
            if not os.path.exists(csv_path):
                # Fallback to local directory
                csv_path = os.path.basename(csv_path)
            
            df = pd.read_csv(csv_path)
            print(f"[Ingesting] {csv_path} -> table '{table_name}' ({len(df)} rows)...")
            df.to_sql(table_name, engine, if_exists="append", index=False)
            
        print("[✓] All 5 tables successfully ingested into MySQL!")

if __name__ == "__main__":
    ingest_to_mysql()
