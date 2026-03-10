import { api } from '../api.js';
import { showToast, refreshBadges } from '../app.js';

let feeds         = [];
let distributions = [];

const statusStyle = {
  critique: { cls: 'red',  label: '⚠ Critical' },
  bas:      { cls: 'gold', label: '⚠ Low'      },
  ok:       { cls: 'green',label: '✅ OK'       },
};

export function feedingHTML() {
  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">🌾 Feeding</h2>
      <p class="page-sub">Stock management &amp; distribution</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-ghost" id="btn-restock">📦 Restock</button>
      <button class="btn-primary" id="btn-add-dist">🌿 Record Distribution</button>
    </div>
  </div>

  <div id="feeding-alert-banner"></div>

  <div class="stats-row" id="feeding-stats">
    ${[1,2,3,4].map(() => `
    <div class="stat-card">
      <div class="stat-icon">·</div>
      <div class="stat-label">Loading</div>
      <div class="stat-value">-</div>
    </div>`).join('')}
  </div>

  <div class="middle-row" style="grid-template-columns:1fr 1fr">
    <div class="card">
      <div class="card-header" style="justify-content:space-between">
        <span>📦 Feed Stocks</span>
        <button class="btn-ghost" style="font-size:11px;padding:4px 10px" id="btn-add-feed">+ Add Feed</button>
      </div>
      <div id="stock-list">
        <p style="color:#A0A8A5;font-size:12px">Loading...</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span>📋 Feeding Recommendations</span></div>
      ${[
        { type: 'Adult',      hay: 150, pellets: 60,  greens: 100, notes: 'Unlimited fresh water' },
        { type: 'Pregnant',   hay: 200, pellets: 80,  greens: 150, notes: '+30% pellets from day 25' },
        { type: 'Nursing',    hay: 250, pellets: 100, greens: 200, notes: 'Unlimited hay, extra pellets' },
        { type: 'Junior <3m', hay: 100, pellets: 30,  greens: 50,  notes: 'Limited greens until 3 months' },
      ].map(r => `
      <div class="event-item" style="flex-direction:column;gap:4px;padding:8px 0">
        <div style="font-weight:600;color:#E0E6E4;font-size:13px">${r.type}</div>
        <div style="font-size:11px;color:#A0A8A5">
          Hay: ${r.hay}g · Pellets: ${r.pellets}g · Greens: ${r.greens}g
        </div>
        <div style="font-size:11px;color:#D4B475">${r.notes}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">Distribution Records</span>
    </div>
    <table class="livestock-table full" id="dist-table">
      <thead>
        <tr><th>DATE</th><th>FEED</th><th>RABBIT / GROUP</th><th>QTY</th><th>NOTES</th><th></th></tr>
      </thead>
      <tbody id="dist-tbody">
        <tr><td colspan="6" style="text-align:center;color:#A0A8A5;padding:20px">Loading...</td></tr>
      </tbody>
    </table>
  </div>

  <div class="modal-overlay" id="modal-dist">
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title">Record Distribution<small>Log a feed distribution</small></div>
        <button class="modal-close" id="close-dist">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Feed <span class="req">*</span></label>
            <select id="df-feed"></select>
          </div>
          <div class="form-group">
            <label>Quantity <span class="req">*</span></label>
            <input id="df-qty" type="number" step="0.01" min="0" placeholder="0.00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Rabbit Tag (optional)</label>
            <input id="df-rabbit" type="text" placeholder="LP-XXXX-XXX or blank for all">
          </div>
          <div class="form-group">
            <label>Date</label>
            <input id="df-date" type="date">
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="df-notes" rows="2" placeholder="Observations…"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-dist">Cancel</button>
        <button class="btn-primary" id="save-dist">💾 Save</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modal-restock">
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div class="modal-title">Restock Feed<small>Add inventory to a feed</small></div>
        <button class="modal-close" id="close-restock">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Feed <span class="req">*</span></label>
          <select id="rf-feed"></select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantity to Add <span class="req">*</span></label>
            <input id="rf-qty" type="number" step="0.001" min="0" placeholder="0.000">
          </div>
          <div class="form-group">
            <label>Expiry Date</label>
            <input id="rf-expiry" type="date">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-restock">Cancel</button>
        <button class="btn-primary" id="save-restock">📦 Restock</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modal-add-feed">
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div class="modal-title">Add Feed Type<small>Define a new feed</small></div>
        <button class="modal-close" id="close-add-feed">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Feed Name <span class="req">*</span></label>
            <input id="af-name" type="text" placeholder="e.g. Timothy Hay">
          </div>
          <div class="form-group">
            <label>Unit</label>
            <select id="af-unit">
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Initial Quantity</label>
            <input id="af-qty" type="number" step="0.001" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label>Alert Threshold</label>
            <input id="af-threshold" type="number" step="0.001" min="0" placeholder="0">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-add-feed">Cancel</button>
        <button class="btn-primary" id="save-add-feed">💾 Save</button>
      </div>
    </div>
  </div>`;
}

export async function initFeeding() {
  const [aliments, stocks, dists] = await Promise.all([
    api.alimentation.aliments(),
    api.alimentation.stocks(),
    api.alimentation.distributions(),
  ]);

  feeds = aliments.map(a => {
    const s = stocks.find(st => st.aliment_id === a.id);
    const quantite = parseFloat(s?.quantite || 0);
    const seuil    = parseFloat(s?.seuil_alerte || 0);
    const statut   = quantite <= 0 ? 'critique' : quantite <= seuil ? 'bas' : 'ok';
    return {
      id:           a.id,
      aliment_id:   a.id,
      stock_id:     s?.id || null,
      nom:          a.nom,
      unite:        a.unite_mesure || 'kg',
      quantite,
      seuil_alerte: seuil,
      date_peremption: s?.date_peremption || null,
      statut_stock: statut,
    };
  });

  distributions = [...dists].sort((a, b) => new Date(b.date_dist || b.createdAt) - new Date(a.date_dist || a.createdAt));

  renderStocks();
  renderDistributions();
  renderStats();
  populateFeedSelects();
  initModals();
}

function renderStocks() {
  document.getElementById('stock-list').innerHTML = feeds.length
    ? feeds.map(f => {
        const s   = statusStyle[f.statut_stock] || statusStyle.ok;
        const pct = Math.min(100, Math.round((f.quantite / Math.max(f.seuil_alerte, 1)) * 50));
        return `
        <div class="stock-item">
          <div class="stock-top">
            <span class="stock-name">${f.nom}</span>
            <span class="stock-qty ${s.cls === 'red' ? 'red-text' : s.cls === 'gold' ? 'gold-text' : 'green-text'}">${f.quantite} ${f.unite}</span>
          </div>
          <div class="kstat-bar"><div class="kstat-fill ${s.cls}" style="width:${pct}%"></div></div>
          <div class="stock-meta">${s.label} · Threshold: ${f.seuil_alerte} ${f.unite}${f.date_peremption ? ' · Exp: ' + f.date_peremption.slice(0,10) : ''}</div>
        </div>`;
      }).join('')
    : `<p style="color:#A0A8A5;font-size:12px">No feeds defined yet — click "+ Add Feed" to get started</p>`;
}

function renderDistributions() {
  document.getElementById('dist-tbody').innerHTML = distributions.length
    ? distributions.map(d => {
        const feed = feeds.find(f => f.aliment_id === d.aliment_id);
        return `
        <tr data-id="${d.id}">
          <td style="font-size:12px">${d.date_dist?.slice(0,10) || d.createdAt?.slice(0,10) || '-'}</td>
          <td><span class="cage-badge">${d.nom_aliment || feed?.nom || '—'}</span></td>
          <td style="font-size:12px">${d.nom_lapin || d.tag_lapin || 'All herd'}</td>
          <td style="font-size:12px;font-weight:600">${d.quantite} ${feed?.unite || ''}</td>
          <td style="font-size:11px;color:#A0A8A5">${d.notes || '-'}</td>
          <td class="action-cell">
            <button class="action-btn danger del-dist" data-id="${d.id}" title="Delete">🗑</button>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="6" style="text-align:center;color:#A0A8A5;padding:20px">No distributions recorded</td></tr>`;
}

function renderStats() {
  const today     = new Date().toISOString().slice(0, 10);
  const todayDist = distributions.filter(d => (d.date_dist || d.createdAt || '').startsWith(today)).length;
  const criticals = feeds.filter(f => f.statut_stock === 'critique').length;
  const lows      = feeds.filter(f => f.statut_stock === 'bas').length;

  document.getElementById('feeding-stats').innerHTML = `
    <div class="stat-card accent-red">
      <div class="stat-icon">🚨</div>
      <div class="stat-label">Critical Stocks</div>
      <div class="stat-value">${criticals}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">⚠️</div>
      <div class="stat-label">Low Stocks</div>
      <div class="stat-value">${lows}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">📦</div>
      <div class="stat-label">Feed Types</div>
      <div class="stat-value">${feeds.length}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">🌿</div>
      <div class="stat-label">Distributions Today</div>
      <div class="stat-value">${todayDist}</div>
    </div>`;

  const alertEl = document.getElementById('feeding-alert-banner');
  if ((criticals + lows) > 0) {
    alertEl.innerHTML = `
      <div class="alert-banner">
        <span class="alert-banner-icon">🚨</span>
        <div class="alert-banner-text">
          <strong>${criticals + lows} feed${(criticals + lows) > 1 ? 's' : ''} need restocking</strong>
          <span>${feeds.filter(f => f.statut_stock !== 'ok').map(f => `${f.nom}: ${f.quantite}${f.unite}`).join(' · ')}</span>
        </div>
        <span class="alert-banner-arrow">→</span>
      </div>`;
  } else {
    alertEl.innerHTML = '';
  }
}

function populateFeedSelects() {
  const options = feeds.map((f, i) => `<option value="${i}">${f.nom} (${f.quantite} ${f.unite})</option>`).join('');
  ['df-feed','rf-feed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = feeds.length ? options : '<option>No feeds defined</option>';
  });
}

function initModals() {
  document.getElementById('dist-table').addEventListener('click', async e => {
    const del = e.target.closest('.del-dist');
    if (!del) return;
    if (!confirm('Remove this distribution record?')) return;
    try {
      await api.alimentation.deleteDist(del.dataset.id);
      distributions = distributions.filter(x => String(x.id) !== del.dataset.id);
      renderDistributions();
      renderStats();
      showToast('Distribution removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-add-dist').addEventListener('click', () => {
    document.getElementById('df-date').value = new Date().toISOString().slice(0,10);
    populateFeedSelects();
    document.getElementById('modal-dist').classList.add('open');
  });

  document.getElementById('btn-restock').addEventListener('click', () => {
    populateFeedSelects();
    document.getElementById('modal-restock').classList.add('open');
  });

  document.getElementById('btn-add-feed').addEventListener('click', () => {
    document.getElementById('modal-add-feed').classList.add('open');
  });

  ['close-dist','cancel-dist'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-dist').classList.remove('open');
    });
  });

  ['close-restock','cancel-restock'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-restock').classList.remove('open');
    });
  });

  ['close-add-feed','cancel-add-feed'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-add-feed').classList.remove('open');
    });
  });

  ['modal-dist','modal-restock','modal-add-feed'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).classList.remove('open');
    });
  });

  document.getElementById('save-dist').addEventListener('click', async () => {
    const feedIdx = parseInt(document.getElementById('df-feed').value);
    const qty     = parseFloat(document.getElementById('df-qty').value);
    if (isNaN(feedIdx) || !qty) { alert('Feed and quantity are required'); return; }

    const feed = feeds[feedIdx];
    try {
      const saved = await api.alimentation.addDist({
        aliment_id:  feed.aliment_id,
        nom_aliment: feed.nom,
        quantite:    qty,
        date_dist:   document.getElementById('df-date').value,
        tag_lapin:   document.getElementById('df-rabbit').value.trim() || null,
        notes:       document.getElementById('df-notes').value.trim() || null,
      });
      distributions.unshift(saved);

      if (feed.stock_id) {
        const newQty = Math.max(0, feed.quantite - qty);
        await api.alimentation.updateStock(feed.stock_id, { quantite: newQty });
        feeds[feedIdx].quantite = newQty;
        const seuil = feeds[feedIdx].seuil_alerte;
        feeds[feedIdx].statut_stock = newQty <= 0 ? 'critique' : newQty <= seuil ? 'bas' : 'ok';
      }

      renderStocks();
      renderDistributions();
      renderStats();
      refreshBadges();
      document.getElementById('modal-dist').classList.remove('open');
      ['df-qty','df-rabbit','df-notes'].forEach(id => { document.getElementById(id).value = ''; });
      showToast('Distribution recorded ✅');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('save-restock').addEventListener('click', async () => {
    const feedIdx = parseInt(document.getElementById('rf-feed').value);
    const qty     = parseFloat(document.getElementById('rf-qty').value);
    if (isNaN(feedIdx) || !qty) { alert('Feed and quantity are required'); return; }

    const feed = feeds[feedIdx];
    try {
      if (feed.stock_id) {
        const newQty = feed.quantite + qty;
        await api.alimentation.updateStock(feed.stock_id, {
          quantite:        newQty,
          date_peremption: document.getElementById('rf-expiry').value || feed.date_peremption,
        });
        feeds[feedIdx].quantite = newQty;
      } else {
        const s = await api.alimentation.createStock({
          aliment_id:      feed.aliment_id,
          quantite:        qty,
          seuil_alerte:    feed.seuil_alerte,
          date_peremption: document.getElementById('rf-expiry').value || null,
        });
        feeds[feedIdx].stock_id = s.id;
        feeds[feedIdx].quantite = qty;
      }
      const seuil = feeds[feedIdx].seuil_alerte;
      feeds[feedIdx].statut_stock = feeds[feedIdx].quantite <= 0 ? 'critique'
        : feeds[feedIdx].quantite <= seuil ? 'bas' : 'ok';

      renderStocks();
      renderStats();
      refreshBadges();
      document.getElementById('modal-restock').classList.remove('open');
      ['rf-qty','rf-expiry'].forEach(id => { document.getElementById(id).value = ''; });
      showToast(`${feed.nom} restocked: +${qty} ${feed.unite} ✅`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('save-add-feed').addEventListener('click', async () => {
    const name = document.getElementById('af-name').value.trim();
    if (!name) { alert('Feed name is required'); return; }

    try {
      const aliment = await api.alimentation.createAliment({
        nom:          name,
        unite_mesure: document.getElementById('af-unit').value,
      });
      const qty       = parseFloat(document.getElementById('af-qty').value) || 0;
      const threshold = parseFloat(document.getElementById('af-threshold').value) || 0;
      const stock = await api.alimentation.createStock({
        aliment_id:   aliment.id,
        quantite:     qty,
        seuil_alerte: threshold,
      });
      const statut = qty <= 0 ? 'critique' : qty <= threshold ? 'bas' : 'ok';
      feeds.push({
        id: aliment.id, aliment_id: aliment.id, stock_id: stock.id,
        nom: name, unite: aliment.unite_mesure, quantite: qty,
        seuil_alerte: threshold, date_peremption: null, statut_stock: statut,
      });
      renderStocks();
      renderStats();
      populateFeedSelects();
      document.getElementById('modal-add-feed').classList.remove('open');
      ['af-name','af-qty','af-threshold'].forEach(id => { document.getElementById(id).value = ''; });
      showToast(`${name} added to feeds ✨`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
