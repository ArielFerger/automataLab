import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface OpcionMenu {
  texto: string
  /** cuando falta, la opción se muestra apagada */
  accion?: () => void
  /** separa visualmente del grupo anterior */
  separar?: boolean
  peligrosa?: boolean
  /** atajo de teclado, si lo hay */
  atajo?: string
}

interface Props {
  x: number
  y: number
  titulo: string
  opciones: OpcionMenu[]
  onCerrar: () => void
}

/**
 * Menú del clic derecho.
 *
 * Se posiciona donde se hizo clic y se corre solo si no entra en la ventana.
 * Cierra con Escape, con un clic afuera o al elegir una opción.
 */
export function MenuContextual({ x, y, titulo, opciones, onCerrar }: Props) {
  const caja = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({
      x: Math.min(x, window.innerWidth - width - 8),
      y: Math.min(y, window.innerHeight - height - 8),
    })
  }, [x, y, opciones.length])

  useEffect(() => {
    const afuera = (ev: MouseEvent) => {
      if (!caja.current?.contains(ev.target as Node)) onCerrar()
    }
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onCerrar()
    }
    // En captura, para adelantarse a los handlers del lienzo.
    document.addEventListener('pointerdown', afuera, true)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', afuera, true)
      document.removeEventListener('keydown', tecla)
    }
  }, [onCerrar])

  return (
    <div
      ref={caja}
      className="menu-contextual"
      style={{ left: pos.x, top: pos.y }}
      role="menu"
      aria-label={titulo}
      onContextMenu={(ev) => ev.preventDefault()}
    >
      <p className="menu-titulo">{titulo}</p>
      {opciones.map((o, i) => (
        <button
          key={i}
          role="menuitem"
          className={'menu-opcion' + (o.separar ? ' separada' : '') + (o.peligrosa ? ' peligrosa' : '')}
          disabled={!o.accion}
          onClick={() => {
            o.accion?.()
            onCerrar()
          }}
        >
          <span>{o.texto}</span>
          {o.atajo && <kbd>{o.atajo}</kbd>}
        </button>
      ))}
    </div>
  )
}
