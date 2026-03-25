import { useEffect, useState } from 'react'
import { Title, Stack, TextInput, Select, Group, Table, Badge, Text } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import type { Product, Category } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function CatalogoPage(): JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)

  useEffect(() => {
    window.api.products
      .list({ isActive: true, search: search || undefined, categoryId: catFilter ? Number(catFilter) : undefined })
      .then((r: any) => { if (r.ok) setProducts(r.data) })
    window.api.categories.list().then((r: any) => { if (r.ok) setCategories(r.data) })
  }, [search, catFilter])

  return (
    <Stack gap="md">
      <Title order={3}>Catálogo de Productos</Title>
      <Group>
        <TextInput
          placeholder="Buscar..."
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
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Producto</Table.Th>
            <Table.Th>Categoría</Table.Th>
            <Table.Th>Código</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Precio</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Stock</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {products.map((p) => (
            <Table.Tr key={p.id}>
              <Table.Td>
                <Text fw={600} size="sm">{p.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">{p.categoryName || '—'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">{p.barcode || p.sku || '—'}</Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text fw={700} size="sm">{fmt(p.salePrice)}</Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Badge size="sm" color={p.stock > 0 ? 'green' : 'red'} variant="light">
                  {p.stock > 0 ? p.stock : 'Sin stock'}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
