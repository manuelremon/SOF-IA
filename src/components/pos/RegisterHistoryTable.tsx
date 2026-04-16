import { Table, Text, Badge } from '@mantine/core'

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export function RegisterHistoryTable({ history }: { history: any[] }): JSX.Element {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Apertura</Table.Th>
          <Table.Th>Cierre</Table.Th>
          <Table.Th>Usuario</Table.Th>
          <Table.Th ta="right">Ventas</Table.Th>
          <Table.Th ta="right">Total ventas</Table.Th>
          <Table.Th ta="right">Esperado</Table.Th>
          <Table.Th ta="right">Contado</Table.Th>
          <Table.Th ta="right">Diferencia</Table.Th>
          <Table.Th>Estado</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {history.map((r) => (
          <Table.Tr key={r.id}>
            <Table.Td>{r.openedAt?.slice(0, 16)}</Table.Td>
            <Table.Td>{r.closedAt?.slice(0, 16) ?? '-'}</Table.Td>
            <Table.Td>{r.userName}</Table.Td>
            <Table.Td ta="right">{r.salesCount}</Table.Td>
            <Table.Td ta="right">{fmt(r.totalSales)}</Table.Td>
            <Table.Td ta="right">{r.expectedAmount != null ? fmt(r.expectedAmount) : '-'}</Table.Td>
            <Table.Td ta="right">{r.closingAmount != null ? fmt(r.closingAmount) : '-'}</Table.Td>
            <Table.Td ta="right">
              {r.difference != null ? (
                <Text c={r.difference === 0 ? 'green' : 'red'} fw={500} size="sm">
                  {fmt(r.difference)}
                </Text>
              ) : '-'}
            </Table.Td>
            <Table.Td>
              <Badge color={r.status === 'abierta' ? 'green' : 'gray'} size="sm">
                {r.status}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
        {history.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={9}>
              <Text c="dimmed" ta="center">Sin historial</Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  )
}
