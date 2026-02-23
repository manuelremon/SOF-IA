import { useState, useCallback } from 'react'
import { TextInput, Paper, Stack, Group, Text, UnstyledButton, Badge } from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import type { Product } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface ProductSearchProps {
  onSelect: (product: Product) => void
}

export default function ProductSearch({ onSelect }: ProductSearchProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])

  const search = useDebouncedCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return }
    const res = await window.api.products.search(q)
    if (res.ok && res.data) setResults(res.data as Product[])
  }, 250)

  const handleChange = (value: string): void => {
    setQuery(value)
    search(value)
  }

  const handleSelect = (product: Product): void => {
    onSelect(product)
    setQuery('')
    setResults([])
  }

  return (
    <Stack gap={0} pos="relative">
      <TextInput
        placeholder="Buscar producto por nombre, código o SKU..."
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(e) => handleChange(e.currentTarget.value)}
        size="md"
      />
      {results.length > 0 && (
        <Paper
          shadow="md"
          withBorder
          pos="absolute"
          top={42}
          left={0}
          right={0}
          style={{ zIndex: 100, maxHeight: 300, overflowY: 'auto' }}
        >
          {results.map((p) => (
            <UnstyledButton
              key={p.id}
              w="100%"
              p="xs"
              onClick={() => handleSelect(p)}
              styles={{ root: { '&:hover': { backgroundColor: '#f5f6f7' } } }}
            >
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={500}>
                    {p.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {p.barcode || p.sku || ''}
                  </Text>
                </div>
                <Group gap="xs">
                  <Badge size="sm" variant="light" color={p.stock > 0 ? 'green' : 'red'}>
                    Stock: {p.stock}
                  </Badge>
                  <Text fw={600} size="sm">
                    {fmt(p.salePrice)}
                  </Text>
                </Group>
              </Group>
            </UnstyledButton>
          ))}
        </Paper>
      )}
    </Stack>
  )
}
