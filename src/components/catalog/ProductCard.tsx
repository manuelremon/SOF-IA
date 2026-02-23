import { Paper, Text, Badge, Stack, Group } from '@mantine/core'
import { IconPackage } from '@tabler/icons-react'
import type { Product } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps): JSX.Element {
  return (
    <Paper withBorder p="sm" h="100%">
      <Stack gap="xs">
        <Group justify="center" py="md" style={{ backgroundColor: '#f5f6f7', borderRadius: 4 }}>
          <IconPackage size={40} color="#adb5bd" />
        </Group>
        <Text fw={600} size="sm" lineClamp={2}>
          {product.name}
        </Text>
        {product.categoryName && (
          <Text size="xs" c="dimmed">
            {product.categoryName}
          </Text>
        )}
        <Group justify="space-between">
          <Text fw={700} c="sap">
            {fmt(product.salePrice)}
          </Text>
          <Badge size="sm" color={product.stock > 0 ? 'green' : 'red'} variant="light">
            {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
          </Badge>
        </Group>
      </Stack>
    </Paper>
  )
}
