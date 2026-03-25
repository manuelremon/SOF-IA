import { useEffect, useState } from 'react'
import { Title, Stack, Table, Paper, Text, Badge } from '@mantine/core'
import type { GoodsReceipt } from '../types'

export default function RecepcionesPage(): JSX.Element {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])

  const load = (): void => {
    window.api.goodsReceipts.list({}).then((r: any) => {
      if (r.ok) setReceipts(r.data)
    })
  }

  useEffect(() => { load() }, [])

  return (
    <Stack gap="md">
      <Title order={3}>Recepciones de Mercadería</Title>

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Número</Table.Th>
              <Table.Th>Orden de compra</Table.Th>
              <Table.Th>Proveedor</Table.Th>
              <Table.Th>Recibido por</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Notas</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {receipts.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Badge variant="light" color="green">{r.receiptNumber}</Badge>
                </Table.Td>
                <Table.Td>{r.orderNumber || '—'}</Table.Td>
                <Table.Td>{r.supplierName || '—'}</Table.Td>
                <Table.Td>{r.userName || '—'}</Table.Td>
                <Table.Td>{r.createdAt}</Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1}>{r.notes || '—'}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {receipts.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center" c="dimmed" py="xl">
                  No hay recepciones registradas
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
