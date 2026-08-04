/* SoftBiblio · Base de datos local*/

const DB_KEY = 'softbiblio:db:v1';
const DAY_MS = 86400000;

export const LOAN_DAYS = 14; 
export const FINE_PER_DAY = 0.5; 

function iso(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString();
}

export function daysLate(dueISO) {
  return Math.max(0, Math.ceil((Date.now() - new Date(dueISO).getTime()) / DAY_MS));
}

export function fineFor(loan) {
  return daysLate(loan.due) * FINE_PER_DAY;
}

const SEED_BOOKS = [
  { id: 'b1', title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', call: '863.44 GAB', year: 1967, status: 'disponible', heldBy: null },
  { id: 'b2', title: 'Elian Biografía', author: 'Elian A. Peña', call: '0993811125 LOJ', year: 2007, status: 'prestado', heldBy: null },
  { id: 'b3', title: 'Veinte Poemas de Amor', author: 'Pablo Neruda', call: '861.44 NER', year: 1924, status: 'disponible', heldBy: null },
  { id: 'b4', title: 'Sapiens', author: 'Yuval Noah Harari', call: '909 HAR', year: 2011, status: 'prestado', heldBy: null },
  { id: 'b5', title: 'Introducción a Algoritmos', author: 'Thomas H. Cormen', call: '005.1 COR', year: 2009, status: 'disponible', heldBy: null },
  { id: 'b6', title: 'El Principito', author: 'Antoine de Saint-Exupéry', call: '843.9 SAI', year: 1943, status: 'disponible', heldBy: null },
  { id: 'b7', title: 'Redes de Computadoras', author: 'Andrew S. Tanenbaum', call: '004.6 TAN', year: 2012, status: 'reservado', heldBy: 'biblioteca' },
  { id: 'b8', title: 'Diseño de Bases de Datos', author: 'Ramez Elmasri', call: '005.74 ELM', year: 2016, status: 'disponible', heldBy: null },
];

function defaultState() {
  return { users: [], books: SEED_BOOKS, loans: [], notices: [] };
}

function load() {
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_err) { /* */ }
  return defaultState();
}

const state = load();

function save() {
  try { window.localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (_err) { /* sin persistencia */ }
}

export const DB = {
  users: {
    upsert(email) {
      let user = state.users.find((u) => u.email === email);
      const isNew = !user;
      if (isNew) {
        user = { email, createdAt: iso(), lastLogin: iso() };
        state.users.push(user);
      } else {
        user.lastLogin = iso();
      }
      save();
      return { user, isNew };
    },
    count: () => state.users.length,
  },
  books: {
    list: () => state.books,
    find: (id) => state.books.find((b) => b.id === id),
    set(id, patch) {
      const book = state.books.find((b) => b.id === id);
      if (book) Object.assign(book, patch);
      save();
    },
  },
  loans: {
    listBy: (email) => state.loans.filter((l) => l.email === email),
    find: (id) => state.loans.find((l) => l.id === id),
    create(email, book) {
      const loan = {
        id: `l${Date.now()}`, email, bookId: book.id,
        title: book.title, author: book.author, due: iso(LOAN_DAYS),
      };
      state.loans.push(loan);
      save();
      return loan;
    },
    remove(id) {
      state.loans = state.loans.filter((l) => l.id !== id);
      save();
    },
  },
  notices: {
    listBy: (email) => state.notices.filter((n) => n.email === email),
    add(email, text, urgent = false) {
      state.notices.unshift({ id: `n${Date.now()}`, email, text, urgent });
      save();
    },
  },
  seedDemoFor(email) {
    state.loans.push(
      { id: 'l1', email, bookId: 'b2', title: 'Clean Code', author: 'Robert C. Martin', due: iso(-5) },
      { id: 'l2', email, bookId: 'b4', title: 'Sapiens', author: 'Yuval Noah Harari', due: iso(9) },
    );
    const b2 = state.books.find((b) => b.id === 'b2');
    const b4 = state.books.find((b) => b.id === 'b4');
    if (b2) b2.heldBy = email;
    if (b4) b4.heldBy = email;
    state.notices.push(
      { id: 'n1', email, urgent: true, text: 'Tu préstamo de "Clean Code" está vencido desde hace varios días.' },
      { id: 'n2', email, urgent: false, text: 'Nuevo ejemplar disponible: "Diseño de Bases de Datos".' },
      { id: 'n3', email, urgent: false, text: 'Recuerda que "Sapiens" vence pronto. Planifica tu devolución.' },
    );
    save();
  },
};