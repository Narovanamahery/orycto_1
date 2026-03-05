// ═══════════════════════════════════════════════════════════════
//  LIVESTOCK PAGE — Orycto
// ═══════════════════════════════════════════════════════════════

const rabbits = [
  { id: 'LP-2023-001', name: 'Atlas',      sex: 'male',   breed: 'Flemish Giant',  dob: '2023-03-10', cage: 'A-01', weight: 4.80, status: 'active',   mere: '—',         pere: '—'         },
  { id: 'LP-2023-002', name: 'Luna',       sex: 'female', breed: 'Rex',            dob: '2023-04-05', cage: 'B-02', weight: 3.20, status: 'pregnant',  mere: '—',         pere: '—'         },
  { id: 'LP-2023-003', name: 'Noisette',   sex: 'female', breed: 'Californian',    dob: '2023-05-18', cage: 'B-01', weight: 2.95, status: 'pregnant',  mere: '—',         pere: 'LP-2023-001'},
  { id: 'LP-2023-004', name: 'Rex',        sex: 'male',   breed: 'Rex',            dob: '2023-06-22', cage: 'A-02', weight: 3.60, status: 'active',   mere: '—',         pere: '—'         },
  { id: 'LP-2023-005', name: 'Cleo',       sex: 'female', breed: 'Dutch',          dob: '2023-07-01', cage: 'C-01', weight: 2.80, status: 'nursing',   mere: '—',         pere: 'LP-2023-004'},
  { id: 'LP-2023-006', name: 'Brutus',     sex: 'male',   breed: 'Flemish Giant',  dob: '2023-08-14', cage: 'A-03', weight: 5.10, status: 'active',   mere: '—',         pere: '—'         },
  { id: 'LP-2023-007', name: 'Bella',      sex: 'female', breed: 'New Zealand',    dob: '2023-09-03', cage: 'B-03', weight: 3.40, status: 'active',   mere: '—',         pere: '—'         },
  { id: 'LP-2023-008', name: 'Toby',       sex: 'male',   breed: 'Californian',    dob: '2023-10-20', cage: 'A-04', weight: 3.85, status: 'active',   mere: '—',         pere: '—'         },
  { id: 'LP-2024-001', name: 'Biscotte',   sex: 'female', breed: 'Dutch',          dob: '2024-01-12', cage: 'C-02', weight: 2.50, status: 'active',   mere: 'LP-2023-005', pere: 'LP-2023-004'},
  { id: 'LP-2024-002', name: 'Petit Paul', sex: 'male',   breed: 'Californian',    dob: '2024-02-05', cage: '—',    weight: 2.90, status: 'sold',      mere: 'LP-2023-003', pere: 'LP-2023-001'},
  { id: 'LP-2024-003', name: 'Moka',       sex: 'female', breed: 'Rex',            dob: '2024-03-18', cage: 'C-03', weight: 2.10, status: 'active',   mere: 'LP-2023-002', pere: 'LP-2023-004'},
  { id: 'LP-2024-004', name: 'Caramel',    sex: 'male',   breed: 'Dutch',          dob: '2024-04-07', cage: 'A-05', weight: 2.30, status: 'active',   mere: 'LP-2023-005', pere: 'LP-2023-004'},
  { id: 'LP-2024-005', name: 'Vanille',    sex: 'female', breed: 'New Zealand',    dob: '2024-05-22', cage: 'B-04', weight: 2.70, status: 'active',   mere: '—',         pere: '—'         },
  { id: 'LP-2024-006', name: 'Oreo',       sex: 'male',   breed: 'Dutch',          dob: '2024-06-10', cage: 'A-06', weight: 1.95, status: 'active',   mere: 'LP-2024-001', pere: 'LP-2024-004'},
  { id: 'LP-2024-007', name: 'Perle',      sex: 'female', breed: 'Flemish Giant',  dob: '2024-07-01', cage: 'C-04', weight: 3.10, status: 'active',   mere: '—',         pere: 'LP-2023-006'},
  { id: 'LP-2024-008', name: 'Blanche',    sex: 'female', breed: 'Rex',            dob: '2024-08-15', cage: 'C-01', weight: 2.40, status: 'active',   mere: 'LP-2023-002', pere: 'LP-2023-004'},
  { id: 'LP-2024-009', name: 'Choco',      sex: 'male',   breed: 'Californian',    dob: '2024-09-05', cage: 'A-07', weight: 2.20, status: 'sick',      mere: 'LP-2023-003', pere: 'LP-2023-001'},
  { id: 'LP-2024-010', name: 'Fifi',       sex: 'female', breed: 'New Zealand',    dob: '2024-10-18', cage: 'B-05', weight: 1.85, status: 'active',   mere: 'LP-2023-007', pere: 'LP-2023-008'},
  { id: 'LP-2024-011', name: 'Maximus',    sex: 'male',   breed: 'Flemish Giant',  dob: '2024-11-02', cage: 'A-08', weight: 2.60, status: 'active',   mere: 'LP-2024-007', pere: 'LP-2023-006'},
  { id: 'LP-2024-012', name: 'Lily',       sex: 'female', breed: 'Dutch',          dob: '2024-12-14', cage: 'C-05', weight: 1.70, status: 'active',   mere: 'LP-2024-001', pere: 'LP-2024-004'},
  { id: 'LP-2024-013', name: 'Tigre',      sex: 'male',   breed: 'Rex',            dob: '2025-01-08', cage: 'A-09', weight: 1.50, status: 'active',   mere: 'LP-2024-003', pere: 'LP-2023-004'},
  { id: 'LP-2024-014', name: 'Rose',       sex: 'female', breed: 'Californian',    dob: '2025-02-20', cage: 'B-06', weight: 1.20, status: 'active',   mere: 'LP-2023-003', pere: 'LP-2023-008'},
  { id: 'LP-2024-015', name: 'Oscar',      sex: 'male',   breed: 'Flemish Giant',  dob: '2024-09-20', cage: 'A-04', weight: 3.10, status: 'active',   mere: '—',         pere: 'LP-2023-006'},
];

