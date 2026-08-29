import { useCallback, useEffect, useState } from 'react'
import { clasificar } from '../../core/automaton'
import { type Publicacion, comunidadConfigurada, editar, eliminar, listar, publicar } from '../../core/comunidad'
import type { Documento } from '../../core/documento'
import { copiar, enlaceDe } from '../../core/enlace'
import type { Sesion } from '../../core/sesion'
import { AdminSesion } from '../AdminSesion'
import { Diagrama } from '../Diagrama'

interface Props {
  documento: Documento
  onAbrir: (d: Documento) => void
  onAutor: (a: string) => void
}

/**
 * La galería: los autómatas que sube la gente, para mirarlos y abrirlos.
 *
 * Si la galería todavía no está conectada a su servidor, la pestaña no queda
 * rota: explica cómo encenderla y ofrece compartir por link, que no necesita
 * servidor y sirve igual para pasarle un autómata a un compañero.
 */
export function ComunidadPage({ documento, onAbrir, onAutor }: Props) {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [publicando, setPublicando] = useState(false)
  const [sesion, setSesion] = useState<Sesion | null>(null)

  const esAdmin = Boolean(sesion?.esAdmin)

  const traer = useCallback(async (texto: string) => {
    if (!comunidadConfigurada) return
    setCargando(true)
    setError(null)
    try {
      setPublicaciones(await listar(texto))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer la galería.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    traer('')
  }, [traer])

  function avisar(texto: string) {
    setAviso(texto)
    setTimeout(() => setAviso(null), 4000)
  }

  async function subir() {
    setPublicando(true)
    setError(null)
    try {
      const nueva = await publicar(documento)
      setPublicaciones((p) => [nueva, ...p])
      avisar('Listo: «' + nueva.titulo + '» ya está en la galería.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo publicar.')
    } finally {
      setPublicando(false)
    }
  }

  return (
    <div className="comunidad">
      <div className="conv-cabecera">
        <div className="fila" style={{ flexWrap: 'wrap' }}>
          <input
            className="campo"
            style={{ maxWidth: 260 }}
            placeholder="Buscar por título o autor"
            value={busqueda}
            onChange={(ev) => setBusqueda(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') traer(busqueda)
            }}
            disabled={!comunidadConfigurada}
          />
          <button className="btn chico" onClick={() => traer(busqueda)} disabled={!comunidadConfigurada || cargando}>
            {cargando ? 'Buscando…' : 'Buscar'}
          </button>
          <div style={{ marginLeft: 'auto' }} className="fila junta">
            <AdminSesion onCambio={setSesion} />
            <input
              className="campo"
              style={{ width: 140 }}
              placeholder="Tu nombre"
              value={documento.autor}
              aria-label="Tu nombre, para firmar lo que publiques"
              onChange={(ev) => onAutor(ev.target.value)}
              disabled={!comunidadConfigurada}
            />
            <button className="btn primario chico" onClick={subir} disabled={!comunidadConfigurada || publicando}>
              {publicando ? 'Subiendo…' : 'Publicar el mío'}
            </button>
          </div>
        </div>
        <p className="ayuda" style={{ marginBottom: 12 }}>
          {!comunidadConfigurada
            ? 'La galería todavía no está conectada.'
            : esAdmin
              ? 'Entraste como administrador: podés editar y borrar cualquier publicación.'
              : 'Se publica el autómata que tengas abierto en el editor, con su título y sus notas.'}
        </p>
      </div>

      <div className="conv-cuerpo">
        {!comunidadConfigurada && <SinConectar documento={documento} />}
        {error && <p className="aviso malo">{error}</p>}
        {aviso && <p className="aviso">{aviso}</p>}

        {comunidadConfigurada && !cargando && publicaciones.length === 0 && !error && (
          <p className="vacio">Todavía no subió nadie nada. Podés ser el primero.</p>
        )}

        <div className="galeria">
          {publicaciones.map((p) => (
            <Tarjeta
              key={p.id}
              publicacion={p}
              esAdmin={esAdmin}
              documentoDelEditor={documento}
              onAbrir={onAbrir}
              onAviso={avisar}
              onError={setError}
              onActualizada={(nueva) =>
                setPublicaciones((lista) => lista.map((x) => (x.id === nueva.id ? nueva : x)))
              }
              onBorrada={() => setPublicaciones((lista) => lista.filter((x) => x.id !== p.id))}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface TarjetaProps {
  publicacion: Publicacion
  esAdmin: boolean
  documentoDelEditor: Documento
  onAbrir: (d: Documento) => void
  onAviso: (t: string) => void
  onError: (t: string | null) => void
  onActualizada: (p: Publicacion) => void
  onBorrada: () => void
}

function Tarjeta({
  publicacion,
  esAdmin,
  documentoDelEditor,
  onAbrir,
  onAviso,
  onError,
  onActualizada,
  onBorrada,
}: TarjetaProps) {
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(publicacion.titulo)
  const [autor, setAutor] = useState(publicacion.autor)
  const [notas, setNotas] = useState(publicacion.notas)
  const [confirmando, setConfirmando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)

  async function guardar(reemplazarAutomata: boolean) {
    setTrabajando(true)
    onError(null)
    try {
      const nueva = await editar(publicacion.id, {
        titulo,
        autor,
        notas,
        documento: reemplazarAutomata
          ? { ...documentoDelEditor, titulo: titulo.trim() || documentoDelEditor.titulo }
          : undefined,
      })
      onActualizada(nueva)
      setEditando(false)
      onAviso('Cambios guardados.')
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo guardar.')
    } finally {
      setTrabajando(false)
    }
  }

  async function borrar() {
    setTrabajando(true)
    onError(null)
    try {
      await eliminar(publicacion.id)
      onAviso('Se borró «' + publicacion.titulo + '».')
      onBorrada()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo borrar.')
      setTrabajando(false)
    }
  }

  return (
    <article className="tarjeta">
      <header className="tarjeta-cabecera">
        <h3>{publicacion.titulo}</h3>
        <span className="chapa">{clasificar(publicacion.documento.automata)}</span>
      </header>
      <p className="tarjeta-autor">
        {publicacion.autor} · {publicacion.estados} estados · Σ = &#123;
        {publicacion.alfabeto.split(' ').filter(Boolean).join(', ')}&#125;
      </p>
      <div className="tarjeta-diagrama">
        <Diagrama automata={publicacion.documento.automata} alto={150} />
      </div>
      {publicacion.notas && !editando && <p className="tarjeta-notas">{publicacion.notas}</p>}

      {editando ? (
        <div className="tarjeta-edicion">
          <label className="etiqueta-campo" htmlFor={'t-' + publicacion.id}>
            Título
          </label>
          <input id={'t-' + publicacion.id} className="campo" value={titulo} onChange={(ev) => setTitulo(ev.target.value)} />
          <label className="etiqueta-campo" htmlFor={'a-' + publicacion.id}>
            Autor
          </label>
          <input id={'a-' + publicacion.id} className="campo" value={autor} onChange={(ev) => setAutor(ev.target.value)} />
          <label className="etiqueta-campo" htmlFor={'n-' + publicacion.id}>
            Notas
          </label>
          <textarea id={'n-' + publicacion.id} className="campo" rows={2} value={notas} onChange={(ev) => setNotas(ev.target.value)} />

          <div className="fila junta" style={{ flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn primario chico" onClick={() => guardar(false)} disabled={trabajando}>
              Guardar
            </button>
            <button
              className="btn chico"
              onClick={() => guardar(true)}
              disabled={trabajando || documentoDelEditor.automata.estados.length === 0}
              title="Pisa el autómata publicado con el que tenés abierto en el editor"
            >
              Guardar y reemplazar el diagrama
            </button>
            <button
              className="btn chico"
              onClick={() => {
                setTitulo(publicacion.titulo)
                setAutor(publicacion.autor)
                setNotas(publicacion.notas)
                setEditando(false)
              }}
              disabled={trabajando}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="fila junta" style={{ flexWrap: 'wrap' }}>
          <button className="btn chico" onClick={() => onAbrir(publicacion.documento)}>
            Abrir en el editor
          </button>
          <button
            className="btn chico"
            onClick={async () => {
              const url = await enlaceDe(publicacion.documento)
              onAviso((await copiar(url)) ? 'Link copiado.' : 'No se pudo copiar el link.')
            }}
          >
            Copiar link
          </button>
          {esAdmin && (
            <>
              <button className="btn chico" onClick={() => setEditando(true)} disabled={trabajando}>
                Editar
              </button>
              {confirmando ? (
                <>
                  <button className="btn chico peligro" onClick={borrar} disabled={trabajando}>
                    {trabajando ? 'Borrando…' : 'Confirmar borrado'}
                  </button>
                  <button className="btn chico" onClick={() => setConfirmando(false)} disabled={trabajando}>
                    No
                  </button>
                </>
              ) : (
                <button className="btn chico peligro" onClick={() => setConfirmando(true)} disabled={trabajando}>
                  Borrar
                </button>
              )}
            </>
          )}
        </div>
      )}
    </article>
  )
}

function SinConectar({ documento }: { documento: Documento }) {
  const [enlace, setEnlace] = useState('')

  return (
    <div className="etapa-caja">
      <h2 className="detalle-enunciado">Compartir sin servidor</h2>
      <p>
        La galería necesita un lugar donde guardar lo que sube la gente, y todavía no está conectada. Mientras
        tanto, cualquier autómata se puede pasar por link: el autómata entero viaja adentro de la URL, así que
        no hace falta ningún servidor ni ninguna cuenta.
      </p>
      <div className="fila" style={{ marginTop: 12 }}>
        <button className="btn primario" onClick={() => enlaceDe(documento).then(setEnlace)}>
          Armar el link de «{documento.titulo}»
        </button>
      </div>
      {enlace && (
        <div className="fila" style={{ marginTop: 10 }}>
          <input className="campo mono" readOnly value={enlace} onFocus={(ev) => ev.target.select()} />
          <button className="btn chico" onClick={() => copiar(enlace)}>
            Copiar
          </button>
        </div>
      )}

      <h3 className="seccion-titulo" style={{ marginTop: 26 }}>
        Cómo encender la galería
      </h3>
      <ol className="pasos-numerados">
        <li>
          Creá un proyecto gratis en <code>supabase.com</code>.
        </li>
        <li>
          En el editor SQL, pegá y ejecutá el script que está en <code>supabase/schema.sql</code> del repo.
        </li>
        <li>
          Copiá la URL del proyecto y la clave <code>anon</code> desde Settings → API.
        </li>
        <li>
          Poné las dos en un archivo <code>.env.local</code> como <code>VITE_SUPABASE_URL</code> y{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, y las mismas en Vercel como variables de entorno.
        </li>
        <li>
          Para moderar, creá tu usuario en Authentication → Users y agregá su UUID a la tabla{' '}
          <code>admins</code>.
        </li>
      </ol>
      <p className="ayuda">Está todo detallado en el README, en la sección Comunidad.</p>
    </div>
  )
}
