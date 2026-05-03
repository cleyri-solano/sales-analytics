# Sales Analytics — Classic Models

End-to-end sales analytics dashboard with a Node.js/Express backend, MySQL database, and AI-generated business insights powered by OpenAI.

**Stack:** MySQL · Node.js · Express · OpenAI API · Chart.js · HTML/CSS

**Live demo:** [cleyri-solano.github.io/sales-analytics](https://cleyri-solano.github.io/sales-analytics)  
**Backend API:** [sales-analytics-production-3196.up.railway.app](https://sales-analytics-production-3196.up.railway.app)

---

## Architecture

```
Frontend (GitHub Pages)
  └── HTML/CSS/JS — consumes the REST API

Backend (Railway)
  ├── Express API — queries MySQL and returns JSON
  └── OpenAI integration — generates business insights from live data
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Summary stats (revenue, orders, fulfillment rate) |
| GET | `/api/revenue` | Top 10 countries by revenue |
| GET | `/api/products` | Top 10 products by units sold |
| GET | `/api/monthly` | Monthly revenue trend |
| GET | `/api/product-lines` | Revenue breakdown by product line |
| GET | `/api/insights` | AI-generated business insights (OpenAI, cached 1h) |

---

## Local Setup

**1. Import the database**
```bash
mysql -u root -p < data/mysqlsampledatabase.sql
```

**2. Create a `.env` file**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=classicmodels
OPENAI_API_KEY=your_openai_key
```

**3. Install dependencies and run**
```bash
npm install
node server.js
# → http://localhost:3000
```

---

## Project Structure

```
sales-analytics/
├── data/
│   ├── mysqlsampledatabase.sql   # Database schema and seed data
│   └── queries.sql               # Reference SQL queries
├── css/
│   └── styles.css
├── js/
│   └── script.js                 # Fetches API, renders charts
├── index.html                    # Frontend dashboard
├── server.js                     # Express backend
└── package.json
```

---

**Cleyri Solano** · [GitHub](https://github.com/cleyri-solano) · 2026
