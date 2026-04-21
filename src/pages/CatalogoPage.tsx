import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, Badge, ActionIcon,
  Paper, Menu, Select, Text, NativeSelect, Box
} from '@mantine/core'
import {
  IconPlus, IconSearch, IconEdit, IconDots, IconCurrencyDollar, IconBarcode
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import ProductFormModal from '../components/inventory/ProductFormModal'
import CategoryFormModal from '../components/inventory/CategoryFormModal'
import BulkPriceModal from '../components/catalog/BulkPriceModal'
import CameraScanner from '../components/pos/CameraScanner'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { notifications } from '@mantine/notifications'
import { useSettingsStore } from '../stores/settingsStore'
import type { Product, Category } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface SupplierInfo {
  supplierId: number
  supplierName: string
  supplierPrice: number
}

export default function CatalogoPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Supplier data per product: productId -> SupplierInfo[]
  const [supplierMap, setSupplierMap] = useState<Record<number, SupplierInfo[]>>({})
  // Selected supplier per product (for cost display)
  const [selectedSupplier, setSelectedSupplier] = useState<Record<number, number>>({})

  const [productFormOpened, productFormHandlers] = useDisclosure(false)
  const [categoryFormOpened, categoryFormHandlers] = useDisclosure(false)
  const [bulkOpened, bulkHandlers] = useDisclosure(false)
  const [cameraOpened, setCameraOpened] = useState(false)

  const { settings } = useSettingsStore()
  const scannerMode = settings?.scanner_mode || 'both'
  const allowCamera = scannerMode === 'both' || scannerMode === 'camera'
  const allowUsb = scannerMode === 'both' || scannerMode === 'usb'

  const load = (): void => {
    window.api.products
      .list({ search: search || undefined, categoryId: catFilter ? Number(catFilter) : undefined })
      .then(async (r: any) => {
        if (!r.ok) return
        const prods = r.data as Product[]
        setProducts(prods)

        // Load suppliers for all products
        const map: Record<number, SupplierInfo[]> = {}
        const defaults: Record<number, number> = {}
        await Promise.all(
          prods.map(async (p) => {
            const res = await window.api.supplierProducts.listByProduct(p.id)
            if (res.ok && res.data) {
              const suppliers = (res.data as any[]).map((s) => ({
                supplierId: s.supplierId,
                supplierName: s.supplierName,
                supplierPrice: s.supplierPrice
              }))
              if (suppliers.length > 0) {
                // Sort by price ascending — cheapest first
                suppliers.sort((a, b) => a.supplierPrice - b.supplierPrice)
                map[p.id] = suppliers
                defaults[p.id] = suppliers[0].supplierId
              }
            }
          })
        )
        setSupplierMap(map)
        setSelectedSupplier((prev) => ({ ...defaults, ...prev }))
      })
    window.api.categories.list().then((r: any) => { if (r.ok) setCategories(r.data) })
  }

  useEffect(() => { load() }, [search, catFilter])

  const handleBarcodeDetection = async (code: string) => {
    // Buscar si el producto ya existe
    const res = await window.api.products.search(code)
    let foundProd: Product | undefined | null = null

    if (res.ok && res.data) {
      const prods = res.data as Product[]
      foundProd = prods.find((p: Product) => p.barcode === code || p.sku === code)
      if (!foundProd && prods.length === 1) foundProd = prods[0]
    }

    if (foundProd) {
      notifications.show({ title: 'Producto encontrado', message: `Editando: ${foundProd.name}`, color: 'blue' })
      setSelectedProduct(foundProd)
      productFormHandlers.open()
    } else {
      notifications.show({ title: 'Nuevo Producto', message: `Código de barras: ${code}`, color: 'green' })
      setSelectedProduct({ barcode: code } as any)
      productFormHandlers.open()
    }
  }

  useBarcodeScanner(handleBarcodeDetection, allowUsb)

  const getCostForProduct = (p: Product): number => {
    const suppliers = supplierMap[p.id]
    if (!suppliers || suppliers.length === 0) return p.costPrice
    const selId = selectedSupplier[p.id]
    const sel = suppliers.find((s) => s.supplierId === selId)
    return sel ? sel.supplierPrice : suppliers[0].supplierPrice
  }

  return (
    <Stack gap="xl">
      <Box style={{ 
        position: 'sticky', 
        top: -24, // Compensa el padding del AppShell
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
              <Title order={2} fw={800}>Catálogo de Productos</Title>
            </div>
            <Group gap="sm">
              <Button variant="light" color="blue" leftSection={<IconCurrencyDollar size={16} />} onClick={bulkHandlers.open}>
                Precios masivos
              </Button>
              <Button variant="light" color="gray" leftSection={<IconPlus size={16} />} onClick={() => { setSelectedCategory(null); categoryFormHandlers.open() }}>
                Nueva Categoría
              </Button>
              <Button color="sap" leftSection={<IconPlus size={16} />} onClick={() => { setSelectedProduct(null); productFormHandlers.open() }}>
                Nuevo Producto
              </Button>
            </Group>
          </Group>

          <Paper p="md" shadow="sm">
            <Group gap="md">
              <TextInput
                placeholder="Buscar por nombre, marca o código..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              {allowCamera && (
                <Button variant="outline" color="blue" onClick={() => setCameraOpened(true)} leftSection={<IconBarcode size={16} />}>
                  Escanear Cámara
                </Button>
              )}
              <Select
                placeholder="Filtrar por Categoría"
                clearable
                data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                value={catFilter}
                onChange={setCatFilter}
                w={250}
              />
            </Group>
          </Paper>
        </Stack>
      </Box>

      <CameraScanner
        opened={cameraOpened}
        onScan={(code) => {
          setCameraOpened(false)
          handleBarcodeDetection(code)
        }}
        onClose={() => setCameraOpened(false)}
      />

      <Paper withBorder={false} bg="transparent" p={0}>
        <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={160}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Artículo</Table.Th>
              <Table.Th>Atributos</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th ta="right">Costo Ref.</Table.Th>
              <Table.Th ta="right">Precio Venta</Table.Th>
              <Table.Th>Mejor Proveedor</Table.Th>
              <Table.Th ta="center">Estado</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((p) => {
              const suppliers = supplierMap[p.id] || []
              const cost = getCostForProduct(p)

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
                  <Table.Td>
                    <Badge variant="light" color="blue" size="sm">{p.categoryName || 'General'}</Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={500}>{fmt(cost)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fw={800} size="sm" c="sap.7">{fmt(p.salePrice)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {suppliers.length === 0 ? (
                      <Text size="xs" c="dimmed">No asignado</Text>
                    ) : (
                      <NativeSelect
                        size="xs"
                        variant="unstyled"
                        value={String(selectedSupplier[p.id] || suppliers[0].supplierId)}
                        onChange={(e) => setSelectedSupplier((prev) => ({
                          ...prev,
                          [p.id]: parseInt(e.currentTarget.value)
                        }))}
                        data={suppliers.map((s) => ({
                          value: String(s.supplierId),
                          label: `${s.supplierName} (${fmt(s.supplierPrice)})`
                        }))}
                        styles={{ input: { paddingLeft: 0, fontWeight: 600, color: 'var(--mantine-color-blue-7)' } }}
                      />
                    )}
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge size="sm" color={p.isActive ? 'green' : 'gray'} variant="light">
                      {p.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray"><IconDots size={18} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelectedProduct(p); productFormHandlers.open() }}>
                          Editar producto
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {products.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text c="dimmed" ta="center" py="xl">No hay productos que coincidan con la búsqueda</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <ProductFormModal opened={productFormOpened} onClose={productFormHandlers.close} product={selectedProduct} categories={categories} onSaved={load} />
      <CategoryFormModal opened={categoryFormOpened} onClose={categoryFormHandlers.close} category={selectedCategory} onSaved={load} />
      <BulkPriceModal opened={bulkOpened} onClose={bulkHandlers.close} onApplied={load} />
    </Stack>
  )
}
