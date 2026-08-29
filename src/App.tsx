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
import { ComunidadPage } from './ui/pages/ComunidadPage'

type Vista = 'editor' | 'conversiones' | 'practica' | 'parciales' | 'comunidad'

const PESTANAS: { id: Vista; texto: string }[] = [
  { id: 'editor', texto: 'Editor' },
  { id: 'conversiones', texto: 'Conversiones' },
  { id: 'practica', texto: 'Práctica' },
  { id: 'parciales', texto: 'Parciales' },
  { id: 'comunidad', texto: 'Comunidad' },
]

export default function App() {
  const [vista, setVista] = useState<Vista>('editor')
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

  return (
    <div className="app">
      <header className="barra">
        <div className="marca">
          AutómataLab <span>Paradigmas y Lenguajes</span>
        </div>
        <nav className="nav">
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
          <button className="btn chico" onClick={historia.deshacer} disabled={!historia.puedeDeshacer}>
            Deshacer
          </button>
          <button className="btn chico" onClick={historia.rehacer} disabled={!historia.puedeRehacer}>
            Rehacer
          </button>
        </div>
      </header>

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

      {vista === 'editor' && <EditorPage historia={historia} />}
      {vista === 'conversiones' && (
        <ConversionesPage
          delEditor={historia.automata}
          onEnviarAlEditor={(a) => {
            historia.setAutomata(a)
            setVista('editor')
          }}
        />
      )}
      {vista === 'practica' && (
        <PracticaPage
          delEditor={historia.automata}
          onEnviarAlEditor={(a) => {
            historia.setAutomata(a)
            setVista('editor')
          }}
          progreso={progreso}
        />
      )}
      {vista === 'parciales' && (
        <ParcialesPage
          delEditor={historia.automata}
          onEnviarAlEditor={(a) => {
            historia.setAutomata(a)
            setVista('editor')
          }}
        />
      )}
      {vista === 'comunidad' && (
        <ComunidadPage documento={historia.documento} onAbrir={abrirDocumento} onAutor={historia.setAutor} />
      )}
    </div>
  )
}
