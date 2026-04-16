export async function readScaleWeight(): Promise<number> {
  // Simulación de lectura de puerto serie (COM1/COM2)
  // En un entorno real esto usaría la librería 'serialport'
  
  return new Promise((resolve) => {
    // Simulamos un retraso de lectura de 500ms
    setTimeout(() => {
      // Generamos un peso aleatorio realista (entre 0.200 y 3.500 kg)
      const mockWeight = parseFloat((Math.random() * (3.5 - 0.2) + 0.2).toFixed(3))
      console.log(`[Hardware] Peso leído de balanza (simulado): ${mockWeight} kg`)
      resolve(mockWeight)
    }, 500)
  })
}
