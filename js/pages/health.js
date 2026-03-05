// ═══════════════════════════════════════════════════════════════
//  HEALTH PAGE — Orycto
// ═══════════════════════════════════════════════════════════════

const treatments = [
  { id: 'TRT-001', rabbit: 'Atlas',    rabbitId: 'LP-2023-001', type: 'Vaccine',       name: 'VHD Vaccine',      date: '2024-12-10', end: '2024-12-10', status: 'done',    notes: 'Annual VHD' },
  { id: 'TRT-002', rabbit: 'Luna',     rabbitId: 'LP-2023-002', type: 'Antiparasitic', name: 'Ivermectin',       date: '2025-01-05', end: '2025-01-12', status: 'done',    notes: 'Mange prevention' },
  { id: 'TRT-003', rabbit: 'Noisette', rabbitId: 'LP-2023-003', type: 'Medication',    name: 'Enrofloxacin',     date: '2025-02-10', end: '2025-02-17', status: 'ongoing', notes: 'Respiratory infection' },
  { id: 'TRT-004', rabbit: 'Rex',      rabbitId: 'LP-2023-004', type: 'Vaccine',       name: 'VHD Vaccine',      date: '2025-02-20', end: '2025-02-20', status: 'overdue', notes: 'Annual due — OVERDUE' },
  { id: 'TRT-005', rabbit: 'Atlas',    rabbitId: 'LP-2023-001', type: 'Vaccine',       name: 'VHD Vaccine',      date: '2025-02-20', end: '2025-02-20', status: 'overdue', notes: 'Annual due — OVERDUE' },
  { id: 'TRT-006', rabbit: 'Oscar',    rabbitId: 'LP-2024-015', type: 'Vaccine',       name: 'VHD Vaccine',      date: '2025-02-20', end: '2025-02-20', status: 'overdue', notes: 'Annual due — OVERDUE' },
  { id: 'TRT-007', rabbit: 'Choco',    rabbitId: 'LP-2024-009', type: 'Medication',    name: 'Trimethoprim',     date: '2025-02-15', end: '2025-02-25', status: 'ongoing', notes: 'Coccidiosis' },
  { id: 'TRT-008', rabbit: 'Bella',    rabbitId: 'LP-2023-007', type: 'Antiparasitic', name: 'Fenbendazole',     date: '2025-01-20', end: '2025-01-25', status: 'done',    notes: 'E. cuniculi prevention' },
  { id: 'TRT-009', rabbit: 'Cleo',     rabbitId: 'LP-2023-005', type: 'Vitamin',       name: 'Vit. B Complex',   date: '2025-02-01', end: '2025-02-07', status: 'done',    notes: 'Post-birth recovery' },
  { id: 'TRT-010', rabbit: 'Moka',     rabbitId: 'LP-2024-003', type: 'Medication',    name: 'Metronidazole',    date: '2025-02-18', end: '2025-02-28', status: 'ongoing', notes: 'Digestive issues' },
];

const pathologies = [
  { id: 'PATH-001', rabbit: 'Choco',    rabbitId: 'LP-2024-009', disease: 'Coccidiosis',        diagnosed: '2025-02-15', status: 'ongoing', severity: 'moderate', notes: 'Under treatment' },
  { id: 'PATH-002', rabbit: 'Noisette', rabbitId: 'LP-2023-003', disease: 'Respiratory Inf.', diagnosed: '2025-02-10', status: 'ongoing', severity: 'mild',     notes: 'Antibiotics' },
  { id: 'PATH-003', rabbit: 'Moka',     rabbitId: 'LP-2024-003', disease: 'Enteritis',          diagnosed: '2025-02-18', status: 'ongoing', severity: 'mild',     notes: 'Digestive support' },
  { id: 'PATH-004', rabbit: 'Brutus',   rabbitId: 'LP-2023-006', disease: 'Dental Malocclusion',diagnosed: '2024-11-05', status: 'managed', severity: 'moderate', notes: 'Regular filing required' },
  { id: 'PATH-005', rabbit: 'Bella',    rabbitId: 'LP-2023-007', disease: 'E. cuniculi',        diagnosed: '2025-01-15', status: 'cured',   severity: 'mild',     notes: 'Resolved with treatment' },
];

