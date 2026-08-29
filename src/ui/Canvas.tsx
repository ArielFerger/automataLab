import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  type Automata,
  EPSILON,
  EPSILON_LABEL,
  agregarEstado,
  agregarTransicion,
  alternarFinal,
  esSimboloEpsilon,
  clonar,
  nuevoId,
  nuevoNombre,
  quitarEstado,
} from '../core/automaton'
import { type Manojo, RADIO, RADIO_FINAL, agruparTransiciones, arcoBucle, arcoEntre, flechaInicial } from '../core/geometria'
import { autoDisponer, limites } from '../core/layout'
import { type Foco, arcoEnFoco } from './foco'
import { MenuContextual, type OpcionMenu } from './MenuContextual'

export type Herramienta = 'mover' | 'estado' | 'transicion' | 'borrar'

/** Par (origen, destino) usado para sincronizar el diagrama con la tabla. */
export interface ClaveArco {
  desde: string
  hasta: string
}

interface Props {
  automata: Automata
  onCambio: (a: Automata) => void
  seleccion: string | null
  onSeleccion: (id: string | null) => void
  /** lo que se está señalando, en el diagrama o en la tabla */
  foco: Foco
  onFoco: (f: Foco) => void
  /** estados activos durante el reconocimiento */
  activos?: string[]
  /** flechas que el control atraviesa en el paso actual */
  arcosActivos?: ClaveArco[]
}

const HERRAMIENTAS: { id: Herramienta; texto: string; ayuda: string }[] = [
  { id: 'mover', texto: 'Mover', ayuda: 'Arrastrá los estados. Arrastrá el fondo para desplazar la vista.' },
  { id: 'estado', texto: 'Estado', ayuda: 'Hacé clic en el lienzo para crear un estado.' },
  { id: 'transicion', texto: 'Transición', ayuda: 'Clic en el estado de origen y después en el de destino.' },
  { id: 'borrar', texto: 'Borrar', ayuda: 'Clic en un estado o en una transición para eliminarla.' },
]

