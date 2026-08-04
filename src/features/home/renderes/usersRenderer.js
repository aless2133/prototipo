import { DB } from '../../../lib/db.js';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

function statusPill(status) {
  const cls = status === 'Activo' ? 'is-active' : 'is-inactive';
  return `<span class="status-pill ${cls}">${escapeHtml(status)}</span>`;
}

function rowHTML(u) {
  return `
    <tr>
      <td><span class="code">${escapeHtml(u.code)}</span></td>
      <td><strong>${escapeHtml(u.name)} ${escapeHtml(u.last)}</strong><div class="muted">${escapeHtml(u.email)}</div></td>
      <td>${escapeHtml(u.cedula)}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td>${statusPill(u.status)}</td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${u.id}">Editar</button>
        <button class="btn btn-outline btn-sm" data-action="toggle" data-id="${u.id}">
          ${u.status === 'Activo' ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>`;
}

export function renderUsersTable(wrap, q = '') {
  if (!wrap) return;
  const rows = DB.users.list(q);
  if (rows.length === 0) {
    wrap.innerHTML = `<table class="admin-table"><thead><tr><th colspan="6">Usuarios</th></tr></thead>
      <tbody><tr class="empty-row"><td>Sin resultados para "${escapeHtml(q)}".</td></tr></tbody></table>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Código</th><th>Nombre</th><th>Cédula</th><th>Teléfono</th><th>Estado</th><th></th></tr></thead>
      <tbody>${rows.map(rowHTML).join('')}</tbody>
    </table>`;
}

export function renderUserForm(wrap, user) {
  if (!wrap) return;
  const mode = wrap.dataset.mode || 'create';
  const u = user || { name: '', last: '', cedula: '', email: '', phone: '', status: 'Activo' };
  wrap.innerHTML = `
    <div class="section__head"><h2 id="userFormTitle">${mode === 'edit' ? 'Editar usuario' : 'Registrar usuario'}</h2></div>
    <form class="card admin-form" id="userForm" novalidate>
      <input type="hidden" id="userId" value="${escapeHtml(u.id || '')}">
      <div class="admin-form__row">
        <div class="field"><label class="field-label" for="userName">Nombre *</label>
          <input class="input" id="userName" type="text" value="${escapeHtml(u.name)}" required></div>
        <div class="field"><label class="field-label" for="userLast">Apellido *</label>
          <input class="input" id="userLast" type="text" value="${escapeHtml(u.last)}" required></div>
      </div>
      <div class="admin-form__row">
        <div class="field"><label class="field-label" for="userCedula">Cédula *</label>
          <input class="input" id="userCedula" type="text" value="${escapeHtml(u.cedula)}" inputmode="numeric" maxlength="13"></div>
        <div class="field"><label class="field-label" for="userPhone">Teléfono</label>
          <input class="input" id="userPhone" type="tel" value="${escapeHtml(u.phone)}"></div>
      </div>
      <div class="field"><label class="field-label" for="userEmail">Correo *</label>
        <input class="input" id="userEmail" type="email" value="${escapeHtml(u.email)}"></div>
      <div class="field"><label class="field-label" for="userStatus">Estado</label>
        <select class="input select" id="userStatus">
          <option value="Activo" ${u.status === 'Activo' ? 'selected' : ''}>Activo</option>
          <option value="Inactivo" ${u.status === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
        </select></div>
      <div class="admin-form__actions">
        <button class="btn btn-primary" type="submit">${mode === 'edit' ? 'Guardar cambios' : 'Registrar'}</button>
        <button class="btn btn-ghost" type="button" data-action="reset">Limpiar</button>
      </div>
    </form>`;
}

export function readUserForm(wrap) {
  const q = (id) => wrap.querySelector(`#${id}`)?.value ?? '';
  return {
    name: q('userName'), last: q('userLast'),
    cedula: q('userCedula'), email: q('userEmail'),
    phone: q('userPhone'), status: q('userStatus'),
  };
}

export function clearUserForm(wrap) {
  wrap.dataset.mode = 'create';
  renderUserForm(wrap, null);
}

export function setUserFormMode(wrap, mode) {
  if (!wrap) return;
  wrap.dataset.mode = mode;
  const h2 = wrap.querySelector('#userFormTitle');
  if (h2) h2.textContent = mode === 'edit' ? 'Editar usuario' : 'Registrar usuario';
  const btn = wrap.querySelector('[type="submit"]');
  if (btn) btn.textContent = mode === 'edit' ? 'Guardar cambios' : 'Registrar';
}