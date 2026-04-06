import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, Badge, ActionIcon,
  Paper, Menu, Select, Text, NativeSelect
} from '@mantine/core'
import {
  IconPlus, IconSearch, IconEdit, IconDots, IconCurrencyDollar
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import ProductFormModal from '../components/inventory/ProductFormModal'
import CategoryFormModal from '../components/inventory/CategoryFormModal'
import BulkPriceModal from '../components/catalog/BulkPriceModal'
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

  const getCostForProduct = (p: Product): number => {
    const suppliers = supplierMap[p.id]
    if (!suppliers || suppliers.length === 0) return p.costPrice
    const selId = selectedSupplier[p.id]
    const sel = suppliers.find((s) => s.supplierId === selId)
    return sel ? sel.supplierPrice : suppliers[0].supplierPrice
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Catálogo de Productos</Title>
        <Group>
          <Button variant="light" color="blue" leftSection={<IconCurrencyDollar size={16} />} onClick={bulkHandlers.open}>
            Actualizar precios
          </Button>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => { setSelectedCategory(null); categoryFormHandlers.open() }}>
            Categoría
          </Button>
          <Button color="sap" leftSection={<IconPlus size={16} />} onClick={() => { setSelectedProduct(null); productFormHandlers.open() }}>
            Nuevo producto
          </Button>
        </Group>
      </Group>

      <Group>
        <TextInput
          placeholder="Buscar productos..."
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
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Código</Table.Th>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th ta="right">Costo</Table.Th>
              <Table.Th ta="right">Precio venta</Table.Th>
              <Table.Th ta="right">Stock mín.</Table.Th>
              <Table.Th>Proveedores</Table.Th>
              <Table.Th ta="center">Activo</Table.Th>
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
                    <Text size="sm" c="dimmed">{p.barcode || p.sku || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm">{p.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{p.categoryName || '—'}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={500}>{fmt(cost)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fw={700} size="sm">{fmt(p.salePrice)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" c="dimmed">{p.minStock}</Text>
                  </Table.Td>
                  <Table.Td>
                    {suppliers.length === 0 ? (
                      <Text size="xs" c="dimmed">—</Text>
                    ) : suppliers.length === 1 ? (
                      <Text size="xs">{suppliers[0].supplierName}</Text>
                    ) : (
                      <NativeSelect
                        size="xs"
                        value={String(selectedSupplier[p.id] || suppliers[0].supplierId)}
                        onChange={(e) => setSelectedSupplier((prev) => ({
                          ...prev,
                          [p.id]: parseInt(e.currentTarget.value)
                        }))}
                        data={suppliers.map((s) => ({
                          value: String(s.supplierId),
                          label: `${s.supplierName} (${fmt(s.supplierPrice)})`
                        }))}
                        styles={{ input: { minHeight: 28, height: 28, paddingTop: 0, paddingBottom: 0, fontSize: 12 } }}
                      />
                    )}
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge size="sm" color={p.isActive ? 'green' : 'gray'} variant="light">
                      {p.isActive ? 'Sí' : 'No'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu>
                      <Menu.Target>
                        <ActionIcon variant="subtle"><IconDots size={16} /></ActionIcon>
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
                <Table.Td colSpan={9}>
                  <Text c="dimmed" ta="center" py="xl">No se encontraron productos</Text>
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
