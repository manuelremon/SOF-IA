import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook que detecta entrada de lector USB de código de barras.
 * Los lectores USB emiten caracteres rápidamente (< 50ms entre sí)
 * y terminan con Enter (keyCode 13).
 *
 * @param onScan - callback que recibe el código escaneado
 * @param enabled - activar/desactivar el listener (default: true)
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  enabled = true
): void {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignorar si el foco está en un input/textarea (excepto el de búsqueda de POS)
      const target = e.target as HTMLElement
      const isSearchInput = target.getAttribute('data-barcode-target') === 'true'

      if (
        !isSearchInput &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      const now = Date.now()
      const timeDiff = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Si pasó mucho tiempo, resetear el buffer (no es un scanner)
      if (timeDiff > 100) {
        bufferRef.current = ''
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim()
        // Un código de barras tiene al menos 3 caracteres
        if (code.length >= 3) {
          e.preventDefault()
          e.stopPropagation()
          onScanRef.current(code)
        }
        bufferRef.current = ''
        return
      }

      // Solo aceptar caracteres imprimibles de un solo carácter
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [enabled, resetBuffer])
}
