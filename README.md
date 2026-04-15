# Sales Analytics — Classic Models

End-to-end sales analytics project built on the Classic Models sample database. Covers data exploration in MySQL, exploratory analysis in Python, and an interactive dashboard in vanilla HTML/CSS/JS.

**Stack:** MySQL · Python (pandas, matplotlib) · Chart.js · Lucide Icons

---

## Setup

**1. Import the database**
```sql
source data/mysqlsampledatabase.sql
```

**2. Create a `.env` file in the project root**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=classicmodels
```

**3. Install Python dependencies**
```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install mysql-connector-python pandas matplotlib python-dotenv
```

**4. Run the analysis**
```bash
cd python
python analysis.py
# Charts are saved to python/charts/
```

**5. View the dashboard**

Open `index.html` in a browser — no build step or server needed.

---

## SQL Queries

Seven queries against the `classicmodels` schema, all filtered to `status = 'Shipped'`: revenue by country, top 10 products by units sold, monthly revenue trend, employee performance, top 10 customers by value, revenue by product line, and orders by status breakdown.

---

## Dashboard

Four interactive Chart.js charts (revenue by country, top products, monthly trend, product line doughnut), dark/light mode with `localStorage` persistence, scroll reveal animations, and a key findings section.

**Highlights from the data:**
- USA drives 31.6% of total revenue — no other market exceeds $1M
- Classic Cars account for 40.9% of revenue, more than all other lines combined
- Sales spike every Q4 — November 2004 peaked at $935K (174% above average)
- The 1992 Ferrari 360 Spider sold 1,720 units, 62% more than the next product

---

**Cleyri Solano** · [GitHub](https://github.com/cleyri-solano) · 2026
