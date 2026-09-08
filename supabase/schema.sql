-- Diario Fit — esquema completo.
-- Correr entero en el SQL Editor de Supabase. Es idempotente: se puede volver a correr.

-- ─────────────────────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────────────────────

create table if not exists profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text not null,
  emoji                text not null default '🙂',
  accent_color         text not null default '#7C5CFF',
  weekly_training_goal int  not null default 4 check (weekly_training_goal between 1 and 14),
  reminder_hour        int  default 21 check (reminder_hour between 0 and 23),
  share_notes          boolean not null default false,
  created_at           timestamptz default now()
);

create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Nosotros',
  invite_code text unique not null,
  created_at  timestamptz default now()
);

create table if not exists team_members (
  team_id   uuid references teams(id) on delete cascade,
  user_id   uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- Un usuario pertenece a lo sumo a un equipo.
create unique index if not exists team_members_one_team_per_user on team_members (user_id);

-- Tipos de entrenamiento: propios de cada usuario, editables desde Ajustes
create table if not exists training_types (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  key        text not null,
  label      text not null,
  color      text not null,
  icon       text not null,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  unique (user_id, key)
);

create table if not exists day_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  date            date not null,
  nutrition_score int check (nutrition_score between 1 and 5),
  nutrition_note  text check (char_length(nutrition_note) <= 280),
  rest_day        boolean not null default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, date)
);

create index if not exists day_entries_user_date on day_entries (user_id, date desc);

create table if not exists entry_trainings (
  id               uuid primary key default gen_random_uuid(),
  entry_id         uuid references day_entries(id) on delete cascade,
  training_type_id uuid references training_types(id) on delete cascade,
  created_at       timestamptz default now(),
  unique (entry_id, training_type_id)
);

create index if not exists entry_trainings_entry on entry_trainings (entry_id);

create table if not exists achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  key         text not null,
  unlocked_at timestamptz default now(),
  unique (user_id, key)
);

create table if not exists team_challenges (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references teams(id) on delete cascade,
  week_start date not null,
  key        text not null,
  target     numeric not null,
  status     text not null default 'active' check (status in ('active','won','missed')),
  unique (team_id, week_start)
);

-- ─────────────────────────────────────────────────────────────
-- Funciones auxiliares
-- ─────────────────────────────────────────────────────────────

