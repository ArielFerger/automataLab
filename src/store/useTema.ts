import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'automatalab:tema'

export type Tema = 'sistema' | 'claro' | 'oscuro' | 'papel'

export const TEMAS: { id: Tema; texto: string; ayuda: string }[] = [
  { id: 'sistema', texto: 'Sistema', ayuda: 'Sigue la configuración de la computadora' },
  { id: 'claro', texto: 'Claro', ayuda: 'Tinta azul sobre blanco' },
  { id: 'oscuro', texto: 'Oscuro', ayuda: 'Para estudiar de noche' },
  { id: 'papel', texto: 'Papel', ayuda: 'Tonos cálidos, como una hoja' },
]

function leer(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado && TEMAS.some((t) => t.id === guardado)) return guardado as Tema
  } catch {
    // Sin localStorage se arranca siguiendo al sistema.
  }
  return 'sistema'
}

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(leer)

  useEffect(() => {
    // 'sistema' no pone atributo: ahí manda la media query de la hoja de estilos.
    if (tema === 'sistema') document.documentElement.removeAttribute('data-tema')
    else document.documentElement.setAttribute('data-tema', tema)
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      // No poder recordar el tema no es motivo para romper nada.
    }
  }, [tema])

  return [tema, useCallback((t: Tema) => setTema(t), [])]
}
