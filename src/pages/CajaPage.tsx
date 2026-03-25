import { useState, useEffect } from 'react'
import {
  Title, Stack, Card, Group, Text, Button, NumberInput, Table,
  Badge, SimpleGrid, Textarea, Paper, Alert
} from '@mantine/core'
import { IconCash, IconAlertCircle } from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'
import { notifications } from '@mantine/notifications'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function CajaPage(): JSX.Element {
  const { user } = useAuthStore()
  const [currentRegister, setCurrentRegister] = useState<any>(null)
  const [openingAmount, setOpeningAmount] = useState<number>(0)
  const [closingAmount, setClosingAmount] = useState<number>(0)
  const [closeNotes, setCloseNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async (): Promise<void> => {
    const [resCurrent, resHistory] = await Promise.all([
      window.api.cashRegister.current(),
      window.api.cashRegister.list(20)
    ])
    if (resCurrent.ok) setCurrentRegister(resCurrent.data)
    if (resHistory.ok) setHistory(resHistory.data as any[])
  }

  useEffect(() => { loadData() }, [])

  const handleOpen = async (): Promise<void> => {
    setLoading(true)
    const res = await window.api.cashRegister.open({
      userId: user?.id,
      openingAmount
    })
    if (res.ok) {
      notifications.show({ title: 'Caja abierta', message: `Monto inicial: ${fmt(openingAmount)}`, color: 'green' })
      setOpeningAmount(0)
      loadData()
    } else {
      notifications.show({ title: 'Error', message: res.error, color: 'red' })
    }
    setLoading(false)
  }

  const handleClose = async (): Promise<void> => {
    if (!currentRegister) return
    setLoading(true)
    const res = await window.api.cashRegister.close({
      id: currentRegister.id,
      closingAmount,
      notes: closeNotes || undefined
    })
    if (res.ok) {
      const data = res.data as any
      const diff = data.difference ?? 0
      notifications.show({
        title: 'Caja cerrada',
        message: diff === 0 ? 'Sin diferencia' : `Diferencia: ${fmt(diff)}`,
        color: diff === 0 ? 'green' : 'orange'
      })
      setClosingAmount(0)
      setCloseNotes('')
      loadData()
    } else {
      notifications.show({ title: 'Error', message: res.error, color: 'red' })
    }
    setLoading(false)
  }

  return (
    <Stack gap="md">
      <Title order={3}>Caja</Title>

      {/* Current register or open new one */}
      {currentRegister ? (
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <IconCash size={24} color="#27AE60" />
              <Text fw={700} size="lg">Caja Abierta</Text>
              <Badge color="green">Activa</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Abierta: {currentRegister.openedAt?.slice(0, 16)} por {currentRegister.userName}
            </Text>
          </Group>

          <SimpleGrid cols={4} mb="lg">
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">Monto inicial</Text>
              <Text fw={700}>{fmt(currentRegister.openingAmount)}</Text>
            </Card>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">Ventas efectivo</Text>
              <Text fw={700}>{fmt(currentRegister.cashSales)}</Text>
            </Card>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">Ventas tarjeta</Text>
              <Text fw={700}>{fmt(currentRegister.cardSales)}</Text>
            </Card>
            <Card withBorder p="sm">
              <Text size="xs" c="dimmed">Ventas transferencia</Text>
              <Text fw={700}>{fmt(currentRegister.transferSales)}</Text>
            </Card>
          </SimpleGrid>

          <Text fw={600} mb="sm">Cerrar caja</Text>
          <Group align="flex-end" mb="sm">
            <NumberInput
              label="Monto en caja (conteo)"
              value={closingAmount}
              onChange={(v) => setClosingAmount(Number(v) || 0)}
              min={0}
              decimalScale={2}
              prefix="$ "
              thousandSeparator="."
              decimalSeparator=","
              w={200}
            />
            <Textarea
              label="Notas (opcional)"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.currentTarget.value)}
              w={300}
              rows={1}
            />
            <Button color="red" onClick={handleClose} loading={loading}>
              Cerrar caja
            </Button>
          </Group>
        </Paper>
      ) : (
        <Paper withBorder p="lg">
          <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="md">
            No hay caja abierta. Abre una para registrar ventas.
          </Alert>
          <Group align="flex-end">
            <NumberInput
              label="Monto inicial"
              value={openingAmount}
              onChange={(v) => setOpeningAmount(Number(v) || 0)}
              min={0}
              decimalScale={2}
              prefix="$ "
              thousandSeparator="."
              decimalSeparator=","
              w={200}
            />
            <Button color="green" onClick={handleOpen} loading={loading}>
              Abrir caja
            </Button>
          </Group>
        </Paper>
      )}

      {/* History */}
      <Text fw={600} size="lg">Historial de cajas</Text>
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
    </Stack>
  )
}
