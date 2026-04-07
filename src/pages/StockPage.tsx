import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, TextInput, Table, Badge, ActionIcon, Paper, Select,
  Text, SimpleGrid, Card, Tabs, NumberInput, Button, Textarea, Modal
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
    <Stack gap="md">
      <Title order={3}>Stock</Title>

      {/* KPIs */}
      <SimpleGrid cols={4}>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed">Productos</Text>
          <Text fw={700} size="lg">{totalProducts}</Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed">Unidades totales</Text>
          <Text fw={700} size="lg">{Math.round(totalUnits)}</Text>
        </Card>
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed">Valor del inventario</Text>
          <Text fw={700} size="lg" c="blue">{fmt(totalValue)}</Text>
        </Card>
        <Card withBorder p="sm" style={lowStock.length > 0 ? { borderColor: '#fa5252' } : undefined}>
          <Text size="xs" c="dimmed">Stock bajo / agotado</Text>
          <Text fw={700} size="lg" c={lowStock.length > 0 ? 'red' : 'green'}>
            {lowStock.length}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Buscar producto..."
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
          w={180}
        />
        <Select
          placeholder="Estado stock"
          clearable
          data={[
            { value: 'ok', label: 'Stock OK' },
            { value: 'bajo', label: 'Stock bajo' },
            { value: 'sin', label: 'Sin stock' }
          ]}
          value={stockFilter}
          onChange={setStockFilter}
          w={160}
        />
      </Group>

      {/* Table */}
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Código</Table.Th>
              <Table.Th>Artículo</Table.Th>
              <Table.Th>Marca</Table.Th>
              <Table.Th>Presentación</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th ta="right">Stock actual</Table.Th>
              <Table.Th ta="right">Mínimo</Table.Th>
              <Table.Th ta="right">Valor (costo)</Table.Th>
              <Table.Th ta="center">Estado</Table.Th>
              <Table.Th w={90} ta="center">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((p) => {
              const status = p.stock <= 0 ? 'sin' : p.stock <= p.minStock ? 'bajo' : 'ok'
              return (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{p.barcode || p.sku || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm">{p.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{p.brand || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{p.presentation || '—'}</Text>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{p.categoryName || '—'}</Text></Table.Td>
                  <Table.Td ta="right">
                    <Text fw={700} size="sm">{p.stock} {p.unit}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" c="dimmed">{p.minStock}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm">{fmt(p.stock * p.costPrice)}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      size="sm"
                      variant="light"
                      color={status === 'ok' ? 'green' : status === 'bajo' ? 'yellow' : 'red'}
                      leftSection={status !== 'ok' ? <IconAlertTriangle size={10} /> : undefined}
                    >
                      {status === 'ok' ? 'OK' : status === 'bajo' ? 'Bajo' : 'Agotado'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => openAdjust(p)} title="Ajustar stock">
                        <IconAdjustmentsAlt size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="teal" size="sm" onClick={() => openCount(p)} title="Conteo físico">
                        <IconClipboardCheck size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {products.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text c="dimmed" ta="center" py="xl">No se encontraron productos</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Adjust stock modal */}
      <Modal opened={adjustOpened} onClose={adjustHandlers.close} title="Ajustar stock" size="sm">
        {adjustProduct && (
          <Stack>
            <Text fw={600}>{adjustProduct.name}</Text>
            <Text size="sm" c="dimmed">Stock actual: {adjustProduct.stock} {adjustProduct.unit}</Text>
            <NumberInput
              label="Ajuste (positivo = entrada, negativo = salida)"
              value={adjustQty}
              onChange={(v) => setAdjustQty(Number(v) || 0)}
              decimalScale={2}
              leftSection={adjustQty > 0 ? <IconArrowUp size={14} color="green" /> : adjustQty < 0 ? <IconArrowDown size={14} color="red" /> : undefined}
            />
            {adjustQty !== 0 && (
              <Text size="sm" c={adjustQty > 0 ? 'green' : 'red'}>
                Nuevo stock: {adjustProduct.stock + adjustQty} {adjustProduct.unit}
              </Text>
            )}
            <Textarea
              label="Motivo"
              placeholder="Ej: Merma, rotura, devolución, error de conteo..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.currentTarget.value)}
              rows={2}
            />
            <Button onClick={handleAdjust} loading={adjustLoading} disabled={adjustQty === 0}>
              Aplicar ajuste
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Physical count modal */}
      <Modal opened={countOpened} onClose={countHandlers.close} title="Conteo físico" size="sm">
        {countProduct && (
          <Stack>
            <Text fw={600}>{countProduct.name}</Text>
            <Text size="sm" c="dimmed">Stock en sistema: {countProduct.stock} {countProduct.unit}</Text>
            <NumberInput
              label="Cantidad contada"
              value={countQty}
              onChange={(v) => setCountQty(Number(v) || 0)}
              min={0}
              decimalScale={2}
              leftSection={<IconClipboardCheck size={14} />}
            />
            {countQty !== countProduct.stock && (
              <Badge size="lg" color={countQty > countProduct.stock ? 'blue' : 'red'} variant="light">
                Diferencia: {countQty > countProduct.stock ? '+' : ''}{countQty - countProduct.stock} {countProduct.unit}
              </Badge>
            )}
            {countQty === countProduct.stock && (
              <Badge size="lg" color="green" variant="light">Sin diferencia</Badge>
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
