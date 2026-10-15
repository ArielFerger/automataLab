import { useMemo, useState } from 'react'
import type { Automata } from '../../core/automaton'
import { vacio } from '../../core/actividad'
import { ACTIVIDADES, GRUPOS, actividadB, type Grupo } from '../../data/catalogo'
import { EJERCICIOS } from '../../data/banco'
import type { Progreso } from '../../store/useProgreso'
import { useLocal } from '../../store/useLocal'
import { RespuestaActividad, type AbrirEditor } from '../RespuestaActividad'

interface Props { delEditor: Automata; onEnviarAlEditor: AbrirEditor; progreso: Progreso }
export function PracticaPage({ delEditor, onEnviarAlEditor, progreso }: Props) {
  const [seleccion, setSeleccion] = useLocal('automatalab:seleccion', () => ({ grupo: 'A' as Grupo, id: 'A1' }), s => GRUPOS.some(g => g.id === s?.grupo) && typeof s?.id === 'string')
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')
  const [tema, setTema] = useState('todos')
  const [listaAbierta, setListaAbierta] = useState(false)
  const lista = ACTIVIDADES.filter(a => a.grupo === seleccion.grupo)
  const temas = [...new Set(lista.map(a => a.tema))]
  const visibles = lista.filter(a => {
    const b = progreso.avanceDe(a.id)
    const terminada = b?.resultado?.veredicto === 'correcto' || b?.revisado
    return (estado === 'todos' || (estado === 'pendientes' ? !terminada : terminada)) &&
      (tema === 'todos' || tema === a.tema) && `${a.id} ${a.enunciado} ${a.tema}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())
  })
  const elegido = visibles.find(a => a.id === seleccion.id) ?? visibles[0]
  const b = (elegido && progreso.avanceDe(elegido.id)) ?? vacio()
  const actividad = useMemo(() => elegido?.grupo === 'B' ? actividadB(elegido.numero, b.fuenteB) : elegido, [elegido, b.fuenteB])
  const completados = lista.filter(a => progreso.avanceDe(a.id)?.resultado?.veredicto === 'correcto' || progreso.avanceDe(a.id)?.revisado).length
  function cambiarGrupo(grupo: Grupo) {
    setSeleccion({ grupo, id: ACTIVIDADES.find(a => a.grupo === grupo)!.id }); setTema('todos'); setBusqueda(''); setEstado('todos'); setListaAbierta(false)
  }
  return <div className="estudio-page">
    <header className="estudio-cabecera"><div><h1>Tu próxima práctica.</h1><p>Elegí un ejercicio, resolvelo y comprobá tu respuesta.</p></div><div className="avance-resumen"><strong>{completados} / {lista.length}</strong><span>{seleccion.grupo === 'F' ? 'revisados por vos' : 'resueltos en este punto'}</span></div></header>
    <nav className="grupos-practica" aria-label="Puntos de la práctica">{GRUPOS.map(g => <button key={g.id} aria-current={seleccion.grupo === g.id ? 'page' : undefined} onClick={() => cambiarGrupo(g.id)}><span>{g.id}</span>{g.nombre}<small>{ACTIVIDADES.filter(a => a.grupo === g.id).length}</small></button>)}</nav>
    <div className="practica practica-nueva">
      <aside className={'practica-lista' + (listaAbierta ? ' lista-abierta' : '')} aria-label="Banco de ejercicios">
        <button className="mostrar-banco" aria-expanded={listaAbierta} aria-controls="banco-listado" onClick={() => setListaAbierta(v => !v)}>{listaAbierta ? 'Cerrar listado' : `Elegir ejercicio · ${actividad?.id ?? seleccion.grupo}`}<span>{visibles.length} disponibles</span></button>
        <div id="banco-listado" className="banco-contenido">
        <div className="practica-filtros">
          <label className="campo-etiqueta">Buscar ejercicio<input className="campo" type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Número, palabra o tema…" /></label>
          <div className="filtros-dobles"><label className="campo-etiqueta">Estado<select className="campo" value={estado} onChange={e => setEstado(e.target.value)}><option value="todos">Todos</option><option value="pendientes">Pendientes</option><option value="resueltos">{seleccion.grupo === 'F' ? 'Revisados' : 'Resueltos'}</option></select></label><label className="campo-etiqueta">Tipo de ejercicio<select className="campo" value={tema} onChange={e => setTema(e.target.value)}><option value="todos">Todos los tipos</option>{temas.map(t => <option key={t}>{t}</option>)}</select></label></div>
          <p className="ayuda">{visibles.length} ejercicios · {GRUPOS.find(g => g.id === seleccion.grupo)?.descripcion}</p>
        </div>
        <ul className="items">{visibles.map(a => {
          const guardado = progreso.avanceDe(a.id)
          const estadoTexto = guardado?.resultado?.veredicto === 'correcto' ? 'Verificado' : guardado?.revisado ? 'Revisado por vos' : guardado ? 'En curso' : 'Sin empezar'
          return <li key={a.id}><button className={'item ejercicio-fila' + (a.id === actividad?.id ? ' elegido' : '')} aria-current={a.id === actividad?.id ? 'true' : undefined} onClick={() => { setSeleccion({ ...seleccion, id: a.id }); setListaAbierta(false) }}><span className="item-numero">{a.id}</span><span className="ejercicio-info"><span className="item-texto">{a.titulo}</span><small>{estadoTexto}</small></span></button></li>
        })}</ul>
        {!visibles.length && <p className="vacio">No hay ejercicios con esos filtros. Cambiá el tema o la búsqueda.</p>}
        </div>
      </aside>
      <section className="practica-detalle" aria-label="Ejercicio seleccionado">
        {actividad && <article className="detalle" key={actividad.id}>
          <div className="detalle-navegacion"><span className="detalle-numero">{actividad.id}</span><span className="guardado-texto">{progreso.error ? 'No se pudo guardar: exportá un respaldo' : b.actualizado ? 'Borrador guardado en este dispositivo' : 'Guardado automático en este dispositivo'}</span></div>
          <h2 className="enunciado-principal">{actividad.enunciado}</h2>
          {actividad.grupo === 'B' && <label className="campo-etiqueta fuente-b">Autómata del punto A<select className="campo" value={b.fuenteB ?? actividad.lenguaje?.id} onChange={ev => progreso.guardar(actividad.id, { ...vacio(), fuenteB: Number(ev.target.value) })}>{EJERCICIOS.filter(e => e.punto === 'A' && e.regular).map(e => <option key={e.id} value={e.id}>A{e.id} · {e.enunciado}</option>)}</select></label>}
          <RespuestaActividad actividad={actividad} borrador={b} onCambio={nuevo => progreso.guardar(actividad.id, nuevo)} delEditor={delEditor} onEditor={onEnviarAlEditor} />
          <div className="navegacion-ejercicios"><button className="btn" disabled={visibles.indexOf(elegido!) <= 0} onClick={() => setSeleccion({ ...seleccion, id: visibles[visibles.indexOf(elegido!) - 1].id })}>Ejercicio anterior</button><button className="btn" disabled={visibles.indexOf(elegido!) >= visibles.length - 1} onClick={() => setSeleccion({ ...seleccion, id: visibles[visibles.indexOf(elegido!) + 1].id })}>Siguiente ejercicio</button></div>
        </article>}
      </section>
    </div>
  </div>
}
