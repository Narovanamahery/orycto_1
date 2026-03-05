// ═══════════════════════════════════════════════════════════════
//  REPRODUCTION PAGE — Orycto
// ═══════════════════════════════════════════════════════════════

const matings = [
  { id: 'ACC-001', male: 'Atlas',  maleId: 'LP-2023-001', female: 'Luna',     femaleId: 'LP-2023-002', date: '2024-12-01', expectedBirth: '2024-12-30', actualBirth: '2024-12-31', status: 'success', litter: 6 },
  { id: 'ACC-002', male: 'Rex',    maleId: 'LP-2023-004', female: 'Cleo',     femaleId: 'LP-2023-005', date: '2025-01-10', expectedBirth: '2025-02-09', actualBirth: '2025-02-10', status: 'success', litter: 5 },
  { id: 'ACC-003', male: 'Atlas',  maleId: 'LP-2023-001', female: 'Noisette', femaleId: 'LP-2023-003', date: '2025-01-20', expectedBirth: '2025-02-19', actualBirth: null,         status: 'pending', litter: null },
  { id: 'ACC-004', male: 'Brutus', maleId: 'LP-2023-006', female: 'Bella',    femaleId: 'LP-2023-007', date: '2025-01-25', expectedBirth: '2025-02-24', actualBirth: null,         status: 'pending', litter: null },
  { id: 'ACC-005', male: 'Toby',   maleId: 'LP-2023-008', female: 'Vanille',  femaleId: 'LP-2024-005', date: '2025-02-05', expectedBirth: '2025-03-06', actualBirth: null,         status: 'planned', litter: null },
  { id: 'ACC-006', male: 'Rex',    maleId: 'LP-2023-004', female: 'Moka',     femaleId: 'LP-2024-003', date: '2024-10-10', expectedBirth: '2024-11-09', actualBirth: null,         status: 'failed',  litter: null },
  { id: 'ACC-007', male: 'Atlas',  maleId: 'LP-2023-001', female: 'Cleo',     femaleId: 'LP-2023-005', date: '2025-02-15', expectedBirth: '2025-03-16', actualBirth: null,         status: 'planned', litter: null },
];

const litters = [
  { id: 'LIT-001', mating: 'ACC-001', date: '2024-12-31', born: 6, alive: 6, dead: 0, weaned: 6, mother: 'Luna',  father: 'Atlas', cage: 'C-01' },
  { id: 'LIT-002', mating: 'ACC-002', date: '2025-02-10', born: 5, alive: 5, dead: 0, weaned: 0, mother: 'Cleo',  father: 'Rex',   cage: 'C-01' },
  { id: 'LIT-003', mating: 'ACC-000', date: '2024-10-05', born: 7, alive: 6, dead: 1, weaned: 6, mother: 'Bella', father: 'Brutus',cage: 'C-02' },
];

const statusStyle = {
  success: { cls: 'green', label: '✅ Success' },
  pending: { cls: 'gold',  label: '⏳ Pending' },
  planned: { cls: 'gray',  label: '📅 Planned' },
  failed:  { cls: 'red',   label: '❌ Failed'  },
};

