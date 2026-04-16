import { useEffect, useState } from 'react'
import {
  Title, Stack, Table, Paper, Text, Badge, Group, Button, Tabs,
  Modal, Select, NumberInput, ActionIcon, Textarea, TextInput, Box
} from '@mantine/core'
import {
  IconTruckDelivery, IconPlus, IconTrash, IconHistory, IconPackage, IconCheck
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../stores/authStore'
import ReceiveGoodsModal from '../components/compras/ReceiveGoodsModal'
import type { GoodsReceipt, PurchaseOrder, Supplier, Product } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function RecepcionesPage(): JSX.Element {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<string | null>('pendientes')
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  
  // Free receive modal
  const [freeOpened, freeHandlers] = useDisclosure(false)
  const [freeSupplierId, setFreeSupplierId] = useState<string | null>(null)
  const [freeItems, setFreeItems] = useState<any[]>([])
  const [freeNotes, setFreeNotes] = useState('')
  const [freeLoading, setFreeLoading] = useState(false)

  // Catalog data for free receive
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // From PO modal
  const [poOpened, poHandlers] = useDisclosure(false)
  const [selectedPO, setSelectedPO] = useState<any>(null)

  const load = () => {
    window.api.purchaseOrders.list({ status: ['enviado', 'recibido_parcial'] }).then((r: any) => {
      if (r.ok) setPendingOrders(r.data)
    })
    window.api.goodsReceipts.list().then((r: any) => {
      if (r.ok) setReceipts(r.data)
    })
    window.api.suppliers.list({ isActive: true }).then((r: any) => {
      if (r.ok) setSuppliers(r.data)
    })
    window.api.products.list({ isActive: true }).then((r: any) => {
      if (r.ok) setProducts(r.data)
    })
  }

  useEffect(() => { load() }, [])

  const openFreeReceive = () => {
    setFreeSupplierId(null)
    setFreeItems([])
    setFreeNotes('')
    freeHandlers.open()
  }

  const handleAddFreeItem = (prodId: string) => {
    const p = products.find(x => String(x.id) === prodId)
    if (!p) return
    if (freeItems.find(x => x.productId === p.id)) return
    setFreeItems([...freeItems, {
      productId: p.id,
      productName: p.name,
      quantityReceived: 1
    }])
  }

  const updateFreeQty = (index: number, val: number) => {
    const next = [...freeItems]
    next[index].quantityReceived = val
    setFreeItems(next)
  }

  const removeFreeItem = (index: number) => {
    setFreeItems(freeItems.filter((_, i) => i !== index))
  }

  const handleFreeReceive = async () => {
    if (!freeSupplierId || freeItems.length === 0) return
    setFreeLoading(true)
    const res = await window.api.goodsReceipts.receiveDirect({
      supplierId: Number(freeSupplierId),
      userId: user?.id,
      notes: freeNotes || undefined,
      items: freeItems.map(i => ({
        productId: i.productId,
        quantityReceived: i.quantityReceived
      }))
    })
    if (res.ok) {
      notifications.show({ title: 'Éxito', message: 'Recepción registrada correctamente', color: 'green' })
      freeHandlers.close()
      load()
    } else {
      notifications.show({ title: 'Error', message: res.error, color: 'red' })
    }
    setFreeLoading(false)
  }

  const openReceiveFromPO = (po: any) => {
    setSelectedPO(po)
    poHandlers.open()
  }

  return (
    <Stack gap="xl">
      <Box style={{ 
        position: 'sticky', 
        top: -24, 
        zIndex: 100, 
        backgroundColor: 'var(--mantine-color-body)', 
        margin: '-24px -24px 0 -24px', 
        padding: '24px 24px 8px 24px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
      }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={2} fw={800}>Recepciones</Title>
              <Text size="sm" c="dimmed">Ingreso de mercadería y control de entregas de proveedores</Text>
            </div>
            <Button color="teal" leftSection={<IconPlus size={16} />} onClick={openFreeReceive}>
              Recepción Directa
            </Button>
          </Group>

          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" size="sm" radius="md">
            <Tabs.List>
              <Tabs.Tab value="pendientes" leftSection={<IconPackage size={16} />}>
                Pedidos Pendientes
                {pendingOrders.length > 0 && (
                  <Badge size="xs" ml={8} color="orange" variant="filled" circle>{pendingOrders.length}</Badge>
                )}
              </Tabs.Tab>
              <Tabs.Tab value="historial" leftSection={<IconHistory size={16} />}>Historial de Ingresos</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Stack>
      </Box>

      <Tabs value={activeTab} onChange={setActiveTab} variant="unstyled">
        <Tabs.Panel value="pendientes" pt="md">
          <Paper withBorder={false} bg="transparent" p={0}>
            <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={120}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nro. Orden</Table.Th>
                  <Table.Th>Proveedor</Table.Th>
                  <Table.Th>Fecha Pedido</Table.Th>
                  <Table.Th ta="center">Items</Table.Th>
                  <Table.Th ta="center">Estado</Table.Th>
                  <Table.Th ta="right">Importe</Table.Th>
                  <Table.Th ta="right">Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pendingOrders.map((po) => (
                  <Table.Tr key={po.id}>
                    <Table.Td><Text size="sm" fw={700}>{po.orderNumber}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={500}>{po.supplierName}</Text></Table.Td>
                    <Table.Td><Text size="sm">{po.orderDate}</Text></Table.Td>
                    <Table.Td ta="center"><Badge variant="light" color="gray">{po.itemCount}</Badge></Table.Td>
                    <Table.Td ta="center">
                      <Badge color={po.status === 'enviado' ? 'blue' : 'orange'} variant="filled" size="sm" style={{ width: 100 }}>
                        {po.status === 'enviado' ? 'ENVIADO' : 'PARCIAL'}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right"><Text size="sm" fw={700}>{fmt(po.subtotal)}</Text></Table.Td>
                    <Table.Td ta="right">
                      <Button 
                        size="compact-xs" 
                        color="green" 
                        radius="xl"
                        leftSection={<IconTruckDelivery size={14} />} 
                        onClick={() => openReceiveFromPO(po)}
                      >
                        Recibir Mercadería
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {pendingOrders.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text c="dimmed" ta="center" py="xl">No hay pedidos pendientes de recepción</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="historial" pt="md">
          <Paper withBorder={false} bg="transparent" p={0}>
            <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={120}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nro. Recepción</Table.Th>
                  <Table.Th>Orden Origen</Table.Th>
                  <Table.Th>Proveedor</Table.Th>
                  <Table.Th>Responsable</Table.Th>
                  <Table.Th>Fecha y Hora</Table.Th>
                  <Table.Th>Notas de Entrega</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {receipts.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Text size="sm" fw={700} c="green.7">{r.receiptNumber}</Text></Table.Td>
                    <Table.Td><Badge variant="outline" color="gray">{r.orderNumber || 'DIRECTA'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" fw={500}>{r.supplierName || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{r.userName || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{r.createdAt}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="dimmed" lineClamp={1}>{r.notes || '—'}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {receipts.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text c="dimmed" ta="center" py="xl">No se registran ingresos en el historial</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <ReceiveGoodsModal 
        opened={poOpened}
        onClose={poHandlers.close}
        purchaseOrder={selectedPO}
        onSaved={load}
      />

      {/* Free Receive Modal */}
      <Modal opened={activeTab === 'pendientes' && freeOpened} onClose={freeHandlers.close} title="Recepción Directa (sin OC)" size="lg">
        <Stack gap="md">
          <Select
            label="Proveedor"
            placeholder="Seleccione proveedor"
            data={suppliers.map(s => ({ value: String(s.id), label: s.name }))}
            value={freeSupplierId}
            onChange={setFreeSupplierId}
            searchable
          />
          <Select
            label="Agregar producto"
            placeholder="Buscar por nombre o código"
            data={products.map(p => ({ 
              value: String(p.id), 
              label: `${p.barcode || p.sku || '—'} | ${p.name}` 
            }))}
            onChange={(v) => v && handleAddFreeItem(v)}
            searchable
            clearable
          />

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th w={120}>Cantidad</Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {freeItems.map((item, i) => (
                <Table.Tr key={item.productId}>
                  <Table.Td>{item.productName}</Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={item.quantityReceived}
                      onChange={(v) => updateFreeQty(i, Number(v) || 0)}
                      min={0.01}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="red" onClick={() => removeFreeItem(i)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Textarea
            label="Notas"
            value={freeNotes}
            onChange={(e) => setFreeNotes(e.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={freeHandlers.close}>Cancelar</Button>
            <Button color="green" leftSection={<IconCheck size={16} />} onClick={handleFreeReceive} loading={freeLoading}>
              Registrar recepción
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
