import { useState, useEffect } from 'react'
import {
  Title, Stack, Tabs, Group, Button, Table, Text, Paper, Select,
  SimpleGrid, Card
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconReportAnalytics, IconChartBar, IconCreditCard, IconUsers, IconCoin } from '@tabler/icons-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import 'dayjs/locale/es'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

function getDefaultRange(): [Date, Date] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return [from, now]
}

export default function ReportesPage(): JSX.Element {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(getDefaultRange())
  const [groupBy, setGroupBy] = useState<string>('day')
  const [periodData, setPeriodData] = useState<any[]>([])
  const [productData, setProductData] = useState<any[]>([])
  const [paymentData, setPaymentData] = useState<any[]>([])
  const [customerData, setCustomerData] = useState<any[]>([])
  const [profitData, setProfitData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string | null>('periodo')

  const from = dateRange[0]?.toISOString().slice(0, 10) ?? ''
  const to = dateRange[1]?.toISOString().slice(0, 10) ?? ''

  const loadData = async (): Promise<void> => {
    if (!from || !to) return
    const [rPeriod, rProduct, rPayment, rCustomer, rProfit] = await Promise.all([
      window.api.reports.byPeriod(from, to, groupBy),
      window.api.reports.byProduct(from, to),
      window.api.reports.byPaymentMethod(from, to),
      window.api.reports.byCustomer(from, to),
      window.api.reports.profit(from, to)
    ])
    if (rPeriod.ok) setPeriodData(rPeriod.data as any[])
    if (rProduct.ok) setProductData(rProduct.data as any[])
    if (rPayment.ok) setPaymentData(rPayment.data as any[])
    if (rCustomer.ok) setCustomerData(rCustomer.data as any[])
    if (rProfit.ok) setProfitData(rProfit.data)
  }

  useEffect(() => { loadData() }, [from, to, groupBy])

  const methodLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia'
  }

  return (
    <Stack gap="md">
      <Title order={3}>Reportes</Title>

      <Group>
        <DatePickerInput
          type="range"
          label="Rango de fechas"
          value={dateRange}
          onChange={setDateRange}
          locale="es"
          valueFormat="DD/MM/YYYY"
          clearable={false}
        />
        <Button mt={24} onClick={loadData}>Actualizar</Button>
      </Group>

      {/* Profit summary cards */}
      {profitData && (
        <SimpleGrid cols={4}>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Ingresos</Text>
            <Text fw={700} size="lg">{fmt(profitData.revenue ?? 0)}</Text>
          </Card>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Costo</Text>
            <Text fw={700} size="lg">{fmt(profitData.cost ?? 0)}</Text>
          </Card>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Ganancia</Text>
            <Text fw={700} size="lg" c="green">{fmt(profitData.profit ?? 0)}</Text>
          </Card>
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed">Margen</Text>
            <Text fw={700} size="lg" c="blue">{profitData.marginPercent ?? 0}%</Text>
          </Card>
        </SimpleGrid>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="periodo" leftSection={<IconChartBar size={16} />}>Por Período</Tabs.Tab>
          <Tabs.Tab value="producto" leftSection={<IconReportAnalytics size={16} />}>Por Producto</Tabs.Tab>
          <Tabs.Tab value="pago" leftSection={<IconCreditCard size={16} />}>Por Método</Tabs.Tab>
          <Tabs.Tab value="cliente" leftSection={<IconUsers size={16} />}>Por Cliente</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="periodo" pt="md">
          <Group mb="md">
            <Select
              label="Agrupar por"
              size="xs"
              w={150}
              value={groupBy}
              onChange={(v) => setGroupBy(v ?? 'day')}
              data={[
                { value: 'day', label: 'Día' },
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' }
              ]}
            />
          </Group>
          <Paper withBorder p="md" mb="md">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" fill="#0A6ED1" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Período</Table.Th>
                <Table.Th ta="right">Ventas</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
                <Table.Th ta="right">Descuentos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {periodData.map((r: any) => (
                <Table.Tr key={r.period}>
                  <Table.Td>{r.period}</Table.Td>
                  <Table.Td ta="right">{r.count}</Table.Td>
                  <Table.Td ta="right">{fmt(r.total)}</Table.Td>
                  <Table.Td ta="right">{fmt(r.discountTotal)}</Table.Td>
                </Table.Tr>
              ))}
              {periodData.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin datos</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="producto" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th ta="right">Cantidad</Table.Th>
                <Table.Th ta="right">Ingresos</Table.Th>
                <Table.Th ta="right">Descuentos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {productData.map((r: any, i: number) => (
                <Table.Tr key={i}>
                  <Table.Td>{r.productName}</Table.Td>
                  <Table.Td ta="right">{r.totalQty}</Table.Td>
                  <Table.Td ta="right">{fmt(r.totalRevenue)}</Table.Td>
                  <Table.Td ta="right">{fmt(r.totalDiscount)}</Table.Td>
                </Table.Tr>
              ))}
              {productData.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin datos</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="pago" pt="md">
          <SimpleGrid cols={3} mb="md">
            {paymentData.map((r: any) => (
              <Card withBorder p="md" key={r.method}>
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed">{methodLabels[r.method] ?? r.method}</Text>
                    <Text fw={700} size="lg">{fmt(r.total)}</Text>
                  </div>
                  <IconCoin size={32} color="#0A6ED1" opacity={0.5} />
                </Group>
                <Text size="xs" c="dimmed" mt="xs">{r.count} ventas</Text>
              </Card>
            ))}
          </SimpleGrid>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Método</Table.Th>
                <Table.Th ta="right">Ventas</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paymentData.map((r: any) => (
                <Table.Tr key={r.method}>
                  <Table.Td>{methodLabels[r.method] ?? r.method}</Table.Td>
                  <Table.Td ta="right">{r.count}</Table.Td>
                  <Table.Td ta="right">{fmt(r.total)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="cliente" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cliente</Table.Th>
                <Table.Th ta="right">Compras</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customerData.map((r: any, i: number) => (
                <Table.Tr key={i}>
                  <Table.Td>{r.customerName}</Table.Td>
                  <Table.Td ta="right">{r.count}</Table.Td>
                  <Table.Td ta="right">{fmt(r.total)}</Table.Td>
                </Table.Tr>
              ))}
              {customerData.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}><Text c="dimmed" ta="center">Sin datos</Text></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
