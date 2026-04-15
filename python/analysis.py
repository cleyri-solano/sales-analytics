# Sales Analytics | Classic Models DB
# Cleyri Solano | 2026

import mysql.connector
import pandas as pd
import matplotlib.pyplot as plt
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

# database connection
conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)

os.makedirs("charts", exist_ok=True)

# 1. revenue by country
query_countries = """
    SELECT c.country,
           ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue
    FROM customers c
    JOIN orders o ON c.customerNumber = o.customerNumber
    JOIN orderdetails od ON o.orderNumber = od.orderNumber
    WHERE o.status = 'Shipped'
    GROUP BY c.country
    ORDER BY revenue DESC
    LIMIT 10
"""
df_countries = pd.read_sql(query_countries, conn)

plt.figure(figsize=(12, 5))
plt.bar(df_countries['country'], df_countries['revenue'], color='steelblue')
plt.title('Top 10 Countries by Revenue')
plt.xlabel('Country')
plt.ylabel('Revenue (USD)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('charts/revenue_by_country.png')
plt.show()

# 2. top 10 products by units sold
query_products = """
    SELECT p.productName,
           SUM(od.quantityOrdered) AS units_sold
    FROM products p
    JOIN orderdetails od ON p.productCode = od.productCode
    JOIN orders o ON od.orderNumber = o.orderNumber
    WHERE o.status = 'Shipped'
    GROUP BY p.productCode, p.productName
    ORDER BY units_sold DESC
    LIMIT 10
"""
df_products = pd.read_sql(query_products, conn)

plt.figure(figsize=(12, 5))
plt.barh(df_products['productName'][::-1], df_products['units_sold'][::-1], color='coral')
plt.title('Top 10 Products by Units Sold')
plt.xlabel('Units Sold')
plt.tight_layout()
plt.savefig('charts/top_products.png')
plt.show()

# 3. monthly revenue
query_monthly = """
    SELECT YEAR(o.orderDate) AS year,
           MONTH(o.orderDate) AS month,
           ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue
    FROM orders o
    JOIN orderdetails od ON o.orderNumber = od.orderNumber
    WHERE o.status = 'Shipped'
    GROUP BY year, month
    ORDER BY year, month
"""
df_monthly = pd.read_sql(query_monthly, conn)
df_monthly['period'] = df_monthly['year'].astype(str) + '-' + df_monthly['month'].astype(str).str.zfill(2)

plt.figure(figsize=(14, 5))
plt.plot(df_monthly['period'], df_monthly['revenue'], marker='o', color='mediumseagreen')
plt.title('Monthly Revenue')
plt.xlabel('Period')
plt.ylabel('Revenue (USD)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('charts/monthly_revenue.png')
plt.show()

# 4. revenue by product line
query_lines = """
    SELECT p.productLine,
           ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue
    FROM products p
    JOIN orderdetails od ON p.productCode = od.productCode
    JOIN orders o ON od.orderNumber = o.orderNumber
    WHERE o.status = 'Shipped'
    GROUP BY p.productLine
    ORDER BY revenue DESC
"""
df_lines = pd.read_sql(query_lines, conn)

plt.figure(figsize=(8, 8))
plt.pie(df_lines['revenue'], labels=df_lines['productLine'],
        autopct='%1.1f%%', startangle=140)
plt.title('Revenue Distribution by Product Line')
plt.tight_layout()
plt.savefig('charts/revenue_by_product_line.png')
plt.show()

conn.close()
print("Analysis complete. Charts saved in /charts")