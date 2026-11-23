-- =====================================================================
-- Turnos · esquema de base de datos para Supabase
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- Tablas ----------
create table if not exists hoteles (
  id smallint primary key,
  nombre text unique not null
);

create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  apellido_nombre text not null,
  alias text,
  legajo int unique,                       -- "ID" del empleado en la planilla
  rol text not null default 'empleado' check (rol in ('admin','empleado')),
  grupo text check (grupo in ('Conserje','Mucama')),
  color text not null default '#9CA3AF',   -- color propio en el Resumen
  activo boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists codigos_turno (
  hotel_id smallint not null references hoteles(id),
  codigo text not null,
  descripcion text not null,
  grupo text not null check (grupo in ('Conserje','Mucama','Ambos')),
  desde time,
  horas numeric not null default 0,
  primary key (hotel_id, codigo)
);

-- Programación mensual (lo que cargan los administradores en la grilla)
create table if not exists turnos (
  hotel_id smallint not null references hoteles(id),
  empleado_id uuid not null references perfiles(id) on delete cascade,
  fecha date not null,
  codigo text not null,
  primary key (hotel_id, empleado_id, fecha),
  foreign key (hotel_id, codigo) references codigos_turno(hotel_id, codigo)
);
create index if not exists turnos_fecha_idx on turnos (fecha);

-- Cambios de turno (permutación, reprogramación, cancelación de franco)
create table if not exists cambios (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  fecha_registro date not null default current_date,
  -- solicitud: el empleado pide y decide el administrador
  -- con_reemplazante: el compañero debe aceptar y luego decide el administrador
  -- directo: lo carga el administrador y queda aceptado
  modo text not null check (modo in ('solicitud','con_reemplazante','directo')),
  tipo text not null check (tipo in ('permutacion','reprogramacion','cancelacion_franco')),
  estado text not null default 'solicitada' check (estado in ('solicitada','aceptada','rechazada')),
  hotel_id smallint not null references hoteles(id),
  solicitante_id uuid not null references perfiles(id),
  fecha_origen date not null,
  turno_origen text not null,
  reemplazante_id uuid references perfiles(id),
  fecha_cambiado date,
  turno_cambiado text,
  reemplazante_acepta boolean,
  motivo text,
  resuelto_por uuid references perfiles(id),
  resuelto_en timestamptz,
  check (modo <> 'con_reemplazante' or reemplazante_id is not null),
  check (reemplazante_id is null or reemplazante_id <> solicitante_id),
  check (estado <> 'aceptada' or (reemplazante_id is not null and fecha_cambiado is not null))
);

-- Efecto de cada cambio aceptado sobre la programación (lo calcula un trigger)
create table if not exists efectos_cambio (
  cambio_id bigint not null references cambios(id) on delete cascade,
  hotel_id smallint not null,
  empleado_id uuid not null,
  fecha date not null,
  codigo text,                              -- null = turno liberado
  primary key (cambio_id, hotel_id, empleado_id, fecha)
);
create index if not exists efectos_fecha_idx on efectos_cambio (fecha);

-- ---------- Funciones ----------
create or replace function es_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin' and activo)
$$;

-- Reglas (iguales a la planilla):
--  * el reemplazante toma el turno original del solicitante
--  * el solicitante deja libre su turno original y toma el turno cambiado (si se indicó)
--  * solo en permutaciones se libera el turno del reemplazante en la fecha cambiada
create or replace function aplicar_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from efectos_cambio where cambio_id = new.id;
  if new.estado = 'aceptada' then
    insert into efectos_cambio values (new.id, new.hotel_id, new.reemplazante_id, new.fecha_origen, new.turno_origen);
    if not (new.turno_cambiado is not null and new.fecha_cambiado = new.fecha_origen) then
      insert into efectos_cambio values (new.id, new.hotel_id, new.solicitante_id, new.fecha_origen, null);
    end if;
    if new.turno_cambiado is not null then
      insert into efectos_cambio values (new.id, new.hotel_id, new.solicitante_id, new.fecha_cambiado, new.turno_cambiado);
    end if;
    if new.tipo = 'permutacion' and new.fecha_cambiado <> new.fecha_origen then
      insert into efectos_cambio values (new.id, new.hotel_id, new.reemplazante_id, new.fecha_cambiado, null);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists cambios_aplicar on cambios;
create trigger cambios_aplicar
after insert or update on cambios
for each row execute function aplicar_cambio();

