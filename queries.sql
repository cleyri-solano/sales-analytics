-- Sales Analytics | Classic Models DB
-- Cleyri Solano | 2026

USE classicmodels;

-- 1. total revenue by country
SELECT
    c.country,
    COUNT(DISTINCT o.orderNumber)  AS total_orders,
    COUNT(DISTINCT c.customerNumber) AS total_customers,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total_revenue
FROM customers c
JOIN orders o      ON c.customerNumber = o.customerNumber
JOIN orderdetails od ON o.orderNumber  = od.orderNumber
WHERE o.status = 'Shipped'
GROUP BY c.country
ORDER BY total_revenue DESC;

-- 2. top 10 best-selling products
SELECT
    p.productName,
    p.productLine,
    SUM(od.quantityOrdered) AS units_sold,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue
FROM products p
JOIN orderdetails od ON p.productCode  = od.productCode
JOIN orders o        ON od.orderNumber = o.orderNumber
WHERE o.status = 'Shipped'
GROUP BY p.productCode, p.productName, p.productLine
ORDER BY units_sold DESC
LIMIT 10;

-- 3. revenue by month
SELECT
    YEAR(o.orderDate)  AS year,
    MONTH(o.orderDate) AS month,
    COUNT(DISTINCT o.orderNumber) AS total_orders,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue
FROM orders o
JOIN orderdetails od ON o.orderNumber = od.orderNumber
WHERE o.status = 'Shipped'
GROUP BY YEAR(o.orderDate), MONTH(o.orderDate)
ORDER BY year, month;

-- 4. employee performance
SELECT
    CONCAT(e.firstName, ' ', e.lastName) AS employee,
    e.jobTitle,
    COUNT(DISTINCT o.orderNumber)  AS total_orders,
    COUNT(DISTINCT c.customerNumber) AS customers_served,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue_generated
FROM employees e
JOIN customers c    ON e.employeeNumber = c.salesRepEmployeeNumber
JOIN orders o       ON c.customerNumber = o.customerNumber
JOIN orderdetails od ON o.orderNumber   = od.orderNumber
WHERE o.status = 'Shipped'
GROUP BY e.employeeNumber, e.firstName, e.lastName, e.jobTitle
ORDER BY revenue_generated DESC;

-- 5. highest-value customers (top 10)
SELECT
    c.customerName,
    c.country,
    COUNT(DISTINCT o.orderNumber) AS total_orders,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS total_value,
    ROUND(AVG(od.quantityOrdered * od.priceEach), 2) AS avg_ticket
FROM customers c
JOIN orders o       ON c.customerNumber = o.customerNumber
JOIN orderdetails od ON o.orderNumber   = od.orderNumber
WHERE o.status = 'Shipped'
GROUP BY c.customerNumber, c.customerName, c.country
ORDER BY total_value DESC
LIMIT 10;

-- 6. revenue by product line
SELECT
    p.productLine,
    COUNT(DISTINCT p.productCode) AS total_products,
    SUM(od.quantityOrdered) AS units_sold,
    ROUND(SUM(od.quantityOrdered * od.priceEach), 2) AS revenue,
    ROUND(AVG(od.priceEach), 2) AS avg_price
FROM productlines pl
JOIN products p      ON pl.productLine  = p.productLine
JOIN orderdetails od ON p.productCode   = od.productCode
JOIN orders o        ON od.orderNumber  = o.orderNumber
WHERE o.status = 'Shipped'
GROUP BY p.productLine
ORDER BY revenue DESC;

-- 7. orders by status
SELECT
    status,
    COUNT(*) AS total_orders,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS percentage
FROM orders
GROUP BY status
ORDER BY total_orders DESC;
