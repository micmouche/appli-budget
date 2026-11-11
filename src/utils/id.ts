/** Identifiants uniques courts (pas besoin d'UUID RFC pour une base locale). */
export function newId(prefix = ''): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}${time}${rand}`;
}
