// ===== STATE =====
let STATS = null;
let SAMPLES = [];
let filteredSamples = [];
let displayedCount = 0;
const PAGE_SIZE = 12;
let predictionStats = { positive: 0, negative: 0 };
let recentPredictions = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  setupCursor();
  await loadData();
  setupNav();
  animateCounters();
});

// ===== CURSOR GLOW =====
function setupCursor() {
  const glow = document.getElementById('cursor-glow');
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

// ===== LOAD DATA =====
async function loadData() {
  try {
    const [statsRes, samplesRes] = await Promise.all([
      fetch('static/data/stats.json'),
      fetch('static/data/samples.json')
    ]);
    STATS = await statsRes.json();
    SAMPLES = await samplesRes.json();

    populateOverviewCards();
    buildHeroDonut();
    buildAllCharts();
    populateFilters();
    filteredSamples = [...SAMPLES];
    renderReviews();
    buildModelCompareChart();
  } catch (e) {
    console.error('Data load error:', e);
  }
}

// ===== OVERVIEW CARDS =====
function populateOverviewCards() {
  document.getElementById('ov-total').textContent = STATS.total.toLocaleString();
  document.getElementById('ov-pos').textContent = STATS.positive.toLocaleString();
  document.getElementById('ov-neg').textContent = STATS.negative.toLocaleString();
  document.getElementById('ov-rating').textContent = STATS.avg_rating_pos.toFixed(1);
}

// ===== ANIMATED COUNTERS =====
function animateCounters() {
  const els = document.querySelectorAll('.hstat-num[data-target]');
  els.forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString();
    }, 20);
  });
}

