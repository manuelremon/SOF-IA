import { useEffect, useState } from 'react'
import { SimpleGrid, Paper, Group, Text, Title, Stack, Table, Box, Badge, Button } from '@mantine/core'
import {
  IconShoppingCart,
  IconPackage,
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
  const [cashFlow, setCashFlow] = useState<any>(null)

  useEffect(() => {
    window.api.dashboard.kpis().then((r: any) => r.ok && setKpis(r.data))
    window.api.dashboard.salesChart(7).then((r: any) => r.ok && setChart(r.data))
    window.api.dashboard.topProducts(5).then((r: any) => r.ok && setTopProducts(r.data))
    window.api.dashboard.recentSales(8).then((r: any) => r.ok && setRecent(r.data))
    window.api.customerAccount.totalDebt().then((r: any) => { if (r.ok) setTotalDebt(r.data as number) })
    window.api.dashboard.cashFlow().then((r: any) => { if (r.ok) setCashFlow(r.data) })
  }, [])

  const kpiCards = kpis
    ? [
        { label: 'Ventas hoy', value: kpis.ventasHoy, sub: fmt(kpis.ingresoHoy), icon: IconShoppingCart, color: '#2196F3' },
        { label: 'Ventas del mes', value: kpis.ventasMes, sub: fmt(kpis.ingresoMes), icon: IconCalendar, color: '#4CAF50' },
        { label: 'Productos', value: kpis.productos, sub: 'En catálogo', icon: IconPackage, color: '#9C27B0' },
        { label: 'Saldo Proyectado (30d)', value: '', sub: cashFlow ? fmt(cashFlow.projection30d) : 'Calculando...', icon: IconReceipt2, color: cashFlow?.projection30d > 0 ? '#4CAF50' : '#F44336' },
        { label: 'Cuentas x cobrar', value: '', sub: fmt(totalDebt), icon: IconReceipt2, color: totalDebt > 0 ? '#FF9800' : '#4CAF50' }
      ]
    : []

  return (
    <Stack gap="xl">
      <Box style={{ 
        position: 'sticky', 
        top: -24, 
        zIndex: 100, 
        backgroundColor: 'var(--mantine-color-body)', 
        margin: '-24px -24px 0 -24px', 
        padding: '24px 24px 16px 24px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
      }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={2} fw={800}>Dashboard</Title>
            </div>
          </Group>
          <PulseAlerts />
        </Stack>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="lg">
        {kpiCards.map((kpi) => (
          <Paper key={kpi.label} p="lg" radius="md">
            <Group justify="space-between" mb={12}>
              <Box style={{ backgroundColor: `${kpi.color}15`, padding: 8, borderRadius: 8 }}>
                <kpi.icon size={22} color={kpi.color} stroke={2} />
              </Box>
              <Badge variant="light" color="gray" size="xs">Hoy</Badge>
            </Group>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>
              {kpi.label}
            </Text>
            <Text size="xl" fw={800} mt={4}>
              {kpi.value || '—'}
            </Text>
            {kpi.sub && (
              <Text size="sm" fw={600} c={kpi.label.includes('Saldo') ? (cashFlow?.projection30d > 0 ? 'green.7' : 'red.7') : 'dark.3'} mt={2}>
                {kpi.sub}
              </Text>
            )}
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper p="lg">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="lg">Tendencia de Ventas</Text>
            <Badge variant="dot" size="sm">Últimos 7 días</Badge>
          </Group>
          <Box h={300}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#868e96', fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#868e96', fontWeight: 500 }} 
                />
                <Tooltip
                  cursor={{ fill: '#f8f9fa' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [fmt(value), 'Ingresos']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Bar dataKey="total" fill="#2196F3" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper p="lg">
          <Group justify="space-between" mb="md">
            <Text fw={700} size="lg">Top Productos</Text>
            <Badge variant="outline" size="sm">Más vendidos</Badge>
          </Group>
          <Table verticalSpacing="sm">
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
                  <Table.Td>
                    <Group gap="sm">
                      <Text size="xs" fw={700} c="dimmed" w={15}>{i + 1}</Text>
                      <Text size="sm" fw={600}>{p.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Badge color="gray" variant="light">{p.qty}</Badge>
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    {fmt(p.revenue)}
                  </Table.Td>
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

      <Paper p="lg">
        <Group justify="space-between" mb="md">
          <Text fw={700} size="lg">Ventas Recientes</Text>
          <Button variant="light" size="xs">Ver todas</Button>
        </Group>
        <Table striped highlightOnHover verticalSpacing="sm">
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
                <Table.Td>
                  <Text size="sm" fw={700}>{s.receiptNumber}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{s.customerName || 'Consumidor Final'}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="dot" color={s.paymentMethod === 'efectivo' ? 'green' : 'blue'} size="sm" tt="capitalize">
                    {s.paymentMethod}
                  </Badge>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm" fw={800} c="sap.7">{fmt(s.total)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{s.createdAt?.slice(0, 16)}</Text>
                </Table.Td>
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
