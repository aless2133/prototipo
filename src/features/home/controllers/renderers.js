import { daysLate } from '../../../lib/db.js';

const STAMP_LABELS = { disponible: 'Disponible', prestado: 'Prestado', reservado: 'Reservado' };

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function bookFootHTML(book, email) {
  if (book.status === 'disponible') {
    return `<button class="btn btn-brass btn-sm" data-action="reserve" data-book-id="${book.id}">Reservar</button>`;
  }
  if (book.status === 'reservado' && book.heldBy === email) {
    return `<div class="cluster gap-2">
      <button class="btn btn-brass btn-sm" data-action="checkout" data-book-id="${book.id}">Retirar</button>
      <button class="btn btn-ghost btn-sm" data-action="cancel" data-book-id="${book.id}">Cancelar</button>
    </div>`;
  }
  return '<button class="btn btn-outline btn-sm" disabled>No disponible</button>';
}

export function bookCardHTML(book, email) {
  return `<article class="card book-card">
    <div class="book-card__top">
      <span class="book-card__call">${book.call}</span>
      <span class="stamp-badge stamp-${book.status}">${STAMP_LABELS[book.status]}</span>
    </div>
    <h3 class="book-card__title">${book.title}</h3>
    <p class="book-card__author">${book.author}</p>
    <div class="book-card__meta"><span>${book.year}</span></div>
    <div class="book-card__foot">${bookFootHTML(book, email)}</div>
  </article>`;
}

export function loanCardHTML(loan) {
  const late = daysLate(loan.due);
  const dueClass = late > 0 ? 'is-late' : '';
  const dueLabel = late > 0 ? `Venció ${formatDate(loan.due)}` : `Vence ${formatDate(loan.due)}`;
  const stamp = late > 0 ? 'stamp-vencido' : 'stamp-prestado';
  const stampLabel = late > 0 ? 'Vencido' : 'Prestado';
  return `<div class="loan-card">
    <div>
      <p style="font-weight:600;">${loan.title}</p>
      <p class="text-muted" style="font-size: var(--text-sm);">${loan.author}</p>
    </div>
    <div class="stack gap-2" style="align-items:flex-end;">
      <span class="loan-card__due ${dueClass}">${dueLabel}</span>
      <span class="stamp-badge ${stamp}">${stampLabel}</span>
      <button class="btn btn-outline btn-sm" data-action="return" data-loan-id="${loan.id}">Devolver</button>
    </div>
  </div>`;
}

export function noticeItemHTML(notice) {
  return `<li class="notice-item">
    <span class="notice-dot ${notice.urgent ? 'is-urgent' : ''}"></span>
    <span>${notice.text}</span>
  </li>`;
}

export function emptyBooksHTML(term) {
  return `<div class="card empty-state" style="grid-column: 1 / -1;">
    <p class="empty-state__title">Sin resultados</p>
    <p>No encontramos libros que coincidan con "${term}". Prueba con otro título o autor.</p>
  </div>`;
}

export function emptyLoansHTML() {
  return '<div class="empty-state"><p>No tienes préstamos activos.</p></div>';
}