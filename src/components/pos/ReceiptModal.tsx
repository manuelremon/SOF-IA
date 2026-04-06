import { useEffect, useState, useRef, useCallback } from 'react'
import { Modal, Stack, Text, Table, Divider, Group, Button, Collapse, Badge, UnstyledButton } from '@mantine/core'
import { IconPrinter, IconChevronDown, IconChevronUp, IconFlame, IconReceipt } from '@tabler/icons-react'
import { createRoot } from 'react-dom/client'
import TicketPrint from './TicketPrint'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface ReceiptModalProps {
  opened: boolean
  onClose: () => void
  sale: any
}

export default function ReceiptModal({ opened, onClose, sale }: ReceiptModalProps): JSX.Element {
  const [profitData, setProfitData] = useState<any>(null)
  const [profitOpen, setProfitOpen] = useState(false)
  const [bizSettings, setBizSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (opened && sale?.id) {
      window.api.sales.profitability(sale.id).then((r: any) => {
        if (r.ok) setProfitData(r.data)
      })
      window.api.settings.getAll().then((r: any) => {
        if (r.ok && r.data) setBizSettings(r.data)
      })
    } else {
      setProfitData(null)
      setProfitOpen(false)
    }
  }, [opened, sale?.id])

  const handlePrintTicket = useCallback(() => {
    if (!sale) return
    const printWindow = window.open('', '_blank', 'width=350,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Ticket</title>
      <style>@page { margin: 0; size: 80mm auto; } body { margin: 0; } @media print { body { margin: 0; } }</style>
      </head><body><div id="ticket-root"></div></body></html>
    `)
    printWindow.document.close()

    const root = printWindow.document.getElementById('ticket-root')
    if (root) {
      const reactRoot = createRoot(root)
      reactRoot.render(
        <TicketPrint
          sale={sale}
          businessName={bizSettings.business_name || 'Mi Negocio'}
          businessAddress={bizSettings.business_address || ''}
          businessPhone={bizSettings.business_phone || ''}
          businessTaxId={bizSettings.business_tax_id || ''}
          receiptFooter={bizSettings.receipt_footer || 'Gracias por su compra'}
        />
      )
      setTimeout(() => {
        printWindow.print()
      }, 300)
    }
  }, [sale, bizSettings])

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
        {sale.customerName && (
          <Text ta="center" size="sm">
            Cliente: {sale.customerName}
          </Text>
        )}
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
                <Table.Td>
                  {item.productName}
                  {item.discountTotal > 0 && (
                    <Text size="xs" c="orange">
                      Dto: -{fmt(item.discountTotal)}
                    </Text>
                  )}
                </Table.Td>
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
        {sale.discountTotal > 0 && (
          <Group justify="space-between">
            <Text c="orange">Descuento:</Text>
            <Text c="orange">-{fmt(sale.discountTotal)}</Text>
          </Group>
        )}
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
        {profitData && (
          <>
            <Divider />
            <UnstyledButton onClick={() => setProfitOpen((v) => !v)}>
              <Group gap={6}>
                <IconFlame size={14} />
                <Text size="sm" fw={600}>Rentabilidad</Text>
                <Badge size="sm" variant="light" color={profitData.marginPercent > 25 ? 'green' : profitData.marginPercent > 10 ? 'yellow' : 'red'}>
                  {profitData.marginPercent.toFixed(1)}%
                </Badge>
                {profitOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              </Group>
            </UnstyledButton>
            <Collapse in={profitOpen}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Costo total:</Text>
                  <Text size="xs">{fmt(profitData.totalCost)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Ganancia:</Text>
                  <Text size="xs" fw={600} c={profitData.totalProfit > 0 ? 'green' : 'red'}>
                    {fmt(profitData.totalProfit)}
                  </Text>
                </Group>
                <Table withTableBorder fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Producto</Table.Th>
                      <Table.Th ta="right">Costo</Table.Th>
                      <Table.Th ta="right">Ganancia</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profitData.items.map((pi: any, idx: number) => (
                      <Table.Tr key={idx}>
                        <Table.Td>{pi.productName}</Table.Td>
                        <Table.Td ta="right">{fmt(pi.costTotal)}</Table.Td>
                        <Table.Td ta="right">
                          <Text size="xs" c={pi.profit > 0 ? 'green' : 'red'}>{fmt(pi.profit)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Collapse>
          </>
        )}
        <Divider />
        <Group grow>
          <Button variant="light" leftSection={<IconReceipt size={16} />} onClick={handlePrintTicket}>
            Imprimir ticket
          </Button>
          <Button variant="subtle" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
            Imprimir página
          </Button>
        </Group>
        <Button fullWidth onClick={onClose}>
          Cerrar
        </Button>
      </Stack>
    </Modal>
  )
}
