import { useEffect, useMemo, useState } from 'react'
import type { Automata } from '../../core/automaton'
import { vacio } from '../../core/actividad'
import { actividadDeItem, armarExamen, entregar, segundosDe, sesionNueva, textoExamen, esSesionExamen, type SesionExamen } from '../../core/examen'
import { descargar, nombreDeArchivo } from '../../core/documento'
import { PARCIALES } from '../../data/parciales'
import { useLocal } from '../../store/useLocal'
import { RespuestaActividad, type AbrirEditor } from '../RespuestaActividad'
import { AccionesIA } from '../AccionesIA'
import { Diagrama } from '../Diagrama'
import { TransitionTable } from '../TransitionTable'

interface Props { delEditor: Automata; onEnviarAlEditor: AbrirEditor }
export function ParcialesPage({ delEditor, onEnviarAlEditor }: Props) {
  const [opciones, setOpciones] = useLocal('automatalab:examen:seleccion', () => ({ elegido: 'generado', semilla: 1 }), o => typeof o?.elegido === 'string' && Number.isSafeInteger(o?.semilla) && o.semilla > 0)
  const [sesiones, setSesiones, error] = useLocal<Record<string, SesionExamen>>('automatalab:examen:sesiones', () => ({}), x => !!x && typeof x === 'object' && !Array.isArray(x) && Object.values(x).every(esSesionExamen))
  const [ahora, setAhora] = useState(Date.now())
  const generado = useMemo(() => armarExamen(opciones.semilla), [opciones.semilla])
  const parcial = opciones.elegido === 'generado' ? generado : PARCIALES.find(p => p.id === opciones.elegido) ?? generado
  const sesion = sesiones[parcial.id] ?? sesionNueva()
  const segundos = segundosDe(sesion, ahora)
  const entrega = sesion.entrega
  const [itemActivo, setItemActivo] = useLocal('automatalab:examen:item', () => 1, n => [1, 2, 3].includes(n))
  const item = parcial.items.find(i => i.numero === itemActivo) ?? parcial.items[0]
  const actividad = useMemo(() => actividadDeItem(item), [item])
  function guardar(s: SesionExamen) { setSesiones(actual => ({ ...actual, [parcial.id]: s })) }
  useEffect(() => {
    if (!sesion.inicio) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [sesion.inicio])
  function pausar() { const t = Date.now(); guardar({ ...sesion, acumulado: segundosDe(sesion, t), inicio: null }); setAhora(t) }
  function entregarTodo() {
    const resultado = entregar(parcial, sesion)
    guardar({ ...sesion, entrega: resultado, historial: [...sesion.historial, resultado], inicio: null, acumulado: resultado.segundos })
  }
  const respondidos = Object.values(sesion.respuestas).filter(b => b.expresion.trim() || b.desarrollo.trim() || b.noRegular || Object.keys(b.diagramas).length).length
  return <div className="estudio-page examenes-page">
    <header className="estudio-cabecera"><div><h1>Practicá como si rindieras.</h1><p>Tres consignas. El mismo formato. Un parcial diferente cuando quieras.</p></div><div className="formato-examen"><strong>20 / 60 / 20</strong><span>puntos por ejercicio</span></div></header>
    <div className="examen-controles"><label className="campo-etiqueta">Examen<select className="campo" value={opciones.elegido} onChange={ev => { setOpciones({ ...opciones, elegido: ev.target.value }); setItemActivo(1) }}><option value="generado">Simulacros generados</option>{PARCIALES.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select></label>{opciones.elegido === 'generado' && <><label className="campo-etiqueta">Número de simulacro<input className="campo numero-simulacro" type="number" min={1} max={1000000} value={opciones.semilla} onChange={ev => { const n = Number(ev.target.value); if (Number.isSafeInteger(n) && n > 0 && n <= 1000000) setOpciones({ ...opciones, semilla: n }) }} /></label><button className="btn" onClick={() => { setOpciones({ elegido: 'generado', semilla: opciones.semilla >= 1000000 ? 1 : opciones.semilla + 1 }); setItemActivo(1) }}>Nuevo simulacro</button></>}
      <div className="reloj"><time className="cronometro" aria-label="Tiempo transcurrido">{String(Math.floor(segundos / 60)).padStart(2, '0')}:{String(segundos % 60).padStart(2, '0')}</time><button className="btn chico" disabled={!!entrega} onClick={() => { if (sesion.inicio) pausar(); else { const t = Date.now(); setAhora(t); guardar({ ...sesion, inicio: t }) } }}>{sesion.inicio ? 'Pausar' : segundos ? 'Continuar' : 'Iniciar reloj'}</button></div>
    </div>
    <div className="examen-contenido">
      <aside className="examen-resumen"><h2>{parcial.titulo}</h2><p className="ayuda">{error ? 'No se pudo guardar. Descargá tu entrega.' : 'El borrador y el reloj se conservan al salir.'}</p><label className="campo-etiqueta">Tu nombre<input className="campo" value={entrega?.alumno ?? sesion.alumno} disabled={!!entrega} onChange={ev => guardar({ ...sesion, alumno: ev.target.value })} placeholder="Nombre y apellido" /></label>
        <nav className="indice-examen" aria-label="Ejercicios del examen">{parcial.items.map(i => <button key={i.numero} aria-current={i.numero === item.numero ? 'step' : undefined} onClick={() => setItemActivo(i.numero)}><strong>Ejercicio {i.numero}<span>{i.puntos} pts</span></strong><span>{i.tipo === 'af-a-er' ? 'Autómata → ER' : i.tipo === 'er-a-afd' ? 'ER → AFD mínimo' : 'Lenguaje → autómata'}</span><small>{entrega ? entrega.respuestas[i.numero]?.resultado?.veredicto === 'correcto' ? 'Verificado' : 'A revisar' : sesion.respuestas[i.numero] ? 'En curso' : 'Sin empezar'}</small></button>)}</nav>
        {!entrega ? <><p>{respondidos} de 3 respuestas iniciadas</p><button className="btn primario" onClick={entregarTodo}>Entregar parcial</button><p className="ayuda">Podés entregar aunque falten respuestas. Se guarda una copia cerrada y se verifica el resultado.</p></> : <div className="resultado-examen" role="status"><h3>Entrega guardada</h3><strong>{entrega.puntos} / 100</strong><p>Verificación automática orientativa. El procedimiento escrito requiere revisión.</p><time dateTime={entrega.fecha}>{new Date(entrega.fecha).toLocaleString('es-AR')}</time><p className="ayuda">Guardada en este dispositivo. Descargala para entregarla por el medio de tu cursada.</p><button className="btn" onClick={() => guardar({ ...sesion, entrega: undefined })}>Volver a practicar</button></div>}
        <button className="btn" onClick={() => descargar(textoExamen(parcial, sesion), nombreDeArchivo(parcial.titulo + (entrega ? '-entrega' : '-borrador'), 'txt'), 'text/plain;charset=utf-8')}>Descargar {entrega ? 'entrega' : 'borrador'}</button>
        <button className="btn texto" onClick={() => window.print()}>Imprimir / guardar PDF</button>
        {sesion.historial.length > 0 && <details><summary>Entregas anteriores ({sesion.historial.length})</summary>{sesion.historial.map((e, i) => <button key={`${e.fecha}-${i}`} className="btn chico historial-entrega" onClick={() => descargar(textoExamen(parcial, { ...sesion, entrega: e }), nombreDeArchivo(parcial.titulo + '-intento-' + (i + 1), 'txt'), 'text/plain;charset=utf-8')}>Intento {i + 1}: {e.puntos}/100 · {new Date(e.fecha).toLocaleDateString('es-AR')}</button>)}</details>}
      </aside>
      <article className="hoja-examen" key={parcial.id + '-' + item.numero}><div className="detalle-navegacion"><span className="detalle-numero">Ejercicio {item.numero}</span><span>{item.puntos} puntos</span></div><h2 className="enunciado-principal">{actividad.enunciado}</h2>
        <RespuestaActividad actividad={actividad} borrador={(entrega?.respuestas ?? sesion.respuestas)[item.numero] ?? vacio()} onCambio={b => guardar({ ...sesion, respuestas: { ...sesion.respuestas, [item.numero]: b } })} delEditor={delEditor} onEditor={onEnviarAlEditor} examen bloqueado={!!entrega} />
        <div className="navegacion-ejercicios"><button className="btn" disabled={item.numero === 1} onClick={() => setItemActivo(n => n - 1)}>Ejercicio anterior</button><button className="btn" disabled={item.numero === 3} onClick={() => setItemActivo(n => n + 1)}>Siguiente ejercicio</button></div>
        <details className="examen-ia"><summary>Revisar el parcial completo con IA</summary><AccionesIA texto={textoExamen(parcial, sesion)} /></details>
      </article>
    </div>
    <div className="solo-impresion"><h1>{parcial.titulo}</h1><p>Alumno: {entrega?.alumno ?? sesion.alumno} · Formato 20 / 60 / 20</p><p>{entrega ? `Entrega local: ${new Date(entrega.fecha).toLocaleString('es-AR')}` : 'Borrador sin entregar'}</p>{parcial.items.map(i => {
      const respuesta = (entrega?.respuestas ?? sesion.respuestas)[i.numero] ?? vacio()
      return <section key={i.numero}><h2>Ejercicio {i.numero} ({i.puntos} puntos)</h2><p>{actividadDeItem(i).enunciado}</p>{i.automata && <Diagrama automata={i.automata} alto={240} />}<h3>Respuesta</h3>{respuesta.noRegular && <p>Clasificación: no regular.</p>}{respuesta.expresion && <p>ER: <code>{respuesta.expresion}</code></p>}{Object.entries(respuesta.diagramas).map(([etapa, a]) => <div key={etapa}><h4>{etapa}</h4><Diagrama automata={a} alto={230} /><TransitionTable automata={a} soloLectura foco={null} onFoco={() => {}} onCambio={() => {}} /></div>)}<pre>{respuesta.desarrollo || '(Sin desarrollo escrito)'}</pre>{respuesta.resultado && <p>Verificación: {respuesta.resultado.mensaje}</p>}</section>
    })}{entrega && <p>Resultado automático orientativo: {entrega.puntos}/100. El procedimiento requiere revisión docente o con IA.</p>}</div>
  </div>
}
