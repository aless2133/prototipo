import { DB, LOAN_DAYS, FINE_PER_DAY, daysLate, fineFor } from '../../../lib/db.js';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function rowHTML(l) {
  const u = DB.users.find(l.userId);
  const uLabel = u ? `${u.name} ${u.last}` : 'Usuario eliminado';
  const isPending = l.status === 'Prestado';
  const late = isPending ? daysLate(l.dueDate) : 0;
  const fine = isPending ? fineFor({ due: l.dueDate }) : (l.fine || 0);
  let pillCls = 'is-lent', pillTxt = 'Prestado';
  if (!isPending) { pillCls = 'is-returned'; pillTxt = 'Devuelto'; }
  else if (late > 0) { pillCls = 'is-late'; pillTxt = 'Vencido'; }
  return `
    <tr>
      <td><span class="code">${escapeHtml(l.code)}</span></td>
      <td>${escapeHtml(uLabel)}<div class="muted">${escapeHtml(u ? u.code : '')}</div></td>
      <td>${escapeHtml(l.bookTitle || '—')}</td>
      <td>${formatDate(l.loanDate)}</td>
      <td>${formatDate(l.dueDate)}</td>
      <td>${formatDate(l.returnDate)}</td>
      <td>
        <span class="status-pill ${pillCls}">${pillTxt}</span>
        ${fine > 0 ? `<div class="muted" style="color: var(--stamp-600);">$${fine.toFixed(2)}</div>` : ''}
      </td>
      <td class="actions">
        ${isPending ? `<button class="btn btn-outline btn-sm" data-action="return" data-id="${l.id}">Devolver</button>` : ''}
      </td>
    </tr>`;
}

export function renderLoansTable(wrap, q = '', onlyPending = true) {
  if (!wrap) return;
  const rows = DB.loans.list(q, onlyPending);
  if (rows.length === 0) {
    wrap.innerHTML = `<table class="admin-table"><thead><tr><th colspan="8">Préstamos</th></tr></thead>
      <tbody><tr class="empty-row"><td>No hay préstamos ${onlyPending ? 'pendientes' : 'registrados'}.</td></tr></tbody></table>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Código</th><th>Usuario</th><th>Libro</th><th>Préstamo</th><th>Límite</th><th>Devolución</th><th>Estado</th><th></th></tr></thead>
      <tbody>${rows.map(rowHTML).join('')}</tbody>
    </table>`;
}

export function renderLoanForm(wrap) {
  if (!wrap) return;
  const users = DB.users.findActive();
  const books = DB.books.available();
  const userOpts = users.map((u) => `<option value="${u.id}">${escapeHtml(u.code)} — ${escapeHtml(u.name)} ${escapeHtml(u.last)}</option>`).join('');
  const bookOpts = books.map((b) => `<option value="${b.id}">${escapeHtml(b.code)} — ${escapeHtml(b.title)} (disp: ${b.available})</option>`).join('');
  const disabled = !users.length || !books.length;
  wrap.innerHTML = `
    <div class="section__head"><h2>Registrar préstamo</h2></div>
    <form class="card admin-form" id="loanForm" novalidate>
      <div class="field"><label class="field-label" for="loanUser">Usuario *</label>
        <select class="input select" id="loanUser" required>
          <option value="">— Selecciona un usuario activo —</option>
          ${userOpts || '<option disabled>No hay usuarios activos</option>'}
        </select></div>
      <div class="field"><label class="field-label" for="loanBook">Libro *</label>
        <select class="input select" id="loanBook" required>
          <option value="">— Selecciona un libro disponible —</option>
          ${bookOpts || '<option disabled>No hay libros disponibles</option>'}
        </select></div>
      <div class="admin-form__actions">
        <button class="btn btn-primary" type="submit" ${disabled ? 'disabled' : ''}>Registrar préstamo</button>
      </div>
      <p class="text-muted" style="font-size: var(--text-xs); margin: 0;">
        Plazo: <strong>${LOAN_DAYS}</strong> días · Multa: <strong>$${FINE_PER_DAY.toFixed(2)}</strong>/día
      </p>
    </form>`;
}

export function readLoanForm(wrap) {
  const q = (id) => wrap.querySelector(`#${id}`)?.value ?? '';
  return { userId: q('loanUser'), bookId: q('loanBook') };
}