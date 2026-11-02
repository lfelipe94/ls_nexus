-- Frecuencia semanal en ingresos/gastos (p. ej. señora del aseo: 26 €/semana ≈ 112,67 €/mes).
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

alter table cash_flows drop constraint if exists cash_flows_frequency_check;
alter table cash_flows
  add constraint cash_flows_frequency_check check (frequency in ('monthly', 'weekly', 'once'));
