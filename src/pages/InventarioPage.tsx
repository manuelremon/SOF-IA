import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, Badge, ActionIcon, Tabs, Paper, Menu, Select
} from '@mantine/core'
import { IconPlus, IconSearch, IconEdit, IconAdjustmentsAlt, IconDots, IconTrash } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import ProductFormModal from '../components/inventory/ProductFormModal'
import CategoryFormModal from '../components/inventory/CategoryFormModal'
import StockAdjustModal from '../components/inventory/StockAdjustModal'
import type { Product, Category } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function InventarioPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)

  const [productFormOpened, productFormHandlers] = useDisclosure(false)
  const [categoryFormOpened, categoryFormHandlers] = useDisclosure(false)
  const [stockModalOpened, stockModalHandlers] = useDisclosure(false)

  const load = (): void => {
    window.api.products.list({ search: search || undefined, categoryId: catFilter ? Number(catFilter) : undefined }).then((r: any) => {
      if (r.ok) setProducts(r.data)
    })
    window.api.categories.list().then((r: any) => { if (r.ok) setCategories(r.data) })
  }

  useEffect(() => { load() }, [search, catFilter])

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Inventario</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => { setSelectedCategory(null); categoryFormHandlers.open() }}>
            Categoría
          </Button>
          <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelectedProduct(null); productFormHandlers.open() }}>
            Producto
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
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>SKU</Table.Th>
              <Table.Th ta="right">Costo</Table.Th>
              <Table.Th ta="right">Precio</Table.Th>
              <Table.Th ta="right">Stock</Table.Th>
              <Table.Th w={60} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td>{p.categoryName || '—'}</Table.Td>
                <Table.Td>{p.sku || '—'}</Table.Td>
                <Table.Td ta="right">{fmt(p.costPrice)}</Table.Td>
                <Table.Td ta="right">{fmt(p.salePrice)}</Table.Td>
                <Table.Td ta="right">
                  <Badge color={p.stock <= p.minStock ? 'red' : 'green'} variant="light">
                    {p.stock}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="subtle"><IconDots size={16} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelectedProduct(p); productFormHandlers.open() }}>
                        Editar
                      </Menu.Item>
                      <Menu.Item leftSection={<IconAdjustmentsAlt size={14} />} onClick={() => { setStockProduct(p); stockModalHandlers.open() }}>
                        Ajustar stock
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <ProductFormModal
        opened={productFormOpened}
        onClose={productFormHandlers.close}
        product={selectedProduct}
        categories={categories}
        onSaved={load}
      />
      <CategoryFormModal
        opened={categoryFormOpened}
        onClose={categoryFormHandlers.close}
        category={selectedCategory}
        onSaved={load}
      />
      <StockAdjustModal
        opened={stockModalOpened}
        onClose={stockModalHandlers.close}
        product={stockProduct}
        onSaved={load}
      />
    </Stack>
  )
}
