/**
 * Sesión de administrador, contra la autenticación de Supabase.
 *
 * Importante: acá no se decide nada. Un "modo admin" que se chequeara solo en el
 * navegador sería decorativo, porque cualquiera con la clave anónima —que es
 * pública por diseño— podría saltearlo. Quien decide si se puede editar o borrar
 * son las políticas de la base: el token que se manda acá lleva el `auth.uid()`
 * que esas políticas comparan contra la tabla `admins`.
 *
 * Lo que hay en este archivo es solo lo necesario para conseguir ese token y
 * saber si conviene mostrar los botones de moderación.
 */

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const CLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const GUARDADO = 'automatalab:sesion'
/** Margen para renovar antes de que el token venza y falle un pedido a mitad de camino. */
const MARGEN_SEGUNDOS = 60

export interface Sesion {
  accessToken: string
  refreshToken: string
  /** segundos desde época en que vence el access token */
  venceEn: number
  email: string
  esAdmin: boolean
}

export class ErrorDeSesion extends Error {}

let sesion: Sesion | null = leerGuardada()
const oyentes = new Set<(s: Sesion | null) => void>()

function leerGuardada(): Sesion | null {
  try {
    const crudo = localStorage.getItem(GUARDADO)
    if (!crudo) return null
    const s = JSON.parse(crudo) as Sesion
    return typeof s.accessToken === 'string' && typeof s.refreshToken === 'string' ? s : null
  } catch {
    return null
  }
}

function guardar(s: Sesion | null) {
  sesion = s
  try {
    if (s) localStorage.setItem(GUARDADO, JSON.stringify(s))
    else localStorage.removeItem(GUARDADO)
  } catch {
    // Sin localStorage la sesión dura lo que dure la pestaña.
  }
  for (const oyente of oyentes) oyente(s)
}

/** Avisa cuando la sesión cambia, para que la interfaz se actualice. */
export function alCambiarSesion(oyente: (s: Sesion | null) => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function sesionActual(): Sesion | null {
  return sesion
}

function ahora(): number {
  return Math.floor(Date.now() / 1000)
}

async function pedirToken(cuerpo: Record<string, string>, tipo: 'password' | 'refresh_token') {
  const respuesta = await fetch(`${URL_BASE}/auth/v1/token?grant_type=${tipo}`, {
    method: 'POST',
    headers: { apikey: CLAVE, 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  const datos = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>
  if (!respuesta.ok) {
    const mensaje = String(datos.error_description ?? datos.msg ?? datos.error ?? '')
    throw new ErrorDeSesion(
      /invalid|credentials|grant/i.test(mensaje) ? 'Ese mail o esa contraseña no son correctos.' : mensaje || 'No se pudo iniciar sesión.',
    )
  }
  return datos as {
    access_token: string
    refresh_token: string
    expires_in: number
    user?: { email?: string }
  }
}

/**
 * Pregunta a la base si este usuario está en `admins`.
 *
 * La política de lectura de esa tabla deja ver solo la fila propia, así que la
 * respuesta viene vacía para cualquiera que no sea administrador.
 */
async function averiguarSiEsAdmin(accessToken: string): Promise<boolean> {
  try {
    const respuesta = await fetch(`${URL_BASE}/rest/v1/admins?select=id&limit=1`, {
      headers: { apikey: CLAVE, Authorization: 'Bearer ' + accessToken },
    })
    if (!respuesta.ok) return false
    return ((await respuesta.json()) as unknown[]).length > 0
  } catch {
    return false
  }
}

export async function entrar(email: string, contrasena: string): Promise<Sesion> {
  if (!URL_BASE || !CLAVE) throw new ErrorDeSesion('La galería no está conectada todavía.')
  const datos = await pedirToken({ email: email.trim(), password: contrasena }, 'password')
  const nueva: Sesion = {
    accessToken: datos.access_token,
    refreshToken: datos.refresh_token,
    venceEn: ahora() + (datos.expires_in ?? 3600),
    email: datos.user?.email ?? email.trim(),
    esAdmin: await averiguarSiEsAdmin(datos.access_token),
  }
  guardar(nueva)
  return nueva
}

export async function salir(): Promise<void> {
  const actual = sesion
  guardar(null)
  if (!actual) return
  try {
    await fetch(`${URL_BASE}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: CLAVE, Authorization: 'Bearer ' + actual.accessToken },
    })
  } catch {
    // Si no se puede avisar al servidor da igual: el token local ya se borró.
  }
}

/**
 * Devuelve un access token vigente, renovándolo si hace falta.
 * Si la sesión venció y no se puede renovar, la cierra y devuelve null.
 */
export async function tokenVigente(): Promise<string | null> {
  if (!sesion) return null
  if (sesion.venceEn - MARGEN_SEGUNDOS > ahora()) return sesion.accessToken
  try {
    const datos = await pedirToken({ refresh_token: sesion.refreshToken }, 'refresh_token')
    const renovada: Sesion = {
      ...sesion,
      accessToken: datos.access_token,
      refreshToken: datos.refresh_token,
      venceEn: ahora() + (datos.expires_in ?? 3600),
    }
    guardar(renovada)
    return renovada.accessToken
  } catch {
    guardar(null)
    return null
  }
}

/** Revalida contra la base si el usuario guardado sigue siendo administrador. */
export async function revalidar(): Promise<Sesion | null> {
  const token = await tokenVigente()
  if (!token || !sesion) return null
  const esAdmin = await averiguarSiEsAdmin(token)
  if (esAdmin !== sesion.esAdmin) guardar({ ...sesion, esAdmin })
  return sesionActual()
}
