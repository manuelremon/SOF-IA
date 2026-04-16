import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { eq } from 'drizzle-orm'

const DDL_SCHEMA = `
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  sale_price REAL,
  stock REAL,
  min_stock REAL,
  category_id INTEGER
);
CREATE TABLE sales (
  id INTEGER PRIMARY KEY,
  total REAL,
  payment_method TEXT,
  created_at TEXT -- Formato YYYY-MM-DD HH:MM:SS
);
CREATE TABLE sale_items (
  sale_id INTEGER,
  product_id INTEGER,
  product_name TEXT,
  quantity REAL,
  unit_price REAL,
  line_total REAL
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT
);
`

export async function askDatabase(question: string): Promise<string> {
  const db = getDb()
  const apiKeyRow = db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'aiApiKey')).get()
  const apiKey = apiKeyRow?.value
  if (!apiKey) throw new Error('API Key no configurada.')

  // 1. Generar SQL
  const sqlPrompt = `
    Eres un experto en SQLite. Dado este esquema:
    ${DDL_SCHEMA}
    
    Escribe una consulta SQL SELECT para responder la siguiente pregunta: "${question}".
    IMPORTANTE: 
    - Responde ÚNICAMENTE con el código SQL, sin bloques de código markdown, sin explicaciones.
    - Usa solo SELECT. No permitas inyecciones.
    - La fecha actual es ${new Date().toISOString().slice(0, 19).replace('T', ' ')}.
  `

  const sqlResponse = await fetchAI(sqlPrompt, apiKey)
  const sqlQuery = sqlResponse.replace(/```sql|```/g, '').trim()

  if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
    return "Lo siento, solo puedo realizar consultas de lectura sobre los datos."
  }

  try {
    // 2. Ejecutar SQL
    const results = db.run(sqlQuery).all()
    
    // 3. Formatear respuesta humana
    const humanPrompt = `
      Pregunta: "${question}"
      Datos de la base de datos (JSON): ${JSON.stringify(results)}
      
      Responde a la pregunta de forma natural y profesional basada en estos datos. 
      Si no hay datos, indícalo amablemente. Responde en español.
    `
    return await fetchAI(humanPrompt, apiKey)
  } catch (err: any) {
    return `Hubo un error al consultar los datos: ${err.message}`
  }
}

async function fetchAI(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generation_config: { temperature: 0.1 }
  }
  const resp = await fetch(url, { method: 'POST', body: JSON.stringify(body) })
  const data = await resp.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
