/**
 * La galería de la comunidad, contra Supabase.
 *
 * Se habla con la API REST directamente, sin el SDK: son cuatro pedidos y evita
 * sumar una dependencia de 100 kB a una app que por lo demás no necesita red.
 *
 * Si el proyecto no está configurado (faltan las variables de entorno), la app
 * sigue funcionando entera: la pestaña Comunidad explica cómo encenderla y
 * compartir por link anda igual, que no necesita servidor.
 *
 * Tabla esperada en Supabase:
 *
 *   create table automatas (
 *     id uuid primary key default gen_random_uuid(),
 *     titulo text not null,
 *     autor text not null default 'Anónimo',
 *     notas text not null default '',
 *     documento jsonb not null,
 *     estados int not null default 0,
 *     alfabeto text not null default '',
 *     creado timestamptz not null default now()
 *   );
 *   alter table automatas enable row level security;
 *   create policy "lectura publica" on automatas for select using (true);
 *   create policy "alta publica"   on automatas for insert with check (true);
 */

import { type Documento, desdeObjeto } from './documento'
import { tokenVigente } from './sesion'

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const CLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const TABLA = 'automatas'

export const comunidadConfigurada = Boolean(URL_BASE && CLAVE)

export interface Publicacion {
  id: string
  titulo: string
  autor: string
  notas: string
  estados: number
  alfabeto: string
  creado: string
  documento: Documento
}

/**
 * Encabezados del pedido. Si hay sesión iniciada se manda ese token en lugar de
 * la clave anónima: es lo que deja que las políticas de la base reconozcan al
 * administrador y le permitan editar o borrar.
 */
async function encabezados(extra: Record<string, string> = {}) {
  const token = await tokenVigente()
  return {
    apikey: CLAVE,
    Authorization: 'Bearer ' + (token ?? CLAVE),
    'Content-Type': 'application/json',
    ...extra,
  }
}

function aPublicacion(fila: Record<string, unknown>): Publicacion {
  return {
    id: String(fila.id),
    titulo: String(fila.titulo ?? 'Sin título'),
    autor: String(fila.autor ?? 'Anónimo'),
    notas: String(fila.notas ?? ''),
    estados: Number(fila.estados ?? 0),
    alfabeto: String(fila.alfabeto ?? ''),
    creado: String(fila.creado ?? ''),
    documento: desdeObjeto(fila.documento),
  }
}

export class ErrorDeComunidad extends Error {}

function sinConfigurar(): never {
  throw new ErrorDeComunidad(
    'La galería todavía no está conectada. Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
  )
}

/** Trae las publicaciones más recientes, opcionalmente filtradas por texto. */
export async function listar(busqueda = '', limite = 60): Promise<Publicacion[]> {
  if (!comunidadConfigurada) sinConfigurar()
  const parametros = new URLSearchParams({
    select: 'id,titulo,autor,notas,estados,alfabeto,creado,documento',
    order: 'creado.desc',
    limit: String(limite),
  })
  if (busqueda.trim()) {
    // Busca por título o por autor, sin distinguir mayúsculas.
    const q = busqueda.trim().replace(/[(),*]/g, ' ')
    parametros.set('or', `(titulo.ilike.*${q}*,autor.ilike.*${q}*)`)
  }

  const respuesta = await fetch(`${URL_BASE}/rest/v1/${TABLA}?${parametros}`, { headers: await encabezados() })
  if (!respuesta.ok) {
    throw new ErrorDeComunidad('No se pudo leer la galería (' + respuesta.status + ').')
  }
  const filas = (await respuesta.json()) as Record<string, unknown>[]
  return filas.map(aPublicacion)
}

