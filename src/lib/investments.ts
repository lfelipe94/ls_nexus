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
