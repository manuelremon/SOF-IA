import { useState, useEffect, useCallback } from 'react'
import {
  Title, Stack, Card, Group, Text, Button, NumberInput,
  Badge, SimpleGrid, Textarea, Paper, Alert, Grid, Tabs, Modal, Divider, rem, Box, ScrollArea
} from '@mantine/core'
import { IconCash, IconAlertCircle, IconShoppingCart, IconBarcode, IconScale, IconArrowsExchange, IconFlame, IconBoxMultiple } from '@tabler/icons-react'
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
import { RegisterHistoryTable } from '../components/pos/RegisterHistoryTable'
import { MovementsViewer } from '../components/pos/MovementsViewer'
import { useCashRegister } from '../hooks/useCashRegister'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function CajaPage(): JSX.Element {
  const { user } = useAuthStore()
  const {
    currentRegister, history, snapshot, refreshSnapshot, movementsData,
    movementFilters, setMovementFilters, loadMovementsData, suggestions,
    pricingSuggestions, drafts, loadDrafts, loading, setLoading, loadData
  } = useCashRegister()
  const [openingAmount, setOpeningAmount] = useState<number>(0)
  const [closingAmount, setClosingAmount] = useState<number>(0)
  const [closeNotes, setCloseNotes] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>('cobrar')
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

  useEffect(() => {
    if (activeTab === 'movimientos') {
      loadMovementsData(movementFilters)
    }
  }, [activeTab, loadMovementsData, movementFilters])

  // POS handlers
  const handleSelectProduct = useCallback((product: Product): void => {
    if (product.stock <= 0) return
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.salePrice,
      costPrice: product.costPrice,
      stock: product.stock,
      unit: product.unit || 'un'
    })
  }, [addItem])

  const handleImportDraft = (draft: any) => {
    const items = JSON.parse(draft.itemsJson)
    items.forEach((item: any) => {
      addItem({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        costPrice: 0,
        stock: 999,
        unit: item.unit || 'un'
      })
    })
    window.api.draftOrders.process(draft.id).then(() => {
      loadDrafts()
      notifications.show({ title: 'Carrito importado', message: `Se cargaron ${items.length} items desde el dispositivo móvil (${draft.deviceName}).`, color: 'blue' })
    })
  }

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

  useEffect(() => {
    const handleSofiaAction = (e: any) => {
      const { type, product, quantity } = e.detail
      if (type === 'ADD_ITEM') {
        for(let i=0; i<quantity; i++) handleSelectProduct(product)
        notifications.show({ title: 'Agregado por voz', message: `Se agregó ${quantity}x ${product.name}`, color: 'blue' })
      }
    }
    window.addEventListener('sofia-action', handleSofiaAction)
    return () => window.removeEventListener('sofia-action', handleSofiaAction)
  }, [handleSelectProduct])

  const handleComplete = async (saleInput: any): Promise<void> => {
    let auditPhoto: string | undefined = undefined
    
    // Si la cámara está abierta (ej. para scanner), aprovechamos para capturar auditoría
    // Nota: Para hacerlo 100% silencioso sin que el usuario lo note,
    // podríamos tener un video oculto siempre, pero por ahora usamos el videoRef existente.
    const videoElement = document.querySelector('video')
    if (videoElement && videoElement.readyState === 4) {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        canvas.getContext('2d')?.drawImage(videoElement, 0, 0)
        auditPhoto = canvas.toDataURL('image/jpeg', 0.3) // Calidad baja para no saturar
      } catch (e) { console.error('Error capturando foto de auditoría:', e) }
    }

    const res = await window.api.sales.complete({ ...saleInput, auditImagePath: auditPhoto })
    if (res.ok) {
      const sale = res.data
      setPaymentOpened(false)
      setLastSale(sale)
      setReceiptOpened(true)
      loadData()
      refreshSnapshot()
      loadMovementsData(movementFilters)

      // Micro-interacción: Celebración sutil para ventas altas
      if (sale.total > 50000) {
        notifications.show({
          title: '¡Venta Excelente! 🚀',
          message: `Has cerrado una venta de ${fmt(sale.total)}. ¡Buen trabajo!`,
          color: 'yellow',
          icon: <IconShoppingCart size={20} />,
          autoClose: 5000
        })
      }
    } else {
      notifications.show({ title: 'Error', message: res.error, color: 'red' })
    }
  }

  const handleCameraScan = useCallback((code: string) => {
    setCameraOpened(false)
    handleBarcodeScan(code)
  }, [handleBarcodeScan])

  const handleIdentify = async (data: any) => {
    setCameraOpened(false)
    if (!data.name) return

    // Intentar buscar el producto identificado en nuestra base local
    const res = await window.api.products.search(data.name)
    if (res.ok && res.data?.length > 0) {
      const product = res.data[0]
      handleSelectProduct(product)
      notifications.show({ 
        title: 'Producto identificado 👁️', 
        message: `Se agregó ${product.name} al carrito.`,
        color: 'blue' 
      })
    } else {
      notifications.show({ 
        title: 'No encontrado localmente', 
        message: `Identifiqué "${data.name}" pero no está en tu catálogo. ¿Deseas crearlo?`,
        color: 'yellow' 
      })
    }
  }

  const handleOpen = async (): Promise<void> => {
    setLoading(true)
    const res = await window.api.cashRegister.open({ userId: user?.id, openingAmount })
    if (res.ok) {
      notifications.show({ 
        title: 'Caja abierta 🔓', 
        message: `¡Buen inicio de jornada! Monto inicial: ${fmt(openingAmount)}`, 
        color: 'green' 
      })
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
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Group justify="space-between" align="center">
            <Tabs.List style={{ borderBottom: 'none' }}>
              <Tabs.Tab value="cobrar" leftSection={<IconShoppingCart size={16} />}>Cobrar</Tabs.Tab>
              <Tabs.Tab value="caja" leftSection={<IconCash size={16} />}>Cerrar caja</Tabs.Tab>
              <Tabs.Tab value="movimientos" leftSection={<IconArrowsExchange size={16} />}>Movimientos</Tabs.Tab>
            </Tabs.List>

            <Group gap="sm" align="center">
              {scanIndicator && (
                <Badge size="sm" variant="light" color="blue" leftSection={<IconBarcode size={12} />}>
                  {scanIndicator}
                </Badge>
              )}
              <Title order={2} style={{ fontWeight: 600 }}>Caja</Title>
              <IconCash size={28} color="#27AE60" stroke={1.5} />
              <Group gap={5}>
                <Badge color="green" size="lg" variant="filled" style={{ fontWeight: 800 }}>ABIERTA</Badge>
                {snapshot && (
                   <Badge color="green.7" size="lg" variant="outline" style={{ fontWeight: 900, fontSize: rem(16) }}>
                     {fmt(snapshot.cashInRegister)}
                   </Badge>
                )}
              </Group>
            </Group>
          </Group>
        </Tabs>
      </Box>

      <Tabs value={activeTab} onChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Tabs.Panel value="cobrar" pt="md">
          <Grid gutter="xl">
            {/* COLUMNA IZQUIERDA: CAJA Y PROMOS */}
            <Grid.Col span={6}>
              <Stack gap="xl">
                {/* 1. Efectivo en Caja */}
                {snapshot && (
                  <Paper withBorder p="xl" radius="md" bg="gray.0" shadow="sm">
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                          Control de Efectivo
                        </Text>
                        <Button 
                          size="xs" 
                          variant="light" 
                          color="blue.7" 
                          leftSection={<IconArrowsExchange size={14} />} 
                          onClick={() => setMovementOpened(true)}
                          radius="md"
                        >
                          Nuevo Movimiento
                        </Button>
                      </Group>

                      <Stack gap="sm">
                        <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Efectivo Ventas</Text>
                            <Text fw={800} size="lg" c="green.7">+{fmt(snapshot.cashSales)}</Text>
                          </Group>
                        </Paper>
                        <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Otros Medios</Text>
                            <Text fw={800} size="lg" c="blue.7">{fmt(snapshot.cardSales + snapshot.transferSales)}</Text>
                          </Group>
                        </Paper>
                      </Stack>

                      <Paper withBorder p="md" bg="white" radius="md" shadow="xs">
                        <Group justify="space-between" mb="sm">
                          <Text size="xs" fw={800} c="dimmed" tt="uppercase">Arqueo de Seguridad</Text>
                          {arqueoResult.shown && (
                            <Badge 
                              size="sm" 
                              variant="filled"
                              color={arqueoResult.diff === 0 ? 'green' : arqueoResult.diff > 0 ? 'blue' : 'red'}
                            >
                              {arqueoResult.diff === 0 ? 'Caja OK' : arqueoResult.diff > 0 ? `Sobrante: ${fmt(arqueoResult.diff)}` : `Faltante: ${fmt(Math.abs(arqueoResult.diff))}`}
                            </Badge>
                          )}
                        </Group>
                        <Group gap="sm">
                          <NumberInput
                            size="md"
                            style={{ flex: 1 }}
                            value={arqueoAmount}
                            onChange={(v) => { setArqueoAmount(Number(v) || 0); setArqueoResult({ diff: 0, shown: false }) }}
                            min={0}
                            decimalScale={2}
                            prefix="$ "
                            placeholder="Contar billetes..."
                          />
                          <Button
                            size="md"
                            color="sap"
                            leftSection={<IconScale size={18} />}
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
                      </Paper>

                      <Group justify="space-between" p="xs" style={{ borderTop: '1px dashed #ced4da' }}>
                        <Text size="sm" fw={600} c="dimmed">Operaciones: <span style={{ color: 'var(--mantine-color-blue-8)', fontWeight: 800 }}>{snapshot.salesCount}</span></Text>
                        <Text size="sm" fw={800}>Venta Total Bruta: {fmt(snapshot.totalSales)}</Text>
                      </Group>
                    </Stack>
                  </Paper>
                )}

                {/* 2. Promociones IA */}
                <Paper withBorder p="xl" radius="md" bg="orange.0" style={{ borderLeft: '8px solid var(--mantine-color-orange-5)' }}>
                  <Group justify="space-between" mb="lg">
                    <Group gap="sm">
                      <IconFlame size={28} color="var(--mantine-color-orange-6)" />
                      <Text fw={900} size="xl" c="orange.9" style={{ letterSpacing: '-0.5px' }}>
                        PROMOCIONES IA 🚀
                      </Text>
                    </Group>
                    <Badge color="orange" variant="filled" size="lg">Auto-Pricing Activo</Badge>
                  </Group>
                  
                  <ScrollArea h={400} offsetScrollbars type="always">
                    <Stack gap="md">
                      {pricingSuggestions.length > 0 ? (
                        pricingSuggestions.map((p) => (
                          <Paper key={p.id} p="md" withBorder radius="md" bg="white" shadow="xs">
                            <Group justify="space-between" wrap="nowrap" align="flex-start">
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Text fw={800} size="md" c="gray.8" lineClamp={1}>{p.name}</Text>
                                
                                <Group gap={6} wrap="wrap">
                                  {(p.brand || p.presentation) && (
                                    <Text size="xs" c="dimmed" fw={600}>
                                      {p.brand}{p.brand && p.presentation ? ' • ' : ''}{p.presentation}
                                    </Text>
                                  )}
                                  {p.sku && (
                                    <Badge size="xs" variant="outline" color="gray">SKU: {p.sku}</Badge>
                                  )}
                                </Group>

                                <Group gap="sm" mt={4}>
                                  <Stack gap={0}>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Precio Actual</Text>
                                    <Text size="sm" c="dimmed" td="line-through">{fmt(p.salePrice)}</Text>
                                  </Stack>
                                  <Stack gap={0}>
                                    <Text size="xs" c="orange.9" tt="uppercase" fw={800}>Precio Sugerido</Text>
                                    <Text size="lg" fw={900} c="orange.8">{fmt(p.suggestedPrice)}</Text>
                                  </Stack>
                                  <Badge color="orange" variant="filled" size="lg" radius="sm" fw={900}>
                                    {p.discountPercentage}% OFF
                                  </Badge>
                                </Group>

                                <Divider variant="dashed" my={4} />

                                <Group justify="space-between">
                                  <Group gap={4}>
                                    <IconBoxMultiple size={14} color="var(--mantine-color-orange-6)" />
                                    <Text size="xs" fw={700} c="orange.9">Stock: {p.stock} {p.unit || 'uds'}</Text>
                                  </Group>
                                  <Text size="xs" c="dimmed" fs="italic" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <IconAlertCircle size={12} /> {p.reason}
                                  </Text>
                                </Group>
                              </Stack>

                              <Button
                                variant="filled"
                                color="orange"
                                size="lg"
                                radius="md"
                                fw={900}
                                onClick={() => handleSelectProduct({
                                  id: p.id,
                                  name: p.name,
                                  salePrice: p.suggestedPrice,
                                  costPrice: p.costPrice,
                                  stock: p.stock,
                                  unit: p.unit || 'un'
                                } as any)}
                                style={{ height: 'auto', alignSelf: 'stretch' }}
                              >
                                AGREGAR
                              </Button>
                            </Group>
                          </Paper>
                        ))
                      ) : (
                        <Stack align="center" py={40} gap="sm">
                          <IconAlertCircle size={40} color="var(--mantine-color-gray-4)" />
                          <Text size="sm" c="dimmed" fw={600}>Generando nuevas ofertas basadas en demanda...</Text>
                        </Stack>
                      )}
                    </Stack>
                  </ScrollArea>
                </Paper>
              </Stack>
            </Grid.Col>

            {/* COLUMNA DERECHA: CARRITO Y STOCK */}
            <Grid.Col span={6}>
              <Stack gap="xl">
                {/* 3. Carrito (Sticky) */}
                <Box style={{ position: 'sticky', top: 80, zIndex: 10 }}>
                  <Cart onPay={() => setPaymentOpened(true)} onCameraOpen={() => setCameraOpened(true)} />
                </Box>

                {/* 4. Stock y Búsqueda */}
                <Paper withBorder p="xl" radius="md" shadow="sm">
                  <Group justify="space-between" mb="lg">
                    <Group gap="sm">
                      <IconBarcode size={28} color="var(--mantine-color-blue-6)" />
                      <Text fw={900} size="xl" c="blue.9" style={{ letterSpacing: '-0.5px' }}>
                        STOCK Y BÚSQUEDA 📦
                      </Text>
                    </Group>
                  </Group>
                  <ProductSearch
                    onSelect={handleSelectProduct}
                    onCameraOpen={() => setCameraOpened(true)}
                  />
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>

          {/* Widgets auxiliares */}
          <Group mt="lg" grow align="stretch">
            {suggestions.length > 0 && (
              <Paper p="sm" withBorder radius="md" bg="gray.0">
                <Text size="xs" fw={800} c="dimmed" mb={10} tt="uppercase">Sugerencias inteligentes 🕒</Text>
                <Group gap={8}>
                  {suggestions.map((p) => (
                    <Button
                      key={p.productId}
                      variant="white"
                      size="xs"
                      radius="xl"
                      leftSection={<IconShoppingCart size={14} />}
                      onClick={() => handleSelectProduct({
                        id: p.productId,
                        name: p.productName,
                        salePrice: p.salePrice,
                        costPrice: 0,
                        stock: p.stock,
                        unit: p.unit || 'un'
                      } as any)}
                      style={{ border: '1px solid #dee2e6' }}
                    >
                      {p.productName}
                    </Button>
                  ))}
                </Group>
              </Paper>
            )}

            {drafts.length > 0 && (
              <Paper p="sm" withBorder radius="md" bg="indigo.0">
                <Text size="xs" fw={800} c="indigo.9" mb={10} tt="uppercase">Carritos en espera 📱</Text>
                <Group gap={8}>
                  {drafts.map((d) => (
                    <Button
                      key={d.id}
                      variant="filled"
                      color="indigo"
                      size="xs"
                      onClick={() => handleImportDraft(d)}
                    >
                      Recuperar ({fmt(d.total)})
                    </Button>
                  ))}
                </Group>
              </Paper>
            )}
          </Group>
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
        onIdentify={handleIdentify}
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
