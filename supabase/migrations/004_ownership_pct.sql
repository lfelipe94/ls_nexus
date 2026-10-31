-- Porcentaje de la inversión que te corresponde (p. ej. 50% si es con un socio).
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

alter table investments
  add column if not exists ownership_pct numeric(5, 2) not null default 100
    check (ownership_pct > 0 and ownership_pct <= 100);