-- El reemplazante acepta o rechaza (solo modo con_reemplazante)
create or replace function responder_cambio(p_id bigint, p_acepta boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update cambios
     set reemplazante_acepta = p_acepta,
         estado = case when p_acepta then estado else 'rechazada' end,
         resuelto_en = case when p_acepta then resuelto_en else now() end
   where id = p_id and reemplazante_id = auth.uid()
     and modo = 'con_reemplazante' and estado = 'solicitada' and reemplazante_acepta is null;
  if not found then raise exception 'No se puede responder este cambio.'; end if;
end $$;

-- El administrador acepta o rechaza (y puede completar reemplazante, fecha y turno)
create or replace function resolver_cambio(
  p_id bigint, p_estado text, p_reemplazante uuid, p_fecha date, p_turno text
) returns void
language plpgsql security definer set search_path = public as $$
declare c cambios;
begin
  if not es_admin() then raise exception 'Sin permiso.'; end if;
  select * into c from cambios where id = p_id for update;
  if not found or c.estado <> 'solicitada' then raise exception 'El cambio ya fue resuelto.'; end if;
  if p_estado = 'aceptada' then
    if c.modo = 'con_reemplazante' and coalesce(c.reemplazante_acepta, false) = false then
      raise exception 'El reemplazante todavía no aceptó el cambio.';
    end if;
    if coalesce(p_reemplazante, c.reemplazante_id) is null then
      raise exception 'Falta indicar el reemplazante.';
    end if;
    if coalesce(p_fecha, c.fecha_cambiado) is null then
      raise exception 'Falta indicar la fecha del turno cambiado.';
    end if;
    update cambios set
      reemplazante_id = coalesce(p_reemplazante, reemplazante_id),
      fecha_cambiado = coalesce(p_fecha, fecha_cambiado),
      turno_cambiado = coalesce(nullif(p_turno, ''), turno_cambiado),
      estado = 'aceptada', resuelto_por = auth.uid(), resuelto_en = now()
    where id = p_id;
  elsif p_estado = 'rechazada' then
    update cambios set estado = 'rechazada', resuelto_por = auth.uid(), resuelto_en = now() where id = p_id;
  else
    raise exception 'Estado inválido.';
  end if;
end $$;

-- ---------- Vistas ----------
-- Programación + cambios aceptados. "cambiado" = true marca los turnos modificados.
create or replace view v_turnos with (security_invoker = true) as
select distinct on (hotel_id, empleado_id, fecha)
       hotel_id, empleado_id, fecha, codigo, cambiado, cambio_id
from (
  select hotel_id, empleado_id, fecha, codigo, false as cambiado, 0::bigint as cambio_id, 0 as prio from turnos
  union all
  select hotel_id, empleado_id, fecha, codigo, true, cambio_id, 1 from efectos_cambio
) x
order by hotel_id, empleado_id, fecha, prio desc, cambio_id desc;

-- Cambios con nombres; cada persona ve solo los suyos (el administrador ve todos)
create or replace view v_cambios as
select c.id, c.creado, c.fecha_registro, c.modo, c.tipo, c.estado, c.hotel_id, h.nombre as hotel,
       c.solicitante_id, s.apellido_nombre as solicitante, s.legajo as solicitante_legajo, s.grupo,
       c.fecha_origen, c.turno_origen,
       c.reemplazante_id, r.apellido_nombre as reemplazante, r.legajo as reemplazante_legajo,
       c.fecha_cambiado, c.turno_cambiado, c.reemplazante_acepta, c.motivo, c.resuelto_en
from cambios c
join hoteles h on h.id = c.hotel_id
join perfiles s on s.id = c.solicitante_id
left join perfiles r on r.id = c.reemplazante_id
where es_admin() or c.solicitante_id = auth.uid() or c.reemplazante_id = auth.uid();

-- Compañeros del mismo grupo (para elegir reemplazante)
create or replace view v_companeros as
select p.id, p.legajo, p.apellido_nombre, p.alias
from perfiles p
where p.activo and p.rol = 'empleado' and p.id <> auth.uid()
  and p.grupo = (select grupo from perfiles where id = auth.uid());

-- ---------- Seguridad por fila (RLS) ----------
alter table hoteles enable row level security;
alter table perfiles enable row level security;
alter table codigos_turno enable row level security;
alter table turnos enable row level security;
alter table cambios enable row level security;
alter table efectos_cambio enable row level security;

drop policy if exists hoteles_leer on hoteles;
create policy hoteles_leer on hoteles for select to authenticated using (true);

drop policy if exists codigos_leer on codigos_turno;
create policy codigos_leer on codigos_turno for select to authenticated using (true);
drop policy if exists codigos_admin on codigos_turno;
create policy codigos_admin on codigos_turno for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists perfiles_leer on perfiles;
create policy perfiles_leer on perfiles for select to authenticated using (id = auth.uid() or es_admin());
drop policy if exists perfiles_admin on perfiles;
create policy perfiles_admin on perfiles for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists turnos_leer on turnos;
create policy turnos_leer on turnos for select to authenticated using (empleado_id = auth.uid() or es_admin());
drop policy if exists turnos_admin on turnos;
create policy turnos_admin on turnos for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists efectos_leer on efectos_cambio;
create policy efectos_leer on efectos_cambio for select to authenticated using (empleado_id = auth.uid() or es_admin());

drop policy if exists cambios_leer on cambios;
create policy cambios_leer on cambios for select to authenticated
  using (es_admin() or solicitante_id = auth.uid() or reemplazante_id = auth.uid());
drop policy if exists cambios_admin on cambios;
create policy cambios_admin on cambios for all to authenticated using (es_admin()) with check (es_admin());
drop policy if exists cambios_pedir on cambios;
create policy cambios_pedir on cambios for insert to authenticated
  with check (solicitante_id = auth.uid() and estado = 'solicitada'
              and modo in ('solicitud','con_reemplazante') and reemplazante_acepta is null);
drop policy if exists cambios_retirar on cambios;
create policy cambios_retirar on cambios for delete to authenticated
  using (solicitante_id = auth.uid() and estado = 'solicitada');

-- ---------- Permisos ----------
revoke all on v_cambios, v_companeros, v_turnos from anon;
grant select on v_cambios, v_companeros, v_turnos to authenticated;
revoke execute on function responder_cambio(bigint, boolean) from public, anon;
revoke execute on function resolver_cambio(bigint, text, uuid, date, text) from public, anon;
grant execute on function responder_cambio(bigint, boolean) to authenticated;
grant execute on function resolver_cambio(bigint, text, uuid, date, text) to authenticated;

-- ---------- Datos iniciales ----------
insert into hoteles (id, nombre) values (1, 'Niyat Urban'), (2, 'Xpres')
on conflict (id) do nothing;

insert into codigos_turno (hotel_id, codigo, descripcion, grupo, desde, horas) values
 (1,'M','Mañana','Conserje','07:00',8),
 (1,'T','Tarde','Conserje','15:00',8),
 (1,'N','Noche','Conserje','23:00',8),
 (1,'MT','Mañana y tarde (doble turno)','Conserje','07:00',16),
 (1,'TN','Tarde y noche (doble turno)','Conserje','15:00',16),
 (1,'NM','Noche y mañana (doble turno)','Conserje','23:00',16),
 (1,'MD','Turno desayuno','Mucama','07:00',8),
 (1,'ML','Turno limpieza','Mucama','08:00',8),
 (1,'MD1','Turno desayuno extendido 1 hora','Mucama','07:00',9),
 (1,'MD2','Turno desayuno extendido 2 horas','Mucama','07:00',10),
 (1,'ML1','Turno limpieza extendido 1 hora','Mucama','08:00',9),
 (1,'ML2','Turno limpieza extendido 2 horas','Mucama','08:00',10),
 (1,'L','Franco','Ambos',null,0),
 (1,'FC','Franco compensatorio','Ambos',null,0),
 (1,'V','Vacaciones','Ambos',null,0),
 (1,'E','Enfermedad','Ambos',null,0),
 (1,'A','Ausencia','Ambos',null,0),
 (2,'M','Mañana','Ambos','06:00',8),
 (2,'T','Tarde','Ambos','14:00',8),
 (2,'N','Noche','Ambos','22:00',8),
 (2,'M4A','Mañana 1ª parte (4 hs)','Conserje','06:00',4),
 (2,'M4B','Mañana 2ª parte (4 hs)','Conserje','10:00',4),
 (2,'M6','Mañana jornada reducida (6 hs)','Conserje','07:00',6),
 (2,'T9','Tarde desde las 12 (9 hs)','Conserje','12:00',9),
 (2,'N9','Noche desde las 21 (9 hs)','Conserje','21:00',9),
 (2,'MT','Mañana y tarde (doble turno)','Conserje','06:00',16),
 (2,'TN','Tarde y noche (doble turno)','Conserje','14:00',16),
 (2,'NM','Noche y mañana (doble turno)','Conserje','22:00',16),
 (2,'M1','Media mañana','Mucama','10:00',8),
 (2,'M2','Medio día','Mucama','12:00',8),
 (2,'T1','Tarde anticipado','Mucama','13:00',8),
 (2,'NX','Noche extendido','Mucama','21:00',9),
 (2,'L','Franco','Ambos',null,0),
 (2,'FC','Franco compensatorio','Ambos',null,0),
 (2,'V','Vacaciones','Ambos',null,0),
 (2,'E','Enfermedad','Ambos',null,0),
 (2,'A','Ausencia','Ambos',null,0)
on conflict (hotel_id, codigo) do nothing;
