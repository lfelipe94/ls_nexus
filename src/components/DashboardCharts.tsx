"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CurrencyTotal } from "@/lib/aggregations";

const CURRENCY_COLORS: Record<string, string> = {
  COP: "#6366f1",
  USD: "#f59e0b",
  EUR: "#14b8a6",
};

function colorFor(currency: string) {
  return CURRENCY_COLORS[currency] ?? "#94a3b8";
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: "1px solid #e7e8f3",
  boxShadow: "0 8px 24px -8px rgb(99 102 241 / 0.25)",
};

export function InvestmentsByCurrencyChart({ data }: { data: CurrencyTotal[] }) {
  if (data.length === 0) return null;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-ink">Inversiones por moneda</h3>
      <p className="mt-0.5 text-xs text-ink-soft">
        Cada moneda en su propia escala; no se suman entre sí.
      </p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="currency"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={4}
              cornerRadius={8}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.currency} fill={colorFor(entry.currency)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => Number(value).toLocaleString("es-CO")}
              contentStyle={tooltipStyle}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PaymentsByMonthChart({
  data,
  currencies,
}: {
  data: Record<string, string | number>[];
  currencies: string[];
}) {
  if (data.length === 0 || currencies.length === 0) return null;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-ink">Pagos próximos por mes</h3>
      <p className="mt-0.5 text-xs text-ink-soft">Próximos 6 meses, agrupados por moneda.</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -16, right: 8 }}>
            <defs>
              {currencies.map((c) => (
                <linearGradient key={c} id={`grad-${c}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorFor(c)} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={colorFor(c)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#e7e8f3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b6f8d" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b6f8d" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => Number(value).toLocaleString("es-CO")}
              contentStyle={tooltipStyle}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            {currencies.map((c) => (
              <Area
                key={c}
                type="monotone"
                dataKey={c}
                stroke={colorFor(c)}
                strokeWidth={2.5}
                fill={`url(#grad-${c})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const PALETTE = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6", "#94a3b8"];

export function AllocationChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={4}
              cornerRadius={8}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => Number(value).toLocaleString("es-CO")}
              contentStyle={tooltipStyle}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
