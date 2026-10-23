/* Rendu et interactions avec le DOM */
import { Store } from './storage.js';
import { Charts } from './charts.js';

export const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ') + ' FCFA';
  const fdate = d => new Date(d + 'T00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const toast = (msg, type = 'ok') => {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    $('#toasts').append(t);
    setTimeout(() => t.remove(), 3200);
  };

  const options = (sel, list, placeholder) =>
    sel.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') +
      list.map(v => `<option>${esc(v)}</option>`).join('');

  const card = (label, value, cls = '') => `<div class="card ${cls}"><span>${label}</span><strong>${value}</strong></div>`;

  return {
    $, fmt, toast, options,
    setTheme(t) { document.documentElement.dataset.theme = t; },
    show(view) {
      document.querySelectorAll('.view').forEach(s => s.hidden = s.id !== view);
      document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
    },
    open: sel => $(sel).showModal(),
    confirm(msg) {
      return new Promise(resolve => {
        const d = $('#confirmDlg');
        $('#confirmMsg').textContent = msg;
        d.returnValue = '';
        d.onclose = () => resolve(d.returnValue === 'ok');
        d.showModal();
      });
    },
    fillForm(e) {
      $('#formTitle').textContent = e.id ? 'Modifier la dépense' : 'Ajouter une dépense';
      $('#eId').value = e.id || '';
      $('#eDesc').value = e.description || '';
      $('#eAmount').value = e.amount || '';
      $('#eDate').value = e.date || '';
      $('#eCat').value = e.category || Store.CATS[0];
      $('#ePay').value = e.payment || Store.PAYS[0];
      $('#eNote').value = e.note || '';
      this.showErrors({});
    },
    readForm: () => ({
      id: $('#eId').value, description: $('#eDesc').value.trim(), amount: Math.round(Number($('#eAmount').value)),
      date: $('#eDate').value, category: $('#eCat').value, payment: $('#ePay').value, note: $('#eNote').value.trim()
    }),
    showErrors(errs) {
      document.querySelectorAll('.err').forEach(el => el.textContent = errs[el.dataset.for] || '');
    },
    renderCards(m) {
      $('#cards').innerHTML =
        card('Total des dépenses', fmt(m.total)) + card('Transactions', m.count) +
        card('Dépenses du mois', fmt(m.spent)) + card('Budget mensuel', fmt(m.budget)) +
        card('Montant restant', fmt(m.left), m.left < 0 ? 'neg' : '');
    },
    renderBudget(m) {
      const pct = m.budget > 0 ? m.spent / m.budget * 100 : 0;
      const state = m.budget <= 0 ? '' : pct > 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
      $('#meterFill').style.width = Math.min(pct, 100) + '%';
      $('#meter').className = 'meter ' + state;
      $('#meter').setAttribute('aria-valuenow', Math.round(pct));
      $('#budgetInput').value = m.budget;
      $('#budgetMsg').className = 'msg ' + state;
      $('#budgetMsg').textContent =
        m.budget <= 0 ? 'Définissez un budget mensuel pour suivre votre consommation.' :
        pct > 100 ? `Budget dépassé de ${fmt(-m.left)} (${Math.round(pct)} % utilisé).` :
        pct >= 80 ? `Attention : ${Math.round(pct)} % du budget utilisé, il reste ${fmt(m.left)}.` :
        `Dans le budget : ${Math.round(pct)} % utilisé, il reste ${fmt(m.left)}.`;
    },
    renderTable(list, totalCount) {
      $('#count').textContent = `${list.length} dépense${list.length > 1 ? 's' : ''} affichée${list.length > 1 ? 's' : ''} sur ${totalCount}`;
      $('#rows').innerHTML = list.length ? list.map(e => `
        <tr>
          <td data-label="Date">${fdate(e.date)}</td>
          <td data-label="Description">${esc(e.description)}${e.note ? `<small class="muted">${esc(e.note)}</small>` : ''}</td>
          <td data-label="Catégorie"><span class="tag">${esc(e.category)}</span></td>
          <td data-label="Paiement">${esc(e.payment)}</td>
          <td data-label="Montant" class="num">${fmt(e.amount)}</td>
          <td class="acts">
            <button class="ghost sm" data-edit="${e.id}" aria-label="Modifier ${esc(e.description)}">Modifier</button>
            <button class="danger sm" data-del="${e.id}" aria-label="Supprimer ${esc(e.description)}">Supprimer</button>
          </td>
        </tr>`).join('') :
        '<tr class="none"><td colspan="6">Aucune dépense ne correspond. Modifiez les filtres ou ajoutez une dépense.</td></tr>';
    },
    renderStats(cats, months) {
      $('#topCat').textContent = cats.length ? `${cats[0][0]} : ${fmt(cats[0][1])}` : 'Aucune dépense enregistrée.';
      Charts.bars($('#chartCat'), cats, fmt);
      Charts.columns($('#chartMonth'), months, fmt);
    }
  };
})();
