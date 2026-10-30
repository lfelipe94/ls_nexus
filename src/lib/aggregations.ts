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

/**
 * Agrupa pagos por mes (próximos N meses desde hoy) y por moneda, para una
 * gráfica de barras agrupadas. Cada fila resultante tiene la forma:
 * { month: "nov 2026", COP: 500000, USD: 120 }
 */
export function paymentsByMonth(
  rows: { amount: number | string; currency: string; due_date: string }[],
  monthsAhead = 6
) {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);

  const buckets: { key: string; label: string; values: Record<string, number> }[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
    buckets.push({ key, label, values: {} });
  }

  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  const currencies = new Set<string>();

  for (const row of rows) {
    const d = new Date(row.due_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;
    currencies.add(row.currency);
    bucket.values[row.currency] = (bucket.values[row.currency] ?? 0) + Number(row.amount);
  }

  return {
    data: buckets.map((b) => ({ month: b.label, ...b.values })),
    currencies: Array.from(currencies),
  };
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
