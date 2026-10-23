/* Données et persistance (localStorage) */
export const Store = (() => {
  const CATS = ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Éducation', 'Autre'];
  const PAYS = ['Espèces', 'Carte', 'Mobile Money', 'Virement'];
  const KEY = { exp: 'expense-tracker:expenses', bud: 'expense-tracker:budget', theme: 'expense-tracker:theme' };

  const get = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const daysAgo = n => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const demo = () => [
    ['Courses au marché', 18500, 'Alimentation', 1, 'Espèces'], ['Course en taxi', 3500, 'Transport', 2, 'Mobile Money'],
    ['Loyer', 150000, 'Logement', 3, 'Virement'], ['Pharmacie', 7200, 'Santé', 5, 'Espèces'],
    ['Cinéma', 5000, 'Loisirs', 7, 'Carte'], ['Chaussures', 28000, 'Shopping', 9, 'Carte'],
    ['Cours en ligne', 15000, 'Éducation', 12, 'Carte'], ['Restaurant', 12500, 'Alimentation', 15, 'Carte'],
    ['Abonnement transport', 10000, 'Transport', 24, 'Mobile Money'], ['Loyer', 150000, 'Logement', 33, 'Virement'],
    ['Courses', 42000, 'Alimentation', 38, 'Espèces'], ['Consultation', 15000, 'Santé', 50, 'Espèces'],
    ['Loyer', 150000, 'Logement', 63, 'Virement'], ['Vêtements', 32000, 'Shopping', 70, 'Carte'],
    ['Livres', 9000, 'Éducation', 85, 'Mobile Money']
  ].map(([description, amount, category, d, payment]) =>
    ({ id: uid(), description, amount, category, date: daysAgo(d), payment, note: '' }));

  return {
    CATS, PAYS, uid, today: () => daysAgo(0),
    load() { const saved = get(KEY.exp, null); if (Array.isArray(saved)) return saved; const seed = demo(); set(KEY.exp, seed); return seed; },
    save: list => set(KEY.exp, list),
    getBudget: () => get(KEY.bud, 300000),
    setBudget: n => set(KEY.bud, n),
    getTheme: () => get(KEY.theme, null),
    setTheme: t => set(KEY.theme, t),
    clear() { set(KEY.exp, []); }
  };
})();
