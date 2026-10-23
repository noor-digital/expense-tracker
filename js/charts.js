/* Graphiques HTML/CSS sans dépendance */
export const Charts = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const empty = '<p class="muted">Pas encore de données.</p>';

  return {
    bars(el, entries, fmt) {
      const total = entries.reduce((t, [, v]) => t + v, 0);
      el.innerHTML = total ? entries.map(([label, v]) => `
        <div class="bar-row">
          <span>${esc(label)}</span>
          <div class="track"><i style="width:${(v / total * 100).toFixed(1)}%"></i></div>
          <b>${Math.round(v / total * 100)} % · ${fmt(v)}</b>
        </div>`).join('') : empty;
    },
    columns(el, entries, fmt) {
      const max = Math.max(...entries.map(([, v]) => v), 0);
      el.innerHTML = max ? `<div class="cols">${entries.map(([label, v]) => `
        <div class="col" title="${esc(label)} : ${fmt(v)}">
          <small>${v ? fmt(v).replace(' FCFA', '') : ''}</small>
          <i style="height:${Math.max(v / max * 100, v ? 3 : 0)}%"></i>
          <span>${esc(label)}</span>
        </div>`).join('')}</div>` : empty;
    }
  };
})();
