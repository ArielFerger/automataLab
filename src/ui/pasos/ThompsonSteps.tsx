import type { ResultadoThompson } from '../../core/thompson'
import { Diagrama } from '../Diagrama'

/**
 * Los fragmentos de Thompson en el orden en que se construyen, que es el orden de
 * evaluación de la expresión: primero los símbolos sueltos, después las
 * operaciones que los combinan.
 */
export function ThompsonSteps({ resultado }: { resultado: ResultadoThompson }) {
  return (
    <div className="pasos">
      {resultado.pasos.map((p, i) => (
        <article className="paso" key={i}>
          <header className="paso-cabecera">
            <span className="paso-numero">{i + 1}</span>
            <code className="paso-expresion">{p.expresion}</code>
            <span className="paso-regla">{p.regla}</span>
          </header>
          <Diagrama automata={p.automata} alto={p.automata.estados.length > 6 ? 210 : 150} />
        </article>
      ))}
    </div>
  )
}