// ===== HERO DONUT =====
function buildHeroDonut() {
  const ctx = document.getElementById('heroDonut').getContext('2d');
  const pos = STATS ? STATS.positive : 2500;
  const neg = STATS ? STATS.negative : 2500;
  const pct = Math.round((pos / (pos + neg)) * 100);
  document.getElementById('donut-pct').textContent = pct + '%';

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [pos, neg],
        backgroundColor: ['rgba(139,92,246,0.85)', 'rgba(236,72,153,0.7)'],
        borderColor: ['#8b5cf6', '#ec4899'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.label || (ctx.dataIndex === 0 ? 'Positive' : 'Negative')}: ${ctx.raw.toLocaleString()}`
        }
      }},
      animation: { animateRotate: true, duration: 1400, easing: 'easeOutQuart' }
    }
  });
}

// ===== CHART HELPERS =====
const C = {
  purple: 'rgba(139,92,246,0.75)',
  purpleBorder: '#8b5cf6',
  pink: 'rgba(236,72,153,0.65)',
  pinkBorder: '#ec4899',
  text: '#a89ec9',
  grid: 'rgba(139,92,246,0.08)',
};

function baseOptions(horizontal = false) {
  const axis = horizontal ? { x: {}, y: {} } : { x: {}, y: {} };
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: C.text, font: { family: 'DM Sans', size: 12 }, padding: 16 } },
      tooltip: { backgroundColor: '#14141f', borderColor: '#8b5cf6', borderWidth: 1, titleColor: '#f1f0ff', bodyColor: '#a89ec9' }
    },
    scales: {
      x: { ticks: { color: C.text }, grid: { color: C.grid }, border: { color: C.grid } },
      y: { ticks: { color: C.text }, grid: { color: C.grid }, border: { color: C.grid } }
    }
  };
}

// ===== ALL CHARTS =====
function buildAllCharts() {
  buildGroupedBar('chartDept', STATS.by_department, 'Sentiment by Department');
  buildGroupedBar('chartCompany', STATS.by_company, 'Sentiment by Company Type');
  buildGroupedBar('chartWorkMode', STATS.by_work_mode, 'Sentiment by Work Mode');
  buildGroupedBar('chartDuration', STATS.by_duration, 'Sentiment by Duration');
  buildGroupedBar('chartLevel', STATS.by_level, 'Sentiment by Intern Level');
  buildStipendChart();
}

function buildGroupedBar(canvasId, dataObj, title) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const labels = Object.keys(dataObj);
  const pos = labels.map(k => dataObj[k].positive || 0);
  const neg = labels.map(k => dataObj[k].negative || 0);

  const opts = baseOptions();
  opts.plugins.title = { display: false };
  opts.scales.x.ticks.maxRotation = 35;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '😊 Positive', data: pos, backgroundColor: C.purple, borderColor: C.purpleBorder, borderWidth: 1, borderRadius: 6 },
        { label: '😟 Negative', data: neg, backgroundColor: C.pink, borderColor: C.pinkBorder, borderWidth: 1, borderRadius: 6 }
      ]
    },
    options: opts
  });
}

function buildStipendChart() {
  const ctx = document.getElementById('chartStipend');
  if (!ctx || !STATS.stipend_sentiment) return;
  const d = STATS.stipend_sentiment;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['With Stipend', 'No Stipend'],
      datasets: [
        { label: 'Positive', data: [d.with_stipend.positive, d.no_stipend.positive], backgroundColor: C.purple, borderColor: C.purpleBorder, borderWidth: 1, borderRadius: 6 },
        { label: 'Negative', data: [d.with_stipend.negative, d.no_stipend.negative], backgroundColor: C.pink, borderColor: C.pinkBorder, borderWidth: 1, borderRadius: 6 }
      ]
    },
    options: baseOptions()
  });
}

function buildModelCompareChart() {
  const ctx = document.getElementById('modelCompareChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
      datasets: [
        { label: 'Logistic Regression', data: [93.2, 92, 93, 92], backgroundColor: C.purple, borderColor: C.purpleBorder, borderWidth: 1, borderRadius: 6 },
        { label: 'DistilBERT', data: [97.1, 97, 97, 97], backgroundColor: C.pink, borderColor: C.pinkBorder, borderWidth: 1, borderRadius: 6 }
      ]
    },
    options: {
      ...baseOptions(),
      scales: {
        ...baseOptions().scales,
        y: { ...baseOptions().scales.y, min: 88, max: 100, ticks: { color: C.text, callback: v => v + '%' } }
      }
    }
  });
}

// ===== CHART TABS =====
document.querySelectorAll('.ctab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.chart-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    // Trigger Chart.js resize after the panel becomes visible
    setTimeout(() => {
      Chart.instances.forEach(chart => chart.resize());
    }, 50);
  });
});

// ===== PREDICTOR =====

// API base URL — when running locally: http://localhost:8000
// When deployed on Render: https://your-app-name.onrender.com
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.host}`
  : 'https://YOUR_RENDER_URL_HERE';  // ← replace after Render deployment

// Selected model toggle (lr or bert)
let selectedModel = 'bert';

// Add model toggle buttons dynamically
document.addEventListener('DOMContentLoaded', () => {
  const actions = document.querySelector('.predictor-actions');
  if (actions) {
    const toggleWrap = document.createElement('div');
    toggleWrap.style.cssText = 'display:flex;gap:0.4rem;align-items:center;margin-left:auto;';
    toggleWrap.innerHTML = `
      <span style="font-size:0.78rem;color:var(--text3)">Model:</span>
      <button id="btn-bert" onclick="setModel('bert')" style="padding:0.4rem 0.9rem;border-radius:7px;border:1px solid var(--pink);background:rgba(236,72,153,0.15);color:var(--pink2);font-size:0.8rem;cursor:pointer;transition:all 0.2s">DistilBERT</button>
      <button id="btn-lr" onclick="setModel('lr')" style="padding:0.4rem 0.9rem;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:0.8rem;cursor:pointer;transition:all 0.2s">Logistic Reg</button>
    `;
    actions.appendChild(toggleWrap);
  }
});

function setModel(model) {
  selectedModel = model;
  document.getElementById('btn-bert').style.cssText = model === 'bert'
    ? 'padding:0.4rem 0.9rem;border-radius:7px;border:1px solid var(--pink);background:rgba(236,72,153,0.15);color:var(--pink2);font-size:0.8rem;cursor:pointer;'
    : 'padding:0.4rem 0.9rem;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:0.8rem;cursor:pointer;';
  document.getElementById('btn-lr').style.cssText = model === 'lr'
    ? 'padding:0.4rem 0.9rem;border-radius:7px;border:1px solid var(--purple);background:rgba(139,92,246,0.15);color:var(--purple2);font-size:0.8rem;cursor:pointer;'
    : 'padding:0.4rem 0.9rem;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:0.8rem;cursor:pointer;';
}

async function predictSentiment() {
  const text = document.getElementById('review-input').value.trim();
  if (!text || text.length < 10) return;

  // Show loading state
  const btn = document.getElementById('predict-btn');
  btn.innerHTML = '<span>Analyzing...</span><span class="btn-arrow">⏳</span>';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model: selectedModel })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Prediction failed');
    }

    const data = await response.json();
    // data = { sentiment, confidence, model_used, positive_score, negative_score }

    showResult(data, text);

  } catch (err) {
    // Show error nicely
    const resultEl = document.getElementById('prediction-result');
    resultEl.classList.remove('hidden');
    document.getElementById('result-badge').textContent = '⚠️ Error';
    document.getElementById('result-badge').className = 'result-badge';
    document.getElementById('result-details').textContent =
      `Could not connect to backend: ${err.message}. Make sure the FastAPI server is running.`;
    document.getElementById('conf-bar').style.width = '0%';
    document.getElementById('conf-pct').textContent = '—';
    document.getElementById('keyword-cloud').innerHTML = '';
  } finally {
    btn.innerHTML = '<span>Analyze Sentiment</span><span class="btn-arrow">→</span>';
    btn.disabled = false;
  }
}

