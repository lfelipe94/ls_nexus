-- Aportes, retiros y tasas E.A. históricas de una inversión (fondos, acciones, otros).
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

create table if not exists investment_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid not null references investments(id) on delete cascade,
  kind text not null check (kind in ('deposit', 'withdrawal', 'rate')),
  movement_date date not null,
  amount numeric(14, 2),   -- aporte/retiro: monto total (antes de aplicar tu %)
  ea_rate numeric(6, 3),   -- 'rate': tasa E.A. vigente desde esa fecha
  notes text,
  created_at timestamptz not null default now(),
  check (
    (kind = 'rate' and ea_rate is not null)
    or (kind <> 'rate' and amount is not null and amount > 0)
  )
);

create index if not exists investment_movements_investment_idx
  on investment_movements (investment_id, movement_date);

alter table investment_movements enable row level security;

create policy "Los usuarios ven sus propios movimientos"
  on investment_movements for select using (auth.uid() = user_id);
create policy "Los usuarios crean movimientos en sus inversiones"
  on investment_movements for insert with check (
    auth.uid() = user_id
    and exists (select 1 from investments i where i.id = investment_id and i.user_id = auth.uid())
  );
create policy "Los usuarios eliminan sus propios movimientos"
  on investment_movements for delete using (auth.uid() = user_id);