export function Canvas(props: Props) {
  const { automata, onCambio, seleccion, onSeleccion, foco, onFoco } = props
  const activos = props.activos ?? []
  const cajaRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const [herramienta, setHerramienta] = useState<Herramienta>('mover')
  const [tam, setTam] = useState({ ancho: 900, alto: 600 })
  const [vista, setVista] = useState({ x: 0, y: 0, escala: 1 })
  const [arrastre, setArrastre] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [paneo, setPaneo] = useState<{ cx: number; cy: number; vx: number; vy: number } | null>(null)
  const [origen, setOrigen] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<ClaveArco | null>(null)
  const [textoSimbolos, setTextoSimbolos] = useState('')
  const [renombrando, setRenombrando] = useState<{ id: string; nombre: string } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; titulo: string; opciones: OpcionMenu[] } | null>(null)
  const entradaRef = useRef<HTMLInputElement>(null)
  const renombreRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    const caja = cajaRef.current
    if (!caja) return
    const ro = new ResizeObserver(() => {
      setTam({ ancho: caja.clientWidth, alto: caja.clientHeight })
    })
    ro.observe(caja)
    setTam({ ancho: caja.clientWidth, alto: caja.clientHeight })
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (pendiente) entradaRef.current?.focus()
  }, [pendiente])

  useEffect(() => {
    if (renombrando) renombreRef.current?.select()
  }, [renombrando?.id])

  // Al cambiar de herramienta se cancela cualquier operación a medio hacer.
  useEffect(() => {
    setOrigen(null)
    setPendiente(null)
  }, [herramienta])

  const encuadrar = useCallback(() => {
    const caja = cajaRef.current
    if (!caja || automata.estados.length === 0) {
      setVista({ x: 0, y: 0, escala: 1 })
      return
    }
    // Con la caja todavía sin medir, encuadrar daría una escala absurda.
    if (caja.clientWidth < 80 || caja.clientHeight < 80) return
    const l = limites(automata)
    const escala = Math.max(0.28, Math.min(1.4, caja.clientWidth / l.ancho, caja.clientHeight / l.alto))
    setVista({
      x: l.x + l.ancho / 2 - caja.clientWidth / escala / 2,
      y: l.y + l.alto / 2 - caja.clientHeight / escala / 2,
      escala,
    })
  }, [automata])

  // Encuadrar cuando entra un autómata distinto (al cargarlo, o al convertir uno).
  const firmaEstados = automata.estados.map((e) => e.id).join(',')
  const firmaPrevia = useRef('')
  useEffect(() => {
    if (firmaPrevia.current === firmaEstados) return
    // Hasta que el lienzo no esté medido no se puede encuadrar; se reintenta
    // cuando el ResizeObserver informe el tamaño real.
    const caja = cajaRef.current
    if (!caja || caja.clientWidth < 80 || caja.clientHeight < 80) return

    const previos = new Set(firmaPrevia.current.split(',').filter(Boolean))
    const ahora = firmaEstados.split(',').filter(Boolean)
    const compartidos = ahora.filter((id) => previos.has(id)).length
    firmaPrevia.current = firmaEstados
    if (compartidos > 0) return
    // Si no queda ningún estado en común es otro autómata, así que se reencuadra.
    // Se espera un cuadro: en el primer render la maqueta todavía se está
    // acomodando y medir ahí da una escala equivocada.
    const cuadro = requestAnimationFrame(() => encuadrar())
    return () => cancelAnimationFrame(cuadro)
  }, [firmaEstados, tam.ancho, tam.alto, encuadrar])

  const manojos = useMemo(() => agruparTransiciones(automata), [automata])

  function aMundo(ev: { clientX: number; clientY: number }) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: vista.x + (ev.clientX - rect.left) / vista.escala,
      y: vista.y + (ev.clientY - rect.top) / vista.escala,
    }
  }

  function clicFondo(ev: React.MouseEvent) {
    if (pendiente) return
    if (herramienta === 'estado') {
      const p = aMundo(ev)
      const r = agregarEstado(automata, p.x, p.y)
      onCambio(r.automata)
      onSeleccion(r.id)
      return
    }
    onSeleccion(null)
    setOrigen(null)
  }

  /** Doble clic en el vacío crea un estado ahí, sin tener que cambiar de herramienta. */
  function dobleClicFondo(ev: React.MouseEvent) {
    if (pendiente || renombrando || herramienta === 'borrar') return
    const p = aMundo(ev)
    const r = agregarEstado(automata, p.x, p.y)
    onCambio(r.automata)
    onSeleccion(r.id)
  }

  function clicEstado(ev: React.MouseEvent, id: string) {
    ev.stopPropagation()
    if (herramienta === 'borrar') {
      onCambio(quitarEstado(automata, id))
      if (seleccion === id) onSeleccion(null)
      return
    }
    if (herramienta === 'transicion') {
      if (origen === null) {
        setOrigen(id)
      } else {
        setPendiente({ desde: origen, hasta: id })
        setTextoSimbolos('')
        setOrigen(null)
      }
      return
    }
    onSeleccion(id)
  }

  function bajaEstado(ev: React.PointerEvent, id: string) {
    if (herramienta !== 'mover') return
    ev.stopPropagation()
    const e = automata.estados.find((s) => s.id === id)
    if (!e) return
    const p = aMundo(ev)
    setArrastre({ id, dx: p.x - e.x, dy: p.y - e.y })
    ;(ev.target as Element).setPointerCapture?.(ev.pointerId)
  }

  function bajaFondo(ev: React.PointerEvent) {
    if (herramienta !== 'mover') return
    setPaneo({ cx: ev.clientX, cy: ev.clientY, vx: vista.x, vy: vista.y })
    ;(ev.currentTarget as Element).setPointerCapture?.(ev.pointerId)
  }

  function mueveLienzo(ev: React.PointerEvent) {
    if (arrastre) {
      const p = aMundo(ev)
      const r = clonar(automata)
      const e = r.estados.find((s) => s.id === arrastre.id)
      if (e) {
        e.x = Math.round(p.x - arrastre.dx)
        e.y = Math.round(p.y - arrastre.dy)
        onCambio(r)
      }
      return
    }
    if (paneo) {
      setVista((v) => ({
        ...v,
        x: paneo.vx - (ev.clientX - paneo.cx) / v.escala,
        y: paneo.vy - (ev.clientY - paneo.cy) / v.escala,
      }))
    }
  }

  function sueltaLienzo() {
    setArrastre(null)
    setPaneo(null)
  }

  function rueda(ev: React.WheelEvent) {
    ev.preventDefault()
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12
    const nueva = Math.min(2.6, Math.max(0.28, vista.escala * factor))
    const p = aMundo(ev)
    // Zoom anclado al puntero: el punto bajo el cursor no se mueve.
    setVista({ x: p.x - (p.x - vista.x) * (vista.escala / nueva), y: p.y - (p.y - vista.y) * (vista.escala / nueva), escala: nueva })
  }

  function confirmarSimbolos() {
    if (!pendiente) return
    const partes = textoSimbolos
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    let r = automata
    for (const parte of partes) {
      const simbolo = esSimboloEpsilon(parte) ? EPSILON : parte
      r = agregarTransicion(r, pendiente.desde, pendiente.hasta, simbolo)
    }
    onCambio(r)
    setPendiente(null)
    setTextoSimbolos('')
  }

  function borrarManojo(m: Manojo) {
    const r = clonar(automata)
    r.transiciones = r.transiciones.filter((t) => !(t.desde === m.desde && t.hasta === m.hasta))
    onCambio(r)
  }

  function renombrar(id: string, nombre: string) {
    const limpio = nombre.trim()
    if (!limpio) return
    const r = clonar(automata)
    const e = r.estados.find((s) => s.id === id)
    if (e) e.nombre = limpio
    onCambio(r)
  }

  function duplicar(id: string) {
    const original = automata.estados.find((e) => e.id === id)
    if (!original) return
    const r = clonar(automata)
    const nuevo = nuevoId(r)
    r.estados.push({ id: nuevo, nombre: nuevoNombre(r), x: original.x + 60, y: original.y + 60 })
    // La copia arranca con las mismas salidas que el original.
    for (const t of automata.transiciones) {
      if (t.desde === id) r.transiciones.push({ desde: nuevo, hasta: t.hasta === id ? nuevo : t.hasta, simbolo: t.simbolo })
    }
    onCambio(r)
    onSeleccion(nuevo)
  }

  // ------------------------------------------------------------ clic derecho

  function menuDeEstado(ev: React.MouseEvent, id: string) {
    ev.preventDefault()
    ev.stopPropagation()
    onSeleccion(id)
    const estado = automata.estados.find((e) => e.id === id)
    if (!estado) return
    const esInicial = automata.inicial === id
    const esFinal = automata.finales.includes(id)
    setMenu({
      x: ev.clientX,
      y: ev.clientY,
      titulo: 'Estado ' + estado.nombre,
      opciones: [
        {
          texto: esInicial ? 'Ya es el estado inicial' : 'Marcar como inicial',
          accion: esInicial
            ? undefined
            : () => {
                const r = clonar(automata)
                r.inicial = id
                onCambio(r)
              },
        },
        { texto: esFinal ? 'Quitar de los finales' : 'Marcar como final', accion: () => onCambio(alternarFinal(automata, id)) },
        {
          texto: 'Renombrar…',
          separar: true,
          accion: () => setRenombrando({ id, nombre: estado.nombre }),
        },
        {
          texto: 'Nueva transición desde acá',
          accion: () => {
            setHerramienta('transicion')
            setOrigen(id)
          },
        },
        { texto: 'Duplicar', accion: () => duplicar(id) },
        {
          texto: 'Eliminar',
          separar: true,
          peligrosa: true,
          accion: () => {
            onCambio(quitarEstado(automata, id))
            if (seleccion === id) onSeleccion(null)
          },
        },
      ],
    })
  }

  function menuDeArco(ev: React.MouseEvent, m: Manojo) {
    ev.preventDefault()
    ev.stopPropagation()
    const etiqueta = m.simbolos.map((s) => (s === EPSILON ? EPSILON_LABEL : s)).join(', ')
    setMenu({
      x: ev.clientX,
      y: ev.clientY,
      titulo: `${rotulo(automata, m.desde)} → ${rotulo(automata, m.hasta)} con ${etiqueta}`,
      opciones: [
        {
          texto: 'Agregar otro símbolo…',
          accion: () => {
            setPendiente({ desde: m.desde, hasta: m.hasta })
            setTextoSimbolos('')
          },
        },
        {
          texto: 'Invertir el sentido',
          accion: () => {
            const r = clonar(automata)
            for (const t of r.transiciones) {
              if (t.desde === m.desde && t.hasta === m.hasta) {
                t.desde = m.hasta
                t.hasta = m.desde
              }
            }
            // Si ya existía la flecha inversa, al invertir quedarían repetidas.
            const vistas = new Set<string>()
            r.transiciones = r.transiciones.filter((t) => {
              const clave = t.desde + '|' + t.simbolo + '|' + t.hasta
              if (vistas.has(clave)) return false
              vistas.add(clave)
              return true
            })
            onCambio(r)
          },
        },
        { texto: 'Eliminar estas transiciones', separar: true, peligrosa: true, accion: () => borrarManojo(m) },
      ],
    })
  }

  function menuDeFondo(ev: React.MouseEvent) {
    ev.preventDefault()
    const p = aMundo(ev)
    setMenu({
      x: ev.clientX,
      y: ev.clientY,
      titulo: 'Lienzo',
      opciones: [
        {
          texto: 'Crear un estado acá',
          accion: () => {
            const r = agregarEstado(automata, p.x, p.y)
            onCambio(r.automata)
            onSeleccion(r.id)
          },
        },
        { texto: 'Acomodar los estados', separar: true, accion: () => onCambio(autoDisponer(automata)) },
        { texto: 'Encuadrar la vista', accion: encuadrar },
        { texto: 'Zoom al 100 %', accion: () => setVista((v) => ({ ...v, escala: 1 })) },
      ],
    })
  }

  const vb = `${vista.x} ${vista.y} ${Math.max(tam.ancho / vista.escala, 1)} ${Math.max(tam.alto / vista.escala, 1)}`
  const inicial = automata.estados.find((e) => e.id === automata.inicial)
  const ayuda = HERRAMIENTAS.find((h) => h.id === herramienta)?.ayuda ?? ''

  return (
    <div className="lienzo-caja" ref={cajaRef}>
      <svg
        ref={svgRef}
        className={'lienzo' + (herramienta === 'mover' ? ' modo-mover' : '')}
        viewBox={vb}
        onClick={clicFondo}
        onDoubleClick={dobleClicFondo}
        onPointerDown={bajaFondo}
        onPointerMove={mueveLienzo}
        onPointerUp={sueltaLienzo}
        onPointerCancel={sueltaLienzo}
        onWheel={rueda}
        onContextMenu={menuDeFondo}
      >
        <defs>
          <pattern id="grilla" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--grilla)" />
          </pattern>
          {[
            ['punta', 'var(--tinta-suave)'],
            ['punta-azul', 'var(--azul)'],
            ['punta-ambar', 'var(--ambar)'],
          ].map(([id, color]) => (
            <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill={color} />
            </marker>
          ))}
        </defs>

        <rect x={vista.x} y={vista.y} width={tam.ancho / vista.escala} height={tam.alto / vista.escala} fill="url(#grilla)" />

        {inicial && (
          <path
            d={flechaInicial(inicial)}
            stroke="var(--azul)"
            strokeWidth={1.6}
            fill="none"
            markerEnd="url(#punta-azul)"
          />
        )}

        {manojos.map((m) => (
          <ArcoDibujado
            key={m.desde + '>' + m.hasta}
            automata={automata}
            manojo={m}
            resaltado={arcoEnFoco(foco, m.desde, m.hasta, m.simbolos)}
            recorrido={(props.arcosActivos ?? []).some((c) => c.desde === m.desde && c.hasta === m.hasta)}
            onEntrar={() => onFoco({ tipo: 'arco', desde: m.desde, hasta: m.hasta })}
            onSalir={() => onFoco(null)}
            onClic={(ev) => {
              ev.stopPropagation()
              if (herramienta === 'borrar') borrarManojo(m)
            }}
            onMenu={(ev) => menuDeArco(ev, m)}
          />
        ))}

        {automata.estados.map((e) => {
          const activo = activos.includes(e.id)
          const esOrigen = origen === e.id
          const sel = seleccion === e.id
          return (
            <g
              key={e.id}
              className={'nodo' + (activo ? ' activo' : '') + (arrastre?.id === e.id ? ' arrastrando' : '')}
              onClick={(ev) => clicEstado(ev, e.id)}
              onDoubleClick={(ev) => {
                ev.stopPropagation()
                setRenombrando({ id: e.id, nombre: e.nombre })
              }}
              onPointerDown={(ev) => bajaEstado(ev, e.id)}
              onContextMenu={(ev) => menuDeEstado(ev, e.id)}
            >
              <circle
                cx={e.x}
                cy={e.y}
                r={RADIO}
                fill={activo ? 'var(--ambar-suave)' : 'var(--papel-alto)'}
                stroke={activo ? 'var(--ambar)' : sel || esOrigen ? 'var(--azul)' : 'var(--tinta)'}
                strokeWidth={activo || sel || esOrigen ? 2.4 : 1.5}
                strokeDasharray={esOrigen ? '4 3' : undefined}
              />
              {automata.finales.includes(e.id) && (
                <circle
                  cx={e.x}
                  cy={e.y}
                  r={RADIO_FINAL}
                  fill="none"
                  stroke={activo ? 'var(--ambar)' : 'var(--tinta)'}
                  strokeWidth={1.5}
                />
              )}
              <text className="nodo-etiqueta" x={e.x} y={e.y}>
                {e.nombre}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="herramientas" role="toolbar" aria-label="Herramientas del lienzo">
        {HERRAMIENTAS.map((h) => (
          <button key={h.id} aria-pressed={herramienta === h.id} onClick={() => setHerramienta(h.id)}>
            {h.texto}
          </button>
        ))}
        <button onClick={encuadrar} title="Ajustar el zoom para que entre todo el autómata">
          Encuadrar
        </button>
      </div>

      {pendiente && (
        <div className="entrada-simbolo">
          <label htmlFor="simbolos-nuevos">
            {rotulo(automata, pendiente.desde)} → {rotulo(automata, pendiente.hasta)}
          </label>
          <input
            id="simbolos-nuevos"
            ref={entradaRef}
            className="campo mono"
            placeholder="a, b, eps"
            value={textoSimbolos}
            onChange={(ev) => setTextoSimbolos(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') confirmarSimbolos()
              if (ev.key === 'Escape') setPendiente(null)
            }}
          />
          <button className="btn primario chico" onClick={confirmarSimbolos}>
            Agregar
          </button>
          <button className="btn chico" onClick={() => setPendiente(null)}>
            Cancelar
          </button>
        </div>
      )}

      {renombrando && (
        <div className="entrada-simbolo">
          <label htmlFor="nombre-nuevo">Nombre del estado</label>
          <input
            id="nombre-nuevo"
            ref={renombreRef}
            className="campo mono"
            value={renombrando.nombre}
            onChange={(ev) => setRenombrando({ ...renombrando, nombre: ev.target.value })}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') {
                renombrar(renombrando.id, renombrando.nombre)
                setRenombrando(null)
              }
              if (ev.key === 'Escape') setRenombrando(null)
            }}
          />
          <button
            className="btn primario chico"
            onClick={() => {
              renombrar(renombrando.id, renombrando.nombre)
              setRenombrando(null)
            }}
          >
            Cambiar
          </button>
          <button className="btn chico" onClick={() => setRenombrando(null)}>
            Cancelar
          </button>
        </div>
      )}

      {menu && (
        <MenuContextual x={menu.x} y={menu.y} titulo={menu.titulo} opciones={menu.opciones} onCerrar={() => setMenu(null)} />
      )}

      <p className="pista">
        {origen ? 'Ahora elegí el estado de destino.' : ayuda} Clic derecho para más opciones.
      </p>
    </div>
  )
}

function rotulo(a: Automata, id: string) {
  return a.estados.find((e) => e.id === id)?.nombre ?? id
}

interface ArcoProps {
  automata: Automata
  manojo: Manojo
  resaltado: boolean
  recorrido: boolean
  onEntrar: () => void
  onSalir: () => void
  onClic: (ev: React.MouseEvent) => void
  onMenu: (ev: React.MouseEvent) => void
}

function ArcoDibujado({ automata, manojo, resaltado, recorrido, onEntrar, onSalir, onClic, onMenu }: ArcoProps) {
  const a = automata.estados.find((e) => e.id === manojo.desde)
  const b = automata.estados.find((e) => e.id === manojo.hasta)
  if (!a || !b) return null

  const arco = manojo.desde === manojo.hasta ? arcoBucle(a) : arcoEntre(a, b, manojo.curvatura)
  const texto = manojo.simbolos.map((s) => (s === EPSILON ? EPSILON_LABEL : s)).join(', ')
  const punta = recorrido ? 'punta-ambar' : resaltado ? 'punta-azul' : 'punta'
  const ancho = texto.length * 7.2 + 8

  return (
    <g
      className={'arco' + (resaltado ? ' resaltado' : '') + (recorrido ? ' recorrido' : '')}
      onMouseEnter={onEntrar}
      onMouseLeave={onSalir}
      onClick={onClic}
      onContextMenu={onMenu}
    >
      <path className="arco-golpe" d={arco.d} />
      <path className="arco-linea" d={arco.d} markerEnd={`url(#${punta})`} />
      <rect
        className="arco-fondo"
        x={arco.etiqueta.x - ancho / 2}
        y={arco.etiqueta.y - 9}
        width={ancho}
        height={16}
        rx={3}
      />
      <text className="arco-etiqueta" x={arco.etiqueta.x} y={arco.etiqueta.y + 4}>
        {texto}
      </text>
    </g>
  )
}
