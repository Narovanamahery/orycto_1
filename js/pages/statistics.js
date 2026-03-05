// ═══════════════════════════════════════════════════════════════
//  STATISTICS PAGE — Orycto
// ═══════════════════════════════════════════════════════════════

export function statisticsHTML() {
  // Monthly production data (last 6 months)
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const births  = [8, 11, 7, 14, 9, 5];
  const deaths  = [1,  2,  1,  2,  1, 2];
  const sales   = [4,  6,  3,  8,  5, 1];
  const maxVal  = 16;

  // Costs breakdown
  const costs = [
    { label: 'Feed',       amount: 145000, pct: 58, cls: 'green' },
    { label: 'Veterinary', amount: 48000,  pct: 19, cls: 'blue'  },
    { label: 'Equipment',  amount: 35000,  pct: 14, cls: 'gold'  },
    { label: 'Other',      amount: 22000,  pct: 9,  cls: 'gray'  },
  ];
  const totalCost = costs.reduce((s, c) => s + c.amount, 0);

  const topBreeds = [
    { breed: 'Flemish Giant', count: 7, pct: 30 },
    { breed: 'Rex',           count: 6, pct: 26 },
    { breed: 'Californian',   count: 5, pct: 22 },
    { breed: 'Dutch',         count: 4, pct: 17 },
    { breed: 'New Zealand',   count: 1, pct: 5  },
  ];

  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">📊 Statistics</h2>
      <p class="page-sub">Farm performance & analytics · Season 2025</p>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card accent-green">
      <div class="stat-icon">📈</div>
      <div class="stat-label">Birth Rate</div>
      <div class="stat-value">85<span style="font-size:16px">%</span></div>
      <div class="stat-sub"><span class="stat-change up">▲ +3%</span><span>vs last season</span></div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">💪</div>
      <div class="stat-label">Survival Rate</div>
      <div class="stat-value">92<span style="font-size:16px">%</span></div>
      <div class="stat-sub"><span class="stat-change up">▲ +1%</span><span>vs last season</span></div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">⚖️</div>
      <div class="stat-label">Avg. Litter Size</div>
      <div class="stat-value">6.2</div>
      <div class="stat-sub"><span class="stat-change neutral">▶ stable</span></div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">📅</div>
      <div class="stat-label">Avg. Interval (days)</div>
      <div class="stat-value">42</div>
      <div class="stat-sub"><span class="stat-change down">▼ -3d</span><span>improving</span></div>
    </div>
  </div>

  <div class="middle-row">

    <!-- PRODUCTION CHART -->
    <div class="card" style="grid-column:span 2">
      <div class="card-header"><span>📅 Monthly Production (Last 6 months)</span></div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding:10px 0;border-bottom:1px solid #1e2e28">
        ${months.map((m, i) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%">
          <div style="flex:1;width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:3px">
            <div title="Births: ${births[i]}" style="width:100%;background:#3a8a72;border-radius:4px 4px 0 0;height:${Math.round(births[i]/maxVal*120)}px;transition:height .5s"></div>
            <div title="Sales: ${sales[i]}" style="width:100%;background:#D4B475;border-radius:4px 4px 0 0;height:${Math.round(sales[i]/maxVal*120)}px;transition:height .5s"></div>
            <div title="Deaths: ${deaths[i]}" style="width:100%;background:#E74C3C;border-radius:4px 4px 0 0;height:${Math.round(deaths[i]/maxVal*120)}px;transition:height .5s"></div>
          </div>
          <span style="font-size:10px;color:#A0A8A5">${m}</span>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:16px;margin-top:10px">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#A0A8A5"><div style="width:12px;height:12px;background:#3a8a72;border-radius:3px"></div>Births</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#A0A8A5"><div style="width:12px;height:12px;background:#D4B475;border-radius:3px"></div>Sales</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#A0A8A5"><div style="width:12px;height:12px;background:#E74C3C;border-radius:3px"></div>Deaths</div>
        <div style="margin-left:auto;font-size:11px;color:#A0A8A5">Total births: <strong style="color:#4ade80">${births.reduce((a,b)=>a+b,0)}</strong> · Sales: <strong style="color:#D4B475">${sales.reduce((a,b)=>a+b,0)}</strong></div>
      </div>
    </div>

    <!-- BREED DISTRIBUTION -->
    <div class="card">
      <div class="card-header"><span>🏷 Breed Distribution</span></div>
      ${topBreeds.map(b => `
      <div class="kstat" style="margin-bottom:12px">
        <div class="kstat-label">
          <span>${b.breed}</span>
          <span class="kstat-val green-text">${b.count} <span style="color:#A0A8A5;font-weight:400">(${b.pct}%)</span></span>
        </div>
        <div class="kstat-bar"><div class="kstat-fill green" style="width:${b.pct}%"></div></div>
      </div>`).join('')}
    </div>
  </div>

  <div class="middle-row" style="grid-template-columns:1fr 1fr">

    <!-- COST BREAKDOWN -->
    <div class="card">
      <div class="card-header">
        <span>💰 Cost Breakdown</span>
        <span style="font-size:12px;color:#D4B475;font-weight:600">${totalCost.toLocaleString()} Ar total</span>
      </div>
      ${costs.map(c => `
      <div class="kstat" style="margin-bottom:14px">
        <div class="kstat-label">
          <span>${c.label}</span>
          <span class="kstat-val" style="color:${c.cls==='green'?'#3a8a72':c.cls==='blue'?'#4a8ab0':c.cls==='gold'?'#D4B475':'#A0A8A5'}">${c.amount.toLocaleString()} Ar <span style="color:#A0A8A5;font-weight:400">(${c.pct}%)</span></span>
        </div>
        <div class="kstat-bar"><div class="kstat-fill ${c.cls}" style="width:${c.pct}%"></div></div>
      </div>`).join('')}
      <div style="margin-top:12px;padding:10px 14px;background:#121B18;border-radius:8px;display:flex;justify-content:space-between;font-size:12px">
        <span style="color:#A0A8A5">Avg. cost / rabbit / month</span>
        <span style="color:#D4B475;font-weight:600">~${Math.round(totalCost/38/6).toLocaleString()} Ar</span>
      </div>
    </div>

    <!-- KEY INDICATORS -->
    <div class="card">
      <div class="card-header"><span>📈 Key Performance Indicators</span></div>
      <div style="display:grid;gap:12px">
        ${[
          { label: 'Avg. weaning weight',   val: '580 g',   note: '+20g vs target', cls: 'green' },
          { label: 'Mortality rate',         val: '8%',      note: 'Target: <10%',   cls: 'green' },
          { label: 'Fertility rate',         val: '85%',     note: 'Good',           cls: 'green' },
          { label: 'Avg. gestation',         val: '31.2d',   note: 'Normal',         cls: 'gold'  },
          { label: 'Rabbits sold / month',   val: '4.3',     note: '+0.8 vs target', cls: 'green' },
          { label: 'Revenue / month (est.)', val: '193,500 Ar', note: 'Sales only', cls: 'gold' },
        ].map(k => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#121B18;border-radius:8px">
          <span style="font-size:12px;color:#A0A8A5">${k.label}</span>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:700;color:${k.cls==='green'?'#4ade80':'#D4B475'}">${k.val}</div>
            <div style="font-size:10px;color:#A0A8A5">${k.note}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>
  `;
}

export function initStatistics() {
  // Animate bars on load
  setTimeout(() => {
    document.querySelectorAll('.kstat-fill').forEach(el => {
      const w = el.style.width;
      el.style.width = '0';
      setTimeout(() => { el.style.width = w; }, 50);
    });
  }, 100);
}
