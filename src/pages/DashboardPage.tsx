import { useEffect, useState } from 'react'
import { SimpleGrid, Paper, Group, Text, Title, Stack, Table, Box } from '@mantine/core'
import {
  IconCash,
  IconShoppingCart,
  IconPackage,
  IconAlertTriangle,
  IconUsers,
  IconCalendar,
  IconReceipt2
} from '@tabler/icons-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { KpiData, SalesChartPoint, TopProduct, RecentSale } from '../types'
import PulseAlerts from '../components/dashboard/PulseAlerts'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function DashboardPage(): JSX.Element {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [chart, setChart] = useState<SalesChartPoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recent, setRecent] = useState<RecentSale[]>([])
  const [totalDebt, setTotalDebt] = useState<number>(0)

  useEffect(() => {
    window.api.dashboard.kpis().then((r: any) => r.ok && setKpis(r.data))
    window.api.dashboard.salesChart(7).then((r: any) => r.ok && setChart(r.data))
    window.api.dashboard.topProducts(5).then((r: any) => r.ok && setTopProducts(r.data))
    window.api.dashboard.recentSales(8).then((r: any) => r.ok && setRecent(r.data))
    window.api.customerAccount.totalDebt().then((r: any) => { if (r.ok) setTotalDebt(r.data as number) })
  }, [])

  const kpiCards = kpis
    ? [
        { label: 'Ventas hoy', value: kpis.ventasHoy, sub: fmt(kpis.ingresoHoy), icon: IconShoppingCart, color: '#0A6ED1' },
        { label: 'Ventas del mes', value: kpis.ventasMes, sub: fmt(kpis.ingresoMes), icon: IconCalendar, color: '#107E7D' },
        { label: 'Productos', value: kpis.productos, sub: '', icon: IconPackage, color: '#6C757D' },
        { label: 'Stock bajo', value: kpis.stockBajo, sub: '', icon: IconAlertTriangle, color: kpis.stockBajo > 0 ? '#E74C3C' : '#27AE60' },
        { label: 'Clientes', value: kpis.clientes, sub: '', icon: IconUsers, color: '#8E44AD' },
        { label: 'Cuentas x cobrar', value: '', sub: fmt(totalDebt), icon: IconReceipt2, color: totalDebt > 0 ? '#E67E22' : '#27AE60' }
      ]
    : []

  return (
    <Stack gap="md">
      <Title order={3}>Dashboard</Title>

      <PulseAlerts />

      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
        {kpiCards.map((kpi) => (
          <Paper key={kpi.label} p="md" withBorder>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {kpi.label}
              </Text>
              <kpi.icon size={20} color={kpi.color} />
            </Group>
            <Text size="xl" fw={700}>
              {kpi.value}
            </Text>
            {kpi.sub && (
              <Text size="sm" c="dimmed">
                {kpi.sub}
              </Text>
            )}
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper p="md" withBorder>
          <Text fw={600} mb="sm">
            Ventas - Últimos 7 días
          </Text>
          <Box h={250}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Bar dataKey="total" fill="#0A6ED1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper p="md" withBorder>
          <Text fw={600} mb="sm">
            Top 5 productos (30 días)
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th ta="right">Cant.</Table.Th>
                <Table.Th ta="right">Ingreso</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topProducts.map((p, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td ta="right">{p.qty}</Table.Td>
                  <Table.Td ta="right">{fmt(p.revenue)}</Table.Td>
                </Table.Tr>
              ))}
              {topProducts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text c="dimmed" ta="center" size="sm">
                      Sin datos
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>

      <Paper p="md" withBorder>
        <Text fw={600} mb="sm">
          Ventas recientes
        </Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Recibo</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Pago</Table.Th>
              <Table.Th ta="right">Total</Table.Th>
              <Table.Th>Fecha</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {recent.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.receiptNumber}</Table.Td>
                <Table.Td>{s.customerName || '—'}</Table.Td>
                <Table.Td>{s.paymentMethod}</Table.Td>
                <Table.Td ta="right">{fmt(s.total)}</Table.Td>
                <Table.Td>{s.createdAt?.slice(0, 16)}</Table.Td>
              </Table.Tr>
            ))}
            {recent.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" size="sm">
                    Sin ventas recientes
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
