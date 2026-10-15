import { useCallback, useEffect, useRef, useState } from 'react'
import { type Automata, automataVacio } from '../core/automaton'
import { type Documento, desdeObjeto, documentoNuevo } from '../core/documento'

const CLAVE = 'automatalab:editor'
const LIMITE_HISTORIA = 60

/** Ejercicio A5: cadenas sobre {a, b} de longitud par. Sirve de punto de partida. */
export function ejemploLongitudPar(): Automata {
  return {
    estados: [
      { id: 'q0', nombre: 'q0', x: 260, y: 240 },
      { id: 'q1', nombre: 'q1', x: 500, y: 240 },
    ],
    alfabeto: ['a', 'b'],
    transiciones: [
      { desde: 'q0', hasta: 'q1', simbolo: 'a' },
      { desde: 'q0', hasta: 'q1', simbolo: 'b' },
      { desde: 'q1', hasta: 'q0', simbolo: 'a' },
      { desde: 'q1', hasta: 'q0', simbolo: 'b' },
    ],
    inicial: 'q0',
    finales: ['q0'],
  }
}

function documentoInicial(): Documento {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (crudo) return desdeObjeto(JSON.parse(crudo))
  } catch {
    // Un guardado corrupto no debería impedir abrir la app.
  }
  return documentoNuevo('Cadenas de longitud par', ejemploLongitudPar())
}

export interface Historia {
  errorGuardado: boolean
  documento: Documento
  /** atajo a documento.automata, que es lo que usan casi todas las pantallas */
  automata: Automata
  /** cambia el autómata y apila el anterior para poder deshacer */
  setAutomata: (a: Automata) => void
  /** cambia sin apilar; para arrastres, que generan cientos de cambios */
  setSinHistoria: (a: Automata) => void
  setTitulo: (t: string) => void
  setNotas: (n: string) => void
  setAutor: (a: string) => void
  /** reemplaza el documento entero: al abrir un archivo o un enlace */
  abrir: (d: Documento) => void
  deshacer: () => void
  rehacer: () => void
  puedeDeshacer: boolean
  puedeRehacer: boolean
}

export function useAutomata(): Historia {
  const [errorGuardado, setErrorGuardado] = useState(false)
  const [documento, setDocumento] = useState<Documento>(documentoInicial)
  const [pasado, setPasado] = useState<Documento[]>([])
  const [futuro, setFuturo] = useState<Documento[]>([])
  const ultimo = useRef(documento)

  useEffect(() => {
    ultimo.current = documento
    try {
      localStorage.setItem(CLAVE, JSON.stringify(documento))
      setErrorGuardado(false)
    } catch {
      setErrorGuardado(true)
    }
  }, [documento])

  const conHistoria = useCallback((cambio: (d: Documento) => Documento) => {
    setPasado((p) => [...p.slice(-LIMITE_HISTORIA), ultimo.current])
    setFuturo([])
    setDocumento((d) => cambio(d))
  }, [])

  const setAutomata = useCallback(
    (a: Automata) => conHistoria((d) => ({ ...d, automata: a })),
    [conHistoria],
  )
  const setSinHistoria = useCallback((a: Automata) => setDocumento((d) => ({ ...d, automata: a })), [])
  const setTitulo = useCallback((titulo: string) => setDocumento((d) => ({ ...d, titulo })), [])
  const setNotas = useCallback((notas: string) => setDocumento((d) => ({ ...d, notas })), [])
  const setAutor = useCallback((autor: string) => setDocumento((d) => ({ ...d, autor })), [])
  const abrir = useCallback((nuevo: Documento) => conHistoria(() => nuevo), [conHistoria])

  const deshacer = useCallback(() => {
    setPasado((p) => {
      if (p.length === 0) return p
      setFuturo((f) => [ultimo.current, ...f])
      setDocumento(p[p.length - 1])
      return p.slice(0, -1)
    })
  }, [])

  const rehacer = useCallback(() => {
    setFuturo((f) => {
      if (f.length === 0) return f
      setPasado((p) => [...p, ultimo.current])
      setDocumento(f[0])
      return f.slice(1)
    })
  }, [])

  return {
    errorGuardado,
    documento,
    automata: documento.automata,
    setAutomata,
    setSinHistoria,
    setTitulo,
    setNotas,
    setAutor,
    abrir,
    deshacer,
    rehacer,
    puedeDeshacer: pasado.length > 0,
    puedeRehacer: futuro.length > 0,
  }
}

export function automataNuevo(): Automata {
  return automataVacio(['a', 'b'])
}
