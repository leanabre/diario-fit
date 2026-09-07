-- ¿Quedó bien cargado el esquema?
-- Pegar en el SQL Editor de Supabase y correr. Tiene que devolver 11 filas:
-- 9 tablas, 1 vista y el conteo de policies.

select 'tabla' as que, table_name as nombre, '' as detalle
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'

union all

select 'vista', table_name, ''
from information_schema.views
where table_schema = 'public'

union all

select 'policies', 'total', count(*)::text
from pg_policies
where schemaname = 'public'

order by que, nombre;
