-- Esquema inicial para LS Nexus
-- Ejecutar en Supabase: Dashboard -> SQL Editor -> pegar y correr.

create type currency_code as enum ('COP', 'USD', 'EUR');

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null,
  currency currency_code not null default 'COP',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null,
  currency currency_code not null default 'COP',
  due_date date not null,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: cada usuario solo ve y modifica sus propios datos.
alter table investments enable row level security;
alter table recurring_payments enable row level security;

create policy "Los usuarios ven sus propias inversiones"
  on investments for select using (auth.uid() = user_id);
create policy "Los usuarios crean sus propias inversiones"
  on investments for insert with check (auth.uid() = user_id);
create policy "Los usuarios actualizan sus propias inversiones"
  on investments for update using (auth.uid() = user_id);
create policy "Los usuarios eliminan sus propias inversiones"
  on investments for delete using (auth.uid() = user_id);

create policy "Los usuarios ven sus propios pagos"
  on recurring_payments for select using (auth.uid() = user_id);
create policy "Los usuarios crean sus propios pagos"
  on recurring_payments for insert with check (auth.uid() = user_id);
create policy "Los usuarios actualizan sus propios pagos"
  on recurring_payments for update using (auth.uid() = user_id);
create policy "Los usuarios eliminan sus propios pagos"
  on recurring_payments for delete using (auth.uid() = user_id);
