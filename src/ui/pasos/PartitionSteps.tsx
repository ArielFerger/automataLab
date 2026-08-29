import type { ResultadoMinimizacion } from '../../core/minimize'

/**
 * Las particiones P1, P2, … del algoritmo de minimización.
 *
 * P1 separa finales de no finales, y cada una siguiente subdivide los grupos cuyos
 * estados no van a parar al mismo grupo con algún símbolo. El algoritmo corta
 * cuando una partición sale igual que la anterior.
 */
export function PartitionSteps({ resultado }: { resultado: ResultadoMinimizacion }) {
  const particiones = resultado.particiones
  const ultima = particiones.length - 1

  return (
    <div className="particiones">
      {(resultado.quitoInalcanzables || resultado.seCompleto) && (
        <p className="aviso" style={{ marginBottom: 12 }}>
          Antes de particionar:
          {resultado.quitoInalcanzables && ' se quitaron los estados inalcanzables desde el inicial.'}
          {resultado.seCompleto && ' se completó el AFD con un estado muerto ∅, porque el algoritmo lo necesita completo.'}
        </p>
      )}

      {particiones.map((p, i) => (
        <section className="particion" key={p.indice}>
          <h3 className="particion-titulo">
            <span className="particion-p">
              P<sub>{p.indice}</sub>
            </span>
            <span className="particion-nota">
              {i === 0
                ? 'finales y no finales, que son distinguibles mediante ε'
                : i === ultima
                  ? 'igual que la anterior: acá termina el refinamiento'
                  : p.grupos.some((g) => g.motivo)
                    ? p.grupos.filter((g) => g.motivo).map((g) => g.motivo)[0]
                    : 'se refina cada grupo'}
            </span>
          </h3>
          <div className="grupos">
            {p.grupos.map((g) => (
              <span className="grupo" key={g.nombre}>
                <b>{g.nombre}</b> = &#123;{g.estados.join(', ')}&#125;
              </span>
            ))}
          </div>
        </section>
      ))}

      <p className="ayuda">
        Se elige un representante por grupo de la última partición: esos son los estados del AFD mínimo.
      </p>
    </div>
  )
}
