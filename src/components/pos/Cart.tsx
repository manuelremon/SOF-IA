import { Table, ActionIcon, NumberInput, Text, Group, Paper, Button, Stack } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { useCartStore } from '../../stores/cartStore'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface CartProps {
  onPay: () => void
}

export default function Cart({ onPay }: CartProps): JSX.Element {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore()
  const subtotal = getSubtotal()

  return (
    <Paper withBorder p="md" h="100%">
      <Stack justify="space-between" h="100%">
        <div>
          <Text fw={600} mb="sm">
            Carrito ({items.length} items)
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th w={90}>Cant.</Table.Th>
                <Table.Th ta="right">Precio</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
                <Table.Th w={40} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <Table.Tr key={item.productId}>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {item.productName}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={item.quantity}
                      onChange={(v) => updateQuantity(item.productId, Number(v) || 0)}
                      min={1}
                      max={item.stock}
                      size="xs"
                      w={70}
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm">{fmt(item.unitPrice)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={500}>
                      {fmt(item.unitPrice * item.quantity)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {items.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" size="sm" py="xl">
                      Carrito vacío
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>

        <div>
          <Group justify="space-between" mb="sm" pt="sm" style={{ borderTop: '1px solid #e0e0e0' }}>
            <Text size="lg" fw={700}>
              Subtotal
            </Text>
            <Text size="lg" fw={700}>
              {fmt(subtotal)}
            </Text>
          </Group>
          <Button fullWidth size="lg" color="sap" disabled={items.length === 0} onClick={onPay}>
            Cobrar
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}
