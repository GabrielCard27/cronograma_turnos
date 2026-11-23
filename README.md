# Turnos

Aplicación web instalable (PWA) para cargar y consultar turnos de conserjes y mucamas.

- **Administradores:** cargan la programación mensual, ven el Resumen de cobertura, resuelven cambios de turno y dan de alta usuarios.
- **Empleados (conserjes y mucamas):** ven solo sus turnos, piden cambios y ven las nuevas asignaciones.
- **Tecnología:** Next.js 14 (App Router) · Supabase (base de datos + login) · GitHub · Vercel.

## 1. Supabase (una sola vez)

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto.
2. **SQL Editor → New query**: pegá todo el contenido de `supabase/schema.sql` y ejecutalo. Crea las tablas, los permisos por fila y los códigos de turno de Niyat Urban y Xpres.
3. **Authentication → Sign In / Providers → Email**: desactivá *Allow new users to sign up* (los usuarios los crea solo el administrador) y, para el alta sin correo de confirmación, no hace falta activar nada más.
4. **Project Settings → API**: copiá `Project URL`, `anon public` y `service_role`.

### Primer administrador

1. **Authentication → Users → Add user → Create new user**: ingresá tu correo y una contraseña (marcá *Auto Confirm User*).
2. En el **SQL Editor** ejecutá (con tu correo):

```sql
insert into perfiles (id, email, apellido_nombre, rol)
select id, email, 'Tu apellido y nombre', 'admin' from auth.users where email = 'tu@correo.com';
```

A partir de ahí, el resto de los usuarios se crean desde la pestaña **Usuarios** de la aplicación.

## 2. Probar en tu computadora

```bash
npm install
cp .env.example .env.local   # completá las tres variables
npm run dev                  # http://localhost:3000
```

## 3. GitHub

```bash
git init
git add .
git commit -m "Turnos: primera versión"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/turnos-app.git
git push -u origin main
```

`.env.local` está en `.gitignore`: las claves no se suben.

## 4. Vercel

1. **Add New → Project** y elegí el repositorio.
2. En **Environment Variables** cargá:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; no la compartas)
3. **Deploy**. Cada `git push` a `main` publica una versión nueva.

## 5. Instalar en el celular o la computadora

- **Android / Chrome / Edge (PC):** menú del navegador → *Instalar aplicación*.
- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*.

## Cómo funciona

| Pantalla | Quién | Qué hace |
|---|---|---|
| Mis turnos | Empleado | Próximo turno, calendario del mes y últimas asignaciones por cambios |
| Cambios | Empleado | Pedir cambios, aceptar o rechazar cuando un compañero pide que lo cubran |
| Resumen | Administrador | Cobertura por hora y día; cada ID con el color de la persona |
| Turnos | Administrador | Grilla mensual por hotel y grupo (igual que la planilla) |
| Cambios | Administrador | Aprobar o rechazar solicitudes y cargar cambios directos |
| Usuarios | Administrador | Alta, nivel de permiso, grupo, ID, color y activación |

### Tres formas de registrar un cambio

1. **Solicitud:** el empleado pide y decide el administrador.
2. **Con reemplazante:** el empleado ya lo habló; el compañero debe aceptar y luego aprueba el administrador.
3. **Directo:** lo carga el administrador y queda aceptado.

### Reglas al aceptar un cambio (las mismas de la planilla)

- El reemplazante toma el turno original del solicitante.
- El solicitante deja libre su turno original y toma el turno cambiado, si se indicó.
- Solo en permutaciones se libera el turno del reemplazante en la fecha cambiada.
- Los turnos modificados se marcan con **borde grueso, negrita y asterisco (*)**.

### Seguridad

- Los permisos se aplican en la base de datos (RLS): un empleado no puede leer turnos ajenos aunque pidiera los datos directamente.
- La clave `service_role` solo se usa en el servidor, para crear usuarios.
- Los usuarios inactivos no pueden ingresar.

## Códigos de turno

Se cargan desde `supabase/schema.sql` (tabla `codigos_turno`). Para agregar o cambiar uno, editá esa tabla desde Supabase (*Table Editor*).
