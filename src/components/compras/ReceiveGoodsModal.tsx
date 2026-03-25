import { useEffect, useState } from 'react'
import {
  Modal, Stack, Group, Text, Table, Button, NumberInput, Textarea, Badge
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import type { PurchaseOrder, PurchaseOrderItem } from '../../types'
import { useAuthStore } from '../../stores/authStore'

interface ReceiveGoodsModalProps {
  opened: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder | null
  onReceived: () => void
}

interface ReceiveLine {
  purchaseOrderItemId: number
  productId: number
  productName: string
  quantityOrdered: number
  quantityReceived: number
  pending: number
  toReceive: number
}

export default function ReceiveGoodsModal({ opened, onClose, purchaseOrder, onReceived }: ReceiveGoodsModalProps): JSX.Element {
  const { user } = useAuthStore()
  const [lines, setLines] = useState<ReceiveLine[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (opened && purchaseOrder?.items) {
      setLines(
        purchaseOrder.items
          .filter((i) => i.quantityOrdered - i.quantityReceived > 0)
          .map((i) => ({
            purchaseOrderItemId: i.id,
            productId: i.productId,
            productName: i.productName,
            quantityOrdered: i.quantityOrdered,
            quantityReceived: i.quantityReceived,
            pending: i.quantityOrdered - i.quantityReceived,
            toReceive: i.quantityOrdered - i.quantityReceived
          }))
      )
      setNotes('')
    }
  }, [opened, purchaseOrder])

  const updateToReceive = (idx: number, val: number): void => {
    const updated = [...lines]
    updated[idx] = { ...updated[idx], toReceive: Math.min(val, updated[idx].pending) }
    setLines(updated)
  }

  const totalToReceive = lines.reduce((sum, l) => sum + l.toReceive, 0)

  const handleReceive = async (): Promise<void> => {
    if (!purchaseOrder) return
    const itemsToReceive = lines.filter((l) => l.toReceive > 0)
    if (itemsToReceive.length === 0) {
      notifications.show({ title: 'Error', message: 'No hay cantidades para recibir', color: 'red' })
      return
    }

    setLoading(true)
    try {
      const res = await window.api.goodsReceipts.receive({
        purchaseOrderId: purchaseOrder.id,
        userId: user?.id,
        notes: notes || undefined,
        items: itemsToReceive.map((l) => ({
          purchaseOrderItemId: l.purchaseOrderItemId,
          productId: l.productId,
          quantityReceived: l.toReceive
        }))
      })

      if ((res as any).ok) {
        notifications.show({
          title: 'Mercadería recibida',
          message: `Se registraron ${itemsToReceive.length} productos`,
          color: 'green'
        })
        onReceived()
        onClose()
      } else {
        notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  if (!purchaseOrder) {
    return <Modal opened={opened} onClose={onClose} title="Recibir mercadería"><Text>Cargando...</Text></Modal>
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Recibir mercadería — ${purchaseOrder.orderNumber}`} size="lg">
      <Stack>
        <Group>
          <Text size="sm" c="dimmed">Proveedor:</Text>
          <Text size="sm" fw={500}>{purchaseOrder.supplierName}</Text>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Producto</Table.Th>
              <Table.Th ta="right">Pedido</Table.Th>
              <Table.Th ta="right">Ya recibido</Table.Th>
              <Table.Th ta="right">Pendiente</Table.Th>
              <Table.Th w={140}>A recibir</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lines.map((line, idx) => (
              <Table.Tr key={line.purchaseOrderItemId}>
                <Table.Td>{line.productName}</Table.Td>
                <Table.Td ta="right">{line.quantityOrdered}</Table.Td>
                <Table.Td ta="right">{line.quantityReceived}</Table.Td>
                <Table.Td ta="right">
                  <Badge color="orange" variant="light">{line.pending}</Badge>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={0}
                    max={line.pending}
                    step={1}
                    decimalScale={2}
                    value={line.toReceive}
                    onChange={(val) => updateToReceive(idx, Number(val) || 0)}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {lines.length === 0 && (
          <Text c="dimmed" ta="center">Todos los productos ya fueron recibidos</Text>
        )}

        <Textarea
          label="Notas de recepción"
          placeholder="Observaciones (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button
            color="green"
            leftSection={<IconCheck size={16} />}
            onClick={handleReceive}
            loading={loading}
            disabled={totalToReceive === 0}
          >
            Confirmar recepción ({totalToReceive} items)
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
