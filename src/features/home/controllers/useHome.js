import { getCurrentUser, logout } from '../../auth/controllers/useAuth.js';
import { setContext, refreshAll } from './homeContext.js';
import { initUsersTab } from './usersTab.js';
import { initCatalogTab } from './catalogTab.js';
import { renderStats } from '../renderers/statsRenderer.js';

const AUTH_URL = '../auth/index.html';

function collectElements() {
  return {
    userLabel: document.getElementById('userLabel'),
    logoutBtn: document.getElementById('logoutBtn'),
    greeting: document.getElementById('greeting'),
    statsGrid: document.getElementById('statsGrid'),
    tabs: document.querySelectorAll('.admin-tab'),
    panels: document.querySelectorAll('.admin-panel'),
    subtabs: document.querySelectorAll('.admin-subtab'),
    subpanels: document.querySelectorAll('.admin-subpanel'),
    alert: document.getElementById('adminAlert'),
  };
}

function wireTabs(els) {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      els.tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
      els.panels.forEach((p) => p.classList.toggle('is-hidden', p.dataset.panel !== tab.dataset.tab));
    });
  });
  els.subtabs.forEach((st) => {
    st.addEventListener('click', () => {
      els.subtabs.forEach((t) => t.classList.remove('is-active'));
      st.classList.add('is-active');
      els.subpanels.forEach((p) => p.classList.toggle('is-hidden', p.dataset.subpanel !== st.dataset.subtab));
    });
  });
}

function wireLogout(els) {
  els.logoutBtn.addEventListener('click', () => { logout(); window.location.href = AUTH_URL; });
}

function greetUser(els, user) {
  const name = user.email.split('@')[0].replace(/[._]/g, ' ');
  els.userLabel.textContent = user.email;
  if (els.greeting) els.greeting.textContent = `Hola, ${name}`;
}

function init() {
  const user = getCurrentUser();
  if (!user) { window.location.href = AUTH_URL; return; }
  const els = collectElements();
  setContext(els, user);
  greetUser(els, user);
  wireTabs(els);
  wireLogout(els);
  renderStats(els.statsGrid);
  initUsersTab();
  initCatalogTab();
  refreshAll();
}

document.addEventListener('DOMContentLoaded', init);