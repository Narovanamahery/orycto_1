export function createHeader() {
  const header = document.createElement('div');
  header.classList.add('header');
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
      <div class="user-box">
        <img src="./assets/img/icon/user.png" alt="User">
        <h2 class="user-name">Admin</h2>
      </div>
    </div>
  `;
  return header;
}
