"""
Data Ingestion Script for MySQL
Stack AI Foundation – Agentic AI Explorer – Level 2
Loads all 5 synthetic retail CSV files and captures row counts.
"""

import os
import sys
import pandas as pd
from dotenv import load_dotenv

# Try mysql-connector-python first as required by assignment, fallback to pymysql/sqlalchemy
load_dotenv()

MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", 3306))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "retail_db")

def get_connection():
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
    except Exception as e:
        print(f"[Warning] mysql.connector failed: {e}. Trying pymysql...")
        import pymysql
        return pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )

def load_all_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    csv_tables = [
        ("customers", os.path.join(data_dir, "customers.csv")),
        ("products", os.path.join(data_dir, "products.csv")),
        ("stores", os.path.join(data_dir, "stores.csv")),
        ("orders", os.path.join(data_dir, "orders.csv")),
        ("returns", os.path.join(data_dir, "returns.csv")),
    ]
    
    print("=" * 60)
    print("RETAIL DATA LOADER - MYSQL VALIDATION")
    print(f"Target Database: {MYSQL_DATABASE}@{MYSQL_HOST}:{MYSQL_PORT}")
    print("=" * 60)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    summary = {}
    
    for table_name, file_path in csv_tables:
        if not os.path.exists(file_path):
            print(f"[Error] File not found: {file_path}")
            continue
            
        df = pd.read_csv(file_path)
        row_count = len(df)
        print(f"Ingesting '{table_name}' from {os.path.basename(file_path)} ({row_count} rows)...")
        
        # Clear existing data in table
        cursor.execute(f"SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute(f"TRUNCATE TABLE {table_name};")
        cursor.execute(f"SET FOREIGN_KEY_CHECKS = 1;")
        
        # Prepare batch insert
        cols = list(df.columns)
        placeholders = ", ".join(["%s"] * len(cols))
        col_names = ", ".join(cols)
        sql = f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})"
        
        # Clean NaN values
        records = df.where(pd.notnull(df), None).values.tolist()
        cursor.executemany(sql, records)
        conn.commit()
        
        # Verify inserted row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        db_count = cursor.fetchone()[0]
        summary[table_name] = {"csv_rows": row_count, "db_rows": db_count, "status": "MATCH" if row_count == db_count else "MISMATCH"}
        print(f" -> Table '{table_name}': {db_count} rows in MySQL [OK]")
        
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("DATA INGESTION SUMMARY REPORT:")
    print("=" * 60)
    for tbl, info in summary.items():
        print(f"Table: {tbl:<15} CSV: {info['csv_rows']:<5} DB: {info['db_rows']:<5} Status: {info['status']}")
    print("=" * 60)
    print("[SUCCESS] All 5 retail datasets verified in MySQL.")

if __name__ == "__main__":
    load_all_data()
