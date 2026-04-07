import { app } from 'electron'
import { join } from 'path'
import { initDb, getDb } from '../electron/main/db/connection'
import * as salesService from '../electron/main/services/salesService'
import * as cashRegisterService from '../electron/main/services/cashRegisterService'
import * as productService from '../electron/main/services/productService'
import * as goodsReceiptService from '../electron/main/services/goodsReceiptService'
import * as schema from '../electron/main/db/schema'
import { eq } from 'drizzle-orm'

async function runE2ETest() {
  console.log('--- EMPEZANDO AUDITORÍA DE FLUJOS (E2E) ---')
  try {
    // 1. Inicializar DB (mock or real)
    initDb()
    const db = getDb()
    console.log('[OK] Base de datos conectada.')

    // 2. Limpiar datos de prueba anteriores si existen
    const testSku = 'TEST-E2E-001'
    db.delete(schema.products).where(eq(schema.products.sku, testSku)).run()

    // 3. Crear Producto de Prueba
    const productId = productService.createProduct({
      sku: testSku,
      name: 'Producto E2E Test',
      costPrice: 50,
      salePrice: 100,
      stock: 10,
      minStock: 2,
      categoryId: null
    })
    console.log(`[OK] Producto creado con ID: ${productId}`)

    // 4. Recepción de Mercadería (Sin OC previa para hacerlo directo)
    const receiptId = goodsReceiptService.createDirectReceipt({
      date: new Date().toISOString(),
      notes: 'Ingreso inicial por prueba E2E',
      items: [
        {
          productId: productId,
          quantity: 5,
          unitCost: 50
        }
      ]
    })
    console.log(`[OK] Mercadería recibida. ID Remito: ${receiptId}`)

    // Verificar nuevo stock = 10 + 5 = 15
    const prodAfterReceipt = productService.getProductBySku(testSku)
    if (prodAfterReceipt?.stock !== 15) throw new Error(`Stock falló tras recepción. Esperado 15, Actual: ${prodAfterReceipt?.stock}`)
    console.log('[OK] Lógica de impacto de Stock (Entrada) funciona.')

    // 5. Manejo de Caja
    const userId = 1 // Admin por defecto (Seeder)
    let register = cashRegisterService.getCurrentRegister()

    if (register?.status === 'abierta') {
      cashRegisterService.closeRegister(userId, register.cashInRegister, 'Cierre automático previo a test E2E')
      console.log('[OK] Caja previa cerrada automáticamente.')
    }

    const registerId = cashRegisterService.openRegister(userId, 500)
    console.log(`[OK] Caja abierta exitosamente (Fondo: 500). ID Caja: ${registerId}`)

    // Verificar que podemos obtenerla
    register = cashRegisterService.getCurrentRegister()
    if (register?.id !== registerId) throw new Error('Caja activa no coincide.')

    // 6. Realizar Venta (2 unidades)
    const saleId = salesService.completeSale({
      paymentMethod: 'efectivo',
      status: 'completada',
      items: [
        {
          productId: productId,
          quantity: 2,
          unitPrice: 100,
          subtotal: 200,
          discountPercent: 10, // Prueba de descuento
          total: 180
        }
      ],
      subtotal: 200,
      globalDiscountPercent: 0,
      total: 180
    }, userId)
    console.log(`[OK] Venta procesada exitosamente. ID Venta: ${saleId}`)

    // 7. Verificar impacto de venta en Stock (15 - 2 = 13)
    const prodAfterSale = productService.getProductBySku(testSku)
    if (prodAfterSale?.stock !== 13) throw new Error(`Stock descontado tras venta falló. Esperado 13, Actual: ${prodAfterSale?.stock}`)
    console.log('[OK] Lógica de impacto de Stock (Salida por Venta) funciona matemáticamente.')

    // 8. Verificar impacto en la Caja Activa (Fondo 500 + Venta Mágica 180 = 680)
    register = cashRegisterService.getCurrentRegister()
    if (register?.cashInRegister !== 680) throw new Error(`El efectivo interno de la caja falló. Esperado 680, Actual: ${register?.cashInRegister}`)
    console.log('[OK] Lógica contable de la Caja funciona perfectamente (Suma automática ventas en efectivo).')

    // 9. Simular Arqueo / Cierre de Caja
    // Usuario cuenta 650 en billetes físicos físicos (faltan 30)
    const closeDiff = cashRegisterService.closeRegister(userId, 650, 'Cierre E2E Test. Faltante detectado intencional.')
    
    // Verificamos el historial de log
    const regFinal = db.select().from(schema.cashRegisters).where(eq(schema.cashRegisters.id, registerId)).get()
    if (regFinal?.status !== 'cerrada') throw new Error('Caja no se cerró correctamente.')
    if (regFinal.expectedCash !== 680) throw new Error('Esperado de cash no coincide tras cierre.')
    if (regFinal.difference !== -30) throw new Error(`Cálculo de diferencia falló. Esperado -30, Actual: ${regFinal.difference}`)
    console.log('[OK] Flujo de Cierre y Arqueo contable totalmente validado. Diferencia registrada correctamente.')

    console.log('--- TODOS LOS FLUJOS COMPLETADOS CON ÉXITO ---')
    process.exit(0)
  } catch (error) {
    console.error('--- ERROR CRÍTICO EN E2E TEST ---')
    console.error(error)
    process.exit(1)
  }
}

app.whenReady().then(() => runE2ETest())
