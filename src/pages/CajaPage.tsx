import { useState, useEffect, useCallback } from 'react'
import {
  Title, Stack, Card, Group, Text, Button, NumberInput, Table,
  Badge, SimpleGrid, Textarea, Paper, Alert, Grid, Tabs, Modal, Select, TextInput
} from '@mantine/core'
import dayjs from 'dayjs'
import { IconCash, IconAlertCircle, IconShoppingCart, IconHistory, IconBarcode, IconScale, IconArrowsExchange } from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'
import { notifications } from '@mantine/notifications'
import ProductSearch from '../components/pos/ProductSearch'
import Cart from '../components/pos/Cart'
import PaymentModal from '../components/pos/PaymentModal'
import ReceiptModal from '../components/pos/ReceiptModal'
import CameraScanner from '../components/pos/CameraScanner'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { useSettingsStore } from '../stores/settingsStore'
import { useCartStore } from '../stores/cartStore'
import type { Product } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function CajaPage(): JSX.Element {
  const { user } = useAuthStore()
  const [currentRegister, setCurrentRegister] = useState<any>(null)
  const [openingAmount, setOpeningAmount] = useState<number>(0)
  const [closingAmount, setClosingAmount] = useState<number>(0)
  const [closeNotes, setCloseNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [movementsData, setMovementsData] = useState<any[]>([])
  const [movementFilters, setMovementFilters] = useState({
    type: 'todos',
    from: dayjs().format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('cobrar')
  const [snapshot, setSnapshot] = useState<any>(null)
  const [arqueoAmount, setArqueoAmount] = useState<number>(0)
  const [arqueoResult, setArqueoResult] = useState<{ diff: number; shown: boolean }>({ diff: 0, shown: false })

  // Movimientos de caja (Ingreso/Egreso manual)
  const [movementOpened, setMovementOpened] = useState(false)
  const [movementAmount, setMovementAmount] = useState<number | ''>('')
  const [movementNotes, setMovementNotes] = useState('')

  // POS state
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [receiptOpened, setReceiptOpened] = useState(false)
  const [cameraOpened, setCameraOpened] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [scanIndicator, setScanIndicator] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const { settings } = useSettingsStore()
  const scannerMode = settings?.scanner_mode || 'both'
  const allowUsb = scannerMode === 'both' || scannerMode === 'usb'

  const loadData = async (): Promise<void> => {
    const [resCurrent, resHistory] = await Promise.all([
      window.api.cashRegister.current(),
      window.api.cashRegister.list(20)
    ])
    if (resCurrent.ok) setCurrentRegister(resCurrent.data)
    if (resHistory.ok) setHistory(resHistory.data as any[])
  }

  const refreshSnapshot = async (): Promise<void> => {
    const r = await window.api.cashRegister.liveSnapshot()
    if (r.ok && r.data) setSnapshot(r.data)
  }

  const loadMovementsData = useCallback(async (filters: any = movementFilters) => {
    setLoading(true)
    const res = await window.api.cashRegister.movements(filters)
    if (res.ok) setMovementsData(res.data)
    setLoading(false)
  }, [movementFilters])

  useEffect(() => { loadData() }, [])
  
  useEffect(() => {
    if (activeTab === 'movimientos') {
      loadMovementsData(movementFilters)
    }
  }, [activeTab, loadMovementsData, movementFilters])

  // Refresh snapshot every 10s and on tab change
  useEffect(() => {
    if (currentRegister) {
      refreshSnapshot()
      const interval = setInterval(refreshSnapshot, 10000)
      return () => clearInterval(interval)
    }
  }, [currentRegister])

  // POS handlers
  const handleSelectProduct = useCallback((product: Product): void => {
    if (product.stock <= 0) return
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.salePrice,
      costPrice: product.costPrice,
      stock: product.stock
    })
  }, [addItem])

  const handleBarcodeScan = useCallback(async (code: string) => {
    if (!currentRegister) return
    setScanIndicator(code)
    setTimeout(() => setScanIndicator(''), 2000)
    const res = await window.api.products.search(code)
    if (res.ok && res.data) {
      const products = res.data as Product[]
      const exact = products.find((p) => p.barcode === code || p.sku === code)
      if (exact && exact.stock > 0) handleSelectProduct(exact)
      else if (products.length === 1 && products[0].stock > 0) handleSelectProduct(products[0])
    }
  }, [handleSelectProduct, currentRegister])

  useBarcodeScanner(handleBarcodeScan, allowUsb)

  const handleComplete = (sale: any): void => {
    setPaymentOpened(false)
    setLastSale(sale)
    setReceiptOpened(true)
    loadData()
    refreshSnapshot()
    loadMovementsData(movementFilters)
  }

  const handleCameraScan = useCallback((code: string) => {
    setCameraOpened(false)
    handleBarcodeScan(code)
  }, [handleBarcodeScan])

  const handleOpen = async (): Promise<void> => {
    setLoading(true)
    const res = await window.api.cashRegister.open({ userId: user?.id, openingAmount })
    if (res.ok) {
      notifications.show({ title: 'Caja abierta', message: `Monto inicial: ${fmt(openingAmount)}`, color: 'green' })
      setOpeningAmount(0)
      loadData()
    } else {
      notifications.show({ title: 'Error', message: res.error, color: 'red' })
    }
    setLoading(false)
  }

  const handleClose = async (): Promise<void> => {
    if (!currentRegister) return
    setLoading(true)
    const res = await window.api.cashRegister.close({
      id: currentRegister.id,
      closingAmount,
      notes: closeNotes || undefined
    })
    if (res.ok) {
      const data = res.data as any
      const diff = data.difference ?? 0
      notifications.show({
        title: 'Caja cerrada',
        message: diff === 0 ? 'Sin diferencia' : `Diferencia: ${fmt(diff)}`,
        color: diff === 0 ? 'green' : 'orange'
      })
      setClosingAmount(0)
      setCloseNotes('')
      loadData()
    } else {
      notifications.show({ title: 'Error', message: res.error, color: 'red' })
    }
    setLoading(false)
  }

  const handleCashMovement = async (): Promise<void> => {
    if (!currentRegister || !movementAmount || movementAmount === 0) return
    setLoading(true)
    try {
      const res = await window.api.cashRegister.addCash({
        id: currentRegister.id,
        amount: Number(movementAmount),
        notes: movementNotes || undefined
      })
      if (res.ok) {
        notifications.show({
          title: 'Movimiento registrado',
          message: Number(movementAmount) > 0 ? 'Ingreso exitoso' : 'Retiro exitoso',
          color: 'green'
        })
        setMovementOpened(false)
        setMovementAmount('')
        setMovementNotes('')
        loadData()
        refreshSnapshot()
        loadMovementsData(movementFilters)
      } else {
        notifications.show({ title: 'Error', message: res.error, color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error procesando movimiento', color: 'red' })
    }
    setLoading(false)
  }

  // No register open — show open form
  if (!currentRegister) {
    return (
      <Stack gap="md">
        <Title order={3}>Caja</Title>
        <Paper withBorder p="lg">
          <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="md">
            No hay caja abierta. Abrí una para empezar a cobrar.
          </Alert>
          <Group align="flex-end">
            <NumberInput
              label="Monto inicial"
              value={openingAmount}
              onChange={(v) => setOpeningAmount(Number(v) || 0)}
              min={0}
              decimalScale={2}
              prefix="$ "
              thousandSeparator="."
              decimalSeparator=","
              w={200}
            />
            <Button color="green" onClick={handleOpen} loading={loading}>
              Abrir caja
            </Button>
          </Group>
        </Paper>

        {history.length > 0 && (
          <>
            <Text fw={600} size="lg">Historial de cajas</Text>
            <RegisterHistoryTable history={history} />
          </>
        )}
      </Stack>
    )
  }

  // Register open — show POS + register info
  return (
    <Stack gap="sm">
      <Tabs value={activeTab} onChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Top Header Row */}
        <Group justify="space-between" align="center" mb="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Tabs.List style={{ borderBottom: 'none' }} pb="xs">
            <Tabs.Tab value="cobrar" leftSection={<IconShoppingCart size={16} />}>Cobrar</Tabs.Tab>
            <Tabs.Tab value="caja" leftSection={<IconCash size={16} />}>Cerrar caja</Tabs.Tab>
            <Tabs.Tab value="movimientos" leftSection={<IconArrowsExchange size={16} />}>Movimientos</Tabs.Tab>
          </Tabs.List>

          <Group gap="sm" align="center" pb="xs">
            {scanIndicator && (
              <Badge size="sm" variant="light" color="blue" leftSection={<IconBarcode size={12} />}>
                {scanIndicator}
              </Badge>
            )}
            <Title order={2} style={{ fontWeight: 600 }}>Caja</Title>
            <IconCash size={28} color="#27AE60" stroke={1.5} />
            <Badge color="green" size="lg" variant="filled" style={{ fontWeight: 800 }}>ABIERTA</Badge>
          </Group>
        </Group>

      {/* Live cash panel */}
      {snapshot && (
        <Group justify="center" mb="md">
          <Paper withBorder p="md" radius="md" shadow="sm" style={{ backgroundColor: '#f8f9fa' }}>
            <Group gap="lg">
              <div style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed" fw={500}>Efectivo total</Text>
                <Text fw={800} size="h2" c="green" mb={4}>{fmt(snapshot.cashInRegister)}</Text>
                <Button size="xs" variant="light" color="blue" onClick={() => setMovementOpened(true)}>
                  Ingreso / Retiro
                </Button>
              </div>
              <div style={{ borderLeft: '1px solid #dee2e6', paddingLeft: 16 }}>
                <Group gap="sm" mb={4}>
                  <Text size="sm" c="dimmed" w={70}>Apertura:</Text>
                  <Text size="sm" fw={600}>{fmt(snapshot.openingAmount)}</Text>
                </Group>
                <Group gap="sm" mb={4}>
                  <Text size="sm" c="dimmed" w={70}>Efectivo:</Text>
                  <Text size="sm" fw={600} c="green">+{fmt(snapshot.cashSales)}</Text>
                </Group>
                <Group gap="sm" mb={4}>
                  <Text size="sm" c="dimmed" w={70}>Tarjeta:</Text>
                  <Text size="sm" fw={600} c="blue">{fmt(snapshot.cardSales)}</Text>
                </Group>
                <Group gap="sm">
                  <Text size="sm" c="dimmed" w={70}>Transf:</Text>
                  <Text size="sm" fw={600} c="violet">{fmt(snapshot.transferSales)}</Text>
                </Group>
              </div>
              <div style={{ borderLeft: '1px solid #dee2e6', paddingLeft: 16 }}>
                <Text size="sm" c="dimmed" fw={500} mb={6}>Arqueo rápido</Text>
                <Group gap={8}>
                  <NumberInput
                    size="sm"
                    w={110}
                    value={arqueoAmount}
                    onChange={(v) => { setArqueoAmount(Number(v) || 0); setArqueoResult({ diff: 0, shown: false }) }}
                    min={0}
                    decimalScale={2}
                    prefix="$ "
                    placeholder="Conteo"
                  />
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconScale size={16} />}
                    onClick={() => {
                      refreshSnapshot().then(() => {
                        const expected = snapshot?.cashInRegister ?? 0
                        setArqueoResult({ diff: arqueoAmount - expected, shown: true })
                      })
                    }}
                  >
                    Arquear
                  </Button>
                </Group>
                {arqueoResult.shown && (
                  <Text size="sm" fw={700} mt={6}
                    c={arqueoResult.diff === 0 ? 'green' : arqueoResult.diff > 0 ? 'blue' : 'red'}
                  >
                    {arqueoResult.diff === 0 ? 'Sin diferencia'
                      : arqueoResult.diff > 0 ? `Sobrante: ${fmt(arqueoResult.diff)}`
                      : `Faltante: ${fmt(Math.abs(arqueoResult.diff))}`
                    }
                  </Text>
                )}
              </div>
              <div style={{ borderLeft: '1px solid #dee2e6', paddingLeft: 16, textAlign: 'center' }}>
                <Text size="sm" c="dimmed" fw={500}>Ventas</Text>
                <Text fw={800} size="h3" my={2}>{snapshot.salesCount}</Text>
                <Text size="sm" fw={600} c="sapphire">{fmt(snapshot.totalSales)}</Text>
              </div>
            </Group>
          </Paper>
        </Group>
      )}

        <Tabs.Panel value="cobrar" pt="sm">
          <Grid>
            <Grid.Col span={7}>
              <ProductSearch
                onSelect={handleSelectProduct}
                onCameraOpen={() => setCameraOpened(true)}
              />
            </Grid.Col>
            <Grid.Col span={5}>
              <Cart onPay={() => setPaymentOpened(true)} />
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="caja" pt="sm">
          <Paper withBorder p="lg">
            <SimpleGrid cols={4} mb="lg">
              <Card withBorder p="sm">
                <Text size="xs" c="dimmed">Monto inicial</Text>
                <Text fw={700}>{fmt(currentRegister.openingAmount)}</Text>
              </Card>
              <Card withBorder p="sm">
                <Text size="xs" c="dimmed">Ventas ({currentRegister.salesCount})</Text>
                <Text fw={700}>{fmt(currentRegister.totalSales)}</Text>
              </Card>
              <Card withBorder p="sm">
                <Text size="xs" c="dimmed">Efectivo esperado</Text>
                <Text fw={700}>{fmt(currentRegister.openingAmount + currentRegister.cashSales)}</Text>
              </Card>
              <Card withBorder p="sm">
                <Text size="xs" c="dimmed">Abierta desde</Text>
                <Text fw={700} size="sm">{currentRegister.openedAt?.slice(0, 16)}</Text>
              </Card>
            </SimpleGrid>

            <Text fw={600} mb="sm">Cerrar caja</Text>
            <Group align="flex-end" mb="sm">
              <NumberInput
                label="Monto en caja (conteo)"
                value={closingAmount}
                onChange={(v) => setClosingAmount(Number(v) || 0)}
                min={0}
                decimalScale={2}
                prefix="$ "
                thousandSeparator="."
                decimalSeparator=","
                w={200}
              />
              <Textarea
                label="Notas (opcional)"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.currentTarget.value)}
                w={300}
                rows={1}
              />
              <Button color="red" onClick={handleClose} loading={loading}>
                Cerrar caja
              </Button>
            </Group>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="movimientos" pt="sm">
          <MovementsViewer 
             data={movementsData} 
             filters={movementFilters}
             onFilter={(newFilters) => setMovementFilters(newFilters)} 
          />
        </Tabs.Panel>
      </Tabs>

      <PaymentModal
        opened={paymentOpened}
        onClose={() => setPaymentOpened(false)}
        onComplete={handleComplete}
      />
      <ReceiptModal
        opened={receiptOpened}
        onClose={() => setReceiptOpened(false)}
        sale={lastSale}
      />
      <CameraScanner
        opened={cameraOpened}
        onClose={() => setCameraOpened(false)}
        onScan={handleCameraScan}
      />

      <Modal opened={movementOpened} onClose={() => setMovementOpened(false)} title="Movimiento de Caja" size="xs">
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="blue" p="sm">
            Tipea un positivo (+) para Ingreso, o un negativo (-) para Retiro.
          </Alert>
          <NumberInput
            label="Monto"
            placeholder="Ej: -5000 o 2500"
            value={movementAmount}
            onChange={(v) => setMovementAmount(v === '' ? '' : Number(v))}
            decimalScale={2}
            prefix="$ "
            thousandSeparator="."
            decimalSeparator=","
          />
          <Textarea
            label="Motivo o detalle (opcional)"
            placeholder="Ej: Retiro para cadete"
            value={movementNotes}
            onChange={(e) => setMovementNotes(e.currentTarget.value)}
            rows={2}
          />
          <Button fullWidth onClick={handleCashMovement} loading={loading} disabled={!movementAmount || movementAmount === 0}>
            Registrar Movimiento
          </Button>
        </Stack>
      </Modal>
    </Stack>
  )
}

