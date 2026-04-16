import { useState, useEffect } from 'react'
import { Stack, Paper, Group, Select, TextInput, Button, Table, Badge, Text } from '@mantine/core'

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export function MovementsViewer({ data, filters, onFilter }: { data: any[]; filters: any; onFilter: (filters: any) => void }): JSX.Element {
  const [type, setType] = useState(filters.type)
  const [dateStr, setDateStr] = useState(filters.from)

  useEffect(() => {
    setType(filters.type)
    setDateStr(filters.from)
  }, [filters])

  const handleApply = () => {
    onFilter({
      type,
      from: dateStr || undefined,
      to: dateStr || undefined
    })
  }

  return (
    <Stack gap="md">
      <Paper withBorder p="sm" bg="gray.0">
        <Group align="flex-end">
          <Select
            label="Tipo de movimiento"
            data={[
              { value: 'todos', label: 'Todos' },
              { value: 'ingreso', label: 'Ingresos' },
              { value: 'egreso', label: 'Egresos' }
            ]}
            value={type}
            onChange={(v) => setType(v || 'todos')}
            w={200}
          />
          <TextInput
            label="Fecha Específica"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.currentTarget.value)}
            w={200}
          />
          <Button onClick={handleApply}>Filtrar</Button>
        </Group>
      </Paper>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha y Hora</Table.Th>
            <Table.Th>Documento</Table.Th>
            <Table.Th>Medio</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th ta="right">Importe</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((m, i) => (
            <Table.Tr key={`${m.docType}-${m.refId}-${i}`}>
              <Table.Td>{m.createdAt?.slice(0, 16)}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Badge color={m.docType === 'Venta' ? 'blue' : 'violet'} variant="light">
                    {m.docType}
                  </Badge>
                  {m.receiptNumber !== 'N/A' && <Text size="sm">{m.receiptNumber}</Text>}
                </Group>
              </Table.Td>
              <Table.Td style={{ textTransform: 'capitalize' }}>{m.paymentMethod}</Table.Td>
              <Table.Td>
                <Badge color={m.type === 'ingreso' ? 'green' : 'red'}>
                  {m.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
             </Badge>
              </Table.Td>
              <Table.Td ta="right" fw={600} c={m.type === 'ingreso' ? 'green' : 'red'}>
                {m.type === 'egreso' ? '-' : ''}{fmt(m.amount)}
              </Table.Td>
            </Table.Tr>
          ))}
          {data.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} ta="center" c="dimmed">
                No hay movimientos para estos filtros.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
