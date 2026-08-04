import { DB } from '../../../lib/db.js';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

function rowHTML(b) {
  const lent = b.copies - b.available;
  const statusClass = b.available > 0 ? 'is-active' : 'is-inactive';
  const statusLabel = b.available > 0 ? `${b.available} disp.` : 'Agotado';
  return `
    <tr>
      <td><span class="code">${escapeHtml(b.code)}</span></td>
      <td><strong>${escapeHtml(b.title)}</strong><div class="muted">${escapeHtml(b.author)}</div></td>
      <td>${escapeHtml(b.isbn || '—')}</td>
      <td>${escapeHtml(b.year || '—')}</td>
      <td>${b.copies}</td>
      <td>
        <span class="status-pill ${statusClass}">${statusLabel}</span>
        ${lent > 0 ? `<div class="muted">${lent} prestado(s)</div>` : ''}
      </td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${b.id}">Editar</button>
      </td>
    </tr>`;
}

export function renderBooksTable(wrap, q = '') {
  if (!wrap) return;
  const rows = DB.books.list(q);
  if (rows.length === 0) {
    wrap.innerHTML = `<table class="admin-table"><thead><tr><th colspan="7">Libros</th></tr></thead>
      <tbody><tr class="empty-row"><td>Sin resultados para "${escapeHtml(q)}".</td></tr></tbody></table>`;
    return;
  }
  wrap.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Código</th><th>Título / Autor</th><th>ISBN</th><th>Año</th><th>Ejemp.</th><th>Disponibles</th><th></th></tr></thead>
      <tbody>${rows.map(rowHTML).join('')}</tbody>
    </table>`;
}

export function renderBookForm(wrap, book) {
  if (!wrap) return;
  const mode = wrap.dataset.mode || 'create';
  const b = book || { title: '', author: '', isbn: '', year: '', copies: 1 };
  wrap.innerHTML = `
    <div class="section__head"><h2 id="bookFormTitle">${mode === 'edit' ? 'Editar libro' : 'Registrar libro'}</h2></div>
    <form class="card admin-form" id="bookForm" novalidate>
      <input type="hidden" id="bookId" value="${escapeHtml(b.id || '')}">
      <div class="field"><label class="field-label" for="bookTitle">Título *</label>
        <input class="input" id="bookTitle" type="text" value="${escapeHtml(b.title)}" required></div>
      <div class="field"><label class="field-label" for="bookAuthor">Autor *</label>
        <input class="input" id="bookAuthor" type="text" value="${escapeHtml(b.author)}" required></div>
      <div class="admin-form__row">
        <div class="field"><label class="field-label" for="bookIsbn">ISBN</label>
          <input class="input" id="bookIsbn" type="text" value="${escapeHtml(b.isbn || '')}"></div>
        <div class="field"><label class="field-label" for="bookYear">Año</label>
          <input class="input" id="bookYear" type="text" value="${escapeHtml(b.year || '')}" inputmode="numeric"></div>
      </div>
      <div class="field"><label class="field-label" for="bookCopies">Ejemplares *</label>
        <input class="input" id="bookCopies" type="number" min="1" value="${escapeHtml(String(b.copies || 1))}"></div>
      <div class="admin-form__actions">
        <button class="btn btn-primary" type="submit">${mode === 'edit' ? 'Guardar cambios' : 'Registrar'}</button>
        <button class="btn btn-ghost" type="button" data-action="reset">Limpiar</button>
      </div>
    </form>`;
}

export function readBookForm(wrap) {
  const q = (id) => wrap.querySelector(`#${id}`)?.value ?? '';
  return { title: q('bookTitle'), author: q('bookAuthor'), isbn: q('bookIsbn'), year: q('bookYear'), copies: q('bookCopies') };
}

export function clearBookForm(wrap) {
  wrap.dataset.mode = 'create';
  renderBookForm(wrap, null);
}

export function setBookFormMode(wrap, mode) {
  if (!wrap) return;
  wrap.dataset.mode = mode;
  const h2 = wrap.querySelector('#bookFormTitle');
  if (h2) h2.textContent = mode === 'edit' ? 'Editar libro' : 'Registrar libro';
  const btn = wrap.querySelector('[type="submit"]');
  if (btn) btn.textContent = mode === 'edit' ? 'Guardar cambios' : 'Registrar';
}