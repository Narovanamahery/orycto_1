import { api } from '../api.js';
import { showToast, refreshBadges } from '../app.js';

let matings = [];
let litters = [];

const statusStyle = {
  succes:     { cls: 'green', label: '✅ Success' },
  en_attente: { cls: 'gold',  label: '⏳ Pending' },
  planifie:   { cls: 'gray',  label: '📅 Planned' },
  echec:      { cls: 'red',   label: '❌ Failed'  },
};

function daysUntil(dateStr) {
  if (!dateStr) return '-';
  const diff = Math.round((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today!';
  return `in ${diff}d`;
}

export function reproductionHTML() {
  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">💞 Reproduction</h2>
      <p class="page-sub">Matings, pregnancies &amp; litters</p>
    </div>
    <button class="btn-primary" id="btn-add-mating">💞 New Mating</button>
  </div>

  <div id="repro-alert-banner"></div>

  <div class="stats-row" id="repro-stats">
    ${[1,2,3,4,5].map(() => `
    <div class="stat-card">
      <div class="stat-icon">·</div>
      <div class="stat-label">Loading</div>
      <div class="stat-value">-</div>
    </div>`).join('')}
  </div>

  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">All Matings</span>
      <div class="filter-pills">
        <button class="pill active" data-mfilter="all">All</button>
        <button class="pill" data-mfilter="en_attente">Pending</button>
        <button class="pill" data-mfilter="planifie">Planned</button>
        <button class="pill" data-mfilter="succes">Success</button>
        <button class="pill" data-mfilter="echec">Failed</button>
      </div>
    </div>
    <table class="livestock-table full" id="mating-table">
      <thead>
        <tr><th>♂ MALE</th><th>♀ FEMALE</th><th>MATING DATE</th><th>EXPECTED BIRTH</th><th>COUNTDOWN</th><th>LITTER</th><th>STATUS</th><th></th></tr>
      </thead>
      <tbody id="mating-tbody">
        <tr><td colspan="8" style="text-align:center;color:#A0A8A5;padding:20px">Loading...</td></tr>
      </tbody>
    </table>
  </div>

  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">Litters</span>
      <button class="btn-ghost" style="font-size:12px" id="btn-add-litter">+ Record Litter</button>
    </div>
    <table class="livestock-table full" id="litter-table">
      <thead>
        <tr><th>MATING</th><th>BIRTH DATE</th><th>BORN</th><th>ALIVE</th><th>AVG WEIGHT</th><th></th></tr>
      </thead>
      <tbody id="litter-tbody">
        <tr><td colspan="6" style="text-align:center;color:#A0A8A5;padding:20px">Loading...</td></tr>
      </tbody>
    </table>
  </div>

  <div class="modal-overlay" id="modal-mating">
    <div class="modal" style="max-width:500px">
      <div class="modal-header">
        <div class="modal-title">New Mating<small>Record a mating event</small></div>
        <button class="modal-close" id="close-mating">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>♂ Male Tag <span class="req">*</span></label>
            <input id="mf-male" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>♀ Female Tag <span class="req">*</span></label>
            <input id="mf-female" type="text" placeholder="LP-XXXX-XXX">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Mating Date <span class="req">*</span></label>
            <input id="mf-date" type="date">
          </div>
          <div class="form-group">
            <label>Expected Birth</label>
            <input id="mf-expected" type="date">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select id="mf-status">
              <option value="planifie">Planned</option>
              <option value="en_attente">Pending</option>
              <option value="succes">Success</option>
              <option value="echec">Failed</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="mf-notes" rows="2" placeholder="Observations…"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-mating">Cancel</button>
        <button class="btn-primary" id="save-mating">💾 Save</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modal-litter">
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title">Record Litter<small>Enter birth details</small></div>
        <button class="modal-close" id="close-litter">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>♂ Male Tag (for mating link)</label>
          <input id="lf-male" type="text" placeholder="LP-XXXX-XXX (optional)">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Birth Date <span class="req">*</span></label>
            <input id="lf-date" type="date">
          </div>
          <div class="form-group">
            <label>Total Born <span class="req">*</span></label>
            <input id="lf-total" type="number" min="0" placeholder="0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Alive</label>
            <input id="lf-alive" type="number" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label>Avg. Weight (g)</label>
            <input id="lf-weight" type="number" step="0.1" min="0" placeholder="0">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-litter">Cancel</button>
        <button class="btn-primary" id="save-litter">💾 Save</button>
      </div>
    </div>
  </div>`;
}

export async function initReproduction() {
  [matings, litters] = await Promise.all([
    api.reproduction.getAll(),
    api.reproduction.portees(),
  ]);
  renderMatings();
  renderLitters();
  renderStats();
  initFilters();
  initModals();
}

function renderMatings(filter = 'all') {
  const rows = filter === 'all' ? matings : matings.filter(m => m.statut === filter);
  document.getElementById('mating-tbody').innerHTML = rows.length
    ? rows.map(m => {
        const s = statusStyle[m.statut] || statusStyle.planifie;
        const littersForMating = litters.filter(l => l.accouplement_id === m.id).length;
        return `<tr data-id="${m.id}">
          <td style="color:#5b9bd5;font-weight:600">${m.tag_male || '—'}</td>
          <td style="color:#e08aaa;font-weight:600">${m.tag_female || '—'}</td>
          <td style="font-size:12px">${m.date_accouplement?.slice(0,10) || '-'}</td>
          <td style="font-size:12px">${m.date_naissance_prevue?.slice(0,10) || '-'}</td>
          <td style="font-size:12px;font-weight:600;color:${m.date_naissance_prevue && new Date(m.date_naissance_prevue) < new Date() && m.statut === 'en_attente' ? '#e05252' : '#4ade80'}">${daysUntil(m.date_naissance_prevue)}</td>
          <td>${littersForMating > 0 ? `<span class="status green">${littersForMating} litter${littersForMating > 1 ? 's' : ''}</span>` : '—'}</td>
          <td><span class="status ${s.cls}" style="font-size:11px">${s.label}</span></td>
          <td class="action-cell">
            <button class="action-btn danger del-mating" data-id="${m.id}" title="Delete">🗑</button>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="8" style="text-align:center;color:#A0A8A5;padding:30px">No matings recorded</td></tr>`;
}

function renderLitters() {
  document.getElementById('litter-tbody').innerHTML = litters.length
    ? litters.map(l => `
      <tr data-id="${l.id}">
        <td style="font-size:11px;color:#A0A8A5">${l.tag_male ? `♂ ${l.tag_male}` : '—'}</td>
        <td style="font-size:12px">${l.date_naissance?.slice(0,10) || '-'}</td>
        <td style="font-weight:600;color:#E0E6E4">${l.nombre_nes || '-'}</td>
        <td style="color:#4ade80;font-weight:600">${l.nombre_vivants || '-'}</td>
        <td style="font-size:12px">${l.poids_moyen_naissance ? l.poids_moyen_naissance + ' g' : '-'}</td>
        <td class="action-cell">
          <button class="action-btn danger del-litter" data-id="${l.id}" title="Delete">🗑</button>
        </td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;color:#A0A8A5;padding:30px">No litters recorded</td></tr>`;
}

function renderStats() {
  const today    = new Date();
  const pending  = matings.filter(m => m.statut === 'en_attente').length;
  const planned  = matings.filter(m => m.statut === 'planifie').length;
  const success  = matings.filter(m => m.statut === 'succes').length;
  const overdue  = matings.filter(m => m.statut === 'en_attente' && m.date_naissance_prevue && new Date(m.date_naissance_prevue) < today).length;
  const totalNes = litters.reduce((s, l) => s + parseInt(l.nombre_nes || 0), 0);

  document.getElementById('repro-stats').innerHTML = `
    <div class="stat-card accent-gold">
      <div class="stat-icon">⏳</div>
      <div class="stat-label">Pending</div>
      <div class="stat-value">${pending}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">📅</div>
      <div class="stat-label">Planned</div>
      <div class="stat-value">${planned}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Successful</div>
      <div class="stat-value">${success}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">🚨</div>
      <div class="stat-label">Overdue</div>
      <div class="stat-value">${overdue}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">🐣</div>
      <div class="stat-label">Total Born</div>
      <div class="stat-value">${totalNes}</div>
    </div>`;

  if (overdue > 0) {
    document.getElementById('repro-alert-banner').innerHTML = `
      <div class="alert-banner">
        <span class="alert-banner-icon">🚨</span>
        <div class="alert-banner-text">
          <strong>${overdue} birth${overdue > 1 ? 's' : ''} overdue</strong>
          <span>Expected births have passed their due date</span>
        </div>
        <span class="alert-banner-arrow">→</span>
      </div>`;
  }
}

function initFilters() {
  document.querySelectorAll('.pill[data-mfilter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-mfilter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMatings(btn.dataset.mfilter);
    });
  });
}

