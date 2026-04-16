import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, TextInput, Table, Badge, ActionIcon, Paper, Select,
  Text, SimpleGrid, Card, Tabs, NumberInput, Button, Textarea, Modal, Tooltip, Box, rem
} from '@mantine/core'
import {
  IconSearch, IconAdjustmentsAlt, IconAlertTriangle, IconPackage,
  IconArrowUp, IconArrowDown, IconClipboardCheck
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import type { Product, Category } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function StockPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [stockFilter, setStockFilter] = useState<string | null>(null)

  // Adjust stock modal
  const [adjustOpened, adjustHandlers] = useDisclosure(false)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  // Inventory count modal
  const [countOpened, countHandlers] = useDisclosure(false)
  const [countProduct, setCountProduct] = useState<Product | null>(null)
  const [countQty, setCountQty] = useState<number>(0)
  const [countLoading, setCountLoading] = useState(false)

  const load = (): void => {
    window.api.products
      .list({ isActive: true, search: search || undefined, categoryId: catFilter ? Number(catFilter) : undefined })
      .then((r: any) => {
        if (r.ok) {
          let data = r.data as Product[]
          if (stockFilter === 'bajo') data = data.filter((p) => p.stock <= p.minStock && p.stock > 0)
          else if (stockFilter === 'sin') data = data.filter((p) => p.stock <= 0)
          else if (stockFilter === 'ok') data = data.filter((p) => p.stock > p.minStock)
          setProducts(data)
        }
      })
    window.api.categories.list().then((r: any) => { if (r.ok) setCategories(r.data) })
    window.api.products.lowStock().then((r: any) => { if (r.ok) setLowStock(r.data as any[]) })
  }

  useEffect(() => { load() }, [search, catFilter, stockFilter])

  const totalProducts = products.length
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)

  const openAdjust = (product: Product): void => {
    setAdjustProduct(product)
    setAdjustQty(0)
    setAdjustReason('')
    adjustHandlers.open()
  }

  const handleAdjust = async (): Promise<void> => {
    if (!adjustProduct || adjustQty === 0) return
    setAdjustLoading(true)
    const res = await window.api.products.adjustStock({
      id: adjustProduct.id,
      adjustment: adjustQty,
      reason: adjustReason || undefined
    })
    if (res.ok) {
      notifications.show({
        title: 'Stock ajustado',
        message: `${adjustProduct.name}: ${adjustQty > 0 ? '+' : ''}${adjustQty}`,
        color: 'green'
      })
      adjustHandlers.close()
      load()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
    }
    setAdjustLoading(false)
  }

  const openCount = (product: Product): void => {
    setCountProduct(product)
    setCountQty(product.stock)
    countHandlers.open()
  }

  const handleCount = async (): Promise<void> => {
    if (!countProduct) return
    const diff = countQty - countProduct.stock
    if (diff === 0) { countHandlers.close(); return }
    setCountLoading(true)
    const res = await window.api.products.adjustStock({
      id: countProduct.id,
      adjustment: diff,
      reason: `Conteo físico: ${countQty} unidades (dif: ${diff > 0 ? '+' : ''}${diff})`
    })
    if (res.ok) {
      notifications.show({
        title: 'Conteo registrado',
        message: `${countProduct.name}: ${diff === 0 ? 'sin diferencia' : `diferencia: ${diff > 0 ? '+' : ''}${diff}`}`,
        color: diff === 0 ? 'green' : 'orange'
      })
      countHandlers.close()
      load()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
    }
    setCountLoading(false)
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
          <div>
            <Title order={2} fw={800}>Control de Inventario</Title>
            <Text size="sm" c="dimmed">Seguimiento de existencias, ajustes y auditoría de stock</Text>
          </div>

          <Group gap="md">
            <TextInput
              placeholder="Buscar por nombre, código o SKU..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Categoría"
              clearable
              data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              value={catFilter}
              onChange={setCatFilter}
              w={200}
            />
            <Select
              placeholder="Estado de Stock"
              clearable
              data={[
                { value: 'ok', label: 'Stock OK' },
                { value: 'bajo', label: 'Bajo stock' },
                { value: 'sin', label: 'Sin stock' }
              ]}
              value={stockFilter}
              onChange={setStockFilter}
              w={180}
            />
          </Group>
        </Stack>
      </Box>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} gap="lg">
        <Paper p="md" radius="md">
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Productos</Text>
            <IconPackage size={18} color="#2196F3" />
          </Group>
          <Text fw={800} size="xl">{totalProducts}</Text>
        </Paper>
        <Paper p="md" radius="md">
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Unidades Totales</Text>
            <IconPackage size={18} color="#9C27B0" />
          </Group>
          <Text fw={800} size="xl">{Math.round(totalUnits)}</Text>
        </Paper>
        <Paper p="md" radius="md" style={{ borderLeft: '4px solid #2196F3' }}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Valor Inventario</Text>
            <IconPackage size={18} color="#2196F3" />
          </Group>
          <Text fw={800} size="xl" c="blue.7">{fmt(totalValue)}</Text>
        </Paper>
        <Paper p="md" radius="md" style={{ borderLeft: '4px solid #F44336' }}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Alerta Stock</Text>
            <IconAlertTriangle size={18} color="#F44336" />
          </Group>
          <Text fw={800} size="xl" c={lowStock.length > 0 ? 'red.7' : 'green.7'}>
            {lowStock.length}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Table */}
      <Paper p={0} withBorder={false} bg="transparent">
        <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={160}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Artículo</Table.Th>
              <Table.Th>Atributos</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th ta="right">Stock Actual</Table.Th>
              <Table.Th ta="right">Valorización</Table.Th>
              <Table.Th ta="center">Estado</Table.Th>
              <Table.Th ta="right">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((p) => {
              const status = p.stock <= 0 ? 'sin' : p.stock <= p.minStock ? 'bajo' : 'ok'
              return (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text fw={700} size="sm">{p.name}</Text>
                      <Text size="xs" c="dimmed">{p.barcode || p.sku || 'Sin código'}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {p.brand && <Badge size="xs" variant="outline" color="gray">{p.brand}</Badge>}
                      {p.presentation && <Badge size="xs" variant="outline" color="gray">{p.presentation}</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge variant="light" color="blue" size="sm">{p.categoryName || 'General'}</Badge></Table.Td>
                  <Table.Td ta="right">
                    <Text fw={800} size="sm">{p.stock} <Text span size="xs" fw={500} c="dimmed">{p.unit}</Text></Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={600}>{fmt(p.stock * p.costPrice)}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      size="sm"
                      variant="filled"
                      color={status === 'ok' ? 'green' : status === 'bajo' ? 'orange' : 'red'}
                      style={{ width: 80 }}
                    >
                      {status === 'ok' ? 'OK' : status === 'bajo' ? 'BAJO' : 'AGOTADO'}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap={4} justify="flex-end">
                      <Tooltip label="Ajuste de Stock">
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => openAdjust(p)}>
                          <IconAdjustmentsAlt size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Auditoría/Conteo">
                        <ActionIcon variant="light" color="teal" size="sm" onClick={() => openCount(p)}>
                          <IconClipboardCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {products.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="xl">No se encontraron productos en el inventario</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Adjust Modal */}
      <Modal opened={adjustOpened} onClose={adjustHandlers.close} title="Ajuste de Stock" size="sm">
        {adjustProduct && (
          <Stack gap="md">
            <Text size="sm">Ajustando: <b>{adjustProduct.name}</b></Text>
            <NumberInput
              label="Cantidad a ajustar"
              description="Positivo para sumar, negativo para restar"
              value={adjustQty}
              onChange={(v) => setAdjustQty(Number(v) || 0)}
            />
            <Textarea
              label="Motivo"
              placeholder="Ej: Rotura, vencimiento..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.currentTarget.value)}
            />
            <Button onClick={handleAdjust} loading={adjustLoading}>
              Aplicar ajuste
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Count Modal */}
      <Modal opened={countOpened} onClose={countHandlers.close} title="Auditoría de Stock (Conteo)" size="sm">
        {countProduct && (
          <Stack gap="md">
            <Text size="sm">Contando: <b>{countProduct.name}</b></Text>
            <NumberInput
              label="Cantidad encontrada"
              value={countQty}
              onChange={(v) => setCountQty(Number(v) || 0)}
              min={0}
            />
            {countQty !== countProduct.stock && (
              <Badge color="orange" fullWidth variant="light">Diferencia: {countQty - countProduct.stock}</Badge>
            )}
            {countQty === countProduct.stock && (
              <Badge color="green" fullWidth variant="light">Sin diferencia</Badge>
            )}
            <Button onClick={handleCount} loading={countLoading} color="teal">
              Registrar conteo
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
