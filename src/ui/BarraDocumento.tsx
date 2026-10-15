import { useRef, useState } from 'react'
import { type Documento, descargar, deserializar, documentoNuevo, nombreDeArchivo, serializar } from '../core/documento'
import { pngDelDocumento, svgDelDocumento } from '../core/exportar'
import { copiar, enlaceDe } from '../core/enlace'
import { ejemploLongitudPar } from '../store/useAutomaton'
import { AccionesIA } from './AccionesIA'
import { textoAutomata } from '../core/paraIA'

interface Props {
  documento: Documento
  onTitulo: (t: string) => void
  onNotas: (n: string) => void
  onAbrir: (d: Documento) => void
}

/**
 * La barra del documento: título, guardar, abrir, exportar y compartir.
 *
 * El autómata deja de ser algo que solo vive en el editor y pasa a ser un archivo
 * con nombre: "Ejercicio 1" se guarda, se vuelve a abrir, se manda por WhatsApp
 * como imagen o como link.
 */
export function BarraDocumento({ documento, onTitulo, onNotas, onAbrir }: Props) {
  const entradaArchivo = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState<{ texto: string; malo?: boolean } | null>(null)
  const [abierto, setAbierto] = useState<'exportar' | 'compartir' | 'notas' | 'ia' | null>(null)
  const [conTabla, setConTabla] = useState(true)
  const [conNotas, setConNotas] = useState(true)
  const [enlace, setEnlace] = useState('')

  function avisar(texto: string, malo = false) {
    setAviso({ texto, malo })
    setTimeout(() => setAviso(null), 3500)
  }

  function guardarArchivo() {
    descargar(serializar(documento), nombreDeArchivo(documento.titulo, 'automata.json'))
    avisar('Archivo guardado. Se vuelve a abrir con el botón Abrir.')
  }

  async function abrirArchivo(archivo: File) {
    try {
      onAbrir(deserializar(await archivo.text()))
      avisar('Se abrió «' + archivo.name + '».')
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo leer el archivo.', true)
    }
  }

  async function exportarPNG() {
    try {
      const blob = await pngDelDocumento(documento, { conTabla, conNotas })
      descargar(blob, nombreDeArchivo(documento.titulo, 'png'), 'image/png')
      avisar('Imagen lista para compartir.')
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo generar la imagen.', true)
    }
  }

  function exportarSVG() {
    descargar(svgDelDocumento(documento, { conTabla, conNotas }), nombreDeArchivo(documento.titulo, 'svg'), 'image/svg+xml')
    avisar('SVG guardado: no pierde calidad al agrandarlo.')
  }

  async function armarEnlace() {
    const url = await enlaceDe(documento)
    setEnlace(url)
    setAbierto('compartir')
    if (await copiar(url)) avisar('Link copiado. Pegalo donde quieras.')
  }

  return (
    <div className="barra-doc">
      <div className="fila junta" style={{ flexWrap: 'wrap' }}>
        <input
          className="campo titulo-doc"
          value={documento.titulo}
          aria-label="Título del autómata"
          placeholder="Ejercicio 1"
          onChange={(ev) => onTitulo(ev.target.value)}
          onFocus={(ev) => ev.target.select()}
        />

        <button className="btn chico" onClick={guardarArchivo}>
          Guardar
        </button>
        <button className="btn chico" onClick={() => entradaArchivo.current?.click()}>
          Abrir
        </button>
        <button className="btn chico" aria-pressed={abierto === 'exportar'} onClick={() => setAbierto((a) => (a === 'exportar' ? null : 'exportar'))}>
          Exportar imagen
        </button>
        <button className="btn chico" onClick={armarEnlace}>
          Compartir link
        </button>
        <button className="btn chico" aria-expanded={abierto === 'ia'} onClick={() => setAbierto(a => a === 'ia' ? null : 'ia')}>Verificar con IA</button>
        <button className="btn chico" aria-pressed={abierto === 'notas'} onClick={() => setAbierto((a) => (a === 'notas' ? null : 'notas'))}>
          Notas{documento.notas.trim() ? ' •' : ''}
        </button>
        <button
          className="btn chico"
          onClick={() => onAbrir(documentoNuevo('Autómata sin título'))}
          title="Empezar uno nuevo, en blanco"
        >
          Nuevo
        </button>
        <button className="btn chico" onClick={() => onAbrir(documentoNuevo('Cadenas de longitud par', ejemploLongitudPar()))}>
          Ejemplo
        </button>

        <input
          ref={entradaArchivo}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(ev) => {
            const f = ev.target.files?.[0]
            if (f) abrirArchivo(f)
            ev.target.value = ''
          }}
        />
      </div>

      {abierto === 'ia' && <div className="panel-desplegable"><AccionesIA texto={`${documento.titulo}\n\nENUNCIADO / NOTAS\n${documento.notas || '(Agregá el enunciado en Notas para una corrección completa.)'}\n\nMI DIAGRAMA\n${textoAutomata(documento.automata)}`} soloEnunciado={documento.notas || documento.titulo} /></div>}

      {abierto === 'exportar' && (
        <div className="panel-desplegable">
          <p className="ayuda" style={{ marginTop: 0 }}>
            La imagen sale con el título arriba y fondo blanco, para que se lea en cualquier chat.
          </p>
      <div className="fila junta" style={{ flexWrap: 'wrap' }}>
            <label className="casilla">
              <input type="checkbox" checked={conTabla} onChange={(ev) => setConTabla(ev.target.checked)} />
              Incluir la tabla de transiciones
            </label>
            <label className="casilla">
              <input type="checkbox" checked={conNotas} onChange={(ev) => setConNotas(ev.target.checked)} disabled={!documento.notas.trim()} />
              Incluir las notas
            </label>
          </div>
          <div className="fila junta" style={{ marginTop: 10 }}>
            <button className="btn primario chico" onClick={exportarPNG}>
              Descargar PNG
            </button>
            <button className="btn chico" onClick={exportarSVG}>
              Descargar SVG
            </button>
          </div>
        </div>
      )}

      {abierto === 'compartir' && (
        <div className="panel-desplegable">
          <p className="ayuda" style={{ marginTop: 0 }}>
            El autómata entero viaja dentro del link. No se sube a ningún lado: quien lo abre lo ve y lo puede
            editar.
          </p>
          <div className="fila">
            <input className="campo mono" readOnly value={enlace} onFocus={(ev) => ev.target.select()} />
            <button className="btn chico" onClick={() => copiar(enlace).then((ok) => avisar(ok ? 'Link copiado.' : 'Copialo a mano.', !ok))}>
              Copiar
            </button>
          </div>
        </div>
      )}

      {abierto === 'notas' && (
        <div className="panel-desplegable">
          <label className="seccion-titulo" htmlFor="notas-doc" style={{ display: 'block' }}>
            Notas del autómata
          </label>
          <textarea
            id="notas-doc"
            className="campo"
            rows={3}
            placeholder="El enunciado, una aclaración, lo que quieras que viaje con el autómata."
            value={documento.notas}
            onChange={(ev) => onNotas(ev.target.value)}
          />
        </div>
      )}

      {aviso && <p className={'aviso' + (aviso.malo ? ' malo' : '')} style={{ marginTop: 8 }}>{aviso.texto}</p>}
    </div>
  )
}
