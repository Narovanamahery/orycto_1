// ═══════════════════════════════════════════════════════════════
//  FEEDING PAGE — Orycto
// ═══════════════════════════════════════════════════════════════

const feeds = [
  { id: 'ALM-001', name: 'Hay',        type: 'Roughage',   unit: 'kg',  stock: 12,  threshold: 20, maxStock: 50, cost: 500,  expires: '2025-03-20', status: 'critical' },
  { id: 'ALM-002', name: 'Pellets',    type: 'Concentrate',unit: 'kg',  stock: 8,   threshold: 15, maxStock: 25, cost: 3500, expires: '2025-06-01', status: 'low'      },
  { id: 'ALM-003', name: 'Greens',     type: 'Vegetables', unit: 'kg',  stock: 45,  threshold: 5,  maxStock: 50, cost: 200,  expires: '2025-03-05', status: 'ok'       },
  { id: 'ALM-004', name: 'Water',      type: 'Water',      unit: 'L',   stock: 200, threshold: 50, maxStock: 200,cost: 0,    expires: null,          status: 'ok'       },
  { id: 'ALM-005', name: 'Corn',       type: 'Grain',      unit: 'kg',  stock: 6,   threshold: 10, maxStock: 20, cost: 1200, expires: '2025-05-15', status: 'low'      },
  { id: 'ALM-006', name: 'Vitamin Mix',type: 'Supplement', unit: 'g',   stock: 350, threshold: 100,maxStock: 500,cost: 8000, expires: '2025-08-01', status: 'ok'       },
];

const distributions = [
  { id: 'DST-001', date: '2025-02-23', rabbit: 'All herd',    cage: 'All', feed: 'Hay',     qty: 2.5, notes: 'Morning feed' },
  { id: 'DST-002', date: '2025-02-23', rabbit: 'All herd',    cage: 'All', feed: 'Pellets', qty: 0.8, notes: 'Morning feed' },
  { id: 'DST-003', date: '2025-02-23', rabbit: 'Cleo',        cage: 'C-01',feed: 'Greens',  qty: 0.3, notes: 'Nursing diet' },
  { id: 'DST-004', date: '2025-02-22', rabbit: 'All herd',    cage: 'All', feed: 'Hay',     qty: 2.5, notes: 'Evening feed' },
  { id: 'DST-005', date: '2025-02-22', rabbit: 'Luna',        cage: 'B-02',feed: 'Pellets', qty: 0.4, notes: 'Gestation diet' },
  { id: 'DST-006', date: '2025-02-22', rabbit: 'Noisette',    cage: 'B-01',feed: 'Vitamin Mix',qty: 5,'notes': 'Prenatal supp.' },
  { id: 'DST-007', date: '2025-02-21', rabbit: 'All herd',    cage: 'All', feed: 'Hay',     qty: 2.5, notes: '' },
  { id: 'DST-008', date: '2025-02-21', rabbit: 'All herd',    cage: 'All', feed: 'Corn',    qty: 0.5, notes: '' },
];

const rations = [
  { type: 'Adult',      hay: 150, pellets: 50, greens: 200, corn: 20, notes: 'Standard adult ration' },
  { type: 'Pregnant',   hay: 200, pellets: 80, greens: 150, corn: 10, notes: '+30% pellets from day 25' },
  { type: 'Nursing',    hay: 250, pellets: 100,greens: 200, corn: 0,  notes: 'Unlimited hay, extra pellets' },
  { type: 'Junior (<3m)',hay: 100,pellets: 30, greens: 50,  corn: 0,  notes: 'Limited greens until 3 months' },
];

const statusStyle = {
  critical: { cls: 'red',   label: '🚨 Critical', pct: cls => 'red'   },
  low:      { cls: 'gold',  label: '⚠ Low',       pct: cls => 'gold'  },
  ok:       { cls: 'green', label: '✅ OK',        pct: cls => 'green' },
};

