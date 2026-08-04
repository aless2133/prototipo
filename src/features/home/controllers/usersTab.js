import { DB, Validators } from '../../../lib/db.js';
import { showAlert, registerRefresher, refreshAll } from './homeContext.js';
import {
  renderUserForm, renderUsersTable, readUserForm,
  clearUserForm, setUserFormMode,
} from '../renderers/usersRenderer.js';

let _formWrap, _tableWrap, _searchInput;
let _currentId = null;

function render(q = '') { renderUsersTable(_tableWrap, q); }

function handleSelect(id) {
  const user = DB.users.find(id); if (!user) return;
  _currentId = id;
  setUserFormMode(_formWrap, 'edit');
  renderUserForm(_formWrap, user);
}

function handleReset() {
  _currentId = null;
  setUserFormMode(_formWrap, 'create');
  clearUserForm(_formWrap);
}

function validate(data) {
  if (!Validators.text(data.name) || !Validators.text(data.last)) return 'Nombre y apellido son obligatorios.';
  if (!Validators.cedula(data.cedula)) return 'La cédula debe tener entre 6 y 13 dígitos.';
  if (!Validators.email(data.email)) return 'El correo no tiene un formato válido.';
  if (!Validators.phone(data.phone)) return 'Teléfono con formato inválido.';
  if (!DB.users.isUnique('cedula', data.cedula.trim(), _currentId)) return 'Ya existe un usuario con esa cédula.';
  if (!DB.users.isUnique('email', data.email.trim().toLowerCase(), _currentId)) return 'Ya existe un usuario con ese correo.';
  return null;
}

function handleSubmit(e) {
  e.preventDefault();
  const data = readUserForm(_formWrap);
  const err = validate(data);
  if (err) { showAlert(err, 'error'); return; }
  if (_currentId) {
    const u = DB.users.update(_currentId, data);
    showAlert(u ? `Usuario ${u.code} actualizado.` : 'No se pudo actualizar.', u ? 'success' : 'error');
  } else {
    const u = DB.users.create(data);
    showAlert(`Usuario ${u.code} registrado correctamente.`);
  }
  handleReset();
  refreshAll();
}

function handleToggleStatus(id) {
  const u = DB.users.toggleStatus(id);
  if (u) {
    showAlert(`Estado de ${u.code}: ${u.status}.`);
    refreshAll();
    if (_currentId === id) handleSelect(id);
  }
}

function wireEvents() {
  _searchInput.addEventListener('input', (e) => render(e.target.value));
  _formWrap.addEventListener('submit', handleSubmit);
  _formWrap.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (t && t.dataset.action === 'reset') handleReset();
  });
  _tableWrap.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    if (t.dataset.action === 'edit') handleSelect(t.dataset.id);
    if (t.dataset.action === 'toggle') handleToggleStatus(t.dataset.id);
  });
}

export function initUsersTab() {
  _formWrap = document.getElementById('userFormWrapper');
  _tableWrap = document.getElementById('usersTableWrap');
  _searchInput = document.getElementById('searchUsers');
  setUserFormMode(_formWrap, 'create');
  renderUserForm(_formWrap, null);
  render();
  wireEvents();
  registerRefresher(() => render(_searchInput ? _searchInput.value : ''));
}