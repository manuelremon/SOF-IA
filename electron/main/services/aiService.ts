import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import * as fs from 'fs'

export function resetAIClient() {}

async function getAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    const data = await response.json()
    return data.models?.map((m: any) => m.name.replace('models/', '')) || []
  } catch (e) {
    return []
  }
}

export async function askAI(prompt: string, history: Array<{ role: 'user' | 'model', content: string }> = [], imageBase64?: string): Promise<string> {
  const db = getDb()
  const apiKeyRow = db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'aiApiKey')).get()
  const apiKey = apiKeyRow?.value
  if (!apiKey) throw new Error('API Key no configurada.')

  // 1. Diagnóstico de modelos disponibles
  const available = await getAvailableModels(apiKey)
  console.log('[SOF-IA] Modelos detectados en tu cuenta:', available.join(', '))

  // 2. Selección inteligente del mejor modelo
  let aiModel = 'gemini-1.5-flash'
  if (!available.includes(aiModel)) {
    // Si no está el estándar, buscamos alternativas comunes
    aiModel = available.find(m => m.includes('1.5-flash')) || available.find(m => m.includes('1.5')) || available[0] || 'gemini-1.5-flash'
  }
  console.log(`[SOF-IA] Usando modelo: ${aiModel}`)

  const systemInstruction = `Eres SOF-IA, la inteligencia de un sistema POS/ERP.
    Tu objetivo es ayudar al usuario con su negocio.
    
    VOZ A ACCIÓN: Si el usuario quiere agregar productos al carrito, responde con un JSON al final de tu texto.
    Ejemplo: "Claro, agrego 2 cocas. {"action": "ADD_CART", "query": "coca", "quantity": 2}"
    
    Identifica productos comercialmente. Usa Google Search si es necesario.
    Responde de forma concisa y profesional.`

  const parts: any[] = [{ text: systemInstruction + "\n\n" + prompt }]
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64
      }
    })
  }

  // 3. Intento con Búsqueda de Google (v1beta)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`
    const body = {
      contents: [{ role: 'user', parts }],
      tools: [{ google_search: {} }], // Herramienta de búsqueda nativa
      generation_config: { temperature: 0.1 }
    }

    const resp = await fetch(url, { method: 'POST', body: JSON.stringify(body) })
    const data = await resp.json()
    
    if (resp.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    console.warn(`[SOF-IA] v1beta falló (${resp.status}), intentando v1 estable...`)
  } catch (e) {}

  // 4. Intento final con API v1 Estable (Sin herramientas extra)
  const v1Url = `https://generativelanguage.googleapis.com/v1/models/${aiModel}:generateContent?key=${apiKey}`
  const v1Body = { contents: [{ role: 'user', parts }] }
  
  const v1Resp = await fetch(v1Url, { method: 'POST', body: JSON.stringify(v1Body) })
  const v1Data = await v1Resp.json()

  if (v1Resp.ok) return v1Data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  return `Error de conexión: ${v1Data.error?.message || 'Fallo desconocido'}. Modelos disponibles: ${available.join(', ')}`
}
