export function createSidebar() {
  const nav = document.createElement('nav');
  nav.classList.add('menu-side');
  nav.innerHTML = `
    <a href="#dashboard" class="menu-item active">
      <img src="./assets/img/icon/dashboard.png" alt="">
      <h3>Home</h3>
    </a>
    <a href="#livestock" class="menu-item">
      <img src="./assets/img/icon/cheptel.png" alt="">
      <h3>Livestock</h3>
      <span class="menu-badge" id="badge-livestock">0</span>
    </a>
    <a href="#health" class="menu-item">
      <img src="./assets/img/icon/health.png" alt="">
      <h3>Health</h3>
      <span class="menu-badge alert" id="badge-health" style="display:none">0</span>
    </a>
    <a href="#reproduction" class="menu-item">
      <img src="./assets/img/icon/repro.png" alt="">
      <h3>Reproduction</h3>
      <span class="menu-badge" id="badge-repro">0</span>
    </a>
    <a href="#feeding" class="menu-item">
      <img src="./assets/img/icon/aliment.png" alt="">
      <h3>Feeding</h3>
      <span class="menu-badge alert" id="badge-feeding" style="display:none">0</span>
    </a>
    <a href="#statistics" class="menu-item">
      <img src="./assets/img/icon/stat.png" alt="">
      <h3>Statistics</h3>
    </a>
  `;
  return nav;
}

export async function updateBadges() {
  try {
    const { db } = await import('../db.js');
    const [lapins, sante, accos, stocks, aliments] = await Promise.all([
      db.getAll('lapins'),
      db.getAll('sante'),
      db.getAll('accouplements'),
      db.getAll('stocks'),
      db.getAll('aliments'),
    ]);

    const actifs   = lapins.filter(l => !['vendu','mort'].includes(l.statut)).length;
    const retards  = sante.filter(s => s.statut === 'en_retard').length;
    const accoPend = accos.filter(a => ['en_attente','planifie'].includes(a.statut)).length;
    const stocksLow = stocks.filter(s => parseFloat(s.quantite) <= parseFloat(s.seuil_alerte || 0)).length;

    const badgeLivestock = document.getElementById('badge-livestock');
    const badgeHealth    = document.getElementById('badge-health');
    const badgeRepro     = document.getElementById('badge-repro');
    const badgeFeeding   = document.getElementById('badge-feeding');
    const notifCount     = document.getElementById('notif-count');

    if (badgeLivestock) badgeLivestock.textContent = actifs;
    if (badgeHealth) {
      badgeHealth.textContent = retards;
      badgeHealth.style.display = retards > 0 ? '' : 'none';
    }
    if (badgeRepro) badgeRepro.textContent = accoPend;
    if (badgeFeeding) {
      badgeFeeding.textContent = stocksLow;
      badgeFeeding.style.display = stocksLow > 0 ? '' : 'none';
    }
    if (notifCount) notifCount.textContent = retards + stocksLow;
  } catch {}
}