export function feedingHTML() {
  const criticals = feeds.filter(f => f.status === 'critical').length;
  const lows      = feeds.filter(f => f.status === 'low').length;

  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">🌾 Feeding</h2>
      <p class="page-sub">Feed stocks, rations & distribution records</p>
    </div>
    <button class="btn-primary" id="btn-add-dist">➕ Record Distribution</button>
  </div>

  ${(criticals + lows) > 0 ? `
  <div class="alert-banner">
    <span class="alert-banner-icon">🌾</span>
    <div class="alert-banner-text">
      <strong>${criticals} critical + ${lows} low stock alert${lows>1?'s':''}</strong>
      <span>${feeds.filter(f=>f.status!=='ok').map(f=>`${f.name}: ${f.stock}${f.unit}`).join(' · ')}</span>
    </div>
    <span class="alert-banner-arrow">→</span>
  </div>` : ''}

  <div class="stats-row">
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
      <div class="stat-label">Total Feed Types</div>
      <div class="stat-value">${feeds.length}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">🌿</div>
      <div class="stat-label">Distributions Today</div>
      <div class="stat-value">${distributions.filter(d=>d.date===new Date().toISOString().split('T')[0]).length || 3}</div>
    </div>
  </div>

  <div class="middle-row" style="grid-template-columns:1fr 1fr">

    <!-- FEED STOCKS -->
    <div class="card">
      <div class="card-header">
        <span>📦 Feed Stocks</span>
        <button class="btn-ghost" style="padding:5px 10px;font-size:11px" id="btn-restock">+ Restock</button>
      </div>
      ${feeds.map(f => {
        const pct = Math.min(100, Math.round((f.stock / f.maxStock) * 100));
        const s = statusStyle[f.status];
        const barCls = s.pct();
        return `
        <div class="stock-item" style="margin-bottom:14px">
          <div class="stock-top">
            <div>
              <span class="stock-name">${f.name}</span>
              <span style="font-size:10px;color:#A0A8A5;margin-left:6px">${f.type}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="stock-qty ${f.status==='ok'?'green-text':f.status==='low'?'gold-text':'red-text'}">${f.stock} ${f.unit}</span>
              <span class="status ${s.cls}" style="font-size:9px">${s.label}</span>
            </div>
          </div>
          <div class="kstat-bar"><div class="kstat-fill ${barCls}" style="width:${pct}%;transition:width .6s"></div></div>
          <div class="stock-meta" style="display:flex;justify-content:space-between">
            <span>Threshold: ${f.threshold} ${f.unit} · ${pct}% full</span>
            ${f.expires ? `<span>Expires: ${f.expires}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- RATIONS TABLE -->
    <div class="card">
      <div class="card-header"><span>📋 Daily Ration Guidelines</span></div>
      <table class="livestock-table">
        <thead>
          <tr><th>TYPE</th><th>HAY (g)</th><th>PELLETS (g)</th><th>GREENS (g)</th><th>CORN (g)</th></tr>
        </thead>
        <tbody>
          ${rations.map(r => `
          <tr>
            <td style="font-weight:600">${r.type}</td>
            <td style="color:#D4B475">${r.hay}</td>
            <td style="color:#4ade80">${r.pellets}</td>
            <td style="color:#3a8a72">${r.greens}</td>
            <td style="color:#A0A8A5">${r.corn || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1e2e28">
        ${rations.map(r => `<div style="font-size:11px;color:#A0A8A5;margin-bottom:4px"><span style="color:#E0E6E4;font-weight:600">${r.type}:</span> ${r.notes}</div>`).join('')}
      </div>
    </div>
  </div>

  <!-- DISTRIBUTION HISTORY -->
  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">📋 Distribution History</span>
      <input id="dist-search" type="text" placeholder="Search…" style="width:180px;height:32px;font-size:12px">
    </div>
    <table class="livestock-table full" id="dist-table">
      <thead>
        <tr><th>ID</th><th>DATE</th><th>RABBIT / GROUP</th><th>CAGE</th><th>FEED</th><th>QTY</th><th>NOTES</th><th></th></tr>
      </thead>
      <tbody id="dist-tbody">
        ${distributions.map(d => `
        <tr>
          <td class="td-id">${d.id}</td>
          <td style="font-size:12px">${d.date}</td>
          <td style="font-size:12px;color:#4ade80">${d.rabbit}</td>
          <td><span class="cage-badge">${d.cage}</span></td>
          <td style="font-size:12px;font-weight:600">${d.feed}</td>
          <td style="color:#D4B475;font-weight:600">${d.qty} ${feeds.find(f=>f.name===d.feed)?.unit||''}</td>
          <td style="font-size:11px;color:#A0A8A5">${d.notes}</td>
          <td class="action-cell">
            <button class="action-btn danger del-dist" title="Delete">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- ADD DISTRIBUTION MODAL -->
  <div class="modal-overlay" id="modal-dist">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Record Distribution<small>Log a feed distribution</small></div>
        <button class="modal-close" id="close-dist">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Date <span class="req">*</span></label>
            <input id="df-date" type="date">
          </div>
          <div class="form-group">
            <label>Feed <span class="req">*</span></label>
            <select id="df-feed">
              ${feeds.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Rabbit / Group</label>
            <input id="df-rabbit" type="text" placeholder="Name or 'All herd'">
          </div>
          <div class="form-group">
            <label>Cage</label>
            <input id="df-cage" type="text" placeholder="A-01 or 'All'">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantity <span class="req">*</span></label>
            <input id="df-qty" type="number" step="0.01" placeholder="0.00">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <input id="df-notes" type="text" placeholder="Observations…">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-dist">Cancel</button>
        <button class="btn-primary" id="save-dist">💾 Save</button>
      </div>
    </div>
  </div>

  <!-- RESTOCK MODAL -->
  <div class="modal-overlay" id="modal-restock">
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <div class="modal-title">Restock Feed<small>Update stock quantity</small></div>
        <button class="modal-close" id="close-restock">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Feed <span class="req">*</span></label>
          <select id="rs-feed">${feeds.map(f=>`<option>${f.name}</option>`).join('')}</select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Add Quantity <span class="req">*</span></label>
            <input id="rs-qty" type="number" step="0.01" placeholder="0.00">
          </div>
          <div class="form-group">
            <label>Expiry Date</label>
            <input id="rs-expires" type="date">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-restock">Cancel</button>
        <button class="btn-primary" id="save-restock">📦 Restock</button>
      </div>
    </div>
  </div>
  `;
}

export function initFeeding() {
  // Set today's date in distribution modal
  document.getElementById('df-date').value = new Date().toISOString().split('T')[0];

  // Open/close distribution modal
  document.getElementById('btn-add-dist').addEventListener('click', () => {
    document.getElementById('modal-dist').classList.add('open');
  });
  ['close-dist','cancel-dist'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-dist').classList.remove('open');
    });
  });
  document.getElementById('modal-dist').addEventListener('click', e => {
    if (e.target.id === 'modal-dist') document.getElementById('modal-dist').classList.remove('open');
  });

  // Restock modal
  document.getElementById('btn-restock').addEventListener('click', () => {
    document.getElementById('modal-restock').classList.add('open');
  });
  ['close-restock','cancel-restock'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-restock').classList.remove('open');
    });
  });

  // Save distribution
  document.getElementById('save-dist').addEventListener('click', () => {
    const date = document.getElementById('df-date').value;
    const feed = document.getElementById('df-feed').value;
    const qty  = document.getElementById('df-qty').value;
    if (!date || !feed || !qty) { alert('Date, Feed and Quantity are required'); return; }

    const feedObj = feeds.find(f => f.name === feed);
    const unit = feedObj?.unit || '';
    const newId = 'DST-' + String(distributions.length + 1).padStart(3, '0');
    const rabbit = document.getElementById('df-rabbit').value || 'All herd';
    const cage   = document.getElementById('df-cage').value   || 'All';
    const notes  = document.getElementById('df-notes').value;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td class="td-id">${newId}</td>
      <td style="font-size:12px">${date}</td>
      <td style="font-size:12px;color:#4ade80">${rabbit}</td>
      <td><span class="cage-badge">${cage}</span></td>
      <td style="font-size:12px;font-weight:600">${feed}</td>
      <td style="color:#D4B475;font-weight:600">${qty} ${unit}</td>
      <td style="font-size:11px;color:#A0A8A5">${notes}</td>
      <td class="action-cell"><button class="action-btn danger del-dist" title="Delete">🗑</button></td>`;
    document.getElementById('dist-tbody').prepend(newRow);
    document.getElementById('modal-dist').classList.remove('open');
    import('../app.js').then(m => m.showToast('Distribution recorded 🌾'));
  });

  // Save restock
  document.getElementById('save-restock').addEventListener('click', () => {
    const qty = parseFloat(document.getElementById('rs-qty').value);
    if (!qty) { alert('Quantity is required'); return; }
    document.getElementById('modal-restock').classList.remove('open');
    import('../app.js').then(m => m.showToast('Stock updated 📦'));
  });

  // Delete distribution
  document.getElementById('dist-table').addEventListener('click', e => {
    const del = e.target.closest('.del-dist');
    if (del && confirm('Remove this distribution record?')) {
      del.closest('tr').remove();
      import('../app.js').then(m => m.showToast('Record removed'));
    }
  });

  // Search
  document.getElementById('dist-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#dist-tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
