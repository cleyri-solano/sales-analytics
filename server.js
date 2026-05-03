require('dotenv').config();
const express   = require('express');
const mysql     = require('mysql2/promise');
const OpenAI    = require('openai');
const cors      = require('cors');
const path      = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run(sql) {
  const [rows] = await db.query(sql);
  return rows;
}

// Revenue by country — top 10
app.get('/api/revenue', async (_, res) => {
  try {
    res.json(await run(`
      SELECT c.country, ROUND(SUM(od.quantityOrdered * od.priceEach)) AS revenue
      FROM customers c
      JOIN orders o ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      WHERE o.status = 'Shipped'
      GROUP BY c.country ORDER BY revenue DESC LIMIT 10
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Top 10 products by units sold
app.get('/api/products', async (_, res) => {
  try {
    res.json(await run(`
      SELECT p.productName, SUM(od.quantityOrdered) AS units
      FROM products p
      JOIN orderdetails od ON p.productCode = od.productCode
      JOIN orders o ON od.orderNumber = o.orderNumber
      WHERE o.status = 'Shipped'
      GROUP BY p.productName ORDER BY units DESC LIMIT 10
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Monthly revenue trend
app.get('/api/monthly', async (_, res) => {
  try {
    res.json(await run(`
      SELECT YEAR(o.orderDate) AS year, MONTH(o.orderDate) AS month,
             ROUND(SUM(od.quantityOrdered * od.priceEach)) AS revenue
      FROM orders o
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      WHERE o.status = 'Shipped'
      GROUP BY year, month ORDER BY year, month
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Revenue by product line
app.get('/api/product-lines', async (_, res) => {
  try {
    res.json(await run(`
      SELECT p.productLine, ROUND(SUM(od.quantityOrdered * od.priceEach)) AS revenue
      FROM products p
      JOIN orderdetails od ON p.productCode = od.productCode
      JOIN orders o ON od.orderNumber = o.orderNumber
      WHERE o.status = 'Shipped'
      GROUP BY p.productLine ORDER BY revenue DESC
    `));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Summary stats for hero section
app.get('/api/stats', async (_, res) => {
  try {
    const [rev] = await run(`
      SELECT ROUND(SUM(od.quantityOrdered * od.priceEach)) AS totalRevenue,
             COUNT(DISTINCT o.orderNumber) AS shippedOrders
      FROM orders o JOIN orderdetails od ON o.orderNumber = od.orderNumber
      WHERE o.status = 'Shipped'
    `);
    const [ord] = await run(`SELECT COUNT(*) AS totalOrders FROM orders`);
    const [top] = await run(`
      SELECT c.country AS topMarket
      FROM customers c
      JOIN orders o ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON o.orderNumber = od.orderNumber
      WHERE o.status = 'Shipped'
      GROUP BY c.country ORDER BY SUM(od.quantityOrdered * od.priceEach) DESC LIMIT 1
    `);
    res.json({
      totalRevenue:    rev.totalRevenue,
      shippedOrders:   rev.shippedOrders,
      fulfillmentRate: ((rev.shippedOrders / ord.totalOrders) * 100).toFixed(2),
      topMarket:       top.topMarket,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI-generated business insights — cached 1 hour
let cache = { data: null, ts: 0 };

app.get('/api/insights', async (_, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < 3_600_000) return res.json(cache.data);

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const [totals]  = await run(`SELECT ROUND(SUM(od.quantityOrdered * od.priceEach)) AS total FROM orders o JOIN orderdetails od ON o.orderNumber = od.orderNumber WHERE o.status = 'Shipped'`);
    const countries = await run(`SELECT c.country, ROUND(SUM(od.quantityOrdered * od.priceEach)) AS revenue FROM customers c JOIN orders o ON c.customerNumber = o.customerNumber JOIN orderdetails od ON o.orderNumber = od.orderNumber WHERE o.status = 'Shipped' GROUP BY c.country ORDER BY revenue DESC LIMIT 3`);
    const [line]    = await run(`SELECT p.productLine, ROUND(SUM(od.quantityOrdered * od.priceEach)) AS revenue FROM products p JOIN orderdetails od ON p.productCode = od.productCode JOIN orders o ON od.orderNumber = o.orderNumber WHERE o.status = 'Shipped' GROUP BY p.productLine ORDER BY revenue DESC LIMIT 1`);
    const [peak]    = await run(`SELECT YEAR(o.orderDate) AS yr, MONTH(o.orderDate) AS mo, ROUND(SUM(od.quantityOrdered * od.priceEach)) AS revenue FROM orders o JOIN orderdetails od ON o.orderNumber = od.orderNumber WHERE o.status = 'Shipped' GROUP BY yr, mo ORDER BY revenue DESC LIMIT 1`);
    const [prod]    = await run(`SELECT p.productName, SUM(od.quantityOrdered) AS units FROM products p JOIN orderdetails od ON p.productCode = od.productCode JOIN orders o ON od.orderNumber = o.orderNumber WHERE o.status = 'Shipped' GROUP BY p.productName ORDER BY units DESC LIMIT 1`);

    const t = totals.total;
    const countrySummary = countries.map(c =>
      `${c.country} $${(c.revenue / 1e6).toFixed(1)}M (${((c.revenue / t) * 100).toFixed(1)}%)`
    ).join(', ');

    const msg = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      max_tokens:  1024,
      messages: [{
        role: 'user',
        content: `You are a business analyst. Based on this sales data from a scale-model retailer (2003–2005), generate 4 key business insights. Return ONLY valid JSON, no markdown, no explanation.

Data:
- Total revenue: $${(t / 1e6).toFixed(1)}M
- Top markets: ${countrySummary}
- Top product line: ${line.productLine} at $${(line.revenue / 1e6).toFixed(1)}M (${((line.revenue / t) * 100).toFixed(1)}%)
- Peak month: ${MONTHS[peak.mo - 1]} ${peak.yr} at $${(peak.revenue / 1000).toFixed(0)}K
- Best-selling product: ${prod.productName} (${prod.units} units)

Return exactly this JSON shape:
{"insights":[{"number":"key metric e.g. 31.6%","title":"short title max 8 words","description":"2 sentences with business implication","icon":"globe|trending-up|calendar|star|alert-triangle|bar-chart-2"}]}`,
      }],
    });

    const result = JSON.parse(msg.choices[0].message.content);
    cache = { data: result, ts: Date.now() };
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
