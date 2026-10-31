-- Fecha de compra del inmueble (para calcular tiempo de tenencia y valorización anual).
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

alter table investments
  add column if not exists purchase_date date; -- vivienda: fecha de compra / escritura
