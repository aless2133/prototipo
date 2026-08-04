/* SoftBiblio · Auth */
import { Session } from '../../../lib/session.js';
import { DB } from '../../../lib/db.js';

const HOME_URL = '../home/index.html';
const MAIL_SUFFIX = '@tecnologicoloja.edu.ec';
const MIN_PASSWORD_LENGTH = 6;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function validateCredentials(email, password) {
  const mail = normalizeEmail(email);
  if (!mail.endsWith(MAIL_SUFFIX) || !mail.split('@')[0]) {
    return { ok: false, message: 'Debes usar un correo Institucional.' };
  }
  if (String(password || '').length <= MIN_PASSWORD_LENGTH) {
    return { ok: false, message: 'La contraseña debe tener más de 6 caracteres.' };
  }
  return { ok: true };
}

export function login(email, password) {
  const check = validateCredentials(email, password);
  if (!check.ok) return check;
  const { user, isNew } = DB.users.upsert(normalizeEmail(email));
  if (isNew && DB.users.count() === 1) DB.seedDemoFor(user.email);
  Session.set({ email: user.email, loginAt: Date.now() });
  return { ok: true };
}

export function logout() { Session.clear(); }
export function getCurrentUser() { return Session.get(); }

function redirectToHome() { window.location.href = HOME_URL; }

function setLoading(els, isLoading) {
  els.submitBtn.disabled = isLoading;
  els.spinner.style.display = isLoading ? 'inline-block' : 'none';
  els.submitLabel.textContent = isLoading ? 'Verificando…' : 'Iniciar sesión';
}

function showFieldError(field, message) {
  field.wrapper.classList.add('is-error');
  field.errorEl.textContent = message;
}

function clearFieldError(field) { field.wrapper.classList.remove('is-error'); }
function showFormAlert(alertEl, message) { alertEl.textContent = message; alertEl.classList.add('is-visible'); }
function hideFormAlert(alertEl) { alertEl.classList.remove('is-visible'); }

function collectElements() {
  return {
    form: document.getElementById('authForm'),
    alert: document.getElementById('authAlert'),
    submitBtn: document.getElementById('submitBtn'),
    submitLabel: document.getElementById('submitLabel'),
    spinner: document.getElementById('submitSpinner'),
    togglePassword: document.getElementById('togglePassword'),
    emailField: {
      input: document.getElementById('email'),
      wrapper: document.getElementById('emailField'),
      errorEl: document.getElementById('emailError'),
    },
    passwordField: {
      input: document.getElementById('password'),
      wrapper: document.getElementById('passwordField'),
      errorEl: document.getElementById('passwordError'),
    },
  };
}

function wireVisibilityToggle(els) {
  els.togglePassword.addEventListener('click', () => {
    const input = els.passwordField.input;
    input.type = input.type === 'password' ? 'text' : 'password';
    els.togglePassword.setAttribute('aria-label',
      input.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
  });
}

function wireSubmit(els) {
  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideFormAlert(els.alert);
    clearFieldError(els.emailField);
    clearFieldError(els.passwordField);

    const email = els.emailField.input.value;
    const password = els.passwordField.input.value;

    if (!email) { showFieldError(els.emailField, 'Ingresa tu correo.'); return; }
    if (!normalizeEmail(email).endsWith(MAIL_SUFFIX)) {
      showFieldError(els.emailField, 'Debe usar un correo Institucional (ej.: alextorres@tecnologicoloja.edu.ec).');
      return;
    }
    if (!password) { showFieldError(els.passwordField, 'Ingresa tu contraseña.'); return; }
    if (password.length <= MIN_PASSWORD_LENGTH) {
      showFieldError(els.passwordField, 'Debe tener más de 6 caracteres.');
      return;
    }

    setLoading(els, true);
    window.setTimeout(() => {
      const result = login(email, password);
      if (!result.ok) {
        setLoading(els, false);
        showFormAlert(els.alert, result.message);
        return;
      }
      redirectToHome();
    }, 450);
  });
}

function init() {
  const els = collectElements();
  if (!els.form) return;
  if (getCurrentUser()) { redirectToHome(); return; }
  wireVisibilityToggle(els);
  wireSubmit(els);
}

document.addEventListener('DOMContentLoaded', init);