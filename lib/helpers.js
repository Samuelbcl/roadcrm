export const uid = () => Math.random().toString(36).slice(2, 9);
export const pad = (n) => String(n).padStart(2, "0");
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export const getDateGroup = (isoDate) => {
  const d = new Date(isoDate);
  const now = new Date();
  const todayKey = toKey(now);
  const dKey = toKey(d);
  if (dKey === todayKey) return "Aujourd'hui";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (dKey === toKey(yesterday)) return "Hier";
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  if (d >= weekAgo) return "Cette semaine";
  return "Plus ancien";
};
export const GROUP_ORDER = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

export const getCalDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let start = first.getDay() - 1; if (start < 0) start = 6;
  const days = [];
  for (let i = start - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), cur: false });
  for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(year, month, i), cur: true });
  const rem = 7 - (days.length % 7); if (rem < 7) for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month + 1, i), cur: false });
  return days;
};