function showResult(data, text) {
  const { sentiment, confidence, model_used, positive_score, negative_score } = data;
  const confPct = Math.round(confidence * 100);

  const resultEl = document.getElementById('prediction-result');
  resultEl.classList.remove('hidden');
  resultEl.classList.add('fade-in');

  const badge = document.getElementById('result-badge');
  badge.textContent = sentiment === 'positive' ? '😊 Positive' : '😟 Negative';
  badge.className = 'result-badge ' + sentiment;

  document.getElementById('conf-bar').style.width = confPct + '%';
  document.getElementById('conf-pct').textContent = confPct + '%';

  document.getElementById('result-details').innerHTML = `
    <strong>Model used:</strong> ${model_used}<br/>
    <strong>Positive score:</strong> ${(positive_score * 100).toFixed(1)}% &nbsp;|&nbsp;
    <strong>Negative score:</strong> ${(negative_score * 100).toFixed(1)}%<br/>
    <span style="color:var(--text3);font-size:0.82rem;">
      ${sentiment === 'positive'
        ? 'This review conveys a positive internship experience based on the trained ML model.'
        : 'This review indicates a negative internship experience based on the trained ML model.'}
    </span>
  `;

  // Show score bars as keyword tags
  const cloud = document.getElementById('keyword-cloud');
  cloud.innerHTML = `
    <span class="keyword-tag">✅ Positive: ${(positive_score*100).toFixed(1)}%</span>
    <span class="keyword-tag neg">❌ Negative: ${(negative_score*100).toFixed(1)}%</span>
    <span class="keyword-tag" style="background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.2);color:#93c5fd;">🤖 ${model_used}</span>
  `;

  // Update stats
  predictionStats[sentiment]++;
  document.getElementById('ps-pos').textContent = predictionStats.positive;
  document.getElementById('ps-neg').textContent = predictionStats.negative;

  // Add to recent
  recentPredictions.unshift({ text: text.slice(0, 55) + (text.length > 55 ? '...' : ''), sentiment });
  if (recentPredictions.length > 6) recentPredictions.pop();
  renderRecentPredictions();
}

function renderRecentPredictions() {
  const el = document.getElementById('recent-preds');
  if (recentPredictions.length === 0) {
    el.innerHTML = '<div class="empty-state">No predictions yet</div>';
    return;
  }
  el.innerHTML = recentPredictions.map(p =>
    `<div class="recent-item ${p.sentiment === 'positive' ? 'pos' : 'neg'}">
      <span style="font-size:0.7rem;opacity:0.6">${p.sentiment.toUpperCase()}</span><br/>
      ${p.text}
    </div>`
  ).join('');
}

