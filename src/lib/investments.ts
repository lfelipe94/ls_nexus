export const CATEGORIES = [
  { value: "vivienda", label: "Vivienda" },
  { value: "cdt", label: "CDT" },
  { value: "fondo", label: "Fondo de inversión" },
  { value: "acciones", label: "Acciones" },
  { value: "otro", label: "Otro" },
] as const;

export const PLATFORMS = ["Tyba", "Nu", "Happi", "Trii", "Bancolombia", "Davivienda", "Fiducia"];

export function categoryLabel(value: string | null) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Otro";
}

type Credit = {
  credit_amount: number | string | null;
  interest_rate: number | string | null;
  credit_term_months: number | null;
};

/** Cuota mensual estimada (sistema francés) con tasa efectiva anual. null si faltan datos. */
export function monthlyPayment(c: Credit) {
  const P = Number(c.credit_amount);
  const n = c.credit_term_months;
  if (!P || !n) return null;
  const ea = Number(c.interest_rate ?? 0) / 100;
  const i = Math.pow(1 + ea, 1 / 12) - 1;
  return i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));
}

/** Próxima fecha de pago para un día del mes (ajustado al último día de meses cortos). */
export function nextPaymentDate(day: number | null, from = new Date()) {
  if (!day) return null;
  for (let m = 0; m < 2; m++) {
    const last = new Date(from.getFullYear(), from.getMonth() + m + 1, 0).getDate();
    const d = new Date(from.getFullYear(), from.getMonth() + m, Math.min(day, last));
    if (d.getTime() >= new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()) return d;
  }
  return null;
}

/** Aplica tu porcentaje de propiedad a montos, valores y crédito (la deuda y la cuota también se reparten). */
export function myShare<
  T extends {
    amount: number | string;
    credit_amount?: number | string | null;
    current_value?: number | string | null;
    purchase_price?: number | string | null;
    ownership_pct?: number | string | null;
  },
>(inv: T): T & { amount: number } {
  const f = Number(inv.ownership_pct ?? 100) / 100;
  const scale = (v: number | string | null | undefined) => (v == null ? null : Number(v) * f);
  return {
    ...inv,
    amount: Number(inv.amount) * f,
    credit_amount: scale(inv.credit_amount),
    current_value: scale(inv.current_value),
    purchase_price: scale(inv.purchase_price),
  };
}

const DAY = 86_400_000;
const daysBetween = (from: string, to: Date) => (to.getTime() - new Date(from).getTime()) / DAY;

type Valued = {
  amount: number | string;
  category: string | null;
  current_value?: number | string | null;
  purchase_price?: number | string | null;
  interest_rate?: number | string | null;
  start_date?: string | null;
  maturity_date?: string | null;
};

/** Valor de hoy: el que escribiste; en CDT se estima con la tasa E.A. hasta el vencimiento. */
export function currentValue(inv: Valued, today = new Date()) {
  if (inv.category === "vivienda") return Number(inv.current_value ?? inv.purchase_price ?? inv.amount);
  if (inv.current_value != null) return Number(inv.current_value);
  if (inv.category === "cdt" && inv.start_date && inv.interest_rate != null) {
    const end = inv.maturity_date && new Date(inv.maturity_date) < today ? new Date(inv.maturity_date) : today;
    const days = Math.max(0, daysBetween(inv.start_date, end));
    return Number(inv.amount) * Math.pow(1 + Number(inv.interest_rate) / 100, days / 365);
  }
  return Number(inv.amount);
}

export type Movement = {
  id: string;
  investment_id: string;
  kind: "deposit" | "withdrawal" | "rate";
  movement_date: string;
  amount: number | string | null;
  ea_rate: number | string | null;
  notes?: string | null;
};

/**
 * Fondos con aportes, retiros y tasas históricas: `amount` pasa a ser lo aportado neto y, si no
 * escribiste un valor actual, `current_value` se estima capitalizando cada tramo con la tasa E.A. vigente.
 * Así dashboard, lista y detalle reutilizan currentValue()/myShare() sin cambios.
 */
export function withMovements<
  T extends { id: string; category: string | null; amount: number | string; current_value?: number | string | null; interest_rate?: number | string | null; start_date?: string | null; created_at?: string },
