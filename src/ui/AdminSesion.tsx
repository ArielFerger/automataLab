import { useEffect, useState } from 'react'
import { type Sesion, ErrorDeSesion, alCambiarSesion, entrar, revalidar, salir, sesionActual } from '../core/sesion'

/**
 * El acceso de administrador.
 *
 * Se muestra chiquito, porque casi nadie lo usa: al resto de la gente la galería
 * le sirve igual sin iniciar sesión.
 */
export function AdminSesion({ onCambio }: { onCambio: (s: Sesion | null) => void }) {
  const [sesion, setSesion] = useState<Sesion | null>(sesionActual)
  const [abierto, setAbierto] = useState(false)
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  useEffect(() => alCambiarSesion(setSesion), [])
  useEffect(() => onCambio(sesion), [sesion, onCambio])

  // Al abrir la app se revalida: puede haberse vencido el token o haber perdido
  // el permiso de administrador desde la última vez.
  useEffect(() => {
    if (sesionActual()) revalidar()
  }, [])

  async function iniciar(ev: React.FormEvent) {
    ev.preventDefault()
    setEntrando(true)
    setError(null)
    try {
      const s = await entrar(email, contrasena)
      setContrasena('')
      setAbierto(false)
      if (!s.esAdmin) {
        setError('Entraste bien, pero esta cuenta no está en la tabla admins, así que no puede moderar.')
        setAbierto(true)
      }
    } catch (e) {
      setError(e instanceof ErrorDeSesion ? e.message : 'No se pudo iniciar sesión.')
    } finally {
      setEntrando(false)
    }
  }

  if (sesion) {
    return (
      <div className="admin-caja">
        <span className={'chapa ' + (sesion.esAdmin ? 'afd' : '')} title={sesion.email}>
          {sesion.esAdmin ? 'admin' : 'sin permisos'}
        </span>
        <button className="btn chico" onClick={() => salir()}>
          Salir
        </button>
      </div>
    )
  }

  return (
    <div className="admin-caja">
      <button className="btn chico" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        Entrar como admin
      </button>
      {abierto && (
        <form className="panel-desplegable admin-acceso" onSubmit={iniciar}>
          <p className="ayuda" style={{ marginTop: 0 }}>
            Solo para moderar la galería. Para mirar y publicar no hace falta.
          </p>
          <div className="fila junta" style={{ flexWrap: 'wrap' }}>
            <input
              className="campo"
              style={{ width: 200 }}
              type="email"
              autoComplete="username"
              placeholder="mail"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
            <input
              className="campo"
              style={{ width: 170 }}
              type="password"
              autoComplete="current-password"
              placeholder="contraseña"
              value={contrasena}
              onChange={(ev) => setContrasena(ev.target.value)}
              required
            />
            <button className="btn primario chico" type="submit" disabled={entrando}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
          {error && (
            <p className="aviso malo" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