const statusStyle = {
  done:    { cls: 'green', label: 'Done' },
  ongoing: { cls: 'gold',  label: 'Ongoing' },
  overdue: { cls: 'red',   label: 'Overdue' },
  planned: { cls: 'gray',  label: 'Planned' },
};
const pathStyle = {
  ongoing: { cls: 'red',   label: 'Ongoing' },
  managed: { cls: 'gold',  label: 'Managed' },
  cured:   { cls: 'green', label: 'Cured' },
};
const sevStyle = {
  mild:     { cls: 'green', label: 'Mild' },
  moderate: { cls: 'gold',  label: 'Moderate' },
  severe:   { cls: 'red',   label: 'Severe' },
};

export function healthHTML() {
  const overdue  = treatments.filter(t => t.status === 'overdue').length;
  const ongoing  = treatments.filter(t => t.status === 'ongoing').length;
  const sick     = pathologies.filter(p => p.status === 'ongoing').length;
  const managed  = pathologies.filter(p => p.status === 'managed').length;

  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">🏥 Health</h2>
      <p class="page-sub">Treatments, vaccines & pathologies</p>
    </div>
    <button class="btn-primary" id="btn-add-treatment">➕ Add Treatment</button>
  </div>

  ${overdue > 0 ? `
  <div class="alert-banner" style="background:linear-gradient(90deg,rgba(231,76,60,.15),rgba(231,76,60,.03));border-color:rgba(231,76,60,.4)">
    <span class="alert-banner-icon">🚨</span>
    <div class="alert-banner-text">
      <strong>${overdue} overdue vaccine${overdue > 1 ? 's' : ''}</strong>
      <span>${treatments.filter(t=>t.status==='overdue').map(t=>t.rabbit).join(', ')} · VHD Vaccine</span>
    </div>
    <span class="alert-banner-arrow">→</span>
  </div>` : ''}

  <div class="stats-row">
    <div class="stat-card accent-red">
      <div class="stat-icon">🚨</div>
      <div class="stat-label">Overdue Vaccines</div>
      <div class="stat-value">${overdue}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">💊</div>
      <div class="stat-label">Ongoing Treatments</div>
      <div class="stat-value">${ongoing}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">🦠</div>
      <div class="stat-label">Active Pathologies</div>
      <div class="stat-value">${sick}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Managed / Stable</div>
      <div class="stat-value">${managed}</div>
    </div>
  </div>

  <div class="middle-row" style="grid-template-columns:3fr 2fr">

    <!-- TREATMENTS TABLE -->
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:14px 16px;border-radius:0">
        <span>💊 Treatments & Vaccines</span>
        <div style="display:flex;gap:8px">
          <div class="filter-pills" id="trt-pills">
            <button class="pill active" data-tfilter="all">All</button>
            <button class="pill" data-tfilter="overdue">Overdue</button>
            <button class="pill" data-tfilter="ongoing">Ongoing</button>
            <button class="pill" data-tfilter="done">Done</button>
          </div>
        </div>
      </div>
      <table class="livestock-table" id="trt-table">
        <thead>
          <tr><th>ID</th><th>RABBIT</th><th>TYPE</th><th>TREATMENT</th><th>START</th><th>END</th><th>STATUS</th><th></th></tr>
        </thead>
        <tbody id="trt-tbody">
          ${treatments.map(t => {
            const s = statusStyle[t.status];
            return `<tr data-tstatus="${t.status}">
              <td class="td-id">${t.id}</td>
              <td><span style="color:#4ade80;font-size:12px">${t.rabbit}</span><br><span style="font-size:10px;color:#A0A8A5">${t.rabbitId}</span></td>
              <td><span class="cage-badge">${t.type}</span></td>
              <td style="font-size:12px">${t.name}</td>
              <td style="font-size:11px;color:#A0A8A5">${t.date}</td>
              <td style="font-size:11px;color:#A0A8A5">${t.end}</td>
              <td><span class="status ${s.cls}">${s.label}</span></td>
              <td class="action-cell">
                <button class="action-btn mark-done" data-id="${t.id}" title="Mark done">✓</button>
                <button class="action-btn danger del-trt" data-id="${t.id}" title="Delete">🗑</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- PATHOLOGIES -->
    <div class="card" style="padding:0;overflow:hidden">
      <div class="card-header" style="padding:14px 16px;border-radius:0">
        <span>🦠 Pathologies</span>
        <button class="btn-ghost" style="padding:5px 10px;font-size:11px" id="btn-add-path">+ Add</button>
      </div>
      <div style="padding:12px">
        ${pathologies.map(p => {
          const ps = pathStyle[p.status];
          const sv = sevStyle[p.severity];
          return `<div class="event-item" style="flex-direction:column;gap:6px;padding:10px 0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;font-weight:600;color:#E0E6E4">${p.disease}</span>
              <span class="status ${ps.cls}">${ps.label}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <span style="color:#4ade80;font-size:12px">🐇 ${p.rabbit}</span>
              <span style="font-size:10px;color:#A0A8A5">${p.rabbitId}</span>
              <span class="status ${sv.cls}" style="margin-left:auto;font-size:9px">${sv.label}</span>
            </div>
            <div style="font-size:11px;color:#A0A8A5">📅 ${p.diagnosed} · ${p.notes}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- ADD TREATMENT MODAL -->
  <div class="modal-overlay" id="modal-treatment">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Add Treatment<small>Record a new treatment or vaccine</small></div>
        <button class="modal-close" id="close-trt">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Rabbit ID <span class="req">*</span></label>
            <input id="tf-rabbit-id" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>Rabbit Name</label>
            <input id="tf-rabbit-name" type="text" placeholder="Name">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Treatment Type <span class="req">*</span></label>
            <select id="tf-type">
              <option>Vaccine</option><option>Medication</option>
              <option>Antiparasitic</option><option>Vitamin</option><option>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Treatment Name <span class="req">*</span></label>
            <input id="tf-name" type="text" placeholder="e.g. VHD Vaccine">
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
          <textarea id="tf-notes" placeholder="Dosage, observations…"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-trt">Cancel</button>
        <button class="btn-primary" id="save-trt">💾 Save</button>
      </div>
    </div>
  </div>
  `;
}

export function initHealth() {
  // Filter pills
  document.querySelectorAll('[data-tfilter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tfilter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.tfilter;
      document.querySelectorAll('#trt-tbody tr').forEach(tr => {
        tr.style.display = (f === 'all' || tr.dataset.tstatus === f) ? '' : 'none';
      });
    });
  });

  // Mark done
  document.getElementById('trt-table').addEventListener('click', e => {
    const btn = e.target.closest('.mark-done');
    if (btn) {
      const tr = btn.closest('tr');
      tr.dataset.tstatus = 'done';
      tr.querySelector('.status').className = 'status green';
      tr.querySelector('.status').textContent = 'Done';
      import('../app.js').then(m => m.showToast('Treatment marked as done ✅'));
    }
    const del = e.target.closest('.del-trt');
    if (del) {
      if (confirm('Remove this treatment?')) {
        del.closest('tr').remove();
        import('../app.js').then(m => m.showToast('Treatment removed'));
      }
    }
  });

  // Modal open/close
  document.getElementById('btn-add-treatment').addEventListener('click', () => {
    document.getElementById('modal-treatment').classList.add('open');
  });
  ['close-trt','cancel-trt'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-treatment').classList.remove('open');
    });
  });
  document.getElementById('modal-treatment').addEventListener('click', e => {
    if (e.target.id === 'modal-treatment') document.getElementById('modal-treatment').classList.remove('open');
  });

  document.getElementById('save-trt').addEventListener('click', () => {
    const name = document.getElementById('tf-name').value.trim();
    const rid  = document.getElementById('tf-rabbit-id').value.trim();
    if (!name || !rid) { alert('Rabbit ID and Treatment Name are required'); return; }

    const newId = 'TRT-' + String(treatments.length + 1).padStart(3, '0');
    const newRow = document.createElement('tr');
    newRow.dataset.tstatus = 'planned';
    newRow.innerHTML = `
      <td class="td-id">${newId}</td>
      <td><span style="color:#4ade80;font-size:12px">${document.getElementById('tf-rabbit-name').value || rid}</span><br><span style="font-size:10px;color:#A0A8A5">${rid}</span></td>
      <td><span class="cage-badge">${document.getElementById('tf-type').value}</span></td>
      <td style="font-size:12px">${name}</td>
      <td style="font-size:11px;color:#A0A8A5">${document.getElementById('tf-start').value || '—'}</td>
      <td style="font-size:11px;color:#A0A8A5">${document.getElementById('tf-end').value || '—'}</td>
      <td><span class="status gray">Planned</span></td>
      <td class="action-cell">
        <button class="action-btn mark-done" title="Mark done">✓</button>
        <button class="action-btn danger del-trt" title="Delete">🗑</button>
      </td>`;
    document.getElementById('trt-tbody').prepend(newRow);
    document.getElementById('modal-treatment').classList.remove('open');
    import('../app.js').then(m => m.showToast('Treatment added ✨'));
  });
}
