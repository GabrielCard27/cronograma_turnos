// Campos comunes del alta y la edición de usuarios
export default function UsuarioCampos({ u, color, prefijo }) {
  const id = (n) => `${prefijo}-${n}`
  return (
    <>
      <div>
        <label htmlFor={id('nom')} className="etiqueta">Apellido y nombre</label>
        <input id={id('nom')} name="apellido_nombre" required defaultValue={u?.apellido_nombre || ''} className="campo" />
      </div>
      <div>
        <label htmlFor={id('ali')} className="etiqueta">Alias (cómo se ve en pantalla)</label>
        <input id={id('ali')} name="alias" defaultValue={u?.alias || ''} className="campo" />
      </div>
      <div>
        <label htmlFor={id('mail')} className="etiqueta">Correo electrónico</label>
        <input id={id('mail')} name="email" type="email" required defaultValue={u?.email || ''} className="campo" />
      </div>
      <div>
        <label htmlFor={id('rol')} className="etiqueta">Nivel de permiso</label>
        <select id={id('rol')} name="rol" defaultValue={u?.rol || 'empleado'} className="campo">
          <option value="empleado">Empleado: ve solo sus turnos</option>
          <option value="admin">Administrador: carga turnos y usuarios</option>
        </select>
      </div>
      <div>
        <label htmlFor={id('gru')} className="etiqueta">Grupo (empleados)</label>
        <select id={id('gru')} name="grupo" defaultValue={u?.grupo || ''} className="campo">
          <option value="">Sin grupo</option>
          <option value="Conserje">Conserje</option>
          <option value="Mucama">Mucama</option>
        </select>
      </div>
      <div>
        <label htmlFor={id('leg')} className="etiqueta">ID del empleado</label>
        <input id={id('leg')} name="legajo" type="number" min="1" defaultValue={u?.legajo || ''} className="campo" />
      </div>
      <div>
        <label htmlFor={id('col')} className="etiqueta">Color en el Resumen</label>
        <input id={id('col')} name="color" type="color" defaultValue={u?.color || color} className="h-11 w-full rounded-md border border-linea bg-white p-1" />
      </div>
    </>
  )
}
