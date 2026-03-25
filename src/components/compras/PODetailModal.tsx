import { useEffect, useState } from 'react'
import {
  Modal, Stack, Group, Text, Badge, Table, Button, Divider, Paper
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconTruckDelivery, IconSend, IconX } from '@tabler/icons-react'
import type { PurchaseOrder } from '../../types'

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

  const load = (): void => {
    if (!purchaseOrderId) return
    window.api.purchaseOrders.getById(purchaseOrderId).then((r: any) => {
      if (r.ok) setPo(r.data)
    })
  }

  useEffect(() => {
    if (opened && purchaseOrderId) load()
    if (!opened) setPo(null)
  }, [opened, purchaseOrderId])

  const handleSend = async (): Promise<void> => {
    if (!po) return
    const res = await window.api.purchaseOrders.updateStatus({ id: po.id, status: 'enviado' })
    if ((res as any).ok) {
      notifications.show({ title: 'Orden enviada', message: po.orderNumber, color: 'blue' })
      load()
      onChanged()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
    }
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
            <Button variant="light" color="blue" leftSection={<IconSend size={16} />} onClick={handleSend}>
              Marcar como enviada
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
  )
}