-- security definer para poder consultar team_members desde las policies
-- sin que la propia policy de team_members se llame a sí misma.
create or replace function public.is_teammate(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target = auth.uid()
      or exists (
           select 1
           from team_members me
           join team_members other on other.team_id = me.team_id
           where me.user_id = auth.uid()
             and other.user_id = target
         );
$$;

create or replace function public.my_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from team_members where user_id = auth.uid() limit 1;
$$;

-- Código de invitación de 6 caracteres, sin caracteres ambiguos (0/O, 1/I).
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from teams where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists day_entries_touch on day_entries;
create trigger day_entries_touch
  before update on day_entries
  for each row execute function public.touch_updated_at();

-- Semilla de tipos de entrenamiento al crear un perfil.
create or replace function public.seed_training_types()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into training_types (user_id, key, label, color, icon, sort_order) values
    (new.id, 'yoga',    'Yoga',    '#4ADE9C', 'yoga',    0),
    (new.id, 'ludus',   'Ludus',   '#A78BFA', 'ludus',   1),
    (new.id, 'gym',     'Gym',     '#60A5FA', 'gym',     2),
    (new.id, 'running', 'Running', '#22D3EE', 'running', 3)
  on conflict (user_id, key) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_seed_training_types on profiles;
create trigger profiles_seed_training_types
  after insert on profiles
  for each row execute function public.seed_training_types();

-- Unirse a un equipo por código. Crea el vínculo respetando "un equipo por persona".
create or replace function public.join_team_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_team uuid;
  member_count int;
begin
  select id into target_team from teams where invite_code = upper(trim(code));
  if target_team is null then
    raise exception 'Código inválido';
  end if;

  if exists (select 1 from team_members where user_id = auth.uid() and team_id <> target_team) then
    raise exception 'Ya pertenecés a otro equipo';
  end if;

  select count(*) into member_count from team_members where team_id = target_team;
  if member_count >= 2 and not exists (
    select 1 from team_members where team_id = target_team and user_id = auth.uid()
  ) then
    raise exception 'Ese equipo ya está completo';
  end if;

  insert into team_members (team_id, user_id) values (target_team, auth.uid())
  on conflict do nothing;

  return target_team;
end;
$$;

-- Crear equipo y quedar como primer miembro.
create or replace function public.create_team(team_name text default 'Nosotros')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team uuid;
begin
  if exists (select 1 from team_members where user_id = auth.uid()) then
    raise exception 'Ya pertenecés a un equipo';
  end if;

  insert into teams (name, invite_code)
  values (coalesce(nullif(trim(team_name), ''), 'Nosotros'), public.generate_invite_code())
  returning id into new_team;

  insert into team_members (team_id, user_id) values (new_team, auth.uid());
  return new_team;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Vista con la nota enmascarada según share_notes
-- ─────────────────────────────────────────────────────────────

drop view if exists day_entries_shared;
create view day_entries_shared
with (security_invoker = on) as
select
  e.id,
  e.user_id,
  e.date,
  e.nutrition_score,
  case
    when e.user_id = auth.uid() or p.share_notes then e.nutrition_note
    else null
  end as nutrition_note,
  e.rest_day,
  e.created_at,
  e.updated_at
from day_entries e
join profiles p on p.id = e.user_id;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Escritura: sólo lo propio. Lectura: lo propio y lo del equipo.
-- ─────────────────────────────────────────────────────────────

alter table profiles        enable row level security;
alter table teams           enable row level security;
alter table team_members    enable row level security;
alter table training_types  enable row level security;
alter table day_entries     enable row level security;
alter table entry_trainings enable row level security;
alter table achievements    enable row level security;
alter table team_challenges enable row level security;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (public.is_teammate(id));

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert
  with check (id = auth.uid());

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists teams_select on teams;
create policy teams_select on teams for select
  using (id = public.my_team_id());

drop policy if exists teams_update on teams;
create policy teams_update on teams for update
  using (id = public.my_team_id()) with check (id = public.my_team_id());

drop policy if exists team_members_select on team_members;
create policy team_members_select on team_members for select
  using (team_id = public.my_team_id());

drop policy if exists team_members_delete on team_members;
create policy team_members_delete on team_members for delete
  using (user_id = auth.uid());

drop policy if exists training_types_select on training_types;
create policy training_types_select on training_types for select
  using (public.is_teammate(user_id));

drop policy if exists training_types_write on training_types;
create policy training_types_write on training_types for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists day_entries_select on day_entries;
create policy day_entries_select on day_entries for select
  using (public.is_teammate(user_id));

drop policy if exists day_entries_write on day_entries;
create policy day_entries_write on day_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists entry_trainings_select on entry_trainings;
create policy entry_trainings_select on entry_trainings for select
  using (exists (
    select 1 from day_entries e
    where e.id = entry_trainings.entry_id and public.is_teammate(e.user_id)
  ));

drop policy if exists entry_trainings_write on entry_trainings;
create policy entry_trainings_write on entry_trainings for all
  using (exists (
    select 1 from day_entries e
    where e.id = entry_trainings.entry_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from day_entries e
    where e.id = entry_trainings.entry_id and e.user_id = auth.uid()
  ));

drop policy if exists achievements_select on achievements;
create policy achievements_select on achievements for select
  using (public.is_teammate(user_id));

drop policy if exists achievements_write on achievements;
create policy achievements_write on achievements for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists team_challenges_select on team_challenges;
create policy team_challenges_select on team_challenges for select
  using (team_id = public.my_team_id());

drop policy if exists team_challenges_write on team_challenges;
create policy team_challenges_write on team_challenges for all
  using (team_id = public.my_team_id()) with check (team_id = public.my_team_id());

-- ─────────────────────────────────────────────────────────────
-- Fase 3: suscripciones de push
-- ─────────────────────────────────────────────────────────────

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now()
);

create index if not exists push_subscriptions_user on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

drop policy if exists push_subscriptions_write on push_subscriptions;
create policy push_subscriptions_write on push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Historial de desafíos: hace falta poder mirar los de semanas pasadas del equipo,
-- ya cubierto por team_challenges_select.
create index if not exists team_challenges_team_week on team_challenges (team_id, week_start desc);
