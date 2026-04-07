import { GoogleGenAI } from '@google/genai'
import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { eq, sql } from 'drizzle-orm'

let aiClient: GoogleGenAI | null = null

// Helper to initialize or retrieve the Gemini client
async function getAIClient(): Promise<GoogleGenAI> {
  if (aiClient) return aiClient

  const db = getDb()
  const apiKeyRow = db.select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, 'aiApiKey'))
    .get()

  const apiKey = apiKeyRow?.value
  if (!apiKey) {
    throw new Error('Asistente desactivado. Configura tu API Key en la pantalla de Configuración.')
  }

  aiClient = new GoogleGenAI({ apiKey })
  return aiClient
}

// Limpiar instancia en caso de actualización desde el Frontend (Configuración)
export function resetAIClient() {
  aiClient = null
}

export async function askAI(prompt: string, history: Array<{ role: 'user' | 'model', content: string }> = []): Promise<string> {
  const client = await getAIClient()
  const db = getDb()

  // Recolectar contexto básico y liviano del negocio (en tiempo real)
  const stats = db.select({
    totalProducts: sql<number>`count(1)`,
    totalValue: sql<number>`sum(stock * cost_price)`,
    lowStockCount: sql<number>`sum(CASE WHEN stock <= min_stock AND stock > 0 THEN 1 ELSE 0 END)`,
    outOfStockCount: sql<number>`sum(CASE WHEN stock <= 0 THEN 1 ELSE 0 END)`
  }).from(schema.products).get()

  // Extraer las ventas totales del día
  const todaySales = db.select({
    totalSales: sql<number>`count(1)`,
    revenue: sql<number>`sum(total)`
  }).from(schema.sales)
    .where(sql`DATE(created_at) = DATE('now', 'localtime')`)
    .get()

  const systemInstruction = `Eres "SOF-IA", la IA oficial asistente de este sistema de Punto de Venta (POS) y Gestión Comercial (con el mismo nombre, SOF-IA).
Tus respuestas deben ser concisas, eficientes e ir al grano. IMPORTANTE: Tu voz será leída en voz alta por un sintetizador, así que adopta un tono conversacional y usa jerga o vocabulario argentino (usá "vos", "che", "mirá") de manera sutil y amigable. No abuses.
Usa puntuación simple, sin exceso de exclamaciones ni listas complejas.
Resalta nombres de productos en negrita si te los preguntan, pero no abuses del formato negritas.
Puedes seguir usando emojis (el sistema de lectura ya se encargará de omitirlos).

**Métricas actuales del Negocio (ESTrictamente Confidenciales pero puedes usarlas para ayudar al usuario si te pregunta por el local/stock):**
- Cantidad Total de Productos en Catalogo: ${stats?.totalProducts || 0}
- Valor Total Inventario (Costo de stock): "$ ${stats?.totalValue?.toFixed(2) || '0.00'}"
- Productos con Bajo Stock (en alerta): ${stats?.lowStockCount || 0}
- Productos Agotados (Sin nada de Stock): ${stats?.outOfStockCount || 0}
- Ventas realizadas HOY: ${todaySales?.totalSales || 0} (Ingresos de hoy: "$ ${todaySales?.revenue?.toFixed(2) || '0.00'}")

Por favor asiste al administrador o vendedor con sus dudas.`

  // Mapear historial al formato genérico
  const convertedHistory = history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))
  
  if (convertedHistory.length > 0) {
     const res = await client.chats.create({
        model: 'gemini-2.5-flash',
        history: convertedHistory,
        config: { systemInstruction, temperature: 0.7 }
     }).sendMessage({ message: prompt })
     return res.text || ''
  } else {
     const res = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction, temperature: 0.7 }
     })
     return res.text || ''
  }
}
