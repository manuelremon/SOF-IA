import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper, Badge, Select,
  Modal, Text, Loader, Tooltip, Box, rem
} from '@mantine/core'
import { IconPlus, IconSearch, IconEye, IconEdit, IconRobot } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import POFormModal from '../components/compras/POFormModal'
import PODetailModal from '../components/compras/PODetailModal'
import { useAuthStore } from '../stores/authStore'
import type { PurchaseOrder } from '../types'

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  recibido_parcial: 'Recibido Parcial',
  recibido: 'Recibido Total',
  cancelado: 'Cancelado'
}

const STATUS_COLOR: Record<string, string> = {
  borrador: 'gray',
  enviado: 'blue',
  recibido_parcial: 'orange',
  recibido: 'green',
  cancelado: 'red'
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function ComprasPage(): JSX.Element {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  
  const [formOpened, formHandlers] = useDisclosure(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  
  const [detailOpened, detailHandlers] = useDisclosure(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const [autopilotOpened, autopilotHandlers] = useDisclosure(false)
  const [autopilotLoading, setAutopilotLoading] = useState(false)
  const [autopilotResults, setAutopilotLoadingResults] = useState<any[]>([])

  const load = () => {
    window.api.purchaseOrders.list({ search: search || undefined, status: statusFilter || undefined }).then((r: any) => {
      if (r.ok) setOrders(r.data)
    })
  }

  useEffect(() => { load() }, [search, statusFilter])

  const openNew = () => {
    setSelectedOrder(null)
    formHandlers.open()
  }

  const openEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    formHandlers.open()
  }

  const openDetail = (id: number) => {
    setDetailId(id)
    detailHandlers.open()
  }

  const openAutopilot = async () => {
    setAutopilotLoading(true)
    autopilotHandlers.open()
    const res = await window.api.autopilot.getSuggestions()
    if (res.ok) {
      setAutopilotLoadingResults(res.data)
    }
    setAutopilotLoading(false)
  }

  const confirmAutopilot = async () => {
    setAutopilotLoading(true)
    const res = await window.api.autopilot.createDrafts({ userId: user?.id })
    if (res.ok) {
      notifications.show({ title: 'Órdenes Generadas', message: `Se crearon ${res.data.count} órdenes en borrador`, color: 'green' })
      autopilotHandlers.close()
      load()
    }
    setAutopilotLoading(false)
  }

  return (
    <Stack gap="xl">
      <Box style={{ 
        position: 'sticky', 
        top: -24, 
        zIndex: 100, 
        backgroundColor: 'var(--mantine-color-body)', 
        margin: '-24px -24px 0 -24px', 
        padding: '24px 24px 16px 24px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
      }}>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={2} fw={800}>Gestión de Compras</Title>
              <Text size="sm" c="dimmed">Abastecimiento de stock y órdenes de compra a proveedores</Text>
            </div>
            <Group gap="sm">
              <Button
                variant="light"
                color="violet"
                leftSection={<IconRobot size={16} />}
                onClick={openAutopilot}
              >
                Piloto Automático
              </Button>
              <Button leftSection={<IconPlus size={16} />} color="sap" onClick={openNew}>
                Nueva Orden
              </Button>
            </Group>
          </Group>

          <Paper p="md" shadow="sm">
            <Group gap="md">
              <TextInput
                placeholder="Buscar por número de orden..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                style={{ flex: 1 }}
                size="md"
              />
              <Select
                placeholder="Filtrar por Estado"
                clearable
                data={[
                  { value: 'borrador', label: 'Borrador' },
                  { value: 'enviado', label: 'Enviado' },
                  { value: 'recibido_parcial', label: 'Recibido Parcial' },
                  { value: 'recibido', label: 'Recibido Total' },
                  { value: 'cancelado', label: 'Cancelado' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                w={220}
                size="md"
              />
            </Group>
          </Paper>
        </Stack>
      </Box>

      <Paper withBorder={false} bg="transparent" p={0}>
        <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={160}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nro. Orden</Table.Th>
              <Table.Th>Proveedor</Table.Th>
              <Table.Th>Fecha Emisión</Table.Th>
              <Table.Th ta="right">Importe Total</Table.Th>
              <Table.Th ta="center">Estado</Table.Th>
              <Table.Th ta="right">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((o) => (
              <Table.Tr key={o.id}>
                <Table.Td><Text size="sm" fw={700}>{o.orderNumber}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={500}>{o.supplierName || '—'}</Text></Table.Td>
                <Table.Td><Text size="sm">{o.orderDate}</Text></Table.Td>
                <Table.Td ta="right"><Text size="sm" fw={700}>{fmt(o.subtotal)}</Text></Table.Td>
                <Table.Td ta="center">
                  <Badge color={STATUS_COLOR[o.status]} variant="filled" size="sm" style={{ width: 110 }}>
                    {STATUS_LABEL[o.status] || o.status}
                  </Badge>
                </Table.Td>
                <Table.Td ta="right">
                  <Group gap={4} justify="flex-end">
                    <Tooltip label="Ver Detalle">
                      <ActionIcon variant="light" color="blue" onClick={() => openDetail(o.id)}>
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    {o.status === 'borrador' && (
                      <Tooltip label="Editar Borrador">
                        <ActionIcon variant="light" color="gray" onClick={() => openEdit(o)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {orders.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="xl">No se encontraron órdenes de compra</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <POFormModal opened={formOpened} onClose={formHandlers.close} order={selectedOrder} onSaved={load} />
      <PODetailModal opened={detailOpened} onClose={detailHandlers.close} orderId={detailId} />

      <Modal opened={autopilotOpened} onClose={autopilotHandlers.close} title="SOF-IA Autopilot" size="lg">
        {autopilotLoading ? (
          <Group justify="center" py="xl"><Loader size="lg" /></Group>
        ) : (
          <Stack gap="md">
            <Alert icon={<IconRobot size={16} />} color="violet">
              Basado en tus ventas, SOF-IA sugiere reponer los siguientes artículos.
            </Alert>
            {autopilotResults.map((res, i) => (
              <Paper withBorder p="xs" key={i}>
                <Group justify="space-between">
                  <Text size="sm" fw={600}>{res.supplierName}</Text>
                  <Badge variant="light" color="gray">{res.items.length} artículos</Badge>
                </Group>
              </Paper>
            ))}
            <Button color="violet" onClick={confirmAutopilot} loading={autopilotLoading}>
              Generar pedidos en borrador
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
