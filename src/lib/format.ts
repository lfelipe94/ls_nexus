export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Sin decimales, para cifras grandes en tarjetas: "$ 139.928.624". */
export function formatMoneyShort(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/** Abreviado para líneas secundarias: "$ 175,7 M". */
export function formatMoneyCompact(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
}