>(inv: T, all: Movement[], today = new Date()): T {
  if (inv.category === "vivienda" || inv.category === "cdt") return inv;
  const todayStr = today.toISOString().slice(0, 10);
  const events = all
    .filter((m) => m.investment_id === inv.id && m.movement_date <= todayStr)
    .sort((a, b) => a.movement_date.localeCompare(b.movement_date));
  if (events.length === 0 && inv.interest_rate == null) return inv;

  const start = inv.start_date ?? inv.created_at?.slice(0, 10) ?? events[0]?.movement_date ?? todayStr;
  const timeline = [
    { kind: "deposit", movement_date: start, amount: inv.amount, ea_rate: null },
    ...events,
  ].sort((a, b) => a.movement_date.localeCompare(b.movement_date));

  // Tasa inicial = la del formulario; si no hay, la primera registrada; sin ninguna no hay rendimiento.
  let rate = Number(inv.interest_rate ?? events.find((m) => m.kind === "rate")?.ea_rate ?? 0) / 100;
  let balance = 0;
  let contributed = 0;
  let cursor = timeline[0].movement_date;
  for (const m of timeline) {
    balance *= Math.pow(1 + rate, daysBetween(cursor, new Date(m.movement_date)) / 365);
    cursor = m.movement_date;
    if (m.kind === "rate") rate = Number(m.ea_rate) / 100;
    else {
      const sign = m.kind === "deposit" ? 1 : -1;
      balance += sign * Number(m.amount);
      contributed += sign * Number(m.amount);
    }
  }
  balance *= Math.pow(1 + rate, daysBetween(cursor, today) / 365);
  return { ...inv, amount: contributed, current_value: inv.current_value ?? balance };
}

/**
 * Tasa E.A. implícita (XIRR): la que hace que los aportes y retiros fechados terminen justo en `value` hoy.
 * null si hay menos de 30 días (se dispara) o no hay solución.
 */
export function impliedRate(
  inv: { amount: number | string; start_date?: string | null; created_at?: string },
  all: Movement[],
  value: number,
  today = new Date(),
) {
  const start = inv.start_date ?? inv.created_at?.slice(0, 10);
  if (!start) return null;
  const flows = [
    { date: start, cf: -Number(inv.amount) },
    ...all
      .filter((m) => m.kind !== "rate" && m.movement_date <= today.toISOString().slice(0, 10))
      .map((m) => ({ date: m.movement_date, cf: (m.kind === "deposit" ? -1 : 1) * Number(m.amount) })),
    { date: today.toISOString().slice(0, 10), cf: value },
  ];
  if (daysBetween(start, today) < 30) return null;
  const npv = (r: number) => flows.reduce((s, f) => s + f.cf / Math.pow(1 + r, daysBetween(start, new Date(f.date)) / 365), 0);
  let lo = -0.99;
  let hi = 10;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Tiempo desde la compra y valorización (total y anualizada). null si falta la fecha o el precio de compra. */
export function appreciation(
  inv: Valued & { purchase_date?: string | null },
  today = new Date(),
) {
  if (!inv.purchase_date || !inv.purchase_price) return null;
  const days = Math.max(0, Math.floor(daysBetween(inv.purchase_date, today)));
  const total = currentValue(inv) / Number(inv.purchase_price) - 1;
  // ponytail: bajo 30 días la anualización se dispara; se omite hasta tener un mes de tenencia.
  const yearly = days >= 30 ? Math.pow(1 + total, 365 / days) - 1 : null;
  const months = Math.floor(days / 30.4375);
  return { days, years: Math.floor(months / 12), months: months % 12, total, yearly };
}

/** Avance del crédito desde el desembolso: cuotas pagadas, saldo e intereses pagados. null si faltan datos. */
export function creditProgress(c: Credit & { start_date?: string | null }, today = new Date()) {
  const cuota = monthlyPayment(c);
  if (!cuota || !c.start_date || !c.credit_term_months) return null;
  const P = Number(c.credit_amount);
  const i = Math.pow(1 + Number(c.interest_rate ?? 0) / 100, 1 / 12) - 1;
  const start = new Date(c.start_date);
  const months = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
  const k = Math.min(Math.max(months, 0), c.credit_term_months);
  const balance = i === 0 ? P - cuota * k : P * Math.pow(1 + i, k) - (cuota * (Math.pow(1 + i, k) - 1)) / i;
  return { paid: k, balance: Math.max(0, balance), interestPaid: cuota * k - (P - Math.max(0, balance)) };
}
