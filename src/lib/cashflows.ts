export type CashFlow = {
  id: string;
  kind: "income" | "expense";
  name: string;
  amount: number | string;
  currency: string;
  frequency: "monthly" | "weekly" | "once";
  flow_date: string | null; // monthly: solo importa el día; once: fecha exacta
  category: string | null;
  property: string | null;
  notes?: string | null;
};

export const FREQUENCIES = [
  { value: "monthly", label: "Mensual" },
  { value: "weekly", label: "Semanal" },
  { value: "once", label: "Único" },
] as const;

export const CATEGORY_SUGGESTIONS = {
  income: ["Honorarios", "Sueldo", "Arriendo", "Intereses", "Bonos", "Reembolsos", "Otros"],
  expense: ["Alquiler", "Mercado", "Servicios", "Seguros", "Mascota", "Aseo", "Transporte", "Ocio", "Salud", "Crédito", "Administración", "Otros"],
};

/** Cuánto pesa en el mes `month` ("AAAA-MM"): mensual tal cual, semanal × 52/12, único solo en su mes. */
export function monthlyAmount(flow: { amount: number | string; frequency: string; flow_date: string | null }, month: string) {
  const amount = Number(flow.amount) || 0;
  if (flow.frequency === "weekly") return (amount * 52) / 12;
  if (flow.frequency === "once") return flow.flow_date?.startsWith(month) ? amount : 0;
  return amount;
}

/** Ingresos, gastos y lo que queda en el mes, por moneda (las monedas no se mezclan). */
export function monthTotals(flows: CashFlow[], month: string) {
  const map = new Map<string, { currency: string; income: number; expenses: number }>();
  for (const f of flows) {
    const t = map.get(f.currency) ?? { currency: f.currency, income: 0, expenses: 0 };
    t[f.kind === "income" ? "income" : "expenses"] += monthlyAmount(f, month);
    map.set(f.currency, t);
  }
  return [...map.values()]
    .filter((t) => t.income || t.expenses)
    .map((t) => ({ ...t, left: t.income - t.expenses }));
}

/** Ingresos o gastos del mes por categoría en una moneda, de mayor a menor. */
export function byCategory(flows: CashFlow[], month: string, currency: string, kind: "income" | "expense") {
  const map = new Map<string, number>();
  for (const f of flows) {
    if (f.kind !== kind || f.currency !== currency) continue;
    const key = f.category || "Sin categoría";
    map.set(key, (map.get(key) ?? 0) + monthlyAmount(f, month));
  }
  return [...map].map(([name, value]) => ({ name, value })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
}

/** Por apartamento: totales del mes en cada moneda que usen sus filas. */
export function propertyTotals(flows: CashFlow[], month: string) {
  const props = [...new Set(flows.map((f) => f.property).filter(Boolean))] as string[];
  return props.map((property) => ({
    property,
    totals: monthTotals(
      flows.filter((f) => f.property === property),
      month,
    ),
  }));
}
