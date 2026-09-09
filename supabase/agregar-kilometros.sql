-- Prende los kilómetros en Caminata y Running de las cuentas que ya existen.
-- Correr una sola vez, después de haber vuelto a correr schema.sql (que es el
-- que agrega las columnas).
--
-- No está dentro de schema.sql a propósito: ahí correría en cada ejecución y le
-- pisaría la preferencia a quien los haya apagado desde Ajustes.

update training_types
set tracks_distance = true
where key in ('caminata', 'running');

select p.display_name, t.label, t.tracks_distance
from training_types t
join profiles p on p.id = t.user_id
order by p.display_name, t.sort_order;
