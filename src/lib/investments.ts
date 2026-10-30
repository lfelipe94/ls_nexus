export const CATEGORIES = [
  { value: "vivienda", label: "Vivienda" },
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
