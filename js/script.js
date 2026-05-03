// @ts-nocheck
/* global Chart, lucide */

const API_BASE = ''; // Cambiar a la URL de Railway al hacer deploy

/* ---- Counter animation ---- */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCounter(el) {
  const target   = parseFloat(el.dataset.count);
  const prefix   = el.dataset.prefix || '';
  const suffix   = el.dataset.suffix || '';
  const decimals = Number.isInteger(target) ? 0 : (String(target).split('.')[1] || '').length;
  const duration = 1400;
  let start      = null;

  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const value    = easeOutCubic(progress) * target;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(step);
}

/* ---- Scroll reveal ---- */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
    }),
    { threshold: 0.1 }
  );
  els.forEach((el) => obs.observe(el));
}

/* ---- Counter trigger ---- */
function initCounters() {
  const counters = document.querySelectorAll('.stat-value[data-count]');
  if (!counters.length) return;
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); }
    }),
    { threshold: 0.5 }
  );
  counters.forEach((el) => obs.observe(el));
}

/* ---- Smooth scroll ---- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 68, behavior: 'smooth' });
    });
  });
}

/* ---- Theme toggle ---- */
function initThemeToggle() {
  const btn  = document.getElementById('theme-toggle');
  const html = document.documentElement;
  if (!btn) return;

  function applyTheme(theme) {
    const icon = btn.querySelector('i');
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
      if (icon) icon.setAttribute('data-lucide', 'moon');
      btn.setAttribute('aria-label', 'Switch to dark mode');
    } else {
      html.removeAttribute('data-theme');
      if (icon) icon.setAttribute('data-lucide', 'sun');
      btn.setAttribute('aria-label', 'Switch to light mode');
    }
    lucide.createIcons();
    updateChartThemes();
  }

  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

/* ---- Chart theme helpers ---- */
function getThemeColors() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    grid: light ? '#e8ecf0' : '#1e1e1e',
    tick: light ? '#475569' : '#64748b',
  };
}

const charts = {};

function updateChartThemes() {
  const { grid, tick } = getThemeColors();
  Object.values(charts).forEach((chart) => {
    if (!chart || !chart.options.scales) return;
    Object.values(chart.options.scales).forEach((scale) => {
      if (scale.grid)  scale.grid.color  = grid;
      if (scale.ticks) scale.ticks.color = tick;
    });
    chart.update('none');
  });
}

/* ---- Shared tooltip config ---- */
const TOOLTIP = {
  backgroundColor: '#1e1e1e',
  borderColor:     '#00d4ff',
  borderWidth:     1,
  titleColor:      '#e2e8f0',
  bodyColor:       '#94a3b8',
  padding:         10,
  cornerRadius:    8,
  titleFont: { family: 'Inter', size: 12, weight: '600' },
  bodyFont:  { family: 'Inter', size: 12 },
};

function fmtUSD(v) { return '$' + v.toLocaleString('en-US'); }
function fmtNum(v) { return v.toLocaleString('en-US'); }

/* ---- Chart 1: Revenue by Country ---- */
function initChartCountries(data) {
  const ctx = document.getElementById('chart-countries');
  if (!ctx) return;
  const { grid, tick } = getThemeColors();
  const labels = data.map(r => r.country);
  const values = data.map(r => Number(r.revenue));

  charts.countries = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Revenue',
        data:            values,
        backgroundColor: 'rgba(0, 212, 255, 0.8)',
        borderWidth:     0,
        borderRadius:    4,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 1000, easing: 'easeOutQuart' },
      indexAxis: 'y',
      plugins: {
        legend:  { display: false },
        tooltip: { ...TOOLTIP, callbacks: { label: (c) => '  ' + fmtUSD(c.raw) } },
      },
      scales: {
        x: {
          grid:  { color: grid },
          ticks: { color: tick, font: { family: 'Inter', size: 11 }, callback: (v) => '$' + (v / 1e6).toFixed(1) + 'M' },
        },
        y: {
          grid:  { color: grid },
          ticks: { color: tick, font: { family: 'Inter', size: 11 } },
        },
      },
    },
  });

  const el = document.getElementById('cstat-country');
  const lb = document.getElementById('cstat-country-lbl');
  if (el && data[0]) el.textContent = '$' + (values[0] / 1e6).toFixed(1) + 'M';
  if (lb && data[0]) lb.textContent = labels[0] + ' leads';
}

/* ---- Chart 2: Top Products by Units Sold ---- */
function initChartProducts(data) {
  const ctx = document.getElementById('chart-products');
  if (!ctx) return;
  const { grid, tick } = getThemeColors();
  const labels = data.map(r => r.productName);
  const values = data.map(r => Number(r.units));

  charts.products = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Units Sold',
        data:            values,
        backgroundColor: 'rgba(124, 58, 237, 0.8)',
        borderWidth:     0,
        borderRadius:    4,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 1000, easing: 'easeOutQuart' },
      indexAxis: 'y',
      plugins: {
        legend:  { display: false },
        tooltip: { ...TOOLTIP, callbacks: { label: (c) => '  ' + fmtNum(c.raw) + ' units' } },
      },
      scales: {
        x: {
          grid:  { color: grid },
          ticks: { color: tick, font: { family: 'Inter', size: 11 }, callback: (v) => fmtNum(v) },
        },
        y: {
          grid:  { color: grid },
          ticks: {
            color: tick,
            font:  { family: 'Inter', size: 11 },
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.length > 22 ? label.slice(0, 22) + '…' : label;
            },
          },
        },
      },
    },
  });

  const el = document.getElementById('cstat-products');
  const lb = document.getElementById('cstat-products-lbl');
  if (el && data[0]) {
    el.textContent = fmtNum(values[0]);
    el.classList.add('chart-stat-value--purple');
  }
  if (lb && data[0]) lb.textContent = labels[0].split(' ').slice(1, 4).join(' ');
}

