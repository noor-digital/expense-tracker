/* Logique applicative : état, événements, import/export */
import { Store } from './storage.js';
import { UI } from './ui.js';

const { $, fmt, toast } = UI;
const state = {
  expenses: Store.load(),
  budget: Store.getBudget(),
  f: { q: '', cat: '', pay: '', from: '', to: '', sort: 'date-desc' }
};

const sum = list => list.reduce((t, e) => t + e.amount, 0);
const monthOf = d => d.slice(0, 7);

const filtered = () => {
  const { q, cat, pay, from, to, sort } = state.f;
  const needle = q.trim().toLowerCase();
  const sorters = {
    'date-desc': (a, b) => b.date.localeCompare(a.date), 'date-asc': (a, b) => a.date.localeCompare(b.date),
    'amount-desc': (a, b) => b.amount - a.amount, 'amount-asc': (a, b) => a.amount - b.amount
  };
  return state.expenses
    .filter(e => (!needle || e.description.toLowerCase().includes(needle)) &&
      (!cat || e.category === cat) && (!pay || e.payment === pay) &&
      (!from || e.date >= from) && (!to || e.date <= to))
    .sort(sorters[sort]);
};

const metrics = () => {
  const spent = sum(state.expenses.filter(e => monthOf(e.date) === monthOf(Store.today())));
  return { total: sum(state.expenses), count: state.expenses.length, spent, budget: state.budget, left: state.budget - spent };
};

const byCategory = () => Object.entries(
  state.expenses.reduce((acc, e) => (acc[e.category] = (acc[e.category] || 0) + e.amount, acc), {})
).sort((a, b) => b[1] - a[1]);

const byMonth = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    return [m.toLocaleDateString('fr-FR', { month: 'short' }), sum(state.expenses.filter(e => monthOf(e.date) === key))];
  });
};

const render = () => {
  const m = metrics();
  UI.renderCards(m);
  UI.renderBudget(m);
  UI.renderTable(filtered(), state.expenses.length);
  UI.renderStats(byCategory(), byMonth());
};
const commit = () => {
  if (!Store.save(state.expenses)) toast('Enregistrement local impossible : stockage plein ou désactivé.', 'err');
  render();
};

/* Formulaire */
const isRealDate = s => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};
const validate = r => {
  const errs = {};
  if (!r.description) errs.description = 'Saisissez une description.';
  if (!(r.amount > 0 && r.amount <= 1e9)) errs.amount = 'Saisissez un montant entre 1 et 1 000 000 000 FCFA.';
  if (!isRealDate(r.date)) errs.date = 'Choisissez une date valide.';
  return errs;
};

const openForm = e => { UI.fillForm(e || { date: Store.today() }); UI.open('#formDlg'); };

$('#expForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const r = UI.readForm();
  const errs = validate(r);
  UI.showErrors(errs);
  if (Object.keys(errs).length) return;
  if (r.id) {
    state.expenses = state.expenses.map(e => e.id === r.id ? r : e);
    toast('Dépense modifiée');
  } else {
    state.expenses.push({ ...r, id: Store.uid() });
    toast('Dépense ajoutée');
  }
  commit();
  $('#formDlg').close();
});

/* Liste : modifier / supprimer */
$('#rows').addEventListener('click', async ev => {
  const edit = ev.target.closest('[data-edit]');
  const del = ev.target.closest('[data-del]');
  if (edit) openForm(state.expenses.find(e => e.id === edit.dataset.edit));
  if (del && await UI.confirm('Supprimer définitivement cette dépense ?')) {
    state.expenses = state.expenses.filter(e => e.id !== del.dataset.del);
    commit();
    toast('Dépense supprimée');
  }
});

/* Filtres */
const bindFilter = (id, key) => $(id).addEventListener('input', e => { state.f[key] = e.target.value; render(); });
[['#fQ', 'q'], ['#fCat', 'cat'], ['#fPay', 'pay'], ['#fFrom', 'from'], ['#fTo', 'to'], ['#fSort', 'sort']].forEach(a => bindFilter(...a));
$('#resetBtn').addEventListener('click', () => {
  state.f = { q: '', cat: '', pay: '', from: '', to: '', sort: 'date-desc' };
  $('#filters').reset();
  render();
});
$('#filters').addEventListener('submit', e => e.preventDefault());

/* Budget */
$('#budgetForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const v = Number($('#budgetInput').value);
  if (!Number.isFinite(v) || v < 0) return toast('Le budget doit être un nombre positif.', 'err');
  state.budget = v;
  Store.setBudget(v);
  render();
  toast('Budget enregistré');
});

/* CSV */
const cell = v => `"${String(v).replace(/"/g, '""')}"`;
const parseCSV = text => {
  const rows = []; let row = [], cur = '', quoted = false;
  const delim = text.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
};

$('#exportBtn').addEventListener('click', () => {
  if (!state.expenses.length) return toast('Aucune dépense à exporter.', 'err');
  const head = ['description', 'montant', 'categorie', 'date', 'paiement', 'note'];
  const lines = state.expenses.map(e => [e.description, e.amount, e.category, e.date, e.payment, e.note].map(cell).join(','));
  const blob = new Blob(['\ufeff' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `depenses-${Store.today()}.csv` });
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Export CSV terminé');
});

$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  if (file.size > 1e6) return toast('Fichier trop volumineux (1 Mo maximum).', 'err');
  let rows;
  try { rows = parseCSV(await file.text()); } catch { return toast('Impossible de lire ce fichier.', 'err'); }
  if (rows.length && rows[0][0].trim().toLowerCase() === 'description') rows.shift();
  const valid = rows.map(([description = '', amount = '', category = '', date = '', payment = '', note = '']) => ({
    id: Store.uid(), description: description.trim().slice(0, 80), amount: Math.round(Number(amount.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'))),
    category: Store.CATS.includes(category.trim()) ? category.trim() : 'Autre',
    date: date.trim(), payment: Store.PAYS.includes(payment.trim()) ? payment.trim() : 'Espèces', note: note.trim().slice(0, 200)
  })).filter(r => Object.keys(validate(r)).length === 0);
  if (!valid.length) return toast('Aucune ligne valide dans ce fichier.', 'err');
  state.expenses.push(...valid);
  commit();
  toast(`${valid.length} dépense(s) importée(s), ${rows.length - valid.length} ignorée(s)`);
});

$('#clearBtn').addEventListener('click', async () => {
  if (await UI.confirm('Supprimer toutes les dépenses ? Cette action est irréversible.')) {
    state.expenses = [];
    Store.clear();
    render();
    toast('Toutes les données ont été supprimées');
  }
});

/* Navigation, thème, fermeture des modales */
$('#nav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) UI.show(b.dataset.view); });
$('#addBtn').addEventListener('click', () => openForm());
document.addEventListener('click', e => e.target.closest('[data-close]')?.closest('dialog').close());
$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  UI.setTheme(next);
  Store.setTheme(next);
});

/* Initialisation */
UI.setTheme(Store.getTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
UI.options($('#fCat'), Store.CATS, 'Toutes les catégories');
UI.options($('#fPay'), Store.PAYS, 'Tous les paiements');
UI.options($('#eCat'), Store.CATS);
UI.options($('#ePay'), Store.PAYS);
render();