const SAMPLE_REVIEWS = [
  "The mentorship I received here was truly exceptional. My manager guided me through every challenge and made sure I understood the purpose behind every task. I left feeling confident and professionally ready.",
  "This was the worst internship I have ever done. No one gave me any tasks for the first two weeks. When I finally got assigned something, my supervisor cancelled the project without explanation.",
  "I genuinely cannot say enough good things about this experience. The team welcomed me like a full-time employee from day one. I built real features that shipped to users.",
  "I regret taking this internship. The workload was extremely heavy, the stipend was unfair, and my manager micromanaged every small decision while providing zero career guidance.",
  "The collaborative culture here is unlike anything I experienced before. Weekly feedback sessions, cross-team projects, and direct exposure to senior leadership made this a phenomenal learning experience."
];
let sampleIdx = 0;
function loadSampleReview() {
  document.getElementById('review-input').value = SAMPLE_REVIEWS[sampleIdx % SAMPLE_REVIEWS.length];
  sampleIdx++;
  updateCharCount();
}
function clearPredictor() {
  document.getElementById('review-input').value = '';
  document.getElementById('prediction-result').classList.add('hidden');
  updateCharCount();
}
document.getElementById('review-input').addEventListener('input', updateCharCount);
function updateCharCount() {
  const len = document.getElementById('review-input').value.length;
  document.getElementById('char-count').textContent = len;
}

// ===== REVIEWS EXPLORER =====
function populateFilters() {
  const depts = [...new Set(SAMPLES.map(r => r.department))].sort();
  const sel = document.getElementById('filter-dept');
  depts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    sel.appendChild(opt);
  });
}

function filterReviews() {
  const sentiment = document.getElementById('filter-sentiment').value;
  const dept = document.getElementById('filter-dept').value;
  const mode = document.getElementById('filter-mode').value;
  const search = document.getElementById('search-input').value.toLowerCase();

  filteredSamples = SAMPLES.filter(r => {
    if (sentiment !== 'all' && r.sentiment !== sentiment) return false;
    if (dept !== 'all' && r.department !== dept) return false;
    if (mode !== 'all' && r.work_mode !== mode) return false;
    if (search && !r.review_text.toLowerCase().includes(search)) return false;
    return true;
  });
  displayedCount = 0;
  document.getElementById('reviews-grid').innerHTML = '';
  renderReviews();
}

function renderReviews() {
  const grid = document.getElementById('reviews-grid');
  const slice = filteredSamples.slice(displayedCount, displayedCount + PAGE_SIZE);
  slice.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = `review-card ${r.sentiment === 'positive' ? 'pos-card' : 'neg-card'} slide-up`;
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML = `
      <div class="review-header">
        <span class="review-id">${r.review_id}</span>
        <span class="review-sentiment-pill ${r.sentiment === 'positive' ? 'pill-pos' : 'pill-neg'}">${r.sentiment === 'positive' ? '😊 Positive' : '😟 Negative'}</span>
      </div>
      <div class="review-text">${r.review_text.slice(0, 180)}${r.review_text.length > 180 ? '...' : ''}</div>
      <div class="review-meta">
        <span class="meta-tag">🏢 ${r.department}</span>
        <span class="meta-tag">💼 ${r.company_type}</span>
        <span class="meta-tag">🌐 ${r.work_mode}</span>
        <span class="review-rating">⭐ ${r.rating}</span>
      </div>
    `;
    grid.appendChild(card);
  });
  displayedCount += slice.length;
  document.getElementById('load-more-btn').style.display =
    displayedCount >= filteredSamples.length ? 'none' : 'inline-flex';
}

function loadMore() { renderReviews(); }

// ===== NAV SCROLL =====
function setupNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = ['hero','overview','charts','predictor','reviews','models'];
  window.addEventListener('scroll', () => {
    const pos = window.scrollY + 120;
    let active = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= pos) active = id;
    });
    links.forEach(l => {
      const href = l.getAttribute('href').slice(1);
      l.classList.toggle('active', href === active);
    });
  });
}
