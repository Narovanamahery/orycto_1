import { createHeader } from "./components/header.js";
import { createSidebar } from "./components/sidebar.js";
import { dashboardHTML } from "./pages/dashboard.js";
import { livestockHTML, initLivestock } from "./pages/livestock.js";
import { healthHTML, initHealth } from "./pages/health.js";
import { reproductionHTML, initReproduction } from "./pages/reproduction.js";
import { feedingHTML, initFeeding } from "./pages/feeding.js";
import { statisticsHTML, initStatistics } from "./pages/statistics.js";

const App = document.querySelector('.app');
App.appendChild(createHeader());

const container = document.createElement('div');
container.classList.add('container');

const contentArea = document.createElement('div');
contentArea.classList.add('content');
container.appendChild(createSidebar());
container.appendChild(contentArea);
App.appendChild(container);

// Toast system
const toastContainer = document.createElement('div');
toastContainer.classList.add('toast-container');
document.body.appendChild(toastContainer);

export function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${msg}</span>`;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Router
const routes = {
  dashboard:    { html: dashboardHTML,    init: null },
  livestock:    { html: livestockHTML,    init: initLivestock },
  health:       { html: healthHTML,       init: initHealth },
  reproduction: { html: reproductionHTML, init: initReproduction },
  feeding:      { html: feedingHTML,      init: initFeeding },
  statistics:   { html: statisticsHTML,   init: initStatistics },
};

function navigate(hash) {
  const page = hash.replace('#', '') || 'dashboard';
  const route = routes[page] || routes.dashboard;
  contentArea.innerHTML = route.html();
  if (route.init) route.init();

  document.querySelectorAll('.menu-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') === '#' + page);
  });

  if (page === 'dashboard') {
    const el = document.getElementById('current-date');
    if (el) {
      const d = new Date();
      el.textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' • Dashboard overview';
    }
  }
}

window.addEventListener('hashchange', () => navigate(location.hash));
navigate(location.hash || '#dashboard');

export { contentArea };
