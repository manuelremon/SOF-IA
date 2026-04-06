import { useEffect, useState } from 'react'
import {
  Modal, Stack, Group, Text, Badge, Table, Button, Divider, Paper,
  Textarea, Checkbox, CopyButton, ActionIcon, Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconTruckDelivery, IconSend, IconX, IconMail, IconBrandWhatsapp,
  IconPrinter, IconCopy, IconCheck
} from '@tabler/icons-react'
import type { PurchaseOrder } from '../../types'

function numberToWords(n: number): string {
  if (n === 0) return 'cero'
  if (!Number.isInteger(n) || n < 0) return String(n)

  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  const convert = (num: number): string => {
    if (num === 0) return ''
    if (num === 100) return 'cien'
    if (num < 10) return units[num]
    if (num < 20) return teens[num - 10]
    if (num < 30) {
      if (num === 20) return 'veinte'
      return 'veinti' + units[num - 20]
    }
    if (num < 100) {
      const t = Math.floor(num / 10)
      const u = num % 10
      return u === 0 ? tens[t] : `${tens[t]} y ${units[u]}`
    }
    if (num < 1000) {
      const h = Math.floor(num / 100)
      const rest = num % 100
      return rest === 0 ? hundreds[h] : `${hundreds[h]} ${convert(rest)}`
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000)
      const rest = num % 1000
      const prefix = thousands === 1 ? 'mil' : `${convert(thousands)} mil`
      return rest === 0 ? prefix : `${prefix} ${convert(rest)}`
    }
    return String(num)
  }

  return convert(Math.floor(n)).trim().replace(/\s+/g, ' ')
}

interface PODetailModalProps {
  opened: boolean
  onClose: () => void
  purchaseOrderId: number | null
  onChanged: () => void
  onReceive: (po: PurchaseOrder) => void
}

const STATUS_COLOR: Record<string, string> = {
  borrador: 'gray',
  enviado: 'blue',
  recibido_parcial: 'orange',
  recibido: 'green',
  cancelado: 'red'
}

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  recibido_parcial: 'Recibido parcial',
  recibido: 'Recibido',
  cancelado: 'Cancelado'
}

