import { useEffect, useState } from 'react'
import { Title, Stack, SimpleGrid, TextInput, Select, Group } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import ProductCard from '../components/catalog/ProductCard'
import type { Product, Category } from '../types'

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
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