const statusMap = {
  active:   { label: 'Active',   cls: 'green' },
  pregnant: { label: 'Pregnant', cls: 'gold'  },
  nursing:  { label: 'Nursing',  cls: 'blue'  },
  sick:     { label: 'Sick',     cls: 'red'   },
  sold:     { label: 'Sold',     cls: 'gray'  },
  dead:     { label: 'Dead',     cls: 'gray'  },
};

function age(dob) {
  const d = new Date(dob), now = new Date();
  const m = (now - d) / (1000 * 60 * 60 * 24 * 30.44);
  if (m < 1) return `${Math.round(m * 30)}d`;
  if (m < 24) return `${Math.floor(m)}m`;
  return `${Math.floor(m / 12)}y ${Math.floor(m % 12)}m`;
}

function rowHTML(r) {
  const s = statusMap[r.status] || statusMap.active;
  const sexBadge = r.sex === 'male'
    ? `<span class="sex-badge male">♂ M</span>`
    : `<span class="sex-badge female">♀ F</span>`;
  const cage = r.cage === '—' ? '—' : `<span class="cage-badge">${r.cage}</span>`;
  return `
    <tr data-id="${r.id}" data-sex="${r.sex}" data-status="${r.status}" data-breed="${r.breed.toLowerCase()}">
      <td class="td-id">${r.id}</td>
      <td>${r.name}</td>
      <td>${sexBadge}</td>
      <td>${r.breed}</td>
      <td>${age(r.dob)}</td>
      <td>${cage}</td>
      <td>${r.weight.toFixed(2)} kg</td>
      <td><span class="status ${s.cls}">${s.label}</span></td>
      <td class="action-cell">
        <button class="action-btn view-rabbit" data-id="${r.id}" title="View">👁</button>
        <button class="action-btn edit-rabbit" data-id="${r.id}" title="Edit">✏️</button>
        <button class="action-btn danger del-rabbit" data-id="${r.id}" title="Delete">🗑</button>
      </td>
    </tr>`;
}