function RegisterHistoryTable({ history }: { history: any[] }): JSX.Element {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Apertura</Table.Th>
          <Table.Th>Cierre</Table.Th>
          <Table.Th>Usuario</Table.Th>
          <Table.Th ta="right">Ventas</Table.Th>
          <Table.Th ta="right">Total ventas</Table.Th>
          <Table.Th ta="right">Esperado</Table.Th>
          <Table.Th ta="right">Contado</Table.Th>
          <Table.Th ta="right">Diferencia</Table.Th>
          <Table.Th>Estado</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {history.map((r) => (
          <Table.Tr key={r.id}>
            <Table.Td>{r.openedAt?.slice(0, 16)}</Table.Td>
            <Table.Td>{r.closedAt?.slice(0, 16) ?? '-'}</Table.Td>
            <Table.Td>{r.userName}</Table.Td>
            <Table.Td ta="right">{r.salesCount}</Table.Td>
            <Table.Td ta="right">{fmt(r.totalSales)}</Table.Td>
            <Table.Td ta="right">{r.expectedAmount != null ? fmt(r.expectedAmount) : '-'}</Table.Td>
            <Table.Td ta="right">{r.closingAmount != null ? fmt(r.closingAmount) : '-'}</Table.Td>
            <Table.Td ta="right">
              {r.difference != null ? (
                <Text c={r.difference === 0 ? 'green' : 'red'} fw={500} size="sm">
                  {fmt(r.difference)}
                </Text>
              ) : '-'}
            </Table.Td>
            <Table.Td>
              <Badge color={r.status === 'abierta' ? 'green' : 'gray'} size="sm">
                {r.status}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
        {history.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={9}>
              <Text c="dimmed" ta="center">Sin historial</Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  )
}

function MovementsViewer({ data, filters, onFilter }: { data: any[]; filters: any; onFilter: (filters: any) => void }): JSX.Element {
  const [type, setType] = useState(filters.type)
  const [dateStr, setDateStr] = useState(filters.from)

  useEffect(() => {
    setType(filters.type)
    setDateStr(filters.from)
  }, [filters])

  const handleApply = () => {
    onFilter({
      type,
      from: dateStr || undefined,
      to: dateStr || undefined
    })
  }

  return (
    <Stack gap="md">
      <Paper withBorder p="sm" bg="gray.0">
        <Group align="flex-end">
          <Select
            label="Tipo de movimiento"
            data={[{ value: 'todos', label: 'Todos' }, { value: 'ingreso', label: 'Ingresos' }, { value: 'egreso', label: 'Egresos' }]}
            value={type}
            onChange={(v) => setType(v || 'todos')}
            w={200}
          />
          <TextInput
            label="Fecha Específica"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.currentTarget.value)}
            w={200}
          />
          <Button onClick={handleApply}>Filtrar</Button>
        </Group>
      </Paper>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha y Hora</Table.Th>
            <Table.Th>Documento</Table.Th>
            <Table.Th>Medio</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th ta="right">Importe</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((m, i) => (
            <Table.Tr key={`${m.docType}-${m.refId}-${i}`}>
              <Table.Td>{m.createdAt?.slice(0, 16)}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Badge color={m.docType === 'Venta' ? 'blue' : 'violet'} variant="light">
                    {m.docType}
                  </Badge>
                  {m.receiptNumber !== 'N/A' && <Text size="sm">{m.receiptNumber}</Text>}
                </Group>
              </Table.Td>
              <Table.Td style={{ textTransform: 'capitalize' }}>{m.paymentMethod}</Table.Td>
              <Table.Td>
                <Badge color={m.type === 'ingreso' ? 'green' : 'red'}>
                  {m.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </Badge>
              </Table.Td>
              <Table.Td ta="right" fw={600} c={m.type === 'ingreso' ? 'green' : 'red'}>
                {m.type === 'egreso' ? '-' : ''}{fmt(m.amount)}
              </Table.Td>
            </Table.Tr>
          ))}
          {data.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" c="dimmed">
                No hay movimientos para estos filtros.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
