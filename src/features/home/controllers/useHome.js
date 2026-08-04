/* SoftBiblio · Home */
import { DB, daysLate, fineFor, LOAN_DAYS } from '../../../lib/db.js';
import {
  bookCardHTML, loanCardHTML, noticeItemHTML, emptyBooksHTML, emptyLoansHTML,
} from './renderers.js';
import { getCurrentUser, logout } from '../../auth/controllers/useAuth.js';

const AUTH_URL = '../auth/index.html';

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

function renderBooks(els, email, query) {
  const term = (query || '').trim().toLowerCase();
  const filtered = DB.books.list().filter((b) => !term
    || b.title.toLowerCase().includes(term)
    || b.author.toLowerCase().includes(term)
    || b.call.toLowerCase().includes(term));
  els.booksGrid.innerHTML = filtered.length
    ? filtered.map((b) => bookCardHTML(b, email)).join('')
    : emptyBooksHTML(term);
}

function renderLoans(els, email) {
  const loans = DB.loans.listBy(email);
  els.loansList.innerHTML = loans.length ? loans.map(loanCardHTML).join('') : emptyLoansHTML();
}

function renderNotices(els, email) {
  const notices = DB.notices.listBy(email);
  els.noticeList.innerHTML = notices.length
    ? notices.map(noticeItemHTML).join('')
    : '<li class="notice-item"><span>No tienes notificaciones nuevas.</span></li>';
}

function renderStats(els, email) {
  const available = DB.books.list().filter((b) => b.status === 'disponible').length;
  const loans = DB.loans.listBy(email);
  const fines = loans.reduce((sum, loan) => sum + fineFor(loan), 0);
  els.statAvailable.textContent = String(available);
  els.statLoans.textContent = String(loans.length);
  els.statFines.textContent = `$${fines.toFixed(2)}`;
  els.statNotices.textContent = String(DB.notices.listBy(email).length);
}

function renderAll(els, email, query) {
  renderBooks(els, email, query);
  renderLoans(els, email);
  renderNotices(els, email);
  renderStats(els, email);
}

function reserveBook(els, email, bookId) {
  const book = DB.books.find(bookId);
  if (!book || book.status !== 'disponible') return;
  DB.books.set(bookId, { status: 'reservado', heldBy: email });
  DB.notices.add(email, `Reservaste "${book.title}". Retíralo antes de 48 horas.`);
  renderAll(els, email, els.searchInput.value);
}

function cancelReservation(els, email, bookId) {
  const book = DB.books.find(bookId);
  if (!book || book.status !== 'reservado' || book.heldBy !== email) return;
  DB.books.set(bookId, { status: 'disponible', heldBy: null });
  renderAll(els, email, els.searchInput.value);
}

function checkoutBook(els, email, bookId) {
  const book = DB.books.find(bookId);
  if (!book || book.status !== 'reservado' || book.heldBy !== email) return;
  DB.loans.create(email, book);
  DB.books.set(bookId, { status: 'prestado', heldBy: email });
  DB.notices.add(email, `Retiraste "${book.title}". Plazo de devolución: ${LOAN_DAYS} días.`);
  renderAll(els, email, els.searchInput.value);
}

function returnLoan(els, email, loanId) {
  const loan = DB.loans.find(loanId);
  if (!loan || loan.email !== email) return;
  const late = daysLate(loan.due);
  const fine = fineFor(loan);
  DB.books.set(loan.bookId, { status: 'disponible', heldBy: null });
  DB.loans.remove(loanId);
  DB.notices.add(email, late > 0
    ? `Devolviste "${loan.title}" con ${late} día(s) de retraso. Multa generada: $${fine.toFixed(2)}.`
    : `Devolviste "${loan.title}" a tiempo. ¡Gracias!`, late > 0);
  renderAll(els, email, els.searchInput.value);
}

function wireSearch(els, email) {
  els.searchInput.addEventListener('input', (e) => renderBooks(els, email, e.target.value));
}

function wireCatalogActions(els, email) {
  els.booksGrid.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action, bookId } = target.dataset;
    if (action === 'reserve') reserveBook(els, email, bookId);
    if (action === 'cancel') cancelReservation(els, email, bookId);
    if (action === 'checkout') checkoutBook(els, email, bookId);
  });
}

function wireLoanActions(els, email) {
  els.loansList.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="return"]');
    if (!target) return;
    returnLoan(els, email, target.dataset.loanId);
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
  if (!user) { window.location.href = AUTH_URL; return; }
  const email = user.email;
  const els = collectElements();
  greetUser(els, user);
  wireSearch(els, email);
  wireCatalogActions(els, email);
  wireLoanActions(els, email);
  wireLogout(els);
  renderAll(els, email, '');
}

document.addEventListener('DOMContentLoaded', init);