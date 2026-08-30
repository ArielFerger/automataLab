import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  type Automata,
  type Curva,
  EPSILON,
  EPSILON_LABEL,
  agregarEstado,
  agregarTransicion,
  alternarFinal,
  claveArco,
  esSimboloEpsilon,
  clonar,
  nuevoId,
  nuevoNombre,
  reconectar,
  quitarEstado,
} from '../core/automaton'
import {
  type Manojo,
  RADIO,
  RADIO_FINAL,
  agruparTransiciones,
  arcoBucle,
  arcoEntre,
  bucleHacia,
  curvaturaHacia,
  flechaInicial,
} from '../core/geometria'
import { autoDisponer, limites } from '../core/layout'
import { type Foco, arcoEnFoco } from './foco'
import { MenuContextual, type OpcionMenu } from './MenuContextual'

export type Herramienta = 'mover' | 'estado' | 'transicion' | 'texto' | 'borrar'

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
  {
    id: 'mover',
    texto: 'Mover',
    ayuda: 'Arrastrá los estados, las flechas para curvarlas, y el fondo para mover la vista.',
  },
  { id: 'estado', texto: 'Estado', ayuda: 'Hacé clic en el lienzo para crear un estado.' },
  { id: 'transicion', texto: 'Transición', ayuda: 'Clic en el estado de origen y después en el de destino.' },
  { id: 'texto', texto: 'Texto', ayuda: 'Hacé clic donde quieras escribir una aclaración.' },
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
  const [curvando, setCurvando] = useState<Manojo | null>(null)
  const [arcoElegido, setArcoElegido] = useState<ClaveArco | null>(null)
  const [reenganche, setReenganche] = useState<{
    manojo: Manojo
    extremo: 'desde' | 'hasta'
    punto: { x: number; y: number }
  } | null>(null)
  const [moviendoTexto, setMoviendoTexto] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [editandoTexto, setEditandoTexto] = useState<{ id: string; contenido: string } | null>(null)
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
    setArcoElegido(null)
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
  const debeEncuadrar = useRef(true)
  useEffect(() => {
    // Hasta que el lienzo no esté medido no se puede encuadrar; se reintenta
    // cuando el ResizeObserver informe el tamaño real.
    const caja = cajaRef.current
    if (!caja || caja.clientWidth < 80 || caja.clientHeight < 80) return

    if (firmaPrevia.current !== firmaEstados) {
      const previos = new Set(firmaPrevia.current.split(',').filter(Boolean))
      const ahora = firmaEstados.split(',').filter(Boolean)
      const compartidos = ahora.filter((id) => previos.has(id)).length
      firmaPrevia.current = firmaEstados
      // Si no queda ningún estado en común es otro autómata: hay que reencuadrar.
      if (compartidos === 0) debeEncuadrar.current = true
    }
    if (!debeEncuadrar.current) return
    debeEncuadrar.current = false

    // Se difiere un turno para que la maqueta termine de acomodarse: medir en
    // pleno render daba una escala equivocada.
    //
    // Va con setTimeout y no con requestAnimationFrame porque este último no
    // corre en pestañas ocultas. Con rAF, abrir la app en una pestaña de fondo
    // —al hacer clic con el botón del medio en un link compartido, por ejemplo—
    // dejaba el autómata sin encuadrar, y no se recuperaba nunca: al volver a la
    // pestaña el efecto ya no se vuelve a disparar.
    let corrio = false
    const t = setTimeout(() => {
      corrio = true
      encuadrar()
    }, 0)
    return () => {
      clearTimeout(t)
      // Si se canceló antes de correr, se vuelve a pedir el encuadre. En modo
      // estricto React monta el efecto dos veces, y sin esto la cancelación de
      // la primera pasada dejaba el autómata sin encuadrar para siempre.
      if (!corrio) debeEncuadrar.current = true
    }
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

  // ------------------------------------------------- curvatura de las flechas

  /** Fija la curvatura de un manojo. Con `null` vuelve a la curva automática. */
  function fijarCurva(m: Manojo, valor: Curva | null) {
    const r = clonar(automata)
    const curvas = { ...(r.curvas ?? {}) }
    const clave = claveArco(m.desde, m.hasta)
    if (valor === null) delete curvas[clave]
    else if (typeof valor === 'number') curvas[clave] = Math.round(valor * 10) / 10
    else curvas[clave] = { angulo: Math.round(valor.angulo * 10) / 10, radio: Math.round(valor.radio) }
    if (Object.keys(curvas).length > 0) r.curvas = curvas
    else delete r.curvas
    onCambio(r)
  }

  /** Estado cuyo círculo contiene ese punto, si hay alguno. */
  function estadoEn(punto: { x: number; y: number }) {
    return automata.estados.find((e) => Math.hypot(e.x - punto.x, e.y - punto.y) <= RADIO + 6)
  }

  /** Suelta la punta que se venía arrastrando sobre el estado que haya debajo. */
  function soltarReenganche() {
    if (!reenganche) return
    const destino = estadoEn(reenganche.punto)
    if (destino) {
      const { manojo, extremo } = reenganche
      const r = reconectar(automata, manojo.desde, manojo.hasta, extremo, destino.id)
      if (r !== automata) {
        onCambio(r)
        setArcoElegido(
          extremo === 'desde'
            ? { desde: destino.id, hasta: manojo.hasta }
            : { desde: manojo.desde, hasta: destino.id },
        )
      }
    }
    // Soltar en el vacío no hace nada: la flecha vuelve a donde estaba.
    setReenganche(null)
  }

  /** Traduce la posición del puntero a curvatura, según sea bucle o flecha. */
  function curvaturaEn(m: Manojo, punto: { x: number; y: number }): Curva {
    const a = automata.estados.find((e) => e.id === m.desde)
    const b = automata.estados.find((e) => e.id === m.hasta)
    if (!a || !b) return m.curvatura
    // En un bucle el arrastre define las dos cosas: hacia dónde apunta y qué tan
    // grande es. Con solo el ángulo, no había manera de agrandarlo.
    if (m.desde === m.hasta) return bucleHacia(a, punto)
    // Se limita para que la flecha no se dispare lejos de un tirón.
    return Math.max(-600, Math.min(600, curvaturaHacia(a, b, punto)))
  }

  // ------------------------------------------------------ cuadros de texto

  function agregarTexto(x: number, y: number) {
    const r = clonar(automata)
    const textos = [...(r.textos ?? [])]
    let n = 0
    const usados = new Set(textos.map((t) => t.id))
    while (usados.has('txt' + n)) n++
    const id = 'txt' + n
    textos.push({ id, contenido: '', x, y })
    r.textos = textos
    onCambio(r)
    setEditandoTexto({ id, contenido: '' })
  }

  function guardarTexto(id: string, contenido: string) {
    const r = clonar(automata)
    const limpio = contenido.trim()
    // Un cuadro vacío no aporta nada y estorba: se descarta.
    const textos = (r.textos ?? []).flatMap((t) =>
      t.id !== id ? [t] : limpio ? [{ ...t, contenido: limpio }] : [],
    )
    if (textos.length > 0) r.textos = textos
    else delete r.textos
    onCambio(r)
  }

  function quitarTexto(id: string) {
    const r = clonar(automata)
    const textos = (r.textos ?? []).filter((t) => t.id !== id)
    if (textos.length > 0) r.textos = textos
    else delete r.textos
    onCambio(r)
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
    if (herramienta === 'texto') {
      const p = aMundo(ev)
      agregarTexto(p.x, p.y)
      return
    }
    onSeleccion(null)
    setOrigen(null)
    setArcoElegido(null)
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

  /**
   * Pulsación larga: el equivalente táctil del clic derecho.
   *
   * En un teléfono no hay botón secundario, así que mantener apretado medio
   * segundo sobre un estado o una flecha abre el mismo menú. Se cancela si el
   * dedo se mueve, para no robarle el gesto al arrastre.
   */
  const pulsacion = useRef<{ temporizador: number; x: number; y: number } | null>(null)

  function empezarPulsacionLarga(ev: React.PointerEvent, abrir: (ev: React.PointerEvent) => void) {
    if (ev.pointerType !== 'touch') return
    const copia = { ...ev, clientX: ev.clientX, clientY: ev.clientY } as React.PointerEvent
    cancelarPulsacionLarga()
    pulsacion.current = {
      x: ev.clientX,
      y: ev.clientY,
      temporizador: window.setTimeout(() => {
        pulsacion.current = null
        setArrastre(null)
        setPaneo(null)
        abrir(copia)
      }, 500),
    }
  }

  function cancelarPulsacionLarga() {
    if (pulsacion.current) {
      clearTimeout(pulsacion.current.temporizador)
      pulsacion.current = null
    }
  }

  function bajaEstado(ev: React.PointerEvent, id: string) {
    empezarPulsacionLarga(ev, (e) => menuDeEstado(e as unknown as React.MouseEvent, id))
    if (herramienta !== 'mover') return
    ev.stopPropagation()
    const e = automata.estados.find((s) => s.id === id)
    if (!e) return
    const p = aMundo(ev)
    setArrastre({ id, dx: p.x - e.x, dy: p.y - e.y })
    ;(ev.target as Element).setPointerCapture?.(ev.pointerId)
  }

  function bajaFondo(ev: React.PointerEvent) {
    empezarPulsacionLarga(ev, (e) => menuDeFondo(e as unknown as React.MouseEvent))
    if (herramienta !== 'mover') return
    setPaneo({ cx: ev.clientX, cy: ev.clientY, vx: vista.x, vy: vista.y })
    ;(ev.currentTarget as Element).setPointerCapture?.(ev.pointerId)
  }

  function mueveLienzo(ev: React.PointerEvent) {
    // Un desplazamiento chico es temblor del dedo; a partir de ahí es arrastre.
    if (pulsacion.current) {
      const d = Math.hypot(ev.clientX - pulsacion.current.x, ev.clientY - pulsacion.current.y)
      if (d > 10) cancelarPulsacionLarga()
    }
    if (reenganche) {
      setReenganche({ ...reenganche, punto: aMundo(ev) })
      return
    }
    if (curvando) {
      fijarCurva(curvando, curvaturaEn(curvando, aMundo(ev)))
      return
    }
    if (moviendoTexto) {
      const p = aMundo(ev)
      const r = clonar(automata)
      const t = (r.textos ?? []).find((x) => x.id === moviendoTexto.id)
      if (t) {
        t.x = Math.round(p.x - moviendoTexto.dx)
        t.y = Math.round(p.y - moviendoTexto.dy)
        onCambio(r)
      }
      return
    }
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
    cancelarPulsacionLarga()
    soltarReenganche()
    setArrastre(null)
    setPaneo(null)
    setCurvando(null)
    setMoviendoTexto(null)
  }

  function rueda(ev: React.WheelEvent) {
    ev.preventDefault()
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12
    const nueva = Math.min(2.6, Math.max(0.28, vista.escala * factor))
    const p = aMundo(ev)
    // Zoom anclado al puntero: el punto bajo el cursor no se mueve.
    setVista({ x: p.x - (p.x - vista.x) * (vista.escala / nueva), y: p.y - (p.y - vista.y) * (vista.escala / nueva), escala: nueva })
  }

  /** Zoom desde los botones: mantiene fijo el centro de lo que se está viendo. */
  function aplicarZoom(factor: number) {
    const caja = cajaRef.current
    if (!caja) return
    setVista((v) => {
      const nueva = Math.min(2.6, Math.max(0.28, v.escala * factor))
      const cx = v.x + caja.clientWidth / v.escala / 2
      const cy = v.y + caja.clientHeight / v.escala / 2
      return { x: cx - caja.clientWidth / nueva / 2, y: cy - caja.clientHeight / nueva / 2, escala: nueva }
    })
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
        {
          texto: m.aMano ? 'Volver a la curva automática' : 'La curva ya es automática',
          separar: true,
          accion: m.aMano ? () => fijarCurva(m, null) : undefined,
        },
        { texto: 'Eliminar estas transiciones', separar: true, peligrosa: true, accion: () => borrarManojo(m) },
      ],
    })
  }

  function menuDeTexto(ev: React.MouseEvent, id: string) {
    ev.preventDefault()
    ev.stopPropagation()
    const t = (automata.textos ?? []).find((x) => x.id === id)
    if (!t) return
    setMenu({
      x: ev.clientX,
      y: ev.clientY,
      titulo: 'Texto',
      opciones: [
        { texto: 'Editar…', accion: () => setEditandoTexto({ id, contenido: t.contenido }) },
        { texto: 'Eliminar', separar: true, peligrosa: true, accion: () => quitarTexto(id) },
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
        { texto: 'Escribir un texto acá', accion: () => agregarTexto(p.x, p.y) },
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
              if (herramienta === 'borrar') {
                borrarManojo(m)
                setArcoElegido(null)
                return
              }
              setArcoElegido({ desde: m.desde, hasta: m.hasta })
              onSeleccion(null)
            }}
            onMenu={(ev) => menuDeArco(ev, m)}
            onPulsacion={(ev) => {
              empezarPulsacionLarga(ev, (e) => menuDeArco(e as unknown as React.MouseEvent, m))
              if (herramienta === 'mover') {
                ev.stopPropagation()
                setCurvando(m)
                ;(ev.currentTarget as Element).setPointerCapture?.(ev.pointerId)
              }
            }}
            curvable={herramienta === 'mover'}
            elegido={!!arcoElegido && arcoElegido.desde === m.desde && arcoElegido.hasta === m.hasta}
            onTomarPunta={(extremo, punto) => {
              setArcoElegido({ desde: m.desde, hasta: m.hasta })
              setReenganche({ manojo: m, extremo, punto })
            }}
          />
        ))}

        {reenganche &&
          (() => {
            // Mientras se arrastra la punta, una línea muestra a dónde iría, y
            // el estado que hay debajo se marca como destino.
            const fijo = automata.estados.find(
              (e) => e.id === (reenganche.extremo === 'desde' ? reenganche.manojo.hasta : reenganche.manojo.desde),
            )
            const destino = estadoEn(reenganche.punto)
            if (!fijo) return null
            return (
              <g className="reenganche">
                <line x1={fijo.x} y1={fijo.y} x2={reenganche.punto.x} y2={reenganche.punto.y} />
                {destino && <circle className="destino" cx={destino.x} cy={destino.y} r={RADIO + 6} />}
              </g>
            )
          })()}

        {(automata.textos ?? []).map((t) => {
          const lineas = t.contenido.split('\n')
          const ancho = Math.max(...lineas.map((l) => l.length), 1) * 7.4 + 16
          const alto = lineas.length * 17 + 12
          return (
            <g
              key={t.id}
              className={'texto-lienzo' + (editandoTexto?.id === t.id ? ' editando' : '')}
              onPointerDown={(ev) => {
                if (herramienta !== 'mover') return
                ev.stopPropagation()
                const p = aMundo(ev)
                setMoviendoTexto({ id: t.id, dx: p.x - t.x, dy: p.y - t.y })
                ;(ev.currentTarget as Element).setPointerCapture?.(ev.pointerId)
                empezarPulsacionLarga(ev, (e) => menuDeTexto(e as unknown as React.MouseEvent, t.id))
              }}
              onClick={(ev) => {
                ev.stopPropagation()
                if (herramienta === 'borrar') quitarTexto(t.id)
              }}
              onDoubleClick={(ev) => {
                ev.stopPropagation()
                setEditandoTexto({ id: t.id, contenido: t.contenido })
              }}
              onContextMenu={(ev) => menuDeTexto(ev, t.id)}
            >
              <rect className="texto-caja" x={t.x - 8} y={t.y - 8} width={ancho} height={alto} rx={4} />
              {lineas.map((linea, i) => (
                <text key={i} className="texto-contenido" x={t.x} y={t.y + 9 + i * 17}>
                  {linea}
                </text>
              ))}
            </g>
          )
        })}

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

      <div className="zoom-lienzo" role="group" aria-label="Zoom del lienzo">
        <button onClick={() => aplicarZoom(1.25)} title="Acercar" aria-label="Acercar">
          +
        </button>
        <button onClick={() => aplicarZoom(1 / 1.25)} title="Alejar" aria-label="Alejar">
          −
        </button>
      </div>

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

      {editandoTexto && (
        <div className="entrada-simbolo entrada-texto">
          <label htmlFor="texto-lienzo">Texto</label>
          <textarea
            id="texto-lienzo"
            autoFocus
            className="campo"
            rows={2}
            value={editandoTexto.contenido}
            placeholder="Una aclaración, un título…"
            onChange={(ev) => setEditandoTexto({ ...editandoTexto, contenido: ev.target.value })}
            onKeyDown={(ev) => {
              // Enter confirma; Mayúsculas+Enter deja escribir otro renglón.
              if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault()
                guardarTexto(editandoTexto.id, editandoTexto.contenido)
                setEditandoTexto(null)
              }
              if (ev.key === 'Escape') {
                guardarTexto(editandoTexto.id, editandoTexto.contenido)
                setEditandoTexto(null)
              }
            }}
          />
          <button
            className="btn primario chico"
            onClick={() => {
              guardarTexto(editandoTexto.id, editandoTexto.contenido)
              setEditandoTexto(null)
            }}
          >
            Listo
          </button>
        </div>
      )}

      {menu && (
        <MenuContextual x={menu.x} y={menu.y} titulo={menu.titulo} opciones={menu.opciones} onCerrar={() => setMenu(null)} />
      )}

      <p className="pista">
        {origen ? 'Ahora elegí el estado de destino.' : ayuda}{' '}
        <span className="solo-puntero">Clic derecho para más opciones.</span>
        <span className="solo-tactil">Mantené apretado para más opciones.</span>
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
  onPulsacion: (ev: React.PointerEvent) => void
  /** con la herramienta Mover, la flecha se puede arrastrar para curvarla */
  curvable: boolean
  /** true cuando la flecha está seleccionada y muestra sus tiradores */
  elegido: boolean
  onTomarPunta: (extremo: 'desde' | 'hasta', punto: { x: number; y: number }) => void
}

function ArcoDibujado({ automata, manojo, resaltado, recorrido, onEntrar, onSalir, onClic, onMenu, onPulsacion, curvable, elegido, onTomarPunta }: ArcoProps) {
  const a = automata.estados.find((e) => e.id === manojo.desde)
  const b = automata.estados.find((e) => e.id === manojo.hasta)
  if (!a || !b) return null

  const arco =
    manojo.desde === manojo.hasta
      ? arcoBucle(a, manojo.curvatura, manojo.radio)
      : arcoEntre(a, b, manojo.curvatura)
  const texto = manojo.simbolos.map((s) => (s === EPSILON ? EPSILON_LABEL : s)).join(', ')
  const punta = recorrido ? 'punta-ambar' : resaltado ? 'punta-azul' : 'punta'
  const ancho = texto.length * 7.2 + 8

  return (
    <g
      className={
        'arco' +
        (resaltado ? ' resaltado' : '') +
        (recorrido ? ' recorrido' : '') +
        (curvable ? ' curvable' : '') +
        (elegido ? ' elegido' : '')
      }
      onMouseEnter={onEntrar}
      onMouseLeave={onSalir}
      onClick={onClic}
      onContextMenu={onMenu}
      onPointerDown={onPulsacion}
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

      {elegido && (
        <g className="tiradores">
          {/* El del medio flexiona la curva; los de las puntas la reenganchan. */}
          <circle className="tirador tirador-curva" cx={arco.vertice.x} cy={arco.vertice.y} r={6} />
          <Punta punto={arco.inicio} onTomar={(p) => onTomarPunta('desde', p)} />
          <Punta punto={arco.fin} onTomar={(p) => onTomarPunta('hasta', p)} />
        </g>
      )}
    </g>
  )
}

/** Tirador de una punta de la flecha: se arrastra hasta otro estado. */
function Punta({ punto, onTomar }: { punto: { x: number; y: number }; onTomar: (p: { x: number; y: number }) => void }) {
  return (
    <g
      className="tirador-punta"
      onPointerDown={(ev) => {
        ev.stopPropagation()
        ;(ev.currentTarget as Element).setPointerCapture?.(ev.pointerId)
        onTomar(punto)
      }}
    >
      {/* Círculo invisible más grande, para poder agarrarlo con el dedo. */}
      <circle className="tirador-golpe" cx={punto.x} cy={punto.y} r={14} />
      <circle className="tirador" cx={punto.x} cy={punto.y} r={6} />
    </g>
  )
}
