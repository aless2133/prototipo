import { renderStats } from '../renderers/statsRenderer.js';

let _els = null;
const _refreshers = new Set();

export function setContext(els, user) { _els = els; _user = user; }
let _user = null;
export function getUser() { return _user; }
export function getEls() { return _els; }

export function showAlert(message, type = 'success') {
  if (!_els || !_els.alert) return;
  _els.alert.className = `admin-alert is-visible is-${type}`;
  _els.alert.textContent = message;
  window.clearTimeout(_els.alert._timer);
  _els.alert._timer = window.setTimeout(() => {
    if (_els.alert) _els.alert.classList.remove('is-visible');
  }, 3800);
}

export function registerRefresher(fn) { _refreshers.add(fn); }
export function refreshAll() {
  if (_els && _els.statsGrid) renderStats(_els.statsGrid);
  _refreshers.forEach((fn) => { try { fn(); } catch (_) {} });
}