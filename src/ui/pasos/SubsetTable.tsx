import { useState } from 'react'
import type { ResultadoSubconjuntos } from '../../core/subset'

/**
 * La tabla de la construcción de subconjuntos, en el formato que se escribe en la
 * hoja: cada fila es un conjunto de estados del AFN con su nombre, y cada columna
 * el conjunto al que se llega con ese símbolo.
 *
 * El detalle muestra los dos pasos por separado, mueve(T, a) y su ε-clausura, que
 * es donde se equivoca todo el mundo cuando lo hace a mano.
 */
export function SubsetTable({ resultado, alfabeto }: { resultado: ResultadoSubconjuntos; alfabeto: string[] }) {
  const [detalle, setDetalle] = useState(false)

  return (
    <>
      <div className="fila" style={{ marginBottom: 10 }}>
        <button className="btn chico" aria-pressed={detalle} onClick={() => setDetalle((d) => !d)}>
          {detalle ? 'Ocultar el detalle' : 'Ver mueve(T, a) y la ε-clausura'}
        </button>
        {resultado.usaVacio && (
          <span className="etiqueta-campo">
            El conjunto ∅ es el estado muerto: hace falta para que el AFD quede completo.
          </span>
        )}
      </div>

      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Conjunto de estados del AFN</th>
              {alfabeto.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultado.filas.map((f) => (
              <tr key={f.nombre}>
                <th>
                  {f.esInicial && <span className="marca-inicial">→</span>}
                  {f.esFinal && <span className="marca-final">∗</span>}
                  {f.nombre}
                </th>
                <td>{f.conjunto}</td>
                {alfabeto.map((s) => {
                  const d = f.destinos[s]
                  return (
                    <td key={s}>
                      <strong>{d.nombre}</strong>
                      {detalle && (
                        <div className="celda-detalle">
                          <div>mueve = {d.mueve}</div>
                          <div>ε-cl = {d.clausura}</div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
