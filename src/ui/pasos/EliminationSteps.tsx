import type { ResultadoEliminacion } from '../../core/stateElimination'
import { Diagrama } from '../Diagrama'

/**
 * El pasaje de AF a ER, estado por estado.
 *
 * Cada paso muestra el autómata generalizado que queda después de sacar un estado:
 * las etiquetas ya no son símbolos sino expresiones regulares. Al final queda una
 * sola flecha, de i a f, y su etiqueta es la respuesta.
 */
export function EliminationSteps({ resultado }: { resultado: ResultadoEliminacion }) {
  return (
    <div className="pasos">
      {resultado.pasos.map((p, i) => (
        <article className="paso" key={i}>
          <header className="paso-cabecera">
            <span className="paso-numero">{i}</span>
            <span className="paso-regla">{p.titulo}</span>
          </header>
          <Diagrama automata={p.automata} alto={240} />
        </article>
      ))}

      <div className="resultado-er">
        <span className="seccion-titulo" style={{ margin: 0 }}>
          Expresión regular
        </span>
        <code className="er-final">{resultado.expresion}</code>
      </div>
    </div>
  )
}
