export type CurrencyTotal = { currency: string; total: number };

export function sumByCurrency(
  rows: { amount: number | string; currency: string }[]
): CurrencyTotal[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.currency, (map.get(row.currency) ?? 0) + Number(row.amount));
  }
  return Array.from(map.entries()).map(([currency, total]) => ({ currency, total }));
}

/** Suma montos por una clave (tipo, plataforma…) dentro de una moneda, de mayor a menor. */
export function groupSum<T extends { amount: number | string; currency: string }>(
  rows: T[],
  currency: string,
  label: (row: T) => string
) {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.currency !== currency) continue;
    map.set(label(r), (map.get(label(r)) ?? 0) + Number(r.amount));
  }
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
