import { useRef, useState } from 'react'
import type { Progreso } from '../../store/useProgreso'
import { ACTIVIDADES, GRUPOS, type Grupo } from '../../data/catalogo'
import { crearRespaldo, restaurarRespaldo, validarRespaldo } from '../../core/respaldo'
import { descargar } from '../../core/documento'

export function ProgresoPage({ progreso, onPracticar }: { progreso: Progreso; onPracticar: (id: string, grupo: Grupo) => void }) {
  const archivo = useRef<HTMLInputElement>(null)
  const [importacion, setImportacion] = useState<Record<string, unknown> | null>(null)
  const [mensaje, setMensaje] = useState('')
  function exportar() { try { descargar(crearRespaldo(), `automatalab-respaldo-${new Date().toISOString().slice(0, 10)}.json`); setMensaje('Respaldo descargado con práctica, exámenes y diagrama del editor.') } catch { setMensaje('No se pudo leer el almacenamiento. Habilitalo en el navegador y volvé a intentar.') } }
  return <div className="progreso-page"><header className="estudio-cabecera"><div><h1>Cada intento cuenta.</h1><p>Tu práctica queda guardada en este navegador. Llevate una copia para seguir en otro dispositivo.</p></div></header>
    {progreso.error && <p className="aviso" role="alert">El navegador no permite guardar. Conservá tus respuestas antes de cerrar.</p>}
    <section className="respaldo-panel"><h2>Tu progreso, con vos.</h2><p>El respaldo incluye las respuestas, los diagramas adjuntos, las entregas y el borrador del editor.</p><div className="fila junta envolver"><button className="btn primario" onClick={exportar}>Descargar respaldo</button><button className="btn" onClick={() => archivo.current?.click()}>Importar respaldo</button></div>
      <input ref={archivo} className="visualmente-oculto" aria-label="Archivo de respaldo" type="file" accept="application/json,.json" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { if (f.size > 20 * 1024 * 1024) throw new Error('El archivo supera los 20 MB.'); setImportacion(validarRespaldo(await f.text())); setMensaje('Respaldo válido. Se conservarán tus ejercicios actuales que no estén en el archivo. Las respuestas coincidentes y el editor se reemplazarán.') } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo leer el respaldo.'); setImportacion(null) } }} />
      <p role="status">{mensaje}</p>{importacion && <div className="fila junta envolver"><button className="btn primario" onClick={() => { try { restaurarRespaldo(importacion); window.location.reload() } catch (e) { setMensaje(e instanceof Error ? e.message : 'No se pudo importar.') } }}>Aplicar respaldo</button><button className="btn" onClick={() => { setImportacion(null); setMensaje('Importación cancelada.') }}>Cancelar</button></div>}
    </section>
    <table className="tabla tabla-progreso"><caption>Avance por punto de la práctica</caption><thead><tr><th scope="col">Práctica</th><th scope="col">Guardados</th><th scope="col">Verificados / revisados</th><th scope="col">Continuar</th></tr></thead><tbody>{GRUPOS.map(g => {
      const lista = ACTIVIDADES.filter(a => a.grupo === g.id)
      const guardados = lista.filter(a => progreso.mapa[a.id])
      const completos = lista.filter(a => progreso.mapa[a.id]?.resultado?.veredicto === 'correcto' || progreso.mapa[a.id]?.revisado)
      const siguiente = lista.find(a => progreso.mapa[a.id] && !completos.includes(a)) ?? lista.find(a => !completos.includes(a)) ?? lista[0]
      return <tr key={g.id}><th scope="row">{g.id} · {g.nombre}</th><td>{guardados.length} / {lista.length}</td><td>{completos.length}{g.id === 'F' && <small> · revisión externa</small>}</td><td><button className="btn chico" onClick={() => onPracticar(siguiente.id, siguiente.grupo)}>Seguir en {siguiente.id}</button></td></tr>
    })}</tbody></table>
    <p className="ayuda">Las verificaciones automáticas comprueban resultados y formato. Las demostraciones, procedimientos y programas LISP requieren una revisión adicional.</p>
  </div>
}
