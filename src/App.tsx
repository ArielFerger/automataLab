import { useEffect, useState } from 'react'
import type { Documento } from './core/documento'
import { documentoDelEnlace, limpiarEnlace } from './core/enlace'
import { useAutomata } from './store/useAutomaton'
import { useProgreso } from './store/useProgreso'
import { TEMAS, useTema } from './store/useTema'
import { EditorPage } from './ui/pages/EditorPage'
import { ConversionesPage } from './ui/pages/ConversionesPage'
import { PracticaPage } from './ui/pages/PracticaPage'
import { ParcialesPage } from './ui/pages/ParcialesPage'
import { ProgresoPage } from './ui/pages/ProgresoPage'
import { useLocal } from './store/useLocal'
import type { Automata } from './core/automaton'

type Vista = 'editor' | 'conversiones' | 'practica' | 'parciales' | 'progreso'

const PESTANAS: { id: Vista; texto: string }[] = [
  { id: 'practica', texto: 'Práctica' },
  { id: 'parciales', texto: 'Parciales' },
  { id: 'editor', texto: 'Editor' },
  { id: 'conversiones', texto: 'Conversiones' },
  { id: 'progreso', texto: 'Mi progreso' },
]

export default function App() {
  const [vista, setVista] = useLocal<Vista>('automatalab:vista', () => 'practica', v => PESTANAS.some(p => p.id === v))
  const [contexto, setContexto] = useLocal<{ titulo: string; volver: Vista } | null>('automatalab:contexto', () => null, c => c === null || (typeof c?.titulo === 'string' && ['practica', 'parciales'].includes(c.volver)))
  const historia = useAutomata()
  const progreso = useProgreso()
  const [tema, setTema] = useTema()
  const [invitacion, setInvitacion] = useState<Documento | null>(null)

  // Si la URL trae un autómata compartido se ofrece abrirlo, en vez de pisar lo
  // que la persona tenga a medio hacer.
  useEffect(() => {
    documentoDelEnlace().then((doc) => {
      if (doc) setInvitacion(doc)
    })
  }, [])

  // Deshacer y rehacer con el teclado, como en cualquier editor.
  useEffect(() => {
    function tecla(ev: KeyboardEvent) {
      if (!(ev.ctrlKey || ev.metaKey)) return
      const enCampo = ev.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(ev.target.tagName)
      if (enCampo) return
      if (ev.key === 'z' && !ev.shiftKey) {
        ev.preventDefault()
        historia.deshacer()
      } else if (ev.key === 'y' || (ev.key === 'z' && ev.shiftKey)) {
        ev.preventDefault()
        historia.rehacer()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [historia])

  function abrirDocumento(d: Documento) {
    historia.abrir(d)
    setVista('editor')
  }

  function resolverEnEditor(a: Automata, titulo?: string, notas?: string) {
    historia.setAutomata(a)
    if (titulo) historia.setTitulo(titulo)
    if (notas !== undefined) historia.setNotas(notas)
    setContexto({ titulo: titulo ?? 'Tu diagrama', volver: vista === 'parciales' ? 'parciales' : 'practica' })
    setVista('editor')
  }

  return (
    <div className="app">
      <a className="saltar-contenido" href="#contenido">Saltar al contenido</a>
      <header className="barra">
        <div className="marca">
          AutómataLab <span>Tu cuaderno de práctica</span>
        </div>
        <nav className="nav" aria-label="Navegación principal">
          {PESTANAS.map((p) => (
            <button key={p.id} aria-current={vista === p.id ? 'page' : undefined} onClick={() => setVista(p.id)}>
              {p.texto}
            </button>
          ))}
        </nav>
        <div className="barra-fin">
          <label className="selector-tema">
            <span className="visualmente-oculto">Tono de la página</span>
            <select value={tema} onChange={(ev) => setTema(ev.target.value as typeof tema)}>
              {TEMAS.map((t) => (
                <option key={t.id} value={t.id} title={t.ayuda}>
                  {t.texto}
                </option>
              ))}
            </select>
          </label>
          <button className="btn chico" onClick={historia.deshacer} disabled={!historia.puedeDeshacer} title="Deshacer" aria-label="Deshacer">
            <span className="icono-btn" aria-hidden="true">↶</span>
            <span className="texto-btn">Deshacer</span>
          </button>
          <button className="btn chico" onClick={historia.rehacer} disabled={!historia.puedeRehacer} title="Rehacer" aria-label="Rehacer">
            <span className="icono-btn" aria-hidden="true">↷</span>
            <span className="texto-btn">Rehacer</span>
          </button>
        </div>
      </header>
      {historia.errorGuardado && <p className="aviso malo" role="alert">No se pudo guardar el editor en este navegador. Usá Guardar para descargar tu diagrama antes de cerrar.</p>}

      {vista === 'editor' && contexto && <div className="contexto-editor"><span>Resolviendo <strong>{contexto.titulo}</strong></span><button className="btn chico" onClick={() => setVista(contexto.volver)}>Volver a la respuesta y adjuntar</button></div>}

      {invitacion && (
        <div className="invitacion">
          <p style={{ margin: 0 }}>
            Te compartieron <b>«{invitacion.titulo}»</b>
            {invitacion.autor ? ', de ' + invitacion.autor : ''}, con {invitacion.automata.estados.length} estados.
          </p>
          <div className="fila junta">
            <button
              className="btn primario chico"
              onClick={() => {
                abrirDocumento(invitacion)
                setInvitacion(null)
                limpiarEnlace()
              }}
            >
              Abrirlo
            </button>
            <button
              className="btn chico"
              onClick={() => {
                setInvitacion(null)
                limpiarEnlace()
              }}
            >
              Seguir con el mío
            </button>
          </div>
        </div>
      )}

      <main id="contenido" className="contenido-app" tabIndex={-1}>
      {vista === 'editor' && <EditorPage historia={historia} />}
      {vista === 'conversiones' && (
        <ConversionesPage
          delEditor={historia.automata}
          onEnviarAlEditor={resolverEnEditor}
        />
      )}
      {vista === 'practica' && (
        <PracticaPage
          delEditor={historia.automata}
          onEnviarAlEditor={resolverEnEditor}
          progreso={progreso}
        />
      )}
      {vista === 'parciales' && (
        <ParcialesPage
          delEditor={historia.automata}
          onEnviarAlEditor={resolverEnEditor}
        />
      )}
      {vista === 'progreso' && <ProgresoPage progreso={progreso} onPracticar={(id, grupo) => { localStorage.setItem('automatalab:seleccion', JSON.stringify({ id, grupo })); setVista('practica') }} />}
      </main>
    </div>
  )
}
