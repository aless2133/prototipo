import { DB, Validators, LOAN_DAYS, FINE_PER_DAY } from '../../../lib/db.js';
import { showAlert, registerRefresher, refreshAll } from './homeContext.js';
import {
  renderBookForm, renderBooksTable, readBookForm, clearBookForm, setBookFormMode,
} from '../renderers/booksRenderer.js';
import { renderLoanForm, renderLoansTable, readLoanForm } from '../renderers/loansRenderer.js';

let _bookFormWrap, _booksTableWrap, _searchBooks;
let _loanFormWrap, _loansTableWrap, _searchLoans, _onlyPending;
let _currentBookId = null;

function renderBooks(q = '') { renderBooksTable(_booksTableWrap, q); }
function renderLoans(q = '', onlyPending = true) { renderLoansTable(_loansTableWrap, q, onlyPending); }

function validateBook(data) {
  if (!Validators.text(data.title)) return 'El título es obligatorio.';
  if (!Validators.text(data.author)) return 'El autor es obligatorio.';
  if (!Validators.positiveInt(data.copies)) return 'Ejemplares debe ser un entero ≥ 1.';
  return null;
}

function handleBookSubmit(e) {
  e.preventDefault();
  const data = readBookForm(_bookFormWrap);
  const err = validateBook(data);
  if (err) { showAlert(err, 'error'); return; }
  if (_currentBookId) {
    const result = DB.books.update(_currentBookId, data);
    if (result && result.error) { showAlert(result.error, 'error'); return; }
    showAlert(result ? `Libro ${result.code} actualizado.` : 'Error.', result ? 'success' : 'error');
  } else {
    const b = DB.books.create(data);
    showAlert(`Libro ${b.code} registrado.`);
  }
  handleBookReset();
  refreshAll();
}

function handleBookSelect(id) {
  const b = DB.books.find(id); if (!b) return;
  _currentBookId = id;
  setBookFormMode(_bookFormWrap, 'edit');
  renderBookForm(_bookFormWrap, b);
}

function handleBookReset() {
  _currentBookId = null;
  setBookFormMode(_bookFormWrap, 'create');
  clearBookForm(_bookFormWrap);
}

function validateLoan(data) {
  if (!data.userId) return 'Selecciona un usuario.';
  if (!data.bookId) return 'Selecciona un libro.';
  const u = DB.users.find(data.userId);
  if (!u || u.status !== 'Activo') return 'El usuario seleccionado está inactivo.';
  const b = DB.books.find(data.bookId);
  if (!b || b.available < 1) return 'No hay ejemplares disponibles.';
  return null;
}

function handleLoanSubmit(e) {
  e.preventDefault();
  const data = readLoanForm(_loanFormWrap);
  const err = validateLoan(data);
  if (err) { showAlert(err, 'error'); return; }
  const loan = DB.loans.create(data.userId, data.bookId);
  if (loan && loan.error) { showAlert(loan.error, 'error'); return; }
  showAlert(`Préstamo ${loan.code} registrado. Fecha límite: ${loan.dueDate}`);
  refreshAll();
}

function handleLoanReturn(id) {
  const loan = DB.loans.return(id);
  if (loan && loan.error) { showAlert(loan.error, 'error'); return; }
  if (loan) {
    const fine = loan.fine || 0;
    showAlert(fine > 0 ? `Devuelto con multa de $${fine.toFixed(2)}.` : 'Devuelto a tiempo. ¡Gracias!', fine > 0 ? 'error' : 'success');
  }
  refreshAll();
}

function wireBooks() {
  _searchBooks.addEventListener('input', (e) => renderBooks(e.target.value));
  _bookFormWrap.addEventListener('submit', handleBookSubmit);
  _bookFormWrap.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (t && t.dataset.action === 'reset') handleBookReset();
  });
  _booksTableWrap.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (t && t.dataset.action === 'edit') handleBookSelect(t.dataset.id);
  });
}

function wireLoans() {
  _searchLoans.addEventListener('input', (e) => renderLoans(e.target.value, _onlyPending.checked));
  _onlyPending.addEventListener('change', () => renderLoans(_searchLoans.value, _onlyPending.checked));
  _loanFormWrap.addEventListener('submit', handleLoanSubmit);
  _loansTableWrap.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (t && t.dataset.action === 'return') handleLoanReturn(t.dataset.id);
  });
}

export function initCatalogTab() {
  _bookFormWrap = document.getElementById('bookFormWrapper');
  _booksTableWrap = document.getElementById('booksTableWrap');
  _searchBooks = document.getElementById('searchBooks');
  _loanFormWrap = document.getElementById('loanFormWrapper');
  _loansTableWrap = document.getElementById('loansTableWrap');
  _searchLoans = document.getElementById('searchLoans');
  _onlyPending = document.getElementById('onlyPending');

  setBookFormMode(_bookFormWrap, 'create');
  renderBookForm(_bookFormWrap, null);
  renderBooks();
  renderLoanForm(_loanFormWrap);
  renderLoans('', true);

  wireBooks();
  wireLoans();

  registerRefresher(() => {
    renderBooks(_searchBooks ? _searchBooks.value : '');
    renderLoans(_searchLoans ? _searchLoans.value : '', _onlyPending ? _onlyPending.checked : true);
    renderLoanForm(_loanFormWrap);
  });
}