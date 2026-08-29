/**
 * Transformación de ER a AFN-ε: construcción de Thompson.
 *
 * Se arma de forma inductiva siguiendo la definición de expresión regular. Los
 * fragmentos cumplen las tres propiedades que pide la teoría: un solo estado
 * final, del final no sale ninguna transición y al inicial no llega ninguna.
 */

import { type Automata, type Estado, type Transicion, EPSILON } from './automaton'
import { disponerPorCapas } from './layout'
import { type Nodo, imprimir } from './regex/ast'

export interface PasoThompson {
  /** la subexpresión que se acaba de construir */
  expresion: string
  /** qué regla de la construcción se aplicó */
  regla: string
  /** el fragmento resultante, listo para dibujar */
  automata: Automata
}

export interface ResultadoThompson {
  automata: Automata
  pasos: PasoThompson[]
}

interface Fragmento {
  inicial: string
  final: string
  estados: string[]
}

class Constructor {
  private siguiente = 0
  estados: Estado[] = []
  transiciones: Transicion[] = []

  nuevoEstado(): string {
    const id = 'n' + this.siguiente
    this.estados.push({ id, nombre: String(this.siguiente), x: 0, y: 0 })
    this.siguiente++
    return id
  }

  conectar(desde: string, hasta: string, simbolo: string) {
    this.transiciones.push({ desde, hasta, simbolo })
  }

  /**
   * Funde `viejo` dentro de `nuevo`: lo que llegaba o salía del viejo pasa a
   * hacerlo del nuevo, y el viejo desaparece. Es lo que hace la concatenación.
   */
  fundir(viejo: string, nuevo: string) {
    for (const t of this.transiciones) {
      if (t.desde === viejo) t.desde = nuevo
      if (t.hasta === viejo) t.hasta = nuevo
    }
    this.estados = this.estados.filter((e) => e.id !== viejo)
  }

  /** Recorta el autómata a los estados de un fragmento, para poder dibujarlo solo. */
  recorte(frag: Fragmento, alfabeto: string[]): Automata {
    const dentro = new Set(frag.estados.filter((id) => this.estados.some((e) => e.id === id)))
    return disponerPorCapas({
      estados: this.estados.filter((e) => dentro.has(e.id)).map((e) => ({ ...e })),
      alfabeto: [...alfabeto],
      transiciones: this.transiciones
        .filter((t) => dentro.has(t.desde) && dentro.has(t.hasta))
        .map((t) => ({ ...t })),
      inicial: frag.inicial,
      finales: [frag.final],
    })
  }
}

export function thompson(nodo: Nodo, alfabeto: string[]): ResultadoThompson {
  const c = new Constructor()
  const pasos: PasoThompson[] = []

  function anotar(frag: Fragmento, n: Nodo, regla: string): Fragmento {
    pasos.push({ expresion: imprimir(n), regla, automata: c.recorte(frag, alfabeto) })
    return frag
  }

  function construir(n: Nodo): Fragmento {
    switch (n.tipo) {
      case 'vacio': {
        // Dos estados sin nada que los una: no se reconoce ninguna cadena.
        const i = c.nuevoEstado()
        const f = c.nuevoEstado()
        return anotar({ inicial: i, final: f, estados: [i, f] }, n, 'lenguaje vacío ∅')
      }
      case 'epsilon': {
        const i = c.nuevoEstado()
        const f = c.nuevoEstado()
        c.conectar(i, f, EPSILON)
        return anotar({ inicial: i, final: f, estados: [i, f] }, n, 'cadena vacía ε')
      }
      case 'simbolo': {
        const i = c.nuevoEstado()
        const f = c.nuevoEstado()
        c.conectar(i, f, n.valor)
        return anotar({ inicial: i, final: f, estados: [i, f] }, n, 'símbolo ' + n.valor)
      }
      case 'union': {
        const r = construir(n.izq)
        const s = construir(n.der)
        const i = c.nuevoEstado()
        const f = c.nuevoEstado()
        c.conectar(i, r.inicial, EPSILON)
        c.conectar(i, s.inicial, EPSILON)
        c.conectar(r.final, f, EPSILON)
        c.conectar(s.final, f, EPSILON)
        return anotar(
          { inicial: i, final: f, estados: [i, ...r.estados, ...s.estados, f] },
          n,
          'unión: un inicial nuevo con ε hacia las dos ramas, y un final nuevo al que ambas llegan con ε',
        )
      }
      case 'concat': {
        const r = construir(n.izq)
        const s = construir(n.der)
        // El final de la primera y el inicial de la segunda pasan a ser el mismo estado.
        c.fundir(s.inicial, r.final)
        const estados = [...r.estados, ...s.estados.filter((id) => id !== s.inicial)]
        return anotar(
          { inicial: r.inicial, final: s.final, estados },
          n,
          'concatenación: el final de la primera se funde con el inicial de la segunda',
        )
      }
      case 'estrella': {
        const r = construir(n.hijo)
        const i = c.nuevoEstado()
        const f = c.nuevoEstado()
        c.conectar(i, r.inicial, EPSILON)
        c.conectar(r.final, f, EPSILON)
        c.conectar(r.final, r.inicial, EPSILON) // repetir
        c.conectar(i, f, EPSILON) // saltear: la clausura admite cero repeticiones
        return anotar(
          { inicial: i, final: f, estados: [i, ...r.estados, f] },
          n,
          'clausura: un ε para repetir y otro para saltear',
        )
      }
    }
  }

  const frag = construir(nodo)
  const automata = disponerPorCapas({
    estados: c.estados.map((e) => ({ ...e })),
    alfabeto: [...alfabeto],
    transiciones: c.transiciones.map((t) => ({ ...t })),
    inicial: frag.inicial,
    finales: [frag.final],
  })
  return { automata, pasos }
}