function daysUntil(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.round((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today!';
  return `in ${diff}d`;
}

export function reproductionHTML() {
  const success  = matings.filter(m => m.status === 'success').length;
  const pending  = matings.filter(m => m.status === 'pending').length;
  const planned  = matings.filter(m => m.status === 'planned').length;
  const failed   = matings.filter(m => m.status === 'failed').length;
  const totalBorn = litters.reduce((s, l) => s + l.born, 0);

  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">💞 Reproduction</h2>
      <p class="page-sub">Matings, pregnancies & litters</p>
    </div>
    <button class="btn-primary" id="btn-add-mating">💞 New Mating</button>
  </div>

  <div class="stats-row">
    <div class="stat-card accent-green">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Successful Matings</div>
      <div class="stat-value">${success}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">⏳</div>
      <div class="stat-label">Pregnant (Pending)</div>
      <div class="stat-value">${pending}</div>
    </div>
    <div class="stat-card" style="border-top-color:#4a8ab0">
      <div class="stat-icon">📅</div>
      <div class="stat-label">Planned</div>
      <div class="stat-value">${planned}</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">🐣</div>
      <div class="stat-label">Total Born (season)</div>
      <div class="stat-value">${totalBorn}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">❌</div>
      <div class="stat-label">Failed</div>
      <div class="stat-value">${failed}</div>
    </div>
  </div>

  <!-- Upcoming births alert -->
  ${matings.filter(m => m.status === 'pending').length > 0 ? `
  <div class="alert-banner">
    <span class="alert-banner-icon">🐣</span>
    <div class="alert-banner-text">
      <strong>${pending} birth${pending>1?'s':''} expected soon</strong>
      <span>${matings.filter(m=>m.status==='pending').map(m=>`${m.female} (${daysUntil(m.expectedBirth)})`).join(' · ')}</span>
    </div>
    <span class="alert-banner-arrow">→</span>
  </div>` : ''}

  <!-- MATINGS TABLE -->
  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">All Matings</span>
      <div class="filter-pills">
        <button class="pill active" data-mfilter="all">All</button>
        <button class="pill" data-mfilter="pending">Pending</button>
        <button class="pill" data-mfilter="planned">Planned</button>
        <button class="pill" data-mfilter="success">Success</button>
        <button class="pill" data-mfilter="failed">Failed</button>
      </div>
    </div>
    <table class="livestock-table full" id="mating-table">
      <thead>
        <tr><th>ID</th><th>♂ MALE</th><th>♀ FEMALE</th><th>MATING DATE</th><th>EXPECTED BIRTH</th><th>COUNTDOWN</th><th>LITTER</th><th>STATUS</th><th></th></tr>
      </thead>
      <tbody id="mating-tbody">
        ${matings.map(m => {
          const s = statusStyle[m.status];
          return `<tr data-mstatus="${m.status}">
            <td class="td-id">${m.id}</td>
            <td><span style="color:#4a8ab0;font-weight:600">${m.male}</span><br><span style="font-size:10px;color:#A0A8A5">${m.maleId}</span></td>
            <td><span style="color:#e08aaa;font-weight:600">${m.female}</span><br><span style="font-size:10px;color:#A0A8A5">${m.femaleId}</span></td>
            <td style="font-size:12px">${m.date}</td>
            <td style="font-size:12px">${m.expectedBirth || '—'}</td>
            <td style="font-size:12px;font-weight:600;color:${m.status==='pending'?'#D4B475':'#A0A8A5'}">${m.status==='pending'||m.status==='planned' ? daysUntil(m.expectedBirth) : '—'}</td>
            <td style="font-size:12px">${m.litter !== null ? `<span style="color:#4ade80;font-weight:600">${m.litter} kittens</span>` : '—'}</td>
            <td><span class="status ${s.cls}">${s.label}</span></td>
            <td class="action-cell">
              ${m.status === 'pending' ? `<button class="action-btn record-birth" data-id="${m.id}" title="Record birth">🐣</button>` : ''}
              <button class="action-btn danger del-mating" data-id="${m.id}" title="Delete">🗑</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- LITTERS -->
  <div class="bottom-row">
    <div class="bottom-row-header"><span class="card-head">🐣 Litter Records</span></div>
    <table class="livestock-table full">
      <thead>
        <tr><th>LITTER ID</th><th>MOTHER</th><th>FATHER</th><th>BIRTH DATE</th><th>BORN</th><th>ALIVE</th><th>DEAD</th><th>WEANED</th><th>CAGE</th></tr>
      </thead>
      <tbody>
        ${litters.map(l => `
        <tr>
          <td class="td-id">${l.id}</td>
          <td style="color:#e08aaa;font-weight:600">${l.mother}</td>
          <td style="color:#4a8ab0;font-weight:600">${l.father}</td>
          <td style="font-size:12px">${l.date}</td>
          <td><span style="color:#4ade80;font-weight:700">${l.born}</span></td>
          <td><span style="color:#4ade80">${l.alive}</span></td>
          <td><span style="color:${l.dead>0?'#E74C3C':'#A0A8A5'}">${l.dead}</span></td>
          <td><span style="color:${l.weaned===l.alive?'#4ade80':'#D4B475'}">${l.weaned}</span></td>
          <td><span class="cage-badge">${l.cage}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- ADD MATING MODAL -->
  <div class="modal-overlay" id="modal-mating">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">New Mating<small>Plan or record a mating</small></div>
        <button class="modal-close" id="close-mating">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-section-label">Male</div>
        <div class="form-row">
          <div class="form-group">
            <label>Male Tag ID <span class="req">*</span></label>
            <input id="mf-male-id" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>Male Name</label>
            <input id="mf-male-name" type="text" placeholder="Name">
          </div>
        </div>
        <div class="form-section-label">Female</div>
        <div class="form-row">
          <div class="form-group">
            <label>Female Tag ID <span class="req">*</span></label>
            <input id="mf-female-id" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>Female Name</label>
            <input id="mf-female-name" type="text" placeholder="Name">
          </div>
        </div>
        <div class="form-section-label">Dates</div>
        <div class="form-row">
          <div class="form-group">
            <label>Mating Date <span class="req">*</span></label>
            <input id="mf-date" type="date">
          </div>
          <div class="form-group">
            <label>Expected Birth</label>
            <input id="mf-expected" type="date">
            <span class="form-hint">~31 days after mating</span>
          </div>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="mf-status">
            <option value="planned">📅 Planned</option>
            <option value="pending">⏳ Pending (mated)</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-mating">Cancel</button>
        <button class="btn-primary" id="save-mating">💾 Save</button>
      </div>
    </div>
  </div>

  <!-- BIRTH MODAL -->
  <div class="modal-overlay" id="modal-birth">
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div class="modal-title">🐣 Record Birth<small id="birth-mating-ref"></small></div>
        <button class="modal-close" id="close-birth">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Birth Date</label>
            <input id="bf-date" type="date">
          </div>
          <div class="form-group">
            <label>Born Alive</label>
            <input id="bf-alive" type="number" min="0" placeholder="0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Born Dead</label>
            <input id="bf-dead" type="number" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label>Cage</label>
            <input id="bf-cage" type="text" placeholder="C-01">
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="bf-notes" placeholder="Observations…"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-birth">Cancel</button>
        <button class="btn-primary" id="save-birth">🐣 Record</button>
      </div>
    </div>
  </div>
  `;
}

export function initReproduction() {
  let currentMatingId = null;

  // Filter pills
  document.querySelectorAll('[data-mfilter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-mfilter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.mfilter;
      document.querySelectorAll('#mating-tbody tr').forEach(tr => {
        tr.style.display = (f === 'all' || tr.dataset.mstatus === f) ? '' : 'none';
      });
    });
  });

  // Auto-fill expected birth (+31 days)
  document.getElementById('mf-date').addEventListener('change', e => {
    const d = new Date(e.target.value);
    d.setDate(d.getDate() + 31);
    document.getElementById('mf-expected').value = d.toISOString().split('T')[0];
  });

  // Mating table actions
  document.getElementById('mating-table').addEventListener('click', e => {
    const birthBtn = e.target.closest('.record-birth');
    if (birthBtn) {
      currentMatingId = birthBtn.dataset.id;
      document.getElementById('birth-mating-ref').textContent = currentMatingId;
      document.getElementById('bf-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('modal-birth').classList.add('open');
    }
    const del = e.target.closest('.del-mating');
    if (del) {
      if (confirm('Remove this mating record?')) {
        del.closest('tr').remove();
        import('../app.js').then(m => m.showToast('Mating removed'));
      }
    }
  });

  // Open add mating modal
  document.getElementById('btn-add-mating').addEventListener('click', () => {
    document.getElementById('modal-mating').classList.add('open');
  });

  // Close modals
  ['close-mating','cancel-mating'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-mating').classList.remove('open');
    });
  });
  ['close-birth','cancel-birth'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      document.getElementById('modal-birth').classList.remove('open');
    });
  });
  ['modal-mating','modal-birth'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).classList.remove('open');
    });
  });

  // Save mating
  document.getElementById('save-mating').addEventListener('click', () => {
    const maleId = document.getElementById('mf-male-id').value.trim();
    const femaleId = document.getElementById('mf-female-id').value.trim();
    const date = document.getElementById('mf-date').value;
    if (!maleId || !femaleId || !date) { alert('Male ID, Female ID and Date are required'); return; }

    const newId = 'ACC-' + String(matings.length + 1).padStart(3, '0');
    const status = document.getElementById('mf-status').value;
    const s = { planned: {cls:'gray',label:'📅 Planned'}, pending:{cls:'gold',label:'⏳ Pending'} }[status];
    const expected = document.getElementById('mf-expected').value;

    const newRow = document.createElement('tr');
    newRow.dataset.mstatus = status;
    newRow.innerHTML = `
      <td class="td-id">${newId}</td>
      <td><span style="color:#4a8ab0;font-weight:600">${document.getElementById('mf-male-name').value||maleId}</span><br><span style="font-size:10px;color:#A0A8A5">${maleId}</span></td>
      <td><span style="color:#e08aaa;font-weight:600">${document.getElementById('mf-female-name').value||femaleId}</span><br><span style="font-size:10px;color:#A0A8A5">${femaleId}</span></td>
      <td style="font-size:12px">${date}</td>
      <td style="font-size:12px">${expected||'—'}</td>
      <td style="font-size:12px;color:#D4B475">${expected?daysUntil(expected):'—'}</td>
      <td>—</td>
      <td><span class="status ${s.cls}">${s.label}</span></td>
      <td class="action-cell">
        ${status==='pending'?`<button class="action-btn record-birth" data-id="${newId}" title="Record birth">🐣</button>`:''}
        <button class="action-btn danger del-mating" data-id="${newId}" title="Delete">🗑</button>
      </td>`;
    document.getElementById('mating-tbody').prepend(newRow);
    matings.push({ id: newId, maleId, femaleId, date, expectedBirth: expected, status });
    document.getElementById('modal-mating').classList.remove('open');
    import('../app.js').then(m => m.showToast('Mating recorded 💞'));
  });

  // Save birth
  document.getElementById('save-birth').addEventListener('click', () => {
    const alive = parseInt(document.getElementById('bf-alive').value) || 0;
    const dead  = parseInt(document.getElementById('bf-dead').value)  || 0;
    const born = alive + dead;

    // Update mating row
    const row = document.querySelector(`[data-id="${currentMatingId}"].record-birth`)?.closest('tr');
    if (row) {
      row.querySelector('.status').className = 'status green';
      row.querySelector('.status').textContent = '✅ Success';
      row.dataset.mstatus = 'success';
      const cells = row.querySelectorAll('td');
      cells[6].innerHTML = `<span style="color:#4ade80;font-weight:700">${born} kittens</span>`;
      cells[5].textContent = '—';
    }

    document.getElementById('modal-birth').classList.remove('open');
    import('../app.js').then(m => m.showToast(`Birth recorded: ${born} kittens 🐣`));
  });
}
