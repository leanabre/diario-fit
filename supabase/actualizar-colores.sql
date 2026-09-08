-- Opcional. Pasa los cuatro tipos sembrados a la paleta nueva, más pareja en
-- luminosidad y más legible sobre el fondo. Sólo toca los que nunca se
-- recolorearon a mano: si cambiaste alguno, se respeta.

update training_types set color = '#4ADE9C' where key = 'yoga'    and color = '#3DDC97';
update training_types set color = '#A78BFA' where key = 'ludus'   and color = '#8B6BFF';
update training_types set color = '#60A5FA' where key = 'gym'     and color = '#4A9BFF';
update training_types set color = '#22D3EE' where key = 'running' and color = '#2FD8D2';