function initModals() {
  document.getElementById('mating-table').addEventListener('click', async e => {
    const delBtn = e.target.closest('.del-mating');
    if (!delBtn) return;
    if (!confirm('Remove this mating record?')) return;
    try {
      await api.reproduction.delete(delBtn.dataset.id);
      matings = matings.filter(x => String(x.id) !== delBtn.dataset.id);
      renderMatings();
      renderStats();
      refreshBadges();
      showToast('Mating record removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('litter-table').addEventListener('click', async e => {
    const delBtn = e.target.closest('.del-litter');
    if (!delBtn) return;
    if (!confirm('Remove this litter record?')) return;
    try {
      await api.reproduction.deletePortee(delBtn.dataset.id);
      litters = litters.filter(x => String(x.id) !== delBtn.dataset.id);
      renderLitters();
      renderStats();
      showToast('Litter record removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-add-mating').addEventListener('click', () => {
    document.getElementById('mf-date').value = new Date().toISOString().slice(0,10);
    document.getElementById('modal-mating').classList.add('open');
  });

  document.getElementById('btn-add-litter').addEventListener('click', () => {
    document.getElementById('lf-date').value = new Date().toISOString().slice(0,10);
    document.getElementById('modal-litter').classList.add('open');
  });

  ['close-mating','cancel-mating'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-mating').classList.remove('open');
    });
  });

  ['close-litter','cancel-litter'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-litter').classList.remove('open');
    });
  });

  ['modal-mating','modal-litter'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).classList.remove('open');
    });
  });

  document.getElementById('save-mating').addEventListener('click', async () => {
    const male   = document.getElementById('mf-male').value.trim();
    const female = document.getElementById('mf-female').value.trim();
    const date   = document.getElementById('mf-date').value;
    if (!male || !female || !date) { alert('Male tag, female tag and mating date are required'); return; }

    try {
      const saved = await api.reproduction.create({
        tag_male:              male,
        tag_female:            female,
        date_accouplement:     date,
        date_naissance_prevue: document.getElementById('mf-expected').value || null,
        statut:                document.getElementById('mf-status').value,
        notes:                 document.getElementById('mf-notes').value.trim() || null,
      });
      matings.unshift(saved);
      renderMatings();
      renderStats();
      refreshBadges();
      document.getElementById('modal-mating').classList.remove('open');
      ['mf-male','mf-female','mf-date','mf-expected','mf-notes'].forEach(id => {
        document.getElementById(id).value = '';
      });
      showToast('Mating recorded 💞');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('save-litter').addEventListener('click', async () => {
    const date  = document.getElementById('lf-date').value;
    const total = document.getElementById('lf-total').value;
    if (!date || !total) { alert('Birth date and total born are required'); return; }

    try {
      const matingId = matings.find(m => m.tag_male === document.getElementById('lf-male').value.trim())?.id || null;
      const saved = await api.reproduction.createPortee({
        accouplement_id:       matingId,
        tag_male:              document.getElementById('lf-male').value.trim() || null,
        date_naissance:        date,
        nombre_nes:            parseInt(total),
        nombre_vivants:        parseInt(document.getElementById('lf-alive').value) || parseInt(total),
        poids_moyen_naissance: parseFloat(document.getElementById('lf-weight').value) || null,
      });
      litters.unshift(saved);
      if (matingId) {
        const idx = matings.findIndex(m => m.id === matingId);
        if (idx > -1) matings[idx].statut = 'succes';
      }
      renderLitters();
      renderMatings();
      renderStats();
      document.getElementById('modal-litter').classList.remove('open');
      ['lf-male','lf-date','lf-total','lf-alive','lf-weight'].forEach(id => {
        document.getElementById(id).value = '';
      });
      showToast('Litter recorded 🐣');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
