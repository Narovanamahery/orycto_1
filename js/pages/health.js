import { api } from '../api.js';
import { showToast, refreshBadges } from '../app.js';

let treatments  = [];
let pathologies = [];

const statusStyle = {
  termine:   { cls: 'green', label: 'Done'    },
  en_cours:  { cls: 'gold',  label: 'Ongoing' },
  en_retard: { cls: 'red',   label: 'Overdue' },
  planifie:  { cls: 'gray',  label: 'Planned' },
};

const pathStyle = {
  en_cours: { cls: 'red',   label: 'Ongoing' },
  stable:   { cls: 'gold',  label: 'Managed' },
  gueri:    { cls: 'green', label: 'Cured'   },
};

const sevStyle = {
  leger:   { cls: 'green', label: 'Mild'     },
  modere:  { cls: 'gold',  label: 'Moderate' },
  severe:  { cls: 'red',   label: 'Severe'   },
};

export function healthHTML() {
  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">🏥 Health</h2>
      <p class="page-sub">Treatments, vaccines &amp; pathologies</p>
    </div>
    <button class="btn-primary" id="btn-add-treatment">➕ Add Treatment</button>
  </div>

  <div id="health-alert-banner"></div>

  <div class="stats-row" id="health-stats">
    ${[1,2,3,4].map(() => `
    <div class="stat-card">
      <div class="stat-icon">·</div>
      <div class="stat-label">Loading</div>
      <div class="stat-value">-</div>
    </div>`).join('')}
  </div>

  <div class="middle-row" style="grid-template-columns:3fr 2fr">
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:14px 16px;border-radius:0">
        <span>💊 Treatments &amp; Vaccines</span>
        <div class="filter-pills" id="trt-pills">
          <button class="pill active" data-tfilter="all">All</button>
          <button class="pill" data-tfilter="en_retard">Overdue</button>
          <button class="pill" data-tfilter="en_cours">Ongoing</button>
          <button class="pill" data-tfilter="termine">Done</button>
        </div>
      </div>
      <table class="livestock-table" id="trt-table">
        <thead>
          <tr><th>RABBIT</th><th>TYPE</th><th>TREATMENT</th><th>START</th><th>END</th><th>STATUS</th><th></th></tr>
        </thead>
        <tbody id="trt-tbody">
          <tr><td colspan="7" style="text-align:center;color:#A0A8A5;padding:20px">Loading...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:14px 16px;border-radius:0;justify-content:space-between">
        <span>🦠 Pathologies</span>
        <button class="btn-ghost" style="font-size:11px;padding:4px 10px" id="btn-add-pathologie">+ Add</button>
      </div>
      <div style="padding:12px" id="path-list">
        <p style="color:#A0A8A5;font-size:12px">Loading...</p>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modal-treatment">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Add Treatment<small>Record a new treatment or vaccine</small></div>
        <button class="modal-close" id="close-trt">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Rabbit Tag ID <span class="req">*</span></label>
            <input id="tf-rabbit-tag" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>Rabbit Name</label>
            <input id="tf-rabbit-name" type="text" placeholder="Name (optional)">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Treatment Type <span class="req">*</span></label>
            <select id="tf-type">
              <option value="vaccin">Vaccine</option>
              <option value="medicament">Medication</option>
              <option value="antiparasitaire">Antiparasitic</option>
              <option value="vitamine">Vitamin</option>
              <option value="autre">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Treatment Name <span class="req">*</span></label>
            <input id="tf-name" type="text" placeholder="e.g. Myxomatosis vaccine">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date</label>
            <input id="tf-start" type="date">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input id="tf-end" type="date">
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="tf-notes" rows="2" placeholder="Dosage, observations…"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-trt">Cancel</button>
        <button class="btn-primary" id="save-trt">💾 Save</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="modal-pathologie">
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title">Add Pathology<small>Record a disease or health issue</small></div>
        <button class="modal-close" id="close-path">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Rabbit Tag ID <span class="req">*</span></label>
            <input id="pf-tag" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>Severity <span class="req">*</span></label>
            <select id="pf-severity">
              <option value="leger">Mild</option>
              <option value="modere">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Description <span class="req">*</span></label>
          <textarea id="pf-desc" rows="3" placeholder="Symptoms, diagnosis…"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select id="pf-status">
              <option value="en_cours">Ongoing</option>
              <option value="stable">Managed</option>
              <option value="gueri">Cured</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-path">Cancel</button>
        <button class="btn-primary" id="save-path">💾 Save</button>
      </div>
    </div>
  </div>`;
}

export async function initHealth() {
  [treatments, pathologies] = await Promise.all([
    api.sante.getAll(),
    api.sante.pathologies(),
  ]);
  renderTreatments();
  renderPathologies();
  renderStats();
  initFilters();
  initModals();
}

function renderTreatments(filter = 'all') {
  const rows = filter === 'all' ? treatments : treatments.filter(t => t.statut === filter);
  document.getElementById('trt-tbody').innerHTML = rows.length
    ? rows.map(t => {
        const s = statusStyle[t.statut] || statusStyle.planifie;
        const today = new Date();
        const end   = t.date_fin ? new Date(t.date_fin) : null;
        let statut  = t.statut;
        if (end && end < today && statut !== 'termine') statut = 'en_retard';
        const ss = statusStyle[statut] || s;
        return `<tr data-id="${t.id}">
          <td class="td-id" style="color:#4ade80">${t.tag_lapin || t.nom_lapin || '—'}</td>
          <td style="font-size:11px">${t.type_soin || '—'}</td>
          <td>${t.nom_traitement || '—'}</td>
          <td style="font-size:12px">${t.date_debut?.slice(0,10) || '-'}</td>
          <td style="font-size:12px">${t.date_fin?.slice(0,10) || '-'}</td>
          <td><span class="status ${ss.cls}">${ss.label}</span></td>
          <td class="action-cell">
            <button class="action-btn danger del-trt" data-id="${t.id}" title="Delete">🗑</button>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="7" style="text-align:center;color:#A0A8A5;padding:30px">No treatments recorded</td></tr>`;
}

function renderPathologies() {
  document.getElementById('path-list').innerHTML = pathologies.length
    ? pathologies.map(p => {
        const ps = pathStyle[p.statut]   || pathStyle.en_cours;
        const ss = sevStyle[p.severite]  || sevStyle.modere;
        return `
        <div class="event-item" data-id="${p.id}">
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-weight:600;color:#E0E6E4;font-size:13px">${p.tag_lapin || p.nom_lapin || '—'}</span>
              <span class="status ${ps.cls}" style="font-size:10px">${ps.label}</span>
            </div>
            <div style="font-size:12px;color:#A0A8A5;margin-bottom:4px">${p.description || '—'}</div>
            <div style="display:flex;gap:8px">
              <span class="status ${ss.cls}" style="font-size:10px">${ss.label}</span>
              <span style="font-size:10px;color:#5a7265">${p.createdAt?.slice(0,10) || ''}</span>
            </div>
          </div>
          <button class="action-btn danger del-path" data-id="${p.id}" title="Delete" style="margin-left:8px">🗑</button>
        </div>`;
      }).join('')
    : `<p style="color:#A0A8A5;font-size:12px">No pathologies recorded</p>`;
}

function renderStats() {
  const today    = new Date();
  const overdue  = treatments.filter(t => t.date_fin && new Date(t.date_fin) < today && t.statut !== 'termine').length;
  const ongoing  = treatments.filter(t => t.statut === 'en_cours').length;
  const done     = treatments.filter(t => t.statut === 'termine').length;
  const activePath = pathologies.filter(p => p.statut !== 'gueri').length;

  document.getElementById('health-stats').innerHTML = `
    <div class="stat-card accent-red">
      <div class="stat-icon">⏰</div>
      <div class="stat-label">Overdue</div>
      <div class="stat-value">${overdue}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">💊</div>
      <div class="stat-label">Ongoing</div>
      <div class="stat-value">${ongoing}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Completed</div>
      <div class="stat-value">${done}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">🦠</div>
      <div class="stat-label">Active Pathologies</div>
      <div class="stat-value">${activePath}</div>
    </div>`;

  if (overdue > 0) {
    document.getElementById('health-alert-banner').innerHTML = `
      <div class="alert-banner">
        <span class="alert-banner-icon">🚨</span>
        <div class="alert-banner-text">
          <strong>${overdue} treatment${overdue > 1 ? 's' : ''} overdue</strong>
          <span>Some treatments have passed their end date without being marked as done</span>
        </div>
        <span class="alert-banner-arrow">→</span>
      </div>`;
  }
}

function initFilters() {
  document.querySelectorAll('.pill[data-tfilter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-tfilter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTreatments(btn.dataset.tfilter);
    });
  });
}

function initModals() {
  document.getElementById('trt-table').addEventListener('click', async e => {
    const delBtn = e.target.closest('.del-trt');
    if (!delBtn) return;
    if (!confirm('Remove this treatment record?')) return;
    try {
      await api.sante.delete(delBtn.dataset.id);
      treatments = treatments.filter(x => String(x.id) !== delBtn.dataset.id);
      renderTreatments();
      renderStats();
      refreshBadges();
      showToast('Treatment removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('path-list').addEventListener('click', async e => {
    const delBtn = e.target.closest('.del-path');
    if (!delBtn) return;
    if (!confirm('Remove this pathology record?')) return;
    try {
      await api.sante.deletePathologie(delBtn.dataset.id);
      pathologies = pathologies.filter(x => String(x.id) !== delBtn.dataset.id);
      renderPathologies();
      renderStats();
      showToast('Pathology removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-add-treatment').addEventListener('click', () => {
    document.getElementById('modal-treatment').classList.add('open');
  });

  document.getElementById('btn-add-pathologie').addEventListener('click', () => {
    document.getElementById('modal-pathologie').classList.add('open');
  });

  ['close-trt','cancel-trt'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-treatment').classList.remove('open');
    });
  });

  ['close-path','cancel-path'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-pathologie').classList.remove('open');
    });
  });

  ['modal-treatment','modal-pathologie'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).classList.remove('open');
    });
  });

  document.getElementById('save-trt').addEventListener('click', async () => {
    const tag  = document.getElementById('tf-rabbit-tag').value.trim();
    const name = document.getElementById('tf-name').value.trim();
    if (!tag || !name) { alert('Rabbit Tag ID and Treatment Name are required'); return; }

    try {
      const saved = await api.sante.create({
        tag_lapin:      tag,
        nom_lapin:      document.getElementById('tf-rabbit-name').value.trim() || tag,
        type_soin:      document.getElementById('tf-type').value,
        nom_traitement: name,
        date_debut:     document.getElementById('tf-start').value || null,
        date_fin:       document.getElementById('tf-end').value   || null,
        statut:         'planifie',
        notes:          document.getElementById('tf-notes').value.trim() || null,
      });
      treatments.unshift(saved);
      renderTreatments();
      renderStats();
      refreshBadges();
      document.getElementById('modal-treatment').classList.remove('open');
      ['tf-rabbit-tag','tf-rabbit-name','tf-name','tf-start','tf-end','tf-notes'].forEach(id => {
        document.getElementById(id).value = '';
      });
      showToast('Treatment added ✨');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('save-path').addEventListener('click', async () => {
    const tag  = document.getElementById('pf-tag').value.trim();
    const desc = document.getElementById('pf-desc').value.trim();
    if (!tag || !desc) { alert('Rabbit Tag ID and Description are required'); return; }

    try {
      const saved = await api.sante.createPathologie({
        tag_lapin:   tag,
        description: desc,
        severite:    document.getElementById('pf-severity').value,
        statut:      document.getElementById('pf-status').value,
      });
      pathologies.unshift(saved);
      renderPathologies();
      renderStats();
      document.getElementById('modal-pathologie').classList.remove('open');
      ['pf-tag','pf-desc'].forEach(id => { document.getElementById(id).value = ''; });
      showToast('Pathology recorded');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
