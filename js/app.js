import { createHeader }              from './components/header.js';
import { createSidebar, updateBadges } from './components/sidebar.js';
import { dashboardHTML,    initDashboard }    from './pages/dashboard.js';
import { livestockHTML,    initLivestock }    from './pages/livestock.js';
import { healthHTML,       initHealth }       from './pages/health.js';
import { reproductionHTML, initReproduction } from './pages/reproduction.js';
import { feedingHTML,      initFeeding }      from './pages/feeding.js';
import { statisticsHTML,   initStatistics }   from './pages/statistics.js';
import { getSession, clearSession, showAuthPage } from './auth.js';

let toastContainer;
let contentArea;

export function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${msg}</span>`;
  toastContainer.appendChild(t);
  setTimeout(() => t.classList.add('hide'), 2700);
  setTimeout(() => t.remove(), 3000);
}

export function refreshBadges() {
  updateBadges();
}

const routes = {
  dashboard:    { html: dashboardHTML,    init: initDashboard },
  livestock:    { html: livestockHTML,    init: initLivestock },
  health:       { html: healthHTML,       init: initHealth },
  reproduction: { html: reproductionHTML, init: initReproduction },
  feeding:      { html: feedingHTML,      init: initFeeding },
  statistics:   { html: statisticsHTML,   init: initStatistics },
};

async function navigate(hash) {
  const page  = hash.replace('#', '') || 'dashboard';
  const route = routes[page] || routes.dashboard;

  contentArea.innerHTML = route.html();

  if (route.init) await route.init();

  document.querySelectorAll('.menu-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === '#' + page);
  });

  updateBadges();
}

async function handleLogout() {
  await clearSession();
  location.hash = '';
  startAuth();
}

async function buildApp(user) {
  document.body.innerHTML = '';

  const App = document.createElement('div');
  App.className = 'app';
  document.body.appendChild(App);

  App.appendChild(createHeader(user, handleLogout));

  const container = document.createElement('div');
  container.classList.add('container');

  contentArea = document.createElement('div');
  contentArea.classList.add('content');
  container.appendChild(createSidebar());
  container.appendChild(contentArea);
  App.appendChild(container);

  toastContainer = document.createElement('div');
  toastContainer.classList.add('toast-container');
  document.body.appendChild(toastContainer);

  window.addEventListener('hashchange', () => navigate(location.hash));
  await navigate(location.hash || '#dashboard');
}

function startAuth() {
  showAuthPage(async (user) => {
    await buildApp(user);
  });
}

(async () => {
  const session = await getSession();
  if (session) {
    await buildApp(session);
  } else {
    startAuth();
  }
})();

export { contentArea };
