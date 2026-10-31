-- Permite editar ingresos y gastos ya agregados.
-- Ejecutar en Supabase: Dashboard -> SQL Editor.

create policy "Los usuarios actualizan sus propios flujos"
  on cash_flows for update using (auth.uid() = user_id);
