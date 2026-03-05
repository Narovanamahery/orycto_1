import { api } from '../api.js';

export function dashboardHTML() {
  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">Welcome back, Admin 👋</h2>
      <p class="page-sub" id="current-date">Loading...</p>
    </div>
  </div>

  <div id="dash-alert-banner"></div>

  <div class="stats-row" id="dash-stats">
    ${[1,2,3,4].map(() => `
    <div class="stat-card accent-green">
      <div class="stat-icon">·</div>
      <div class="stat-label">Loading</div>
      <div class="stat-value">-</div>
    </div>`).join('')}
  </div>

  <div class="quick-actions-row">
    <button class="qa-btn" data-qa="livestock"><span class="qa-icon">➕</span><span>Add Rabbit</span></button>
    <button class="qa-btn" data-qa="reproduction"><span class="qa-icon">💞</span><span>New Mating</span></button>
    <button class="qa-btn" data-qa="livestock"><span class="qa-icon">⚖️</span><span>Weigh Rabbit</span></button>
    <button class="qa-btn" data-qa="health"><span class="qa-icon">💊</span><span>Add Treatment</span></button>
    <button class="qa-btn" data-qa="feeding"><span class="qa-icon">🌾</span><span>Feed Distribution</span></button>
    <button class="qa-btn" data-qa="statistics"><span class="qa-icon">📊</span><span>Statistics</span></button>
  </div>

  <div class="middle-row">
    <div class="card">
      <div class="card-header"><span>🚨 Alerts &amp; Events</span></div>
      <div id="dash-alerts-list"><p style="color:#A0A8A5;font-size:12px">Loading...</p></div>
    </div>

    <div class="card">
      <div class="card-header"><span>📊 Statistics Overview</span></div>
      <div id="dash-kpi-bars"></div>
      <div class="card-sub-header">🌾 Feed Stocks</div>
      <div id="dash-stocks-list"></div>
    </div>

    <div class="card">
      <div class="card-header"><span>🕐 Recent Activities</span></div>
      <div id="dash-activities-list"><p style="color:#A0A8A5;font-size:12px">Loading...</p></div>
    </div>
  </div>

  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">Recently Added Rabbits</span>
      <a href="#livestock" class="view-btn">View All →</a>
    </div>
    <table class="livestock-table">
      <thead><tr>
        <th>TAG / ID</th><th>NAME</th><th>GENDER</th><th>BREED</th>
        <th>CAGE</th><th>WEIGHT</th><th>STATUS</th>
      </tr></thead>
      <tbody id="dash-recent-rabbits">
        <tr><td colspan="7" style="text-align:center;color:#A0A8A5;padding:20px">Loading...</td></tr>
      </tbody>
    </table>
  </div>`;
}

export async function initDashboard() {
  const el = document.getElementById('current-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) + ' • Dashboard overview';
  }

  document.querySelectorAll('.qa-btn[data-qa]').forEach(btn => {
    btn.addEventListener('click', () => {
      location.hash = '#' + btn.dataset.qa;
    });
  });

  const data = await api.dashboard.get();
  renderStats(data.kpis);
  renderAlerts(data.alertes);
  renderActivities(data.activites);
  renderStocks(data.stocks);

  const lapins = await api.lapins.getAll();
  renderRecentRabbits(lapins.slice(-5).reverse());
}

function renderStats(k) {
  if (!k) return;
  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card accent-green">
      <div class="stat-icon">🐇</div>
      <div class="stat-label">Active Rabbits</div>
      <div class="stat-value">${k.total_actifs}</div>
    </div>
    <div class="stat-card accent-blue">
      <div class="stat-icon">🤰</div>
      <div class="stat-label">Pregnant Females</div>
      <div class="stat-value">${k.nb_gestantes}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">🐣</div>
      <div class="stat-label">Expected Births</div>
      <div class="stat-value">${k.naissances_attendues}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">🚨</div>
      <div class="stat-label">Vaccines Overdue</div>
      <div class="stat-value">${k.vaccins_en_retard}</div>
    </div>`;

  const gestPct  = Math.round((k.nb_gestantes / Math.max(k.nb_femelles, 1)) * 100);
  const litterAvg = parseFloat(k.taille_portee_moy) || 0;
  document.getElementById('dash-kpi-bars').innerHTML =
    kpiBar('Avg. Litter Size',  k.taille_portee_moy || '0', Math.min(litterAvg * 10, 100), 'green') +
    kpiBar('Pregnant Females',  gestPct + '%',               gestPct,                       'gold')  +
    kpiBar('Active / Total',    k.total_actifs + ' / ' + k.total_lapins,
      k.total_lapins > 0 ? Math.round((k.total_actifs / k.total_lapins) * 100) : 0, 'green');
}

function kpiBar(label, val, pct, cls) {
  return `
  <div class="key-stats"><div class="kstat">
    <div class="kstat-label">
      <span>${label}</span>
      <span class="kstat-val ${cls}-text">${val}</span>
    </div>
    <div class="kstat-bar">
      <div class="kstat-fill ${cls}" style="width:${Math.min(pct, 100)}%"></div>
    </div>
  </div></div>`;
}

