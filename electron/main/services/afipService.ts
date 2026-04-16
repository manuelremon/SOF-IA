import Afip from '@afipsdk/afip.js'
import { getSetting } from './settingsService'
import path from 'path'
import fs from 'fs'

export interface AfipVoucherData {
  tipoComprobante: number // 1, 6, 11, etc.
  puntoVenta: number
  docTipo: number // 80=CUIT, 96=DNI, 99=Consumidor Final
  docNro: number
  importeTotal: number
  importeGravado: number // Subtotal antes de IVA
  importeExento: number
  importeIVA: number
  alicuotas?: Array<{ Id: number; BaseImp: number; Importe: number }>
}

function getAfipInstance() {
  const cuitStr = getSetting('afip_cuit')
  const ptoVta = parseInt(getSetting('afip_pto_vta') || '1')
  const env = getSetting('afip_env')
  const certPath = getSetting('afip_cert_path')
  const keyPath = getSetting('afip_key_path')

  if (!cuitStr) {
    throw new Error('CUIT de AFIP no configurado')
  }

  // Si los paths no existen o están vacíos, afip.js podría fallar si no se pasan
  // pero para inicializar necesitamos el CUIT al menos.
  const options: any = {
    CUIT: parseInt(cuitStr),
    production: env === 'prod'
  }

  if (certPath && fs.existsSync(certPath)) {
    options.cert = certPath
  }
  if (keyPath && fs.existsSync(keyPath)) {
    options.key = keyPath
  }

  return new Afip(options)
}

export async function getServerStatus() {
  const afip = getAfipInstance()
  try {
    const status = await afip.ElectronicBilling.getServerStatus()
    return status
  } catch (error: any) {
    throw new Error(`Error al conectar con AFIP: ${error.message}`)
  }
}

export async function createVoucher(data: AfipVoucherData) {
  const afip = getAfipInstance()
  const lastVoucher = await afip.ElectronicBilling.getLastVoucher(data.puntoVenta, data.tipoComprobante)
  const nextVoucher = lastVoucher + 1

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const voucherData: any = {
    CantReg: 1,
    PtoVta: data.puntoVenta,
    CbteTipo: data.tipoComprobante,
    Concepto: 1, // 1=Productos, 2=Servicios, 3=Productos y Servicios
    DocTipo: data.docTipo,
    DocNro: data.docNro,
    CbteDesde: nextVoucher,
    CbteHasta: nextVoucher,
    CbteFch: date,
    ImpTotal: data.importeTotal,
    ImpTotConc: 0,
    ImpNeto: data.importeGravado,
    ImpOpEx: data.importeExento,
    ImpIVA: data.importeIVA,
    ImpTrib: 0,
    MonId: 'PES',
    MonCotiz: 1
  }

  if (data.alicuotas && data.alicuotas.length > 0) {
    voucherData.Iva = data.alicuotas.map((a) => ({
      Id: a.Id, // 5 para 21%, 4 para 10.5%, etc.
      BaseImp: a.BaseImp,
      Importe: a.Importe
    }))
  }

  try {
    const res = await afip.ElectronicBilling.createVoucher(voucherData)
    return {
      cae: res.CAE,
      caeVto: res.CAEFchVto,
      voucherNumber: nextVoucher,
      fullNumber: `${String(data.puntoVenta).padStart(4, '0')}-${String(nextVoucher).padStart(8, '0')}`
    }
  } catch (error: any) {
    console.error('AFIP Error:', error)
    throw new Error(`Error de AFIP: ${error.message}`)
  }
}

export async function getIvaTypes() {
  const afip = getAfipInstance()
  return await afip.ElectronicBilling.getIvaTypes()
}

export async function getDocumentTypes() {
  const afip = getAfipInstance()
  return await afip.ElectronicBilling.getDocumentTypes()
}
