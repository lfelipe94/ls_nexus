import Link from "next/link";
import { formatMoney } from "@/lib/format";
import {
  appreciation,
  categoryLabel,
  creditProgress,
  currentValue,
  monthlyPayment,
  myShare,
  nextPaymentDate,
} from "@/lib/investments";

type Inv = {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  category: string | null;
  platform: string | null;
  project_name: string | null;
  ownership_pct: number | string | null;
  credit_amount: number | string | null;
  interest_rate: number | string | null;
  credit_term_months: number | null;
  payment_day: number | null;
  purchase_price: number | string | null;
  current_value: number | string | null;
  start_date: string | null;
  purchase_date: string | null;
  maturity_date: string | null;
};

const sign = (n: number) => (n >= 0 ? "+" : "");
const pct = (n: number) => `${sign(n)}${(n * 100).toFixed(1)} %`;

function Bar({ parts }: { parts: { value: number; className: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-stamp-soft">
      {parts.map((p, i) => (
        <div key={i} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} />
      ))}
    </div>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-stamp-soft/60 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="tabular mt-1 text-lg font-semibold text-ink">{value}</p>
      {hint && <p className="tabular text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function Header({ inv, actions }: { inv: Inv; actions: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link
          href={`/inversiones/${inv.id}`}
          className="block truncate text-xl font-semibold text-ink hover:text-stamp-dark hover:underline"
        >
          {inv.name}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
          <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-xs font-medium text-stamp-dark">
            {categoryLabel(inv.category)}
          </span>
          {inv.platform && <span>{inv.platform}</span>}
          {inv.project_name && <span>· {inv.project_name}</span>}
          {Number(inv.ownership_pct) < 100 && <span>· mi parte {Number(inv.ownership_pct)} %</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
  );
}

export function FinancialCard({ inv, actions, now }: { inv: Inv; actions: React.ReactNode; now: Date }) {
  const mine = myShare(inv);
  const money = (n: number) => formatMoney(n, inv.currency);
  const value = currentValue(mine, now);
  const invested = mine.amount;
  const gain = value - invested;
  const cdt = inv.category === "cdt" && inv.start_date && inv.maturity_date;
  const DAY = 86_400_000;
  const total = cdt ? new Date(inv.maturity_date!).getTime() - new Date(inv.start_date!).getTime() : 0;
  const elapsed = cdt ? Math.min(total, Math.max(0, now.getTime() - new Date(inv.start_date!).getTime())) : 0;
  const daysLeft = cdt ? Math.max(0, Math.ceil((new Date(inv.maturity_date!).getTime() - now.getTime()) / DAY)) : 0;

  return (
    <article className="card space-y-5 p-6">
      <Header inv={inv} actions={actions} />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Valor hoy</p>
        <p className="tabular text-4xl font-bold tracking-tight text-ink">{money(value)}</p>
        <p className={`tabular mt-1 text-sm font-medium ${gain >= 0 ? "text-teal" : "text-mustard"}`}>
          {sign(gain)}
          {money(gain)}
          {invested > 0 && ` (${pct(gain / invested)})`} de rendimiento
        </p>
      </div>
      <div className="space-y-1.5">
        <Bar
          parts={[
            { value: Math.min(value, invested), className: "bg-indigo-500" },
            { value: Math.max(0, gain), className: "bg-teal" },
            { value: Math.max(0, -gain), className: "bg-mustard" },
          ]}
        />
        <p className="tabular flex justify-between text-xs text-ink-soft">
          <span>Invertido {money(invested)}</span>
          <span>{gain >= 0 ? "Ganado" : "Perdido"} {money(Math.abs(gain))}</span>
        </p>
      </div>
      {cdt && (
        <div className="space-y-1.5">
          <Bar
            parts={[
              { value: elapsed, className: "bg-violet-500" },
              { value: total - elapsed, className: "bg-transparent" },
            ]}
          />
          <p className="tabular flex justify-between text-xs text-ink-soft">
            <span>{inv.interest_rate != null ? `${inv.interest_rate} % E.A.` : "CDT"}</span>
            <span>
              {daysLeft > 0 ? `faltan ${daysLeft} días · vence ` : "vencido el "}
              {new Date(inv.maturity_date!).toLocaleDateString("es-CO")}
            </span>
          </p>
        </div>
      )}
      {!cdt && inv.interest_rate != null && (
        <p className="tabular text-xs text-ink-soft">Tasa inicial {inv.interest_rate} % E.A.</p>
      )}
    </article>
  );
}

export function HomeCard({
  inv,
  actions,
  rent,
  now,
}: {
  inv: Inv;
  actions: React.ReactNode;
  rent: number;
  now: Date;
}) {
  const mine = myShare(inv);
  const money = (n: number) => formatMoney(n, inv.currency);
  const share = Number(inv.ownership_pct ?? 100) / 100;
  const value = currentValue(mine, now);
  const debt = Number(mine.credit_amount ?? 0);
  const equity = value - debt;
  const growth = appreciation(inv, now);
  const progress = inv.credit_amount ? creditProgress(inv, now) : null;
  const cuota = inv.credit_amount ? (monthlyPayment(inv) ?? 0) * share : 0;
  const next = nextPaymentDate(inv.payment_day, now);
  const repaid = progress && inv.credit_amount ? 1 - progress.balance / Number(inv.credit_amount) : 0;
  const pocket = Math.max(0, cuota - rent);

  return (
    <article className="card space-y-6 p-6">
      <Header inv={inv} actions={actions} />

      <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/30">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">Patrimonio neto (mi parte)</p>
        <p className="tabular mt-1 text-4xl font-bold tracking-tight">{money(equity)}</p>
        <p className="tabular mt-1 text-xs text-white/70">
          Valor {money(value)} − deuda {money(debt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini
          label="Valorización"
          value={growth ? `${sign(growth.total)}${money(value - Number(mine.purchase_price))}` : "—"}
          hint={
            growth
              ? `${pct(growth.total)}${growth.yearly != null ? ` · ${pct(growth.yearly)} anual` : ""}`
              : "Falta precio y fecha de compra"
          }
        />
        <Mini
          label="Tiempo de tenencia"
          value={growth ? `${growth.years} a, ${growth.months} m` : "—"}
          hint={growth ? `${growth.days} días` : undefined}
        />
        <Mini label="Cuota mensual" value={cuota ? money(cuota) : "—"} hint={inv.interest_rate != null ? `${inv.interest_rate} % E.A.` : undefined} />
        <Mini
          label="Próximo pago"
          value={next ? next.toLocaleDateString("es-CO") : "—"}
          hint={inv.payment_day ? `día ${inv.payment_day} de cada mes` : undefined}
        />
      </div>

      {progress && inv.credit_term_months && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-ink">Crédito pagado</p>
          <Bar
            parts={[
              { value: repaid, className: "bg-teal" },
              { value: 1 - repaid, className: "bg-transparent" },
            ]}
          />
          <p className="tabular flex justify-between text-xs text-ink-soft">
            <span>
              {progress.paid} de {inv.credit_term_months} cuotas · {(repaid * 100).toFixed(1)} % del capital
            </span>
            <span>saldo {money(progress.balance * share)}</span>
          </p>
        </div>
      )}

      {cuota > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-ink">Arriendo vs cuota</p>
          <Bar
            parts={[
              { value: Math.min(rent, cuota), className: "bg-teal" },
              { value: pocket, className: "bg-mustard" },
            ]}
          />
          <p className="tabular flex justify-between text-xs text-ink-soft">
            <span>Arriendo {money(rent)}</span>
            <span>Sale de mi bolsillo {money(pocket)}</span>
          </p>
        </div>
      )}
    </article>
  );
}
