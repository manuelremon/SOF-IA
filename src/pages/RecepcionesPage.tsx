import { useEffect, useState } from 'react'
import {
  Title, Stack, Table, Paper, Text, Badge, Group, Button, Tabs,
  Modal, Select, NumberInput, ActionIcon, Textarea, TextInput
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
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string | null>('pendientes')

  // Receive from PO
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null)
  const [receiveOpened, receiveHandlers] = useDisclosure(false)

  // Receive without PO
  const [freeOpened, freeHandlers] = useDisclosure(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [freeSupplierId, setFreeSupplierId] = useState<string | null>(null)
  const [freeNotes, setFreeNotes] = useState('')
  const [freeRemito, setFreeRemito] = useState('')
  const [freeInvoice, setFreeInvoice] = useState('')
  const [freePayMethod, setFreePayMethod] = useState<string | null>(null)
  const [freeLines, setFreeLines] = useState<Array<{ productId: string | null; productName: string; qty: number; unitCost: number; expirationDate: string }>>([])
  const [freeLoading, setFreeLoading] = useState(false)

  const load = (): void => {
    window.api.goodsReceipts.list({}).then((r: any) => { if (r.ok) setReceipts(r.data) })
    window.api.goodsReceipts.pendingOrders().then((r: any) => { if (r.ok) setPendingOrders(r.data) })
  }

  useEffect(() => { load() }, [])

  const openReceiveFromPO = (po: any): void => {
    window.api.purchaseOrders.getById(po.id).then((r: any) => {
      if (r.ok) {
        setReceivePO(r.data)
        receiveHandlers.open()
      }
    })
  }

  const openFreeReceive = (): void => {
    window.api.suppliers.list({ isActive: true }).then((r: any) => { if (r.ok) setSuppliers(r.data) })
    window.api.products.list({ isActive: true }).then((r: any) => { if (r.ok) setProducts(r.data) })
    setFreeSupplierId(null)
    setFreeNotes('')
    setFreeRemito('')
    setFreeInvoice('')
    setFreePayMethod(null)
    setFreeLines([{ productId: null, productName: '', qty: 1, unitCost: 0, expirationDate: '' }])
    freeHandlers.open()
  }

  const addFreeLine = (): void => {
    setFreeLines([...freeLines, { productId: null, productName: '', qty: 1, unitCost: 0, expirationDate: '' }])
  }

  const removeFreeLine = (idx: number): void => {
    if (freeLines.length <= 1) return
    setFreeLines(freeLines.filter((_, i) => i !== idx))
  }

  const updateFreeLine = (idx: number, field: string, value: any): void => {
    const updated = [...freeLines]
    if (field === 'productId' && value) {
      const p = products.find((pr) => pr.id === Number(value))
      if (p) updated[idx] = { ...updated[idx], productId: value, productName: p.name, unitCost: p.costPrice }
    } else {
      (updated[idx] as any)[field] = value
    }
    setFreeLines(updated)
  }

  const handleFreeReceive = async (): Promise<void> => {
    if (!freeSupplierId) {
      notifications.show({ title: 'Error', message: 'Seleccioná un proveedor', color: 'red' })
      return
    }
    const validLines = freeLines.filter((l) => l.productId && l.qty > 0)
    if (validLines.length === 0) {
      notifications.show({ title: 'Error', message: 'Agregá al menos un artículo', color: 'red' })
      return
    }

    setFreeLoading(true)
    const res = await window.api.goodsReceipts.receiveWithoutPO({
      supplierId: parseInt(freeSupplierId),
      userId: user?.id,
      notes: freeNotes || undefined,
      supplierRemito: freeRemito || undefined,
      supplierInvoice: freeInvoice || undefined,
      totalAmount: validLines.reduce((s, l) => s + l.qty * l.unitCost, 0) || undefined,
      paymentMethod: freePayMethod || undefined,
      items: validLines.map((l) => ({
        productId: parseInt(l.productId!),
        productName: l.productName,
        quantityReceived: l.qty,
        unitCost: l.unitCost,
        expirationDate: l.expirationDate || undefined
      }))
    })

    if ((res as any).ok) {
      notifications.show({ title: 'Recepción registrada', message: `${validLines.length} artículo(s) recibidos. OC creada automáticamente.`, color: 'green' })
      freeHandlers.close()
      load()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
    }
    setFreeLoading(false)
  }

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: `${p.barcode || p.sku || ''} — ${p.name}`
  }))

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Recepciones de Mercadería</Title>
        <Button color="teal" leftSection={<IconPlus size={16} />} onClick={openFreeReceive}>
          Recepción sin OC
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="pendientes" leftSection={<IconPackage size={16} />}>
            Pedidos pendientes
            {pendingOrders.length > 0 && (
              <Badge size="xs" ml={6} color="orange" variant="filled" circle>{pendingOrders.length}</Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="historial" leftSection={<IconHistory size={16} />}>Historial</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pendientes" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Orden</Table.Th>
                  <Table.Th>Proveedor</Table.Th>
                  <Table.Th>Fecha pedido</Table.Th>
                  <Table.Th>Fecha esperada</Table.Th>
                  <Table.Th ta="center">Artículos</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th ta="right">Total</Table.Th>
                  <Table.Th w={100} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pendingOrders.map((po) => (
                  <Table.Tr key={po.id}>
                    <Table.Td><Badge variant="light">{po.orderNumber}</Badge></Table.Td>
                    <Table.Td fw={500}>{po.supplierName}</Table.Td>
                    <Table.Td>{po.orderDate}</Table.Td>
                    <Table.Td>{po.expectedDate || '—'}</Table.Td>
                    <Table.Td ta="center">{po.itemCount}</Table.Td>
                    <Table.Td>
                      <Badge color={po.status === 'enviado' ? 'blue' : 'orange'} variant="light" size="sm">
                        {po.status === 'enviado' ? 'Enviado' : 'Parcial'}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right">{fmt(po.subtotal)}</Table.Td>
                    <Table.Td>
                      <Button size="xs" color="green" leftSection={<IconTruckDelivery size={14} />} onClick={() => openReceiveFromPO(po)}>
                        Recibir
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {pendingOrders.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8} ta="center" c="dimmed" py="xl">
                      No hay pedidos pendientes de recepción
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="historial" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Número</Table.Th>
                  <Table.Th>Orden de compra</Table.Th>
                  <Table.Th>Proveedor</Table.Th>
                  <Table.Th>Recibido por</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Notas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {receipts.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Badge variant="light" color="green">{r.receiptNumber}</Badge></Table.Td>
                    <Table.Td>{r.orderNumber || '—'}</Table.Td>
                    <Table.Td>{r.supplierName || '—'}</Table.Td>
                    <Table.Td>{r.userName || '—'}</Table.Td>
                    <Table.Td>{r.createdAt}</Table.Td>
                    <Table.Td><Text size="sm" lineClamp={1}>{r.notes || '—'}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {receipts.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center" c="dimmed" py="xl">
                      No hay recepciones registradas
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Receive from existing PO */}
      <ReceiveGoodsModal
        opened={receiveOpened}
        onClose={receiveHandlers.close}
        purchaseOrder={receivePO}
        onReceived={load}
      />

      {/* Free receive (without PO) */}
      <Modal opened={freeOpened} onClose={freeHandlers.close} title="Recepción sin orden de compra" size="xl">
        <Stack>
          <Text size="sm" c="dimmed">
            Se creará automáticamente una orden de compra con estado "Recibido".
          </Text>

          <Select
            label="Proveedor"
            placeholder="Seleccionar proveedor"
            searchable
            required
            data={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
            value={freeSupplierId}
            onChange={setFreeSupplierId}
          />

          <Group justify="space-between">
            <Text fw={600} size="sm">Artículos recibidos</Text>
            <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={addFreeLine}>
              Agregar línea
            </Button>
          </Group>

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th w={90}>Cantidad</Table.Th>
                <Table.Th w={110}>Costo unit.</Table.Th>
                <Table.Th w={90}>Total</Table.Th>
                <Table.Th w={130}>Vencimiento</Table.Th>
                <Table.Th w={40} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {freeLines.map((line, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Select
                      placeholder="Seleccionar producto"
                      data={productOptions}
                      searchable
                      size="xs"
                      value={line.productId}
                      onChange={(val) => updateFreeLine(idx, 'productId', val)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" min={0.01} step={1} decimalScale={2} value={line.qty}
                      onChange={(val) => updateFreeLine(idx, 'qty', Number(val) || 0)} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput size="xs" min={0} step={0.01} decimalScale={2} prefix="$" value={line.unitCost}
                      onChange={(val) => updateFreeLine(idx, 'unitCost', Number(val) || 0)} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">${(line.qty * line.unitCost).toFixed(2)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      size="xs"
                      type="date"
                      value={line.expirationDate}
                      onChange={(e) => updateFreeLine(idx, 'expirationDate', e.currentTarget.value)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeFreeLine(idx)} disabled={freeLines.length <= 1}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group grow>
            <TextInput
              label="Nº Remito"
              placeholder="Ej: R-00012345"
              value={freeRemito}
              onChange={(e) => setFreeRemito(e.currentTarget.value)}
            />
            <TextInput
              label="Nº Factura"
              placeholder="Ej: A-0001-00012345"
              value={freeInvoice}
              onChange={(e) => setFreeInvoice(e.currentTarget.value)}
            />
          </Group>
          <Group grow>
            <Select
              label="Método de pago"
              placeholder="Seleccionar"
              clearable
              value={freePayMethod}
              onChange={setFreePayMethod}
              data={[
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'transferencia', label: 'Transferencia' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'cuenta_corriente', label: 'Cuenta corriente' },
                { value: 'otro', label: 'Otro' }
              ]}
            />
          </Group>
          <Textarea
            label="Notas"
            placeholder="Ej: Pedido por teléfono, entrega directa..."
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
