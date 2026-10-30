-- Ingresos y gastos mensuales (los dos trabajos, en EUR y USD).
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

create table if not exists cash_flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  name text not null,                 -- "Sueldo Trabajo 1", "Arriendo", "Gym"...
  amount numeric(14, 2) not null,     -- monto mensual
  currency currency_code not null default 'EUR',
  notes text,
  created_at timestamptz not null default now()
);

alter table cash_flows enable row level security;

create policy "Los usuarios ven sus propios flujos"
  on cash_flows for select using (auth.uid() = user_id);
create policy "Los usuarios crean sus propios flujos"
  on cash_flows for insert with check (auth.uid() = user_id);
create policy "Los usuarios eliminan sus propios flujos"
  on cash_flows for delete using (auth.uid() = user_id);