/** Sube un autómata a la galería. Devuelve la publicación creada. */
export async function publicar(doc: Documento): Promise<Publicacion> {
  if (!comunidadConfigurada) sinConfigurar()
  if (!doc.titulo.trim() || doc.titulo === 'Autómata sin título') {
    throw new ErrorDeComunidad('Ponele un título antes de publicarlo.')
  }
  if (doc.automata.estados.length === 0) {
    throw new ErrorDeComunidad('El autómata está vacío.')
  }

  const cuerpo = {
    titulo: doc.titulo.trim().slice(0, 120),
    autor: (doc.autor.trim() || 'Anónimo').slice(0, 60),
    notas: doc.notas.trim().slice(0, 1000),
    documento: doc,
    estados: doc.automata.estados.length,
    alfabeto: doc.automata.alfabeto.join(' '),
  }

  const respuesta = await fetch(`${URL_BASE}/rest/v1/${TABLA}`, {
    method: 'POST',
    headers: await encabezados({ Prefer: 'return=representation' }),
    body: JSON.stringify(cuerpo),
  })
  if (!respuesta.ok) {
    throw new ErrorDeComunidad('No se pudo publicar (' + respuesta.status + ').')
  }
  const filas = (await respuesta.json()) as Record<string, unknown>[]
  return aPublicacion(filas[0])
}

/** Lo que un administrador puede cambiar de una publicación. */
export interface Cambios {
  titulo?: string
  autor?: string
  notas?: string
  /** reemplaza el autómata guardado; se recalculan los datos derivados */
  documento?: Documento
}

/**
 * Edita una publicación. Solo funciona con sesión de administrador: si no, la
 * base rechaza el cambio y no se modifica nada.
 */
export async function editar(id: string, cambios: Cambios): Promise<Publicacion> {
  if (!comunidadConfigurada) sinConfigurar()

  const cuerpo: Record<string, unknown> = {}
  if (cambios.titulo !== undefined) {
    if (!cambios.titulo.trim()) throw new ErrorDeComunidad('El título no puede quedar vacío.')
    cuerpo.titulo = cambios.titulo.trim().slice(0, 120)
  }
  if (cambios.autor !== undefined) cuerpo.autor = (cambios.autor.trim() || 'Anónimo').slice(0, 60)
  if (cambios.notas !== undefined) cuerpo.notas = cambios.notas.trim().slice(0, 1000)
  if (cambios.documento) {
    cuerpo.documento = cambios.documento
    cuerpo.estados = cambios.documento.automata.estados.length
    cuerpo.alfabeto = cambios.documento.automata.alfabeto.join(' ')
  }
  if (Object.keys(cuerpo).length === 0) throw new ErrorDeComunidad('No hay nada que cambiar.')

  const respuesta = await fetch(`${URL_BASE}/rest/v1/${TABLA}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: await encabezados({ Prefer: 'return=representation' }),
    body: JSON.stringify(cuerpo),
  })
  if (!respuesta.ok) throw new ErrorDeComunidad(explicarFalla(respuesta.status, 'editar'))

  const filas = (await respuesta.json()) as Record<string, unknown>[]
  // PostgREST devuelve una lista vacía cuando la política no dejó tocar la fila.
  if (filas.length === 0) throw new ErrorDeComunidad(SIN_PERMISO)
  return aPublicacion(filas[0])
}

/** Borra una publicación. También requiere ser administrador. */
export async function eliminar(id: string): Promise<void> {
  if (!comunidadConfigurada) sinConfigurar()
  const respuesta = await fetch(`${URL_BASE}/rest/v1/${TABLA}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await encabezados({ Prefer: 'return=representation' }),
  })
  if (!respuesta.ok) throw new ErrorDeComunidad(explicarFalla(respuesta.status, 'borrar'))
  const filas = (await respuesta.json().catch(() => [])) as unknown[]
  if (filas.length === 0) throw new ErrorDeComunidad(SIN_PERMISO)
}

const SIN_PERMISO =
  'La base no dejó hacer el cambio. Iniciá sesión con una cuenta que esté en la tabla admins.'

function explicarFalla(estado: number, accion: string): string {
  if (estado === 401 || estado === 403) return SIN_PERMISO
  return `No se pudo ${accion} (${estado}).`
}
