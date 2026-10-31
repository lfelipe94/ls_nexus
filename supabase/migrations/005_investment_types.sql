-- CDT como categoría propia, y datos de valor/rendimiento.
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

alter table investments drop constraint if exists investments_category_check;
alter table investments
  add constraint investments_category_check
    check (category in ('vivienda', 'cdt', 'fondo', 'acciones', 'otro'));

alter table investments
  add column if not exists purchase_price numeric(14, 2), -- vivienda: precio de compra (total)
  add column if not exists current_value numeric(14, 2),  -- valor de hoy (total); en CDT se estima
  add column if not exists start_date date,               -- CDT: inicio; vivienda: desembolso del crédito
  add column if not exists maturity_date date;            -- CDT: vencimiento
