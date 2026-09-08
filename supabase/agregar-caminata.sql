-- Agrega Caminata a las cuentas que ya existen. Las nuevas ya la traen de fábrica.
-- Correr una vez en el SQL Editor. Si se corre dos veces no duplica nada.
--
-- El color es magenta a propósito: es el que queda más lejos de los otros cuatro
-- (verde, violeta, azul, cian) y no se confunde con ninguno en el calendario.

insert into training_types (user_id, key, label, color, icon, sort_order)
select id, 'caminata', 'Caminata', '#E879C7', 'caminata', 4
from profiles
on conflict (user_id, key) do nothing;

-- Para ver cómo quedó:
select p.display_name, t.label, t.color, t.sort_order
from training_types t
join profiles p on p.id = t.user_id
order by p.display_name, t.sort_order;
