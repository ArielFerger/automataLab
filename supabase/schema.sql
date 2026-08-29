-- Esquema de la galería de la comunidad de AutómataLab.
-- Pegar y ejecutar entero en el editor SQL del proyecto de Supabase.
-- Se puede volver a ejecutar sin problema: todo está escrito para ser idempotente.

-- ---------------------------------------------------------------- publicaciones

create table if not exists automatas (
  id        uuid primary key default gen_random_uuid(),
  titulo    text        not null,
  autor     text        not null default 'Anónimo',
  notas     text        not null default '',
  documento jsonb       not null,
  estados   int         not null default 0,
  alfabeto  text        not null default '',
  creado    timestamptz not null default now()
);

create index if not exists automatas_creado_idx on automatas (creado desc);

-- ------------------------------------------------------------- administradores

-- Quién puede moderar. Se cargan a mano desde el panel de Supabase; ver el README.
create table if not exists admins (
  id     uuid primary key references auth.users (id) on delete cascade,
  nota   text        not null default '',
  creado timestamptz not null default now()
);

alter table admins enable row level security;

-- Cada uno puede ver únicamente su propia fila. La app usa esto para saber si
-- mostrar los botones de moderación: si la consulta vuelve vacía, no es admin.
drop policy if exists "ver si soy admin" on admins;
create policy "ver si soy admin" on admins for select to authenticated using (id = auth.uid());

-- Función auxiliar para no repetir la subconsulta en cada política.
create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

-- ------------------------------------------------------------------- políticas

alter table automatas enable row level security;

-- Cualquiera puede mirar la galería, esté logueado o no.
drop policy if exists "lectura publica" on automatas;
create policy "lectura publica" on automatas for select using (true);

-- Cualquiera puede publicar, con límites de tamaño para que no entre basura.
drop policy if exists "alta publica" on automatas;
create policy "alta publica" on automatas for insert with check (
  length(titulo) between 1 and 120
  and length(autor) <= 60
  and length(notas) <= 1000
  and estados between 1 and 200
);

-- Editar y borrar es solo de administradores. Esto es lo que hace que el modo
-- admin de la app sea real y no un adorno: aunque alguien modificara el código
-- del navegador, la base rechaza el cambio igual.
drop policy if exists "edicion de admins" on automatas;
create policy "edicion de admins" on automatas for update to authenticated
  using (es_admin()) with check (es_admin());

drop policy if exists "borrado de admins" on automatas;
create policy "borrado de admins" on automatas for delete to authenticated using (es_admin());

-- ---------------------------------------------------------------------- alta
--
-- Para nombrar al primer administrador:
--   1. Authentication → Users → Add user, con mail y contraseña (marcá el mail
--      como confirmado; así no hace falta el correo de confirmación).
--   2. Copiá el UUID que quedó en la lista y ejecutá:
--
--        insert into admins (id, nota) values ('EL-UUID-DE-TU-USUARIO', 'Ariel')
--        on conflict (id) do nothing;
--
--   3. En la app, pestaña Comunidad → Entrar como admin, con ese mail y contraseña.