export default function PODetailModal({ opened, onClose, purchaseOrderId, onChanged, onReceive }: PODetailModalProps): JSX.Element {
  const [po, setPo] = useState<any>(null)
  const [sendOpened, setSendOpened] = useState(false)
  const [sendMessage, setSendMessage] = useState('')
  const [sendMail, setSendMail] = useState(false)
  const [sendWhatsapp, setSendWhatsapp] = useState(false)
  const [sendPrint, setSendPrint] = useState(false)
  const [businessName, setBusinessName] = useState('Mi Negocio')

  const load = (): void => {
    if (!purchaseOrderId) return
    window.api.purchaseOrders.getById(purchaseOrderId).then((r: any) => {
      if (r.ok) setPo(r.data)
    })
  }

  useEffect(() => {
    if (opened && purchaseOrderId) {
      load()
      window.api.settings.get('business_name').then((r: any) => {
        if (r.ok && r.data) setBusinessName(r.data)
      })
    }
    if (!opened) { setPo(null); setSendOpened(false) }
  }, [opened, purchaseOrderId])

  const buildDefaultMessage = (): string => {
    if (!po) return ''
    const items = (po.items || [])
      .map((i: any) => `  - ${i.productName} x ${i.quantityOrdered} (${numberToWords(i.quantityOrdered)})`)
      .join('\n')

    return `Estimado/a, ${po.supplierName}

Tenga Ud. a bien recibir mi pedido por los siguientes artículos:

${items}

Espero su confirmación.
Desde ya muchas gracias,

${businessName}`
  }

  const openSendModal = (): void => {
    setSendMessage(buildDefaultMessage())
    setSendMail(false)
    setSendWhatsapp(false)
    setSendPrint(false)
    setSendOpened(true)
  }

  const handleSendActions = async (): Promise<void> => {
    if (!po) return

    // Mark as sent
    const res = await window.api.purchaseOrders.updateStatus({ id: po.id, status: 'enviado' })
    if (!(res as any).ok) {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
      return
    }

    const encodedMsg = encodeURIComponent(sendMessage)

    if (sendMail) {
      // Get supplier email
      const supRes = await window.api.suppliers.getById(po.supplierId)
      const email = (supRes as any)?.ok ? (supRes.data as any)?.email || '' : ''
      const subject = encodeURIComponent(`Orden de compra ${po.orderNumber} — ${businessName}`)
      window.open(`mailto:${email}?subject=${subject}&body=${encodedMsg}`)
    }

    if (sendWhatsapp) {
      // Get supplier phone
      const supRes = await window.api.suppliers.getById(po.supplierId)
      const phone = (supRes as any)?.ok ? (supRes.data as any)?.phone?.replace(/[^0-9]/g, '') || '' : ''
      window.open(`https://wa.me/${phone}?text=${encodedMsg}`)
    }

    if (sendPrint) {
      const printWindow = window.open('', '_blank', 'width=600,height=800')
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Orden ${po.orderNumber}</title>
          <style>body { font-family: Arial, sans-serif; padding: 20px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
          @page { margin: 20mm; }</style></head>
          <body>${sendMessage.replace(/\n/g, '<br>')}</body></html>`)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 300)
      }
    }

    notifications.show({ title: 'Orden enviada', message: po.orderNumber, color: 'blue' })
    setSendOpened(false)
    load()
    onChanged()
  }

  const handleCancel = async (): Promise<void> => {
    if (!po) return
    const res = await window.api.purchaseOrders.cancel(po.id)
    if ((res as any).ok) {
      notifications.show({ title: 'Orden cancelada', message: po.orderNumber, color: 'orange' })
      load()
      onChanged()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
    }
  }

  if (!po) {
    return <Modal opened={opened} onClose={onClose} title="Detalle de orden"><Text>Cargando...</Text></Modal>
  }

  const canSend = po.status === 'borrador'
  const canReceive = po.status === 'enviado' || po.status === 'recibido_parcial'
  const canCancel = po.status === 'borrador' || po.status === 'enviado'

  return (
    <>
      <Modal opened={opened} onClose={onClose} title={`Orden ${po.orderNumber}`} size="lg">
        <Stack>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">Proveedor</Text>
              <Text fw={600}>{po.supplierName}</Text>
            </div>
            <Badge color={STATUS_COLOR[po.status]} size="lg">{STATUS_LABEL[po.status]}</Badge>
          </Group>

          <Group>
            <div>
              <Text size="sm" c="dimmed">Fecha de orden</Text>
              <Text size="sm">{po.orderDate}</Text>
            </div>
            {po.expectedDate && (
              <div>
                <Text size="sm" c="dimmed">Fecha esperada</Text>
                <Text size="sm">{po.expectedDate}</Text>
              </div>
            )}
            <div>
              <Text size="sm" c="dimmed">Creado por</Text>
              <Text size="sm">{po.userName || '—'}</Text>
            </div>
          </Group>

          {po.notes && (
            <div>
              <Text size="sm" c="dimmed">Notas</Text>
              <Text size="sm">{po.notes}</Text>
            </div>
          )}

          <Divider label="Productos" />

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th ta="right">Pedido</Table.Th>
                <Table.Th ta="right">Recibido</Table.Th>
                <Table.Th ta="right">Pendiente</Table.Th>
                <Table.Th ta="right">Costo unit.</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {po.items?.map((item: any) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.productName}</Table.Td>
                  <Table.Td ta="right">{item.quantityOrdered}</Table.Td>
                  <Table.Td ta="right">{item.quantityReceived}</Table.Td>
                  <Table.Td ta="right">{item.quantityOrdered - item.quantityReceived}</Table.Td>
                  <Table.Td ta="right">${item.unitCost.toFixed(2)}</Table.Td>
                  <Table.Td ta="right">${item.lineTotal.toFixed(2)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="flex-end">
            <Text fw={700}>Total: ${po.subtotal?.toFixed(2)}</Text>
          </Group>

          {po.receipts && po.receipts.length > 0 && (
            <>
              <Divider label="Historial de recepciones" />
              <Paper withBorder p="sm">
                {po.receipts.map((rec: any) => (
                  <Group key={rec.id} justify="space-between" mb="xs">
                    <div>
                      <Text size="sm" fw={500}>{rec.receiptNumber}</Text>
                      <Text size="xs" c="dimmed">{rec.createdAt} — {rec.userName || 'Usuario'}</Text>
                    </div>
                    {rec.notes && <Text size="xs" c="dimmed">{rec.notes}</Text>}
                  </Group>
                ))}
              </Paper>
            </>
          )}

          <Divider />

          <Group justify="flex-end">
            {canCancel && (
              <Button variant="light" color="red" leftSection={<IconX size={16} />} onClick={handleCancel}>
                Cancelar orden
              </Button>
            )}
            {canSend && (
              <Button color="blue" leftSection={<IconSend size={16} />} onClick={openSendModal}>
                Enviar
              </Button>
            )}
            {canReceive && (
              <Button color="green" leftSection={<IconTruckDelivery size={16} />} onClick={() => onReceive(po)}>
                Recibir mercadería
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>

      {/* Send modal */}
      <Modal opened={sendOpened} onClose={() => setSendOpened(false)} title="Enviar orden de compra" size="lg">
        <Stack>
          <Text size="sm" fw={600}>Seleccioná cómo enviar:</Text>
          <Group>
            <Checkbox
              label="Email"
              checked={sendMail}
              onChange={(e) => setSendMail(e.currentTarget.checked)}
              icon={({ className }) => <IconMail className={className} size={14} />}
            />
            <Checkbox
              label="WhatsApp"
              checked={sendWhatsapp}
              onChange={(e) => setSendWhatsapp(e.currentTarget.checked)}
              icon={({ className }) => <IconBrandWhatsapp className={className} size={14} />}
            />
            <Checkbox
              label="Imprimir"
              checked={sendPrint}
              onChange={(e) => setSendPrint(e.currentTarget.checked)}
              icon={({ className }) => <IconPrinter className={className} size={14} />}
            />
          </Group>

          <Group justify="space-between" align="center">
            <Text size="sm" fw={600}>Mensaje:</Text>
            <CopyButton value={sendMessage}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copiado' : 'Copiar mensaje'}>
                  <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Textarea
            value={sendMessage}
            onChange={(e) => setSendMessage(e.currentTarget.value)}
            minRows={12}
            autosize
            styles={{ input: { fontFamily: 'inherit', lineHeight: 1.6 } }}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSendOpened(false)}>Cancelar</Button>
            <Button
              color="blue"
              leftSection={<IconSend size={16} />}
              onClick={handleSendActions}
              disabled={!sendMail && !sendWhatsapp && !sendPrint}
            >
              Enviar y marcar como enviada
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