export function livestockHTML() {
  return `
  <div class="page-header">
    <div>
      <h2 class="page-title">🐇 Livestock</h2>
      <p class="page-sub">Manage your rabbit herd · ${rabbits.filter(r=>r.status!=='sold'&&r.status!=='dead').length} active animals</p>
    </div>
    <button class="btn-primary" id="btn-add-rabbit">➕ Add Rabbit</button>
  </div>

  <div class="stats-row">
    <div class="stat-card accent-green">
      <div class="stat-icon">🐇</div>
      <div class="stat-label">Total Active</div>
      <div class="stat-value">${rabbits.filter(r=>!['sold','dead'].includes(r.status)).length}</div>
    </div>
    <div class="stat-card" style="border-top-color:#4a8ab0">
      <div class="stat-icon">♂</div>
      <div class="stat-label">Males</div>
      <div class="stat-value">${rabbits.filter(r=>r.sex==='male'&&r.status!=='sold').length}</div>
    </div>
    <div class="stat-card" style="border-top-color:#e08aaa">
      <div class="stat-icon">♀</div>
      <div class="stat-label">Females</div>
      <div class="stat-value">${rabbits.filter(r=>r.sex==='female'&&r.status!=='sold').length}</div>
    </div>
    <div class="stat-card accent-gold">
      <div class="stat-icon">🤰</div>
      <div class="stat-label">Pregnant</div>
      <div class="stat-value">${rabbits.filter(r=>r.status==='pregnant').length}</div>
    </div>
    <div class="stat-card accent-red">
      <div class="stat-icon">🏥</div>
      <div class="stat-label">Sick</div>
      <div class="stat-value">${rabbits.filter(r=>r.status==='sick').length}</div>
    </div>
  </div>

  <div class="card" style="padding:14px">
    <div class="filter-bar">
      <div class="filter-pills">
        <button class="pill active" data-filter="all">All</button>
        <button class="pill" data-filter="male">♂ Males</button>
        <button class="pill" data-filter="female">♀ Females</button>
        <button class="pill" data-filter="pregnant">Pregnant</button>
        <button class="pill" data-filter="sick">Sick</button>
        <button class="pill" data-filter="sold">Sold</button>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <select id="breed-filter" style="width:160px;height:36px;font-size:12px">
          <option value="">All breeds</option>
          <option>Flemish Giant</option>
          <option>Rex</option>
          <option>Californian</option>
          <option>Dutch</option>
          <option>New Zealand</option>
        </select>
        <input id="search-rabbit" type="text" placeholder="Search…" style="width:180px;height:36px;font-size:12px">
      </div>
    </div>
  </div>

  <div class="bottom-row">
    <div class="bottom-row-header">
      <span class="card-head">All Rabbits</span>
      <span id="result-count" style="font-size:12px;color:#A0A8A5"></span>
    </div>
    <table class="livestock-table full" id="rabbit-table">
      <thead>
        <tr>
          <th>TAG / ID</th><th>NAME</th><th>SEX</th><th>BREED</th>
          <th>AGE</th><th>CAGE</th><th>WEIGHT</th><th>STATUS</th><th>ACTIONS</th>
        </tr>
      </thead>
      <tbody id="rabbit-tbody">
        ${rabbits.map(rowHTML).join('')}
      </tbody>
    </table>
  </div>

  <!-- VIEW MODAL -->
  <div class="modal-overlay" id="modal-view">
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <div class="modal-title" id="mv-title">Rabbit Details<small id="mv-sub"></small></div>
        <button class="modal-close" id="close-mv">✕</button>
      </div>
      <div class="modal-body" id="mv-body"></div>
    </div>
  </div>

  <!-- ADD/EDIT MODAL -->
  <div class="modal-overlay" id="modal-rabbit">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="modal-rabbit-title">Add Rabbit<small>Fill in rabbit details</small></div>
        <button class="modal-close" id="close-modal-rabbit">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Tag ID <span class="req">*</span></label>
            <input id="f-id" type="text" placeholder="LP-2025-XXX">
          </div>
          <div class="form-group">
            <label>Name</label>
            <input id="f-name" type="text" placeholder="Name">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Sex <span class="req">*</span></label>
            <select id="f-sex"><option value="male">♂ Male</option><option value="female">♀ Female</option></select>
          </div>
          <div class="form-group">
            <label>Breed <span class="req">*</span></label>
            <select id="f-breed">
              <option>Flemish Giant</option><option>Rex</option>
              <option>Californian</option><option>Dutch</option><option>New Zealand</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date of Birth <span class="req">*</span></label>
            <input id="f-dob" type="date">
          </div>
          <div class="form-group">
            <label>Weight (kg)</label>
            <input id="f-weight" type="number" step="0.01" placeholder="0.00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Cage</label>
            <input id="f-cage" type="text" placeholder="A-01">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="f-status">
              <option value="active">Active</option><option value="pregnant">Pregnant</option>
              <option value="nursing">Nursing</option><option value="sick">Sick</option><option value="sold">Sold</option>
            </select>
          </div>
        </div>
        <div class="form-section-label">Lineage (optional)</div>
        <div class="form-row">
          <div class="form-group">
            <label>Mother ID</label>
            <input id="f-mere" type="text" placeholder="LP-XXXX-XXX">
          </div>
          <div class="form-group">
            <label>Father ID</label>
            <input id="f-pere" type="text" placeholder="LP-XXXX-XXX">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" id="cancel-rabbit">Cancel</button>
        <button class="btn-primary" id="save-rabbit">💾 Save</button>
      </div>
    </div>
  </div>
  `;
}

