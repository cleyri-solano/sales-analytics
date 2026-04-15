// @ts-nocheck
/* global Chart, lucide */

/* --- Counter Animations --- */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el) {
  const target   = parseFloat(el.dataset.count);
  const prefix   = el.dataset.prefix || '';
  const suffix   = el.dataset.suffix || '';
  const decimals = Number.isInteger(target) ? 0 : (String(target).split('.')[1] || '').length;
  const duration = 1400;
  let   start    = null;

  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const value    = easeOutCubic(progress) * target;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
  }
  requestAnimationFrame(step);
}

/* --- Scroll Reveal --- */
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

/* --- Counter Trigger --- */
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

/* --- Smooth Scroll --- */
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

/* --- Theme Toggle --- */
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

/* --- Chart.js Theme Helpers --- */

/* --- Obtiene colores segun el tema actual --- */
function getThemeColors() {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    grid: light ? '#e8ecf0' : '#1e1e1e',
    tick: light ? '#475569' : '#64748b',
  };
}

/* --- Instancias de charts para actualizar temas --- */
const charts = {};

/* --- Re-aplicar colores de tema a los charts --- */
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

/* --- Configuracion compartida de tooltips --- */
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

/* --- Chart 1: Revenue by Country --- */
function initChartCountries() {
  const ctx = document.getElementById('chart-countries');
  if (!ctx) return;
  const { grid, tick } = getThemeColors();

  // @ts-ignore
  charts.countries = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['USA', 'France', 'Spain', 'Australia', 'New Zealand', 'UK', 'Italy', 'Finland', 'Singapore', 'Canada'],
      datasets: [{
        label:           'Revenue',
        data:            [3032204, 965750, 947470, 509385, 416114, 391503, 360616, 295149, 263997, 205911],
        backgroundColor: 'rgba(0, 212, 255, 0.8)',
        borderWidth:     0,
        borderRadius:    4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: (c) => '  ' + fmtUSD(c.raw) },
        },
      },
      scales: {
        x: {
          grid:  { color: grid },
          ticks: { color: tick, font: { family: 'Inter', size: 11 }, callback: (v) => '$' + (v / 1000000).toFixed(1) + 'M' },
        },
        y: {
          grid:  { color: grid },
          ticks: { color: tick, font: { family: 'Inter', size: 11 } },
        },
      },
    },
  });
}

/* --- Chart 2: Top Products by Units Sold --- */
function initChartProducts() {
  const ctx = document.getElementById('chart-products');
  if (!ctx) return;
  const { grid, tick } = getThemeColors();

  // @ts-ignore
  charts.products = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [
        '1992 Ferrari 360 Spider Red',
        '1937 Lincoln Berline',
        '1913 Ford Model T Speedster',
        '1957 Chevy Pickup',
        '1960 BSA Gold Star DBD34',
        '1957 Corvette Convertible',
        '1956 Porsche 356A Coupe',
        '2002 Suzuki XREO',
        '1997 BMW R 1100 S',
        '2002 Yamaha YZR M1',
      ],
      datasets: [{
        label:           'Units Sold',
        data:            [1720, 1060, 1028, 1023, 1015, 1013, 1013, 1007, 998, 992],
        backgroundColor: 'rgba(124, 58, 237, 0.8)',
        borderWidth:     0,
        borderRadius:    4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: (c) => '  ' + fmtNum(c.raw) + ' units' },
        },
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
}

/* --- Chart 3: Monthly Revenue Trend --- */
function initChartMonthly() {
  const ctx = document.getElementById('chart-monthly');
  if (!ctx) return;
  const { grid, tick } = getThemeColors();

  const labels = [
    '2003-01','2003-02','2003-03','2003-04','2003-05','2003-06',
    '2003-07','2003-08','2003-09','2003-10','2003-11','2003-12',
    '2004-01','2004-02','2004-03','2004-04','2004-05','2004-06',
    '2004-07','2004-08','2004-09','2004-10','2004-11','2004-12',
    '2005-01','2005-02','2005-03','2005-04','2005-05',
  ];

  const data = [
    129753, 145062, 159721, 187808, 179370, 166810,
    187731, 197809, 263973, 477532, 457861, 261876,
    205480, 248841, 268492, 208411, 273438, 213092,
    325563, 419327, 283799, 500233, 935712, 428838,
    268156, 317192, 312743, 227427, 155335,
  ];

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 215);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

  charts.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:                'Revenue',
        data,
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
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: (c) => '  ' + fmtUSD(c.raw) },
        },
      },
      scales: {
        x: {
          grid:  { color: grid },
          ticks: {
            color: tick,
            font:  { family: 'Inter', size: 11 },
            maxRotation: 0,
            // Show only the year label on the first month of each year
            callback: (_val, index) => labels[index].endsWith('-01') ? labels[index].split('-')[0] : null,
          },
        },
        y: {
          grid:  { color: grid },
          ticks: {
            color: tick,
            font:  { family: 'Inter', size: 11 },
            callback: (v) => '$' + (v / 1000).toFixed(0) + 'K',
          },
        },
      },
    },
  });
}

/* --- Chart 4: Revenue by Product Line --- */
function initChartProductLines() {
  const ctx = document.getElementById('chart-product-lines');
  if (!ctx) return;

  charts.productLines = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Classic Cars', 'Vintage Cars', 'Motorcycles', 'Trucks & Buses', 'Planes', 'Ships', 'Trains'],
      datasets: [{
        data: [3623600, 1643172, 1084927, 949004, 832730, 556629, 175030],
        backgroundColor: ['#00d4ff', '#a855f7', '#f97316', '#22c55e', '#ec4899', '#eab308', '#ef4444'],
        borderColor:     'transparent',
        borderWidth:     0,
        hoverOffset:     8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart' },
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
}

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();    // sets button text + updateChartThemes()
  initScrollReveal();
  initCounters();
  initSmoothScroll();
  initChartCountries();
  initChartProducts();
  initChartMonthly();
  initChartProductLines();
  lucide.createIcons(); // render all data-lucide icons (finding cards, etc.)
});
