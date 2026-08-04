/* SoftBiblio · Base de datos local */
const DB_KEY = 'softbiblio:db:v2';
const DAY_MS = 86400000;

export const LOAN_DAYS = 14;
export const FINE_PER_DAY = 0.50;

function iso(offsetDays = 0) { return new Date(Date.now() + offsetDays * DAY_MS).toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(isoDate, days) {
  const d = new Date(isoDate); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysLate(dueISO) {
  const due = new Date(dueISO).getTime();
  return Math.max(0, Math.ceil((Date.now() - due) / DAY_MS));
}
export function fineFor(loan) { return daysLate(loan.due || loan.dueDate) * FINE_PER_DAY; }
function nextSeq(prefix, existing) {
  const nums = existing.filter((c) => typeof c === 'string' && c.startsWith(prefix))
    .map((c) => parseInt(c.slice(prefix.length), 10)).filter((n) => !isNaN(n));
  return `${prefix}${String(Math.max(0, ...nums) + 1).padStart(4, '0')}`;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const Validators = {
  text: (v, min = 2) => typeof v === 'string' && v.trim().length >= min,
  email: (v) => EMAIL_RE.test((v || '').trim()),
  cedula: (v) => /^\d{6,13}$/.test((v || '').trim()),
  positiveInt: (v) => { const n = parseInt(v, 10); return !isNaN(n) && n >= 1; },
  phone: (v) => !v || /^[\d\s+()-]{6,20}$/.test(v.trim()),
};

const SEED_BOOKS = [
  { id: 'b1', code: 'LIB-0001', title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', isbn: '9780307474728', year: '1967', copies: 3, available: 3 },
  { id: 'b2', code: 'LIB-0002', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', year: '2008', copies: 2, available: 2 },
  { id: 'b3', code: 'LIB-0003', title: 'Veinte Poemas de Amor', author: 'Pablo Neruda', isbn: '9788434410763', year: '1924', copies: 2, available: 2 },
  { id: 'b4', code: 'LIB-0004', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', year: '2011', copies: 2, available: 2 },
  { id: 'b5', code: 'LIB-0005', title: 'Introducción a Algoritmos', author: 'Thomas H. Cormen', isbn: '9780262033848', year: '2009', copies: 1, available: 1 },
  { id: 'b6', code: 'LIB-0006', title: 'El Principito', author: 'Antoine de Saint-Exupéry', isbn: '9780156012195', year: '1943', copies: 4, available: 4 },
  { id: 'b7', code: 'LIB-0007', title: 'Redes de Computadoras', author: 'Andrew S. Tanenbaum', isbn: '9780132126953', year: '2012', copies: 2, available: 2 },
  { id: 'b8', code: 'LIB-0008', title: 'Diseño de Bases de Datos', author: 'Ramez Elmasri', isbn: '9788478290840', year: '2016', copies: 1, available: 1 },
];
const SEED_USERS = [
  { id: 'u1', code: 'SOC-0001', name: 'Elian', last: 'Peña', cedula: '1104685932', email: 'elian@tecnologicoloja.edu.ec', phone: '0987654321', status: 'Activo', createdAt: iso(-30) },
  { id: 'u2', code: 'SOC-0002', name: 'Alex', last: 'Torres', cedula: '1103456789', email: 'alextorres@tecnologicoloja.edu.ec', phone: '0912345678', status: 'Activo', createdAt: iso(-20) },
];

function defaultState() { return { users: SEED_USERS, books: SEED_BOOKS, loans: [], notices: [] }; }
function load() {
  try { const raw = window.localStorage.getItem(DB_KEY); if (raw) return JSON.parse(raw); } catch (_) {}
  return defaultState();
}
const state = load();
function save() { try { window.localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (_) {} }

const users = {
  list: (q = '') => {
    const t = q.trim().toLowerCase();
    const rows = !t ? state.users : state.users.filter((u) =>
      u.name.toLowerCase().includes(t) || u.last.toLowerCase().includes(t) ||
      u.cedula.includes(t) || u.email.toLowerCase().includes(t) || u.code.toLowerCase().includes(t));
    return rows.slice().sort((a, b) => b.id.localeCompare(a.id));
  },
  find: (id) => state.users.find((u) => u.id === id),
  findActive: () => state.users.filter((u) => u.status === 'Activo'),
  idGen: () => `u${Date.now()}`,
  codeGen: () => nextSeq('SOC-', state.users.map((u) => u.code)),
  isUnique: (field, value, excludeId = null) =>
    !state.users.some((u) => u[field] === value && u.id !== excludeId),
  create: (data) => {
    const user = {
      id: users.idGen(), code: users.codeGen(),
      name: data.name.trim(), last: data.last.trim(), cedula: data.cedula.trim(),
      email: data.email.trim().toLowerCase(), phone: (data.phone || '').trim(),
      status: data.status || 'Activo', createdAt: iso(),
    };
    state.users.push(user); save(); return user;
  },
  update: (id, data) => {
    const u = users.find(id); if (!u) return null;
    Object.assign(u, {
      name: data.name.trim(), last: data.last.trim(), cedula: data.cedula.trim(),
      email: data.email.trim().toLowerCase(), phone: (data.phone || '').trim(),
      status: data.status || u.status,
    });
    save(); return u;
  },
  toggleStatus: (id) => {
    const u = users.find(id); if (!u) return null;
    u.status = u.status === 'Activo' ? 'Inactivo' : 'Activo';
    save(); return u;
  },
  count: () => state.users.length,
  activeCount: () => state.users.filter((u) => u.status === 'Activo').length,
  upsert: (email) => {
    let user = state.users.find((u) => u.email === email);
    const isNew = !user;
    if (isNew) {
      const parts = email.split('@')[0].split(/[._-]/);
      const name = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Usuario';
      const last = parts.slice(1).join(' ') || 'Nuevo';
      user = {
        id: users.idGen(), code: users.codeGen(), name, last,
        cedula: `0000${String(state.users.length + 1).padStart(9, '0')}`,
        email, phone: '', status: 'Activo', createdAt: iso(),
      };
      state.users.push(user);
    }
    save();
    return { user, isNew };
  },
};

const books = {
  list: (q = '') => {
    const t = q.trim().toLowerCase();
    const rows = !t ? state.books : state.books.filter((b) =>
      b.title.toLowerCase().includes(t) || b.author.toLowerCase().includes(t) ||
      b.code.toLowerCase().includes(t) || (b.isbn || '').includes(t));
    return rows.slice().sort((a, b) => a.title.localeCompare(b.title));
  },
  find: (id) => state.books.find((b) => b.id === id),
  available: () => state.books.filter((b) => b.available > 0),
  idGen: () => `b${Date.now()}`,
  codeGen: () => nextSeq('LIB-', state.books.map((b) => b.code)),
  create: (data) => {
    const copies = parseInt(data.copies, 10);
    const book = {
      id: books.idGen(), code: books.codeGen(),
      title: data.title.trim(), author: data.author.trim(),
      isbn: (data.isbn || '').trim() || null, year: (data.year || '').trim() || null,
      copies, available: copies,
    };
    state.books.push(book); save(); return book;
  },
  update: (id, data) => {
    const b = books.find(id); if (!b) return null;
    const lent = b.copies - b.available;
    const newCopies = parseInt(data.copies, 10);
    if (newCopies < lent) return { error: `Hay ${lent} ejemplar(es) prestado(s); no puedes reducir a menos.` };
    Object.assign(b, {
      title: data.title.trim(), author: data.author.trim(),
      isbn: (data.isbn || '').trim() || null, year: (data.year || '').trim() || null,
      copies: newCopies, available: newCopies - lent,
    });
    save(); return b;
  },
  count: () => state.books.length,
  availableCount: () => state.books.reduce((s, b) => s + b.available, 0),
};

const loans = {
  list: (q = '', onlyPending = false) => {
    const t = q.trim().toLowerCase();
    let rows = state.loans.slice();
    if (onlyPending) rows = rows.filter((l) => l.status === 'Prestado');
    if (t) {
      rows = rows.filter((l) => {
        const u = users.find(l.userId);
        const uName = u ? `${u.name} ${u.last}`.toLowerCase() : '';
        const bTitle = (l.bookTitle || '').toLowerCase();
        return uName.includes(t) || bTitle.includes(t) || l.code.toLowerCase().includes(t);
      });
    }
    return rows.sort((a, b) => b.id.localeCompare(a.id));
  },
  find: (id) => state.loans.find((l) => l.id === id),
  listBy: (email) => {
    const u = state.users.find((x) => x.email === email);
    return u ? state.loans.filter((l) => l.userId === u.id) : [];
  },
  idGen: () => `l${Date.now()}`,
  codeGen: () => nextSeq('PRE-', state.loans.map((l) => l.code)),
  create: (userId, bookId) => {
    const u = users.find(userId); const b = books.find(bookId);
    if (!u || u.status !== 'Activo') return { error: 'Usuario inválido o inactivo.' };
    if (!b || b.available < 1) return { error: 'No hay ejemplares disponibles.' };
    const loanDate = today(); const dueDate = addDays(loanDate, LOAN_DAYS);
    const loan = {
      id: loans.idGen(), code: loans.codeGen(), userId, bookId,
      bookTitle: b.title, bookAuthor: b.author,
      loanDate, dueDate, returnDate: null, fine: 0, status: 'Prestado',
    };
    state.loans.push(loan); b.available -= 1; save(); return loan;
  },
  return: (id) => {
    const l = loans.find(id);
    if (!l || l.status !== 'Prestado') return { error: 'Préstamo no válido o ya devuelto.' };
    const b = books.find(l.bookId);
    if (b) b.available += 1;
    l.returnDate = today(); l.status = 'Devuelto';
    l.fine = fineFor({ due: l.dueDate }); save(); return l;
  },
  activeCount: () => state.loans.filter((l) => l.status === 'Prestado').length,
  pendingFines: () => state.loans.filter((l) => l.status === 'Prestado').reduce((s, l) => s + fineFor({ due: l.dueDate }), 0),
};

const notices = {
  list: () => state.notices,
  listBy: (email) => state.notices.filter((n) => n.email === email),
  add: (email, text, urgent = false) => {
    state.notices.unshift({ id: `n${Date.now()}`, email, text, urgent, at: iso() });
    save();
  },
};

export const DB = { users, books, loans, notices };

DB.seedDemoFor = (email) => {
  const user = state.users.find((u) => u.email === email);
  if (!user) return;
  [state.books[1], state.books[3]].forEach((b, idx) => {
    if (!b || b.available < 1) return;
    state.loans.push({
      id: loans.idGen(), code: loans.codeGen(), userId: user.id, bookId: b.id,
      bookTitle: b.title, bookAuthor: b.author,
      loanDate: iso(idx === 0 ? -10 : -20).slice(0, 10),
      dueDate: iso(idx === 0 ? 4 : -6).slice(0, 10),
      returnDate: null, fine: 0, status: 'Prestado',
    });
    b.available -= 1;
  });
  save();
};