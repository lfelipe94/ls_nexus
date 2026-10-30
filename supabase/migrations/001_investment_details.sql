-- Detalle de inversiones: categoría, plataforma y datos de crédito de vivienda.
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

alter table investments
  add column if not exists category text not null default 'otro'
    check (category in ('vivienda', 'fondo', 'acciones', 'otro')),
  add column if not exists platform text,              -- Tyba, Nu, Happi... o banco del crédito
  add column if not exists project_name text,          -- proyecto de vivienda
  add column if not exists credit_amount numeric(14, 2),
  add column if not exists interest_rate numeric(6, 3), -- % efectivo anual
  add column if not exists credit_term_months integer,
  add column if not exists payment_day integer check (payment_day between 1 and 31);
