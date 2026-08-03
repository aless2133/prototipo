import { Session } from '../../../lib/session.js';

const HOME_URL = '../home/index.html';

const VALID_CREDENTIALS = {
  email: 'alessless674@gmail.com',
  password: 'clave123',
};


function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/** Compara las credenciales ingresadas contra la credencial válida. */
export function validateCredentials(email, password) {
  return (
    normalizeEmail(email) === VALID_CREDENTIALS.email &&
    String(password || '') === VALID_CREDENTIALS.password
  );
}

/** Abre sesión y guarda al usuario actual. */
export function login(email, password) {
  if (!validateCredentials(email, password)) {
    return { ok: false, message: 'Revisa el correo o la contraseña ingresados.' };
  }
  Session.set({ email: normalizeEmail(email), loginAt: Date.now() });
  return { ok: true };
}

export function logout() {
  Session.clear();
}

export function getCurrentUser() {
  return Session.get();
}

function redirectToHome() {
  window.location.href = HOME_URL;
}

function setLoading(elements, isLoading) {
  elements.submitBtn.disabled = isLoading;
  elements.spinner.style.display = isLoading ? 'inline-block' : 'none';
  elements.submitLabel.textContent = isLoading ? 'Verificando…' : 'Iniciar sesión';
}

function showFieldError(field, message) {
  field.wrapper.classList.add('is-error');
  field.errorEl.textContent = message;
}

function clearFieldError(field) {
  field.wrapper.classList.remove('is-error');
}

function showFormAlert(alertEl, message) {
  alertEl.textContent = message;
  alertEl.classList.add('is-visible');
}

function hideFormAlert(alertEl) {
  alertEl.classList.remove('is-visible');
}

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
    els.togglePassword.setAttribute(
      'aria-label',
      input.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'
    );
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

    if (!email) {
      showFieldError(els.emailField, 'Ingresa tu correo institucional.');
      return;
    }
    if (!password) {
      showFieldError(els.passwordField, 'Ingresa tu contraseña.');
      return;
    }

    setLoading(els, true);
    window.setTimeout(() => {
      const result = login(email, password);
      if (!result.ok) {
        setLoading(els, false);
        showFormAlert(els.alert, result.message);
        showFieldError(els.emailField, ' ');
        showFieldError(els.passwordField, ' ');
        els.passwordField.errorEl.textContent = result.message;
        return;
      }
      redirectToHome();
    }, 450);
  });
}

function init() {
  if (getCurrentUser()) {
    redirectToHome();
    return;
  }
  const els = collectElements();
  wireVisibilityToggle(els);
  wireSubmit(els);
}

document.addEventListener('DOMContentLoaded', init);
