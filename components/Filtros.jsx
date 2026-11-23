// Filtros por URL (hotel, grupo, mes). Es un formulario GET: no necesita JavaScript.
export default function Filtros({ hoteles, hotelId, grupo, mes }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="f-hotel" className="etiqueta">Hotel</label>
        <select id="f-hotel" name="hotel" defaultValue={hotelId} className="campo">
          {hoteles.map((h) => (
            <option key={h.id} value={h.id}>{h.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-grupo" className="etiqueta">Grupo</label>
        <select id="f-grupo" name="grupo" defaultValue={grupo} className="campo">
          <option value="Conserje">Conserjes</option>
          <option value="Mucama">Mucamas</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-mes" className="etiqueta">Mes</label>
        <input id="f-mes" type="month" name="mes" defaultValue={mes} className="campo" />
      </div>
      <button className="btn">Ver</button>
    </form>
  )
}
