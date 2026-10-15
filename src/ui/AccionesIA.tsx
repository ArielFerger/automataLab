import { useState } from 'react'
import { copiar } from '../core/enlace'
import { PEDIDO_IA } from '../core/paraIA'

export function AccionesIA({ texto, soloEnunciado }: { texto: string; soloEnunciado?: string }) {
  const [aviso, setAviso] = useState('')
  const [manual, setManual] = useState(false)
  const completo = `${PEDIDO_IA}\n\n${texto}`
  async function copiarTexto(contenido: string, abrir = false) {
    if (abrir) window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')
    const ok = await copiar(contenido)
    setManual(!ok)
    setAviso(ok ? (abrir ? 'Copiado. En ChatGPT, pegá el texto y envialo.' : 'Texto copiado al portapapeles.') : 'El navegador bloqueó la copia. Seleccioná y copiá el texto de abajo.')
  }
  return <div className="acciones-ia">
    <div className="fila junta envolver">
      {soloEnunciado && <button className="btn chico" onClick={() => copiarTexto(soloEnunciado)}>Copiar enunciado</button>}
      <button className="btn chico" onClick={() => copiarTexto(completo)}>Copiar para IA</button>
      <button className="btn chico" onClick={() => copiarTexto(completo, true)}>Copiar y abrir ChatGPT</button>
      <button className="btn texto chico" onClick={() => setManual(v => !v)} aria-expanded={manual}>Ver texto</button>
    </div>
    <p className="ayuda">Incluye enunciado, respuesta y tablas de los diagramas. Pegás y enviás vos.</p>
    <p className="estado-copia" role="status">{aviso}</p>
    {manual && <label className="campo-etiqueta">Texto listo para copiar<textarea className="campo mono" rows={10} readOnly value={completo} onFocus={ev => ev.target.select()} /></label>}
  </div>
}
