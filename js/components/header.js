export function createHeader(user = null, onLogout = null) {
  const header = document.createElement('div');
  header.classList.add('header');

  const displayName = user
    ? (user.firstName || user.email.split('@')[0])
    : 'Admin';

  header.innerHTML = `
    <div class="left-side">
      <img src="./assets/img/icon/menu.png" alt="Menu" class="menu-icon">
      <div class="search-box">
        <input type="text" placeholder="Search rabbit, cage, breed…" class="searchbox" id="global-search">
        <img src="./assets/img/icon/search.png" alt="Search" class="searchico">
      </div>
      <img src="./assets/img/orycto.png" alt="Orycto Logo" class="orycto-logo">
    </div>
    <div class="right-side">
      <div class="notif-box" id="notif-btn">
        <img src="./assets/img/icon/notif.png" alt="Notifications">
        <div class="notif" id="notif-count">0</div>
      </div>
      <div class="user-box" id="user-menu-btn" style="cursor:pointer;position:relative">
        <img src="./assets/img/icon/user.png" alt="User">
        <h2 class="user-name">${displayName}</h2>
        <span style="font-size:10px;color:#5a7265;margin-left:2px">▾</span>
        <div id="user-dropdown" style="
          display:none;position:absolute;top:calc(100% + 8px);right:0;
          background:#1C2A25;border:1px solid #2A6353;border-radius:10px;
          padding:6px;min-width:180px;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.4)
        ">
          <div style="padding:8px 12px 10px;border-bottom:1px solid #1e2e28">
            <div style="font-size:13px;font-weight:600;color:#E0E6E4">${displayName}</div>
            <div style="font-size:11px;color:#5a7265;margin-top:2px">${user?.email || ''}</div>
            ${user?.role ? '<div style="font-size:10px;color:#D4B475;margin-top:3px">' + user.role + '</div>' : ''}
          </div>
          <button id="btn-logout" style="
            width:100%;margin-top:6px;padding:8px 12px;background:rgba(231,76,60,.1);
            border:1px solid rgba(231,76,60,.25);border-radius:7px;color:#f08080;
            font-family:Poppins,sans-serif;font-size:12px;font-weight:500;cursor:pointer;
            display:flex;align-items:center;gap:8px;transition:background .2s
          ">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    </div>
  `;

  const menuBtn   = header.querySelector('#user-menu-btn');
  const dropdown  = header.querySelector('#user-dropdown');
  const logoutBtn = header.querySelector('#btn-logout');

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });

  if (logoutBtn && onLogout) {
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = 'none';
      onLogout();
    });
  }

  return header;
}
