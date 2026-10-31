-- Fechas, recurrencia, categoría y apartamento en ingresos/gastos.
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

alter table cash_flows
  add column if not exists frequency text not null default 'monthly'
    check (frequency in ('monthly', 'once')),
  add column if not exists flow_date date,   -- 'once': fecha exacta; 'monthly': su día del mes
  add column if not exists category text,
  add column if not exists property text;    -- nombre libre del apartamento
