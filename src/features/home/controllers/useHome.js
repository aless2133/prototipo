import { Session } from '../../../lib/session.js';
import { getCurrentUser, logout } from '../../auth/controllers/useAuth.js';

const AUTH_URL = '../auth/index.html';
const FINE_PER_DAY = 0.5; // dólares por día de retraso


function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(date) {
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLate(dueDate) {
  const diffMs = Date.now() - dueDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

const today = new Date();

let books = [
  { id: 'b1', title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', call: '863.44 GAB', year: 1967, status: 'disponible' },
  { id: 'b2', title: 'Clean Code', author: 'Robert C. Martin', call: '005.1 ROB', year: 2008, status: 'prestado' },
  { id: 'b3', title: 'Veinte Poemas de Amor', author: 'Pablo Neruda', call: '861.44 NER', year: 1924, status: 'disponible' },
  { id: 'b4', title: 'Sapiens', author: 'Yuval Noah Harari', call: '909 HAR', year: 2011, status: 'prestado' },
  { id: 'b5', title: 'Introducción a Algoritmos', author: 'Thomas H. Cormen', call: '005.1 COR', year: 2009, status: 'disponible' },
  { id: 'b6', title: 'El Principito', author: 'Antoine de Saint-Exupéry', call: '843.9 SAI', year: 1943, status: 'disponible' },
  { id: 'b7', title: 'Redes de Computadoras', author: 'Andrew S. Tanenbaum', call: '004.6 TAN', year: 2012, status: 'reservado' },
  { id: 'b8', title: 'Diseño de Bases de Datos', author: 'Ramez Elmasri', call: '005.74 ELM', year: 2016, status: 'disponible' },
];

let loans = [
  { id: 'l1', bookId: 'b2', title: 'Clean Code', author: 'Robert C. Martin', due: addDays(today, -5) },
  { id: 'l2', bookId: 'b4', title: 'Sapiens', author: 'Yuval Noah Harari', due: addDays(today, 9) },
];

let notifications = [
  { id: 'n1', text: 'Tu préstamo de "Clean Code" está vencido desde hace varios días.', urgent: true },
  { id: 'n2', text: 'Nuevo ejemplar disponible: "Diseño de Bases de Datos".', urgent: false },
  { id: 'n3', text: 'Recuerda que "Sapiens" vence pronto. Planifica tu devolución.', urgent: false },
];

function collectElements() {
  return {
    userLabel: document.getElementById('userLabel'),
    logoutBtn: document.getElementById('logoutBtn'),
    searchInput: document.getElementById('searchInput'),
    booksGrid: document.getElementById('booksGrid'),
    loansList: document.getElementById('loansList'),
    noticeList: document.getElementById('noticeList'),
    statAvailable: document.getElementById('statAvailable'),
    statLoans: document.getElementById('statLoans'),
    statFines: document.getElementById('statFines'),
    statNotices: document.getElementById('statNotices'),
  };
}

const STAMP_LABELS = { disponible: 'Disponible', prestado: 'Prestado', reservado: 'Reservado' };

function bookCardHTML(book) {
  const canReserve = book.status === 'disponible';
  const canCancel = book.status === 'reservado';
  let actionHTML = '<button class="btn btn-outline btn-sm" disabled>No disponible</button>';
  if (canReserve) {
    actionHTML = `<button class="btn btn-brass btn-sm" data-action="reserve" data-book-id="${book.id}">Reservar</button>`;
  } else if (canCancel) {
    actionHTML = `<button class="btn btn-ghost btn-sm" data-action="cancel" data-book-id="${book.id}">Cancelar reserva</button>`;
  }
  return `
    <article class="card book-card">
      <div class="book-card__top">
        <span class="book-card__call">${book.call}</span>
        <span class="stamp-badge stamp-${book.status}">${STAMP_LABELS[book.status]}</span>
      </div>
      <h3 class="book-card__title">${book.title}</h3>
      <p class="book-card__author">${book.author}</p>
      <div class="book-card__meta"><span>${book.year}</span></div>
      <div class="book-card__foot">${actionHTML}</div>
    </article>`;
}

function loanCardHTML(loan) {
  const late = daysLate(loan.due);
  const dueClass = late > 0 ? 'is-late' : '';
  const dueLabel = late > 0 ? `Venció ${formatDate(loan.due)}` : `Vence ${formatDate(loan.due)}`;
  const stamp = late > 0 ? 'stamp-vencido' : 'stamp-prestado';
  const stampLabel = late > 0 ? 'Vencido' : 'Prestado';
  return `
    <div class="loan-card">
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

function noticeItemHTML(notice) {
  return `
    <li class="notice-item">
      <span class="notice-dot ${notice.urgent ? 'is-urgent' : ''}"></span>
      <span>${notice.text}</span>
    </li>`;
}

function renderBooks(els, query) {
  const term = (query || '').trim().toLowerCase();
  const filtered = books.filter((book) => {
    if (!term) return true;
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.call.toLowerCase().includes(term)
    );
  });

  if (filtered.length === 0) {
    els.booksGrid.innerHTML = `
      <div class="card empty-state" style="grid-column: 1 / -1;">
        <p class="empty-state__title">Sin resultados</p>
        <p>No encontramos libros que coincidan con "${term}". Prueba con otro título o autor.</p>
      </div>`;
    return;
  }
  els.booksGrid.innerHTML = filtered.map(bookCardHTML).join('');
}

function renderLoans(els) {
  if (loans.length === 0) {
    els.loansList.innerHTML = '<div class="empty-state"><p>No tienes préstamos activos.</p></div>';
    return;
  }
  els.loansList.innerHTML = loans.map(loanCardHTML).join('');
}

function renderNotifications(els) {
  els.noticeList.innerHTML = notifications.length
    ? notifications.map(noticeItemHTML).join('')
    : '<li class="notice-item"><span>No tienes notificaciones nuevas.</span></li>';
}

function renderStats(els) {
  const available = books.filter((b) => b.status === 'disponible').length;
  const fines = loans.reduce((sum, loan) => sum + daysLate(loan.due) * FINE_PER_DAY, 0);
  els.statAvailable.textContent = String(available);
  els.statLoans.textContent = String(loans.length);
  els.statFines.textContent = `$${fines.toFixed(2)}`;
  els.statNotices.textContent = String(notifications.length);
}

function renderAll(els, query) {
  renderBooks(els, query);
  renderLoans(els);
  renderNotifications(els);
  renderStats(els);
}

function reserveBook(els, bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book || book.status !== 'disponible') return;
  book.status = 'reservado';
  notifications.unshift({ id: `n${Date.now()}`, text: `Reservaste "${book.title}". Retíralo antes de 48 horas.`, urgent: false });
  renderAll(els, els.searchInput.value);
}

function cancelReservation(els, bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book || book.status !== 'reservado') return;
  book.status = 'disponible';
  renderAll(els, els.searchInput.value);
}

function returnLoan(els, loanId) {
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return;
  const late = daysLate(loan.due);
  const book = books.find((b) => b.id === loan.bookId);
  if (book) book.status = 'disponible';
  loans = loans.filter((l) => l.id !== loanId);
  if (late > 0) {
    const fine = (late * FINE_PER_DAY).toFixed(2);
    notifications.unshift({ id: `n${Date.now()}`, text: `Devolviste "${loan.title}" con ${late} día(s) de retraso. Multa generada: $${fine}.`, urgent: true });
  } else {
    notifications.unshift({ id: `n${Date.now()}`, text: `Devolviste "${loan.title}" a tiempo. ¡Gracias!`, urgent: false });
  }
  renderAll(els, els.searchInput.value);
}

function wireSearch(els) {
  els.searchInput.addEventListener('input', (event) => {
    renderBooks(els, event.target.value);
  });
}

function wireCatalogActions(els) {
  els.booksGrid.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, bookId } = target.dataset;
    if (action === 'reserve') reserveBook(els, bookId);
    if (action === 'cancel') cancelReservation(els, bookId);
  });
}

function wireLoanActions(els) {
  els.loansList.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="return"]');
    if (!target) return;
    returnLoan(els, target.dataset.loanId);
  });
}

function wireLogout(els) {
  els.logoutBtn.addEventListener('click', () => {
    logout();
    window.location.href = AUTH_URL;
  });
}

function greetUser(els, user) {
  const name = user.email.split('@')[0].replace(/[._]/g, ' ');
  els.userLabel.textContent = user.email;
  const headline = document.getElementById('greeting');
  if (headline) headline.textContent = `Hola, ${name}`;
}

function init() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = AUTH_URL;
    return;
  }
  const els = collectElements();
  greetUser(els, user);
  wireSearch(els);
  wireCatalogActions(els);
  wireLoanActions(els);
  wireLogout(els);
  renderAll(els, '');
}

document.addEventListener('DOMContentLoaded', init);