/* ---- Chart 3: Monthly Revenue Trend ---- */
function initChartMonthly(data) {
  const ctx = document.getElementById('chart-monthly');
  if (!ctx) return;
  const { grid, tick } = getThemeColors();

  const labels = data.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`);
  const values = data.map(r => Number(r.revenue));

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 215);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

  charts.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:                'Revenue',
        data:                 values,
        borderColor:          '#00d4ff',
        borderWidth:          2,
        pointRadius:          3,
        pointHoverRadius:     6,
        pointBackgroundColor: '#00d4ff',
        fill:                 true,
        backgroundColor:      gradient,
        tension:              0.4,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 1000, easing: 'easeOutQuart' },
      plugins: {
        legend:  { display: false },
        tooltip: { ...TOOLTIP, callbacks: { label: (c) => '  ' + fmtUSD(c.raw) } },
      },
      scales: {
        x: {
          grid:  { color: grid },
          ticks: {
            color:       tick,
            font:        { family: 'Inter', size: 11 },
            maxRotation: 0,
            callback:    (_val, index) => labels[index].endsWith('-01') ? labels[index].split('-')[0] : null,
          },
        },
        y: {
          grid:  { color: grid },
          ticks: { color: tick, font: { family: 'Inter', size: 11 }, callback: (v) => '$' + (v / 1000).toFixed(0) + 'K' },
        },
      },
    },
  });

  const peakIdx = values.indexOf(Math.max(...values));
  const el = document.getElementById('cstat-monthly');
  const lb = document.getElementById('cstat-monthly-lbl');
  if (el && peakIdx >= 0) el.textContent = '$' + (values[peakIdx] / 1000).toFixed(0) + 'K';
  if (lb && peakIdx >= 0) lb.textContent = labels[peakIdx] + ' peak';
}

/* ---- Chart 4: Revenue by Product Line ---- */
function initChartProductLines(data) {
  const ctx = document.getElementById('chart-product-lines');
  if (!ctx) return;
  const labels = data.map(r => r.productLine);
  const values = data.map(r => Number(r.revenue));

  charts.productLines = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data:            values,
        backgroundColor: ['#00d4ff', '#a855f7', '#f97316', '#22c55e', '#ec4899', '#eab308', '#ef4444'],
        borderColor:     'transparent',
        borderWidth:     0,
        hoverOffset:     8,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 1000, easing: 'easeOutQuart' },
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:    '#64748b',
            font:     { family: 'Inter', size: 11 },
            boxWidth: 10,
            padding:  14,
          },
        },
        tooltip: {
          ...TOOLTIP,
          callbacks: {
            label: (c) => {
              const total = c.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((c.raw / total) * 100).toFixed(1);
              return `  ${fmtUSD(c.raw)}  (${pct}%)`;
            },
          },
        },
      },
      scales: {},
    },
  });

  const total = values.reduce((a, b) => a + b, 0);
  const el = document.getElementById('cstat-lines');
  const lb = document.getElementById('cstat-lines-lbl');
  if (el && data[0]) el.textContent = ((values[0] / total) * 100).toFixed(1) + '%';
  if (lb && data[0]) lb.textContent = labels[0];
}

/* ---- Render hero stats from API ---- */
function renderStats(stats) {
  const el = (id) => document.getElementById(id);
  const total = Number(stats.totalRevenue);
  if (el('stat-revenue'))     el('stat-revenue').textContent     = '$' + (total / 1e6).toFixed(1) + 'M';
  if (el('stat-orders'))      el('stat-orders').textContent      = stats.shippedOrders;
  if (el('stat-market'))      el('stat-market').textContent      = stats.topMarket;
  if (el('stat-fulfillment')) el('stat-fulfillment').textContent = stats.fulfillmentRate + '%';
}

/* ---- Render AI insights from Claude ---- */
function renderInsights(insights) {
  const grid = document.querySelector('.findings-grid');
  if (!grid || !insights) return;

  grid.innerHTML = insights.map(i => `
    <article class="finding-card reveal is-visible">
      <div class="finding-icon-box" aria-hidden="true">
        <i data-lucide="${i.icon}"></i>
      </div>
      <div class="finding-content">
        <div class="finding-number">${i.number}</div>
        <p class="finding-title">${i.title}</p>
        <p class="finding-desc">${i.description}</p>
      </div>
    </article>
  `).join('');

  lucide.createIcons();
}

/* ---- Load all data from the backend API ---- */
async function loadData() {
  try {
    const [revenue, products, monthly, productLines, stats] = await Promise.all([
      fetch(`${API_BASE}/api/revenue`).then(r => r.json()),
      fetch(`${API_BASE}/api/products`).then(r => r.json()),
      fetch(`${API_BASE}/api/monthly`).then(r => r.json()),
      fetch(`${API_BASE}/api/product-lines`).then(r => r.json()),
      fetch(`${API_BASE}/api/stats`).then(r => r.json()),
    ]);

    renderStats(stats);
    initChartCountries(revenue);
    initChartProducts(products);
    initChartMonthly(monthly);
    initChartProductLines(productLines);
  } catch (e) {
    console.error('Failed to load data:', e);
  }

  // Insights loads separately — Claude API may take a few seconds
  fetch(`${API_BASE}/api/insights`)
    .then(r => r.json())
    .then(data => renderInsights(data.insights))
    .catch(() => {
      const grid = document.querySelector('.findings-grid');
      if (grid) grid.innerHTML = '<p class="loading-insights">Could not load AI insights.</p>';
    });
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScrollReveal();
  initCounters();
  initSmoothScroll();
  loadData();
  lucide.createIcons();
});
