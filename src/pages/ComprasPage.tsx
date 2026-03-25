import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper, Badge, Select
} from '@mantine/core'
import { IconPlus, IconSearch, IconEye, IconEdit } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import POFormModal from '../components/compras/POFormModal'
import PODetailModal from '../components/compras/PODetailModal'
import ReceiveGoodsModal from '../components/compras/ReceiveGoodsModal'
import type { PurchaseOrder } from '../types'

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
  recibido_parcial: 'Parcial',
  recibido: 'Recibido',
  cancelado: 'Cancelado'
}

export default function ComprasPage(): JSX.Element {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null)

  const [formOpened, formHandlers] = useDisclosure(false)
  const [detailOpened, detailHandlers] = useDisclosure(false)
  const [receiveOpened, receiveHandlers] = useDisclosure(false)

  const load = (): void => {
    window.api.purchaseOrders
      .list({
        search: search || undefined,
        status: statusFilter || undefined
      })
      .then((r: any) => {
        if (r.ok) setOrders(r.data)
      })
  }

  useEffect(() => { load() }, [search, statusFilter])

  const openNew = (): void => {
    setSelectedPO(null)
    formHandlers.open()
  }

  const openEdit = (po: PurchaseOrder): void => {
    // Load full PO with items for editing
    window.api.purchaseOrders.getById(po.id).then((r: any) => {
      if (r.ok) {
        setSelectedPO(r.data)
        formHandlers.open()
      }
    })
  }

  const openDetail = (id: number): void => {
    setDetailId(id)
    detailHandlers.open()
  }

  const openReceive = (po: PurchaseOrder): void => {
    // Load full PO with items for receiving
    window.api.purchaseOrders.getById(po.id).then((r: any) => {
      if (r.ok) {
        setReceivePO(r.data)
        detailHandlers.close()
        receiveHandlers.open()
      }
    })
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Órdenes de Compra</Title>
        <Button leftSection={<IconPlus size={16} />} color="sap" onClick={openNew}>
          Nueva orden
        </Button>
      </Group>

      <Group>
        <TextInput
          placeholder="Buscar por número..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Estado"
          clearable
          data={[
            { value: 'borrador', label: 'Borrador' },
            { value: 'enviado', label: 'Enviado' },
            { value: 'recibido_parcial', label: 'Recibido parcial' },
            { value: 'recibido', label: 'Recibido' },
            { value: 'cancelado', label: 'Cancelado' }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          w={180}
        />
      </Group>

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Número</Table.Th>
              <Table.Th>Proveedor</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th ta="right">Total</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th w={100} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((o) => (
              <Table.Tr key={o.id}>
                <Table.Td>{o.orderNumber}</Table.Td>
                <Table.Td>{o.supplierName || '—'}</Table.Td>
                <Table.Td>{o.orderDate}</Table.Td>
                <Table.Td ta="right">${o.subtotal.toFixed(2)}</Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLOR[o.status]} variant="light">
                    {STATUS_LABEL[o.status] || o.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" onClick={() => openDetail(o.id)} title="Ver detalle">
                      <IconEye size={16} />
                    </ActionIcon>
                    {o.status === 'borrador' && (
                      <ActionIcon variant="subtle" onClick={() => openEdit(o)} title="Editar">
                        <IconEdit size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {orders.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center" c="dimmed" py="xl">
                  No hay órdenes de compra
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <POFormModal opened={formOpened} onClose={formHandlers.close} purchaseOrder={selectedPO} onSaved={load} />
      <PODetailModal
        opened={detailOpened}
        onClose={detailHandlers.close}
        purchaseOrderId={detailId}
        onChanged={load}
        onReceive={openReceive}
      />
      <ReceiveGoodsModal
        opened={receiveOpened}
        onClose={receiveHandlers.close}
        purchaseOrder={receivePO}
        onReceived={load}
      />
    </Stack>
  )
}
