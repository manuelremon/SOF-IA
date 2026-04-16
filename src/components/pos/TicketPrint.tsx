import { QRCodeSVG } from 'qrcode.react'

interface TicketPrintProps {
  sale: any
  businessName: string
  businessAddress: string
  businessPhone: string
  businessTaxId: string
  receiptFooter: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  cuenta_corriente: 'Cuenta Corriente'
}

export default function TicketPrint({
  sale, businessName, businessAddress, businessPhone, businessTaxId, receiptFooter
}: TicketPrintProps): JSX.Element {
  const items = sale.items ?? []

  // AFIP QR Data
  let afipQrUrl = ''
  if (sale.afipCae) {
    const qrData = {
      ver: 1,
      fecha: sale.createdAt?.slice(0, 10),
      cuit: parseInt(businessTaxId.replace(/\D/g, '')),
      ptoVta: parseInt(sale.afipInvoiceNumber?.split('-')[0] || '1'),
      tipoCbte: sale.afipInvoiceType,
      nroCbte: parseInt(sale.afipInvoiceNumber?.split('-')[1] || '0'),
      importe: sale.total,
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: sale.afipDocType || 99,
      nroDocRec: parseInt(sale.afipDocNumber?.replace(/\D/g, '') || '0'),
      tipoCodAut: 'E',
      codAut: parseInt(sale.afipCae)
    }
    const base64 = btoa(JSON.stringify(qrData))
    afipQrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64}`
  }

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px',
      width: '80mm',
      padding: '4mm',
      color: '#000',
      lineHeight: 1.4
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{businessName}</div>
        {businessAddress && <div>{businessAddress}</div>}
        {businessPhone && <div>Tel: {businessPhone}</div>}
        {businessTaxId && <div>CUIT: {businessTaxId}</div>}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Receipt info */}
      <div style={{ marginBottom: '8px' }}>
        {sale.afipInvoiceNumber ? (
          <div><strong>Factura {sale.afipInvoiceType === 1 ? 'A' : (sale.afipInvoiceType === 6 ? 'B' : 'C')}:</strong> {sale.afipInvoiceNumber}</div>
        ) : (
          <div><strong>Recibo:</strong> {sale.receiptNumber}</div>
        )}
        <div><strong>Fecha:</strong> {sale.createdAt?.slice(0, 16).replace('T', ' ')}</div>
        {sale.userName && <div><strong>Vendedor:</strong> {sale.userName}</div>}
        {sale.customerName && <div><strong>Cliente:</strong> {sale.customerName}</div>}
        {sale.afipDocNumber && <div><strong>{sale.afipDocType === 80 ? 'CUIT' : 'DNI'}:</strong> {sale.afipDocNumber}</div>}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Producto</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Cant</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>P.Unit</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item.id}>
              <td style={{ paddingBottom: '2px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.productName}
              </td>
              <td style={{ textAlign: 'right', paddingBottom: '2px' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', paddingBottom: '2px' }}>{fmt(item.unitPrice)}</td>
              <td style={{ textAlign: 'right', paddingBottom: '2px' }}>{fmt(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Totals */}
      <div style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{fmt(sale.subtotal)}</span>
        </div>
        {sale.discountTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Descuento:</span>
            <span>-{fmt(sale.discountTotal)}</span>
          </div>
        )}
        {sale.taxTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>IVA:</span>
            <span>{fmt(sale.taxTotal)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '14px', fontWeight: 'bold',
          borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px'
        }}>
          <span>TOTAL:</span>
          <span>{fmt(sale.total)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Payment */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pago:</span>
          <span>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
        </div>
        {sale.paymentMethod === 'efectivo' && sale.change > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Vuelto:</span>
            <span>{fmt(sale.change)}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {sale.afipCae && (
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px' }}>
          <div style={{ marginBottom: '4px' }}><strong>CAE:</strong> {sale.afipCae}</div>
          <div style={{ marginBottom: '8px' }}><strong>Vto CAE:</strong> {sale.afipCaeExpiration}</div>
          <div style={{ 
            marginTop: '4px', 
            padding: '4px',
            display: 'inline-block',
            backgroundColor: '#fff'
          }}>
            <QRCodeSVG value={afipQrUrl} size={100} />
            <div style={{ fontSize: '7px', marginTop: '4px' }}>Comprobante Autorizado por AFIP</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0 4px' }} />
      <div style={{ textAlign: 'center', fontSize: '11px' }}>
        {receiptFooter || 'Gracias por su compra'}
      </div>
    </div>
  )
}
