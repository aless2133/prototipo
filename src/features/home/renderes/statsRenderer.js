import { DB } from '../../../lib/db.js';

export function renderStats(wrap) {
  if (!wrap) return;
  const users = DB.users.count();
  const activeUsers = DB.users.activeCount();
  const books = DB.books.count();
  const available = DB.books.availableCount();
  const activeLoans = DB.loans.activeCount();
  const pendingFines = DB.loans.pendingFines();

  const cards = [
    { value: `${users}`, label: 'Usuarios totales', sub: `${activeUsers} activos` },
    { value: `${books}`, label: 'Libros en catálogo', sub: `${available} disponibles` },
    { value: `${activeLoans}`, label: 'Préstamos activos' },
    { value: `$${pendingFines.toFixed(2)}`, label: 'Multas pendientes' },
  ];
  wrap.innerHTML = cards.map((c) => `
    <div class="card stat-card">
      <span class="stat-card__value">${c.value}</span>
      <span class="stat-card__label">${c.label}</span>
      ${c.sub ? `<span class="text-muted" style="font-size: var(--text-xs);">${c.sub}</span>` : ''}
    </div>
  `).join('');
}