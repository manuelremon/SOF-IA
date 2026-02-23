import { Modal, Stack, Text, Table, Divider, Group, Button } from '@mantine/core'
import { IconPrinter } from '@tabler/icons-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface ReceiptModalProps {
  opened: boolean
  onClose: () => void
  sale: any
}

export default function ReceiptModal({ opened, onClose, sale }: ReceiptModalProps): JSX.Element {
  if (!sale) return <></>

  return (
    <Modal opened={opened} onClose={onClose} title="Recibo de venta" size="sm">
      <Stack>
        <Text ta="center" fw={700} size="lg">
          {sale.receiptNumber}
        </Text>
        <Text ta="center" size="xs" c="dimmed">
          {sale.createdAt?.slice(0, 16)}
        </Text>
        <Divider />
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Producto</Table.Th>
              <Table.Th ta="right">Cant.</Table.Th>
              <Table.Th ta="right">Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sale.items?.map((item: any) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.productName}</Table.Td>
                <Table.Td ta="right">{item.quantity}</Table.Td>
                <Table.Td ta="right">{fmt(item.lineTotal)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Divider />
        <Group justify="space-between">
          <Text>Subtotal:</Text>
          <Text>{fmt(sale.subtotal)}</Text>
        </Group>
        {sale.taxTotal > 0 && (
          <Group justify="space-between">
            <Text>IVA:</Text>
            <Text>{fmt(sale.taxTotal)}</Text>
          </Group>
        )}
        <Group justify="space-between">
          <Text fw={700} size="lg">
            TOTAL
          </Text>
          <Text fw={700} size="lg">
            {fmt(sale.total)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Pago:</Text>
          <Text size="sm">{sale.paymentMethod}</Text>
        </Group>
        {sale.change > 0 && (
          <Group justify="space-between">
            <Text size="sm">Vuelto:</Text>
            <Text size="sm">{fmt(sale.change)}</Text>
          </Group>
        )}
        <Divider />
        <Button variant="light" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button fullWidth onClick={onClose}>
          Cerrar
        </Button>
      </Stack>
    </Modal>
  )
}