function renderAlerts(alertes = []) {
  const banner  = document.getElementById('dash-alert-banner');
  const listEl  = document.getElementById('dash-alerts-list');
  const urgents = alertes.filter(a => a.type === 'vaccin_retard' || a.type === 'stock_critique');

  if (urgents.length) {
    banner.innerHTML = `
      <div class="alert-banner">
        <span class="alert-banner-icon">🚨</span>
        <div class="alert-banner-text">
          <strong>${urgents.length} alert${urgents.length > 1 ? 's' : ''} require your attention</strong>
          <span>${urgents.map(a => a.nom || a.detail).join(' · ')}</span>
        </div>
        <span class="alert-banner-arrow">→</span>
      </div>`;
  }

  const dotCls   = { vaccin_retard: 'red',    naissance_proche: 'gold', stock_critique: 'red' };
  const badgeCls = { vaccin_retard: 'urgent', naissance_proche: 'warn', stock_critique: 'warn' };
  const badgeLbl = { vaccin_retard: 'OVERDUE', naissance_proche: 'BIRTH', stock_critique: 'STOCK' };

  listEl.innerHTML = alertes.length
    ? alertes.map(a => `
      <div class="event-item">
        <div class="alert-dot ${dotCls[a.type] || 'gold'}"></div>
        <div class="alert-info">
          <div class="alert-title">${a.nom}</div>
          <div class="alert-desc">${a.detail || ''}</div>
        </div>
        <span class="alert-badge ${badgeCls[a.type] || 'warn'}">${badgeLbl[a.type] || 'INFO'}</span>
      </div>`).join('')
    : `<p style="color:#A0A8A5;font-size:12px;padding:8px 0">No active alerts 🎉</p>`;
}

function renderActivities(activites = []) {
  document.getElementById('dash-activities-list').innerHTML = activites.length
    ? activites.map(a => `
      <div class="activity-item">
        <div class="activity-dot green"></div>
        <div class="activity-info">
          <div class="activity-title">${a.nom_lapin || '—'} — ${a.type_evenement || ''}</div>
          <div class="activity-time">${a.date_evenement ? new Date(a.date_evenement).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short',
          }) : ''}</div>
        </div>
      </div>`).join('')
    : `<p style="color:#A0A8A5;font-size:12px">No recent activity</p>`;
}

function renderStocks(stocks = []) {
  if (!stocks.length) {
    document.getElementById('dash-stocks-list').innerHTML = `<p style="color:#A0A8A5;font-size:12px">No feed stocks recorded</p>`;
    return;
  }
  const cls = { critique: 'red', bas: 'gold', ok: 'green' };
  document.getElementById('dash-stocks-list').innerHTML = stocks.map(s => {
    const pct   = Math.min(100, Math.round((parseFloat(s.quantite) / Math.max(parseFloat(s.seuil_alerte), 1)) * 50));
    const label = s.statut_stock === 'critique' ? '⚠ Critical'
                : s.statut_stock === 'bas'      ? '⚠ Low'
                : '✅ OK';
    return `
    <div class="stock-item">
      <div class="stock-top">
        <span class="stock-name">${s.nom}</span>
        <span class="stock-qty ${cls[s.statut_stock] || 'green'}-text">${s.quantite} ${s.unite}</span>
      </div>
      <div class="kstat-bar">
        <div class="kstat-fill ${cls[s.statut_stock] || 'green'}" style="width:${pct}%"></div>
      </div>
      <div class="stock-meta">${label} · Threshold: ${s.seuil_alerte} ${s.unite}</div>
    </div>`;
  }).join('');
}

function renderRecentRabbits(lapins) {
  const statusCls = {
    actif: 'green', gestante: 'gold', allaitante: 'blue',
    malade: 'red',  vendu: 'gray',    mort: 'gray',
  };
  document.getElementById('dash-recent-rabbits').innerHTML = lapins.length
    ? lapins.map(r => `
    <tr>
      <td class="td-id">${r.tag || r.identifiant_unique || '—'}</td>
      <td>${r.nom || '—'}</td>
      <td><span class="sex-badge ${r.sexe === 'M' ? 'male' : 'female'}">${r.sexe === 'M' ? '♂ M' : '♀ F'}</span></td>
      <td>${r.race || '—'}</td>
      <td>${r.cage ? `<span class="cage-badge">${r.cage}</span>` : '—'}</td>
      <td>${r.poids_actuel ? r.poids_actuel + ' kg' : '—'}</td>
      <td><span class="status ${statusCls[r.statut] || 'green'}">${r.statut}</span></td>
    </tr>`).join('')
    : `<tr><td colspan="7" style="text-align:center;color:#A0A8A5;padding:20px">No rabbits yet — add your first rabbit in Livestock</td></tr>`;
}
