import { api } from '../api.js';

export function statisticsHTML() {
  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">📊 Statistics</h2>
      <p class="page-sub">Farm performance &amp; analytics</p>
    </div>
  </div>

  <div class="stats-row" id="stat-kpis">
    ${[1,2,3,4].map(() => `
    <div class="stat-card">
      <div class="stat-icon">·</div>
      <div class="stat-label">Loading</div>
      <div class="stat-value">-</div>
    </div>`).join('')}
  </div>

  <div class="middle-row">
    <div class="card">
      <div class="card-header"><span>📈 Monthly Births (6 months)</span></div>
      <div id="stat-monthly" style="padding:8px 0">
        <p style="color:#A0A8A5;font-size:12px">Loading...</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span>🐇 Population by Breed</span></div>
      <div id="stat-breeds" style="padding:8px 0">
        <p style="color:#A0A8A5;font-size:12px">Loading...</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span>💰 Costs by Category</span></div>
      <div id="stat-costs" style="padding:8px 0">
        <p style="color:#A0A8A5;font-size:12px">Loading...</p>
      </div>
    </div>
  </div>`;
}

export async function initStatistics() {
  const [kpis, stats] = await Promise.all([
    api.dashboard.get(),
    api.dashboard.statistiques(),
  ]);

  renderKpis(kpis.kpis);
  renderMonthly(stats.mensuel);
  renderBreeds(stats.races);
  renderCosts(stats.couts);
}

function renderKpis(k) {
  if (!k) return;
  const survivalRate = k.total_actifs > 0
    ? Math.round(((k.total_actifs - k.nb_malades) / k.total_actifs) * 100)
    : 100;

  document.getElementById('stat-kpis').innerHTML = `
    <div class="stat-card accent-green">
      <div class="stat-icon">📈</div>
      <div class="stat-label">Avg. Litter Size</div>
      <div class="stat-value">${k.taille_portee_moy || '0'}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">💪</div>
      <div class="stat-label">Survival Rate</div>
      <div class="stat-value">${survivalRate}<span style="font-size:16px">%</span></div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">🤰</div>
      <div class="stat-label">Pregnant Females</div>
      <div class="stat-value">${k.nb_gestantes}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">🚨</div>
      <div class="stat-label">Overdue Vaccines</div>
      <div class="stat-value">${k.vaccins_en_retard}</div>
    </div>`;
}

function renderMonthly(rows = []) {
  if (!rows.length || rows.every(r => r.nes === 0)) {
    document.getElementById('stat-monthly').innerHTML =
      `<p style="color:#A0A8A5;font-size:12px">No birth data yet — record litters in Reproduction</p>`;
    return;
  }
  const max = Math.max(...rows.map(r => r.nes), 1);
  document.getElementById('stat-monthly').innerHTML = rows.map(r => `
    <div class="key-stats"><div class="kstat">
      <div class="kstat-label">
        <span style="color:#E0E6E4">${r.mois}</span>
        <span style="color:#4ade80;font-weight:700">${r.nes} born</span>
      </div>
      <div class="kstat-bar">
        <div class="kstat-fill green" style="width:${Math.round((r.nes / max) * 100)}%"></div>
      </div>
    </div></div>`).join('');
}

function renderBreeds(rows = []) {
  if (!rows.length) {
    document.getElementById('stat-breeds').innerHTML =
      `<p style="color:#A0A8A5;font-size:12px">No breed data yet — add rabbits with a breed in Livestock</p>`;
    return;
  }
  const colors = ['#4ade80','#4a8ab0','#D4B475','#e08aaa','#A0A8A5'];
  document.getElementById('stat-breeds').innerHTML = rows.map((r, i) => `
    <div class="key-stats"><div class="kstat">
      <div class="kstat-label">
        <span style="color:#E0E6E4">${r.race}</span>
        <span style="color:${colors[i % colors.length]};font-weight:700">${r.nb} (${r.pct}%)</span>
      </div>
      <div class="kstat-bar">
        <div class="kstat-fill" style="width:${r.pct}%;background:${colors[i % colors.length]}"></div>
      </div>
    </div></div>`).join('');
}

function renderCosts(rows = []) {
  if (!rows.length) {
    document.getElementById('stat-costs').innerHTML =
      `<p style="color:#A0A8A5;font-size:12px">No cost data yet — record expenses in the app</p>`;
    return;
  }
  const total  = rows.reduce((s, r) => s + parseFloat(r.montant || 0), 0);
  const colors = ['#4ade80','#4a8ab0','#D4B475','#A0A8A5','#e08aaa'];
  document.getElementById('stat-costs').innerHTML = rows.map((r, i) => {
    const pct = total > 0 ? Math.round((parseFloat(r.montant) / total) * 100) : 0;
    return `
    <div class="key-stats"><div class="kstat">
      <div class="kstat-label">
        <span style="color:#E0E6E4;text-transform:capitalize">${r.categorie}</span>
        <span style="color:${colors[i % colors.length]};font-weight:700">${pct}% · ${parseInt(r.montant).toLocaleString()} Ar</span>
      </div>
      <div class="kstat-bar">
        <div class="kstat-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
      </div>
    </div></div>`;
  }).join('') + `
  <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);font-size:12px;color:#A0A8A5">
    Total costs: <strong style="color:#E0E6E4">${parseInt(total).toLocaleString()} Ar</strong>
  </div>`;
}