export function initLivestock() {
  const tbody = document.getElementById('rabbit-tbody');
  const countEl = document.getElementById('result-count');
  let activeFilter = 'all';
  let breedFilter = '';
  let searchQ = '';

  function updateCount() {
    const visible = tbody.querySelectorAll('tr:not([style*="display: none"])').length;
    countEl.textContent = `${visible} rabbit${visible !== 1 ? 's' : ''}`;
  }

  function applyFilters() {
    tbody.querySelectorAll('tr').forEach(tr => {
      const sex = tr.dataset.sex;
      const status = tr.dataset.status;
      const breed = tr.dataset.breed || '';
      const text = tr.textContent.toLowerCase();

      const matchFilter =
        activeFilter === 'all' ? true :
        activeFilter === 'male' ? sex === 'male' :
        activeFilter === 'female' ? sex === 'female' :
        status === activeFilter;

      const matchBreed = !breedFilter || breed.includes(breedFilter.toLowerCase());
      const matchSearch = !searchQ || text.includes(searchQ.toLowerCase());

      tr.style.display = (matchFilter && matchBreed && matchSearch) ? '' : 'none';
    });
    updateCount();
  }

  updateCount();

  // Filter pills
  document.querySelectorAll('.pill[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  document.getElementById('breed-filter').addEventListener('change', e => {
    breedFilter = e.target.value; applyFilters();
  });
  document.getElementById('search-rabbit').addEventListener('input', e => {
    searchQ = e.target.value; applyFilters();
  });

  // View modal
  document.getElementById('rabbit-table').addEventListener('click', e => {
    const viewBtn = e.target.closest('.view-rabbit');
    const editBtn = e.target.closest('.edit-rabbit');
    const delBtn  = e.target.closest('.del-rabbit');

    if (viewBtn) {
      const r = rabbits.find(x => x.id === viewBtn.dataset.id);
      if (!r) return;
      const s = statusMap[r.status];
      document.getElementById('mv-title').childNodes[0].textContent = r.name + ' ';
      document.getElementById('mv-sub').textContent = r.id;
      document.getElementById('mv-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label>Sex</label><p style="color:#E0E6E4;margin-top:4px">${r.sex === 'male' ? '♂ Male' : '♀ Female'}</p></div>
          <div><label>Breed</label><p style="color:#E0E6E4;margin-top:4px">${r.breed}</p></div>
          <div><label>Date of Birth</label><p style="color:#E0E6E4;margin-top:4px">${r.dob}</p></div>
          <div><label>Age</label><p style="color:#E0E6E4;margin-top:4px">${age(r.dob)}</p></div>
          <div><label>Cage</label><p style="color:#E0E6E4;margin-top:4px">${r.cage}</p></div>
          <div><label>Weight</label><p style="color:#E0E6E4;margin-top:4px">${r.weight} kg</p></div>
          <div><label>Status</label><p style="margin-top:4px"><span class="status ${s.cls}">${s.label}</span></p></div>
          <div><label>Mother</label><p style="color:#D4B475;margin-top:4px;font-family:monospace">${r.mere}</p></div>
          <div><label>Father</label><p style="color:#D4B475;margin-top:4px;font-family:monospace">${r.pere}</p></div>
        </div>`;
      document.getElementById('modal-view').classList.add('open');
    }

    if (editBtn) {
      const r = rabbits.find(x => x.id === editBtn.dataset.id);
      if (!r) return;
      document.getElementById('modal-rabbit-title').innerHTML = 'Edit Rabbit<small>' + r.id + '</small>';
      document.getElementById('f-id').value = r.id;
      document.getElementById('f-name').value = r.name;
      document.getElementById('f-sex').value = r.sex;
      document.getElementById('f-breed').value = r.breed;
      document.getElementById('f-dob').value = r.dob;
      document.getElementById('f-weight').value = r.weight;
      document.getElementById('f-cage').value = r.cage === '—' ? '' : r.cage;
      document.getElementById('f-status').value = r.status;
      document.getElementById('f-mere').value = r.mere === '—' ? '' : r.mere;
      document.getElementById('f-pere').value = r.pere === '—' ? '' : r.pere;
      document.getElementById('modal-rabbit').classList.add('open');
    }

    if (delBtn) {
      if (confirm('Remove this rabbit from records?')) {
        const idx = rabbits.findIndex(x => x.id === delBtn.dataset.id);
        if (idx > -1) { rabbits.splice(idx, 1); }
        delBtn.closest('tr').remove();
        updateCount();
        import('../app.js').then(m => m.showToast('Rabbit removed'));
      }
    }
  });

  // Close modals
  document.getElementById('close-mv').addEventListener('click', () => {
    document.getElementById('modal-view').classList.remove('open');
  });
  document.getElementById('close-modal-rabbit').addEventListener('click', () => {
    document.getElementById('modal-rabbit').classList.remove('open');
  });
  document.getElementById('cancel-rabbit').addEventListener('click', () => {
    document.getElementById('modal-rabbit').classList.remove('open');
  });

  // Open add modal
  document.getElementById('btn-add-rabbit').addEventListener('click', () => {
    document.getElementById('modal-rabbit-title').innerHTML = 'Add Rabbit<small>Fill in rabbit details</small>';
    ['f-id','f-name','f-weight','f-cage','f-mere','f-pere'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-sex').value = 'male';
    document.getElementById('f-breed').value = 'Flemish Giant';
    document.getElementById('f-status').value = 'active';
    document.getElementById('f-dob').value = '';
    document.getElementById('modal-rabbit').classList.add('open');
  });

  // Save
  document.getElementById('save-rabbit').addEventListener('click', () => {
    const id = document.getElementById('f-id').value.trim();
    if (!id) { alert('Tag ID is required'); return; }

    const existing = rabbits.find(x => x.id === id);
    const data = {
      id,
      name:   document.getElementById('f-name').value.trim() || id,
      sex:    document.getElementById('f-sex').value,
      breed:  document.getElementById('f-breed').value,
      dob:    document.getElementById('f-dob').value,
      cage:   document.getElementById('f-cage').value.trim() || '—',
      weight: parseFloat(document.getElementById('f-weight').value) || 0,
      status: document.getElementById('f-status').value,
      mere:   document.getElementById('f-mere').value.trim() || '—',
      pere:   document.getElementById('f-pere').value.trim() || '—',
    };

    if (existing) {
      Object.assign(existing, data);
      import('../app.js').then(m => m.showToast('Rabbit updated'));
    } else {
      rabbits.push(data);
      import('../app.js').then(m => m.showToast('Rabbit added ✨'));
    }

    document.getElementById('modal-rabbit').classList.remove('open');
    tbody.innerHTML = rabbits.map(rowHTML).join('');
    applyFilters();
  });

  // Close on overlay click
  ['modal-view','modal-rabbit'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) document.getElementById(id).classList.remove('open');
    });
  });
}
