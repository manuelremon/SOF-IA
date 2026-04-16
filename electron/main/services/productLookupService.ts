import { getDb } from '../db/connection'
import * as schema from '../db/schema'
import { askAI } from './aiService'
import { eq } from 'drizzle-orm'

interface ProductLookupResult {
  name: string
  brand?: string
  presentation?: string
  categoryId?: number
  suggestedPrice?: number
  description?: string
  barcode?: string
  found: boolean
}

export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  // 1. Intentar con Open Food Facts (API Gratuita)
  try {
    const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const offData = await offResponse.json()

    if (offData.status === 1 && offData.product) {
      const p = offData.product
      return {
        name: p.product_name || '',
        brand: p.brands || '',
        presentation: p.quantity || '',
        description: p.generic_name || '',
        found: true
      }
    }
  } catch (err) {
    console.error('Error fetching from Open Food Facts:', err)
  }

  // 2. Si no se encuentra, usar IA (Gemini) para interpretar el código o buscar contexto
  try {
    const db = getDb()
    const categories = db.select().from(schema.categories).where(eq(schema.categories.isActive, true)).all()
    const categoryList = categories.map(c => `${c.id}: ${c.name}`).join(', ')

    const prompt = `Un usuario escaneó el código de barras "${barcode}". 
No lo encontré en bases de datos estándar. 
Usa Google Search para identificar qué producto es y cuál es su PRECIO DE VENTA PROMEDIO actual en el mercado minorista de Argentina (en Pesos ARS).
Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "name": "Nombre del producto",
  "brand": "Marca",
  "presentation": "Presentación (ej: 500ml, 1kg)",
  "categoryId": ID_DE_CATEGORIA_SUGERIDO (un número de la lista),
  "suggestedPrice": PRECIO_SUGERIDO_NUMERICO,
  "description": "Breve descripción"
}

Lista de categorías disponibles en el sistema (usa el ID):
${categoryList}

Si no estás seguro del precio, pon 0 en "suggestedPrice". Si no sabes qué producto es, responde {}.`

    const aiResponse = await askAI(prompt)
    // Extraer JSON de la respuesta de la IA
    const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      if (data.name) {
        return { ...data, found: true }
      }
    }
  } catch (err) {
    console.error('Error fetching from AI Lookup:', err)
  }

  return { name: '', found: false }
}

export async function identifyProductByImage(base64Image: string): Promise<ProductLookupResult> {
  try {
    const db = getDb()
    const categories = db.select().from(schema.categories).where(eq(schema.categories.isActive, true)).all()
    const categoryList = categories.map(c => `${c.id}: ${c.name}`).join(', ')

    // Prompt específico para análisis de imagen
    const prompt = `Analiza esta imagen de un producto comercial.
Usa Google Search para identificar: Nombre exacto, Marca, Presentación (peso/volumen), Código de barras (si se ve) y una breve descripción.
Busca también el PRECIO DE VENTA PROMEDIO actual de este producto en Argentina (en Pesos ARS).
Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "name": "Nombre del producto",
  "brand": "Marca",
  "presentation": "Presentación (ej: 500ml, 1.5kg)",
  "barcode": "Número del código de barras (solo si es legible)",
  "categoryId": ID_DE_CATEGORIA_SUGERIDO (un número de la lista),
  "suggestedPrice": PRECIO_SUGERIDO_NUMERICO,
  "description": "Breve descripción"
}

Lista de categorías disponibles en el sistema (usa el ID):
${categoryList}

Si no logras identificar el producto o el precio, responde con un objeto vacío o pon 0 en suggestedPrice.`

    // Enviar imagen a Gemini
    const aiResponse = await askAI(prompt, [], base64Image)
    
    // Limpieza robusta de la respuesta
    const cleanResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      if (data.name) {
        console.log('SOF-IA identificó el producto:', data.name, 'Precio Sugerido:', data.suggestedPrice)
        return { ...data, found: true }
      }
    }
  } catch (err) {
    console.error('Error in Visual Identification:', err)
  }

  return { name: '', found: false }
}
