import { useState, useEffect } from 'react'
import {
  Title, Stack, Tabs, Group, Button, Table, Text, Paper, Select,
  SimpleGrid, Card, Box, ActionIcon, RingProgress, Badge, Modal, rem
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  IconReportAnalytics, IconChartBar, IconCreditCard, IconUsers, IconCoin,
  IconTruck, IconUserSearch, IconEye, IconCamera
} from '@tabler/icons-react'
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
  const [supplierRanking, setSupplierRanking] = useState<any[]>([])
  const [segmentation, setSegmentation] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [auditImage, setAuditImage] = useState<string | null>(null)
  const [auditOpened, setAuditOpened] = useState(false)

  const from = dateRange[0]?.toISOString().slice(0, 10) ?? ''
  const to = dateRange[1]?.toISOString().slice(0, 10) ?? ''

  const loadData = async (): Promise<void> => {
    if (!from || !to) return
    const [rPeriod, rProduct, rPayment, rCustomer, rProfit, rSales] = await Promise.all([
      window.api.reports.byPeriod(from, to, groupBy),
      window.api.reports.byProduct(from, to),
      window.api.reports.byPaymentMethod(from, to),
      window.api.reports.byCustomer(from, to),
      window.api.reports.profit(from, to),
      window.api.sales.list({ from, to })
    ])
    if (rPeriod.ok) setPeriodData(rPeriod.data as any[])
    if (rProduct.ok) setProductData(rProduct.data as any[])
    if (rPayment.ok) setPaymentData(rPayment.data as any[])
    if (rCustomer.ok) setCustomerData(rCustomer.data as any[])
    if (rProfit.ok) setProfitData(rProfit.data)
    if (rSales.ok) setSales(rSales.data as any[])
  }

  useEffect(() => { loadData() }, [from, to, groupBy])

  useEffect(() => {
    if (activeTab === 'proveedores') {
      window.api.supplierScorecard.ranking().then((r: any) => {
        if (r.ok) setSupplierRanking(r.data)
      })
    }
    if (activeTab === 'segmentacion') {
      window.api.customerInsight.segmentation().then((r: any) => {
        if (r.ok) setSegmentation(r.data)
      })
    }
  }, [activeTab])

  const methodLabels: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia'
  }

  return (
    <Stack gap="md">
      <Box style={{ 
        position: 'sticky', 
        top: -24, 
        zIndex: 100, 
        backgroundColor: 'var(--mantine-color-body)', 
        margin: '-24px -24px 0 -24px', 
        padding: '24px 24px 8px 24px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
      }}>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>Reportes</Title>
            <Group align="flex-end">
              <DatePickerInput
                type="range"
                size="xs"
                placeholder="Rango de fechas"
                value={dateRange}
                onChange={setDateRange}
                locale="es"
                valueFormat="DD/MM/YYYY"
                clearable={false}
                w={220}
              />
              <Button size="xs" onClick={loadData}>Actualizar</Button>
            </Group>
          </Group>

          {/* Profit summary cards inside sticky header for quick reference */}
          {profitData && (
            <SimpleGrid cols={{ base: 2, md: 4 }} gap="xs">
              <Paper p="xs" radius="sm">
                <Text size="10px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Ingresos</Text>
                <Text fw={800} size="sm">{fmt(profitData.revenue ?? 0)}</Text>
              </Paper>
              <Paper p="xs" radius="sm">
                <Text size="10px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Costo</Text>
                <Text fw={800} size="sm">{fmt(profitData.cost ?? 0)}</Text>
              </Paper>
              <Paper p="xs" radius="sm" style={{ borderLeft: '3px solid #4CAF50' }}>
                <Text size="10px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Ganancia</Text>
                <Text fw={800} size="sm" c="green.7">{fmt(profitData.profit ?? 0)}</Text>
              </Paper>
              <Paper p="xs" radius="sm" style={{ borderLeft: '3px solid #2196F3' }}>
                <Text size="10px" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.5px' }}>Margen</Text>
                <Text fw={800} size="sm" c="blue.7">{profitData.marginPercent ?? 0}%</Text>
              </Paper>
            </SimpleGrid>
          )}

          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" size="xs" radius="md">
            <Tabs.List>
              <Tabs.Tab value="periodo" leftSection={<IconChartBar size={14} />}>Ventas & Período</Tabs.Tab>
              <Tabs.Tab value="producto" leftSection={<IconReportAnalytics size={14} />}>Por Producto</Tabs.Tab>
              <Tabs.Tab value="pago" leftSection={<IconCreditCard size={14} />}>Métodos de Pago</Tabs.Tab>
              <Tabs.Tab value="cliente" leftSection={<IconUsers size={14} />}>Ranking Clientes</Tabs.Tab>
              <Tabs.Tab value="proveedores" leftSection={<IconTruck size={14} />}>Proveedores</Tabs.Tab>
              <Tabs.Tab value="segmentacion" leftSection={<IconUserSearch size={14} />}>Segmentación RFM</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Stack>
      </Box>

      <Tabs value={activeTab} onChange={setActiveTab} variant="unstyled">
        <Tabs.Panel value="periodo" pt="md">
          <Group justify="space-between" mb="lg">
            <Title order={4}>Evolución de Ingresos</Title>
            <Select
              size="xs"
              w={150}
              label="Agrupar por"
              value={groupBy}
              onChange={(v) => setGroupBy(v ?? 'day')}
              data={[
                { value: 'day', label: 'Día' },
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' }
              ]}
            />
          </Group>
          
          <Paper p="lg" mb="xl">
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f5" />
                  <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8f9fa' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(v: number) => fmt(v)} 
                  />
                  <Bar dataKey="total" fill="#2196F3" radius={[4, 4, 0, 0]} name="Ingresos" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper p="lg">
            <Title order={4} mb="md">Detalle de Ventas</Title>
            <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={200}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ticket</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Cliente</Table.Th>
                  <Table.Th ta="right">Importe</Table.Th>
                  <Table.Th ta="center">Auditoría</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sales.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td><Text size="sm" fw={700}>{s.receiptNumber}</Text></Table.Td>
                    <Table.Td><Text size="sm">{s.createdAt?.slice(0, 16)}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={500}>{s.customerName || 'Consumidor Final'}</Text></Table.Td>
                    <Table.Td ta="right"><Text size="sm" fw={800} c="sap.7">{fmt(s.total)}</Text></Table.Td>
                    <Table.Td ta="center">
                      {s.auditImagePath ? (
                        <ActionIcon 
                          variant="light" 
                          color="blue" 
                          size="sm"
                          onClick={() => {
                            setAuditImage(s.auditImagePath)
                            setAuditOpened(true)
                          }}
                        >
                          <IconCamera size={16} />
                        </ActionIcon>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="producto" pt="md">
          <Table striped highlightOnHover stickyHeader stickyHeaderOffset={200}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th ta="right">Vendidos</Table.Th>
                <Table.Th ta="right">Ingresos</Table.Th>
                <Table.Th ta="right">Descuentos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {productData.map((r: any) => (
                <Table.Tr key={r.productId}>
                  <Table.Td>{r.productName}</Table.Td>
                  <Table.Td ta="right">{r.totalQty}</Table.Td>
                  <Table.Td ta="right">{fmt(r.totalRevenue)}</Table.Td>
                  <Table.Td ta="right">{fmt(r.totalDiscount)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="pago" pt="md">
          <Table stickyHeader stickyHeaderOffset={200}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Método</Table.Th>
                <Table.Th ta="right">Cant. Ventas</Table.Th>
                <Table.Th ta="right">Total Recaudado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paymentData.map((r: any) => (
                <Table.Tr key={r.paymentMethod}>
                  <Table.Td style={{ textTransform: 'capitalize' }}>
                    {methodLabels[r.paymentMethod] || r.paymentMethod}
                  </Table.Td>
                  <Table.Td ta="right">{r.count}</Table.Td>
                  <Table.Td ta="right">{fmt(r.total)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="cliente" pt="md">
          <Table striped highlightOnHover stickyHeader stickyHeaderOffset={200}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cliente</Table.Th>
                <Table.Th ta="right">Cant. Compras</Table.Th>
                <Table.Th ta="right">Total Invertido</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customerData.map((r: any) => (
                <Table.Tr key={r.customerId}>
                  <Table.Td>{r.customerName || 'Consumidor Final'}</Table.Td>
                  <Table.Td ta="right">{r.count}</Table.Td>
                  <Table.Td ta="right">{fmt(r.total)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="proveedores" pt="md">
          <Table striped highlightOnHover stickyHeader stickyHeaderOffset={200}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Proveedor</Table.Th>
                <Table.Th ta="center">Calificación</Table.Th>
                <Table.Th ta="right">Tiempo Entrega</Table.Th>
                <Table.Th ta="right">Items Recibidos</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {supplierRanking.map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.name}</Table.Td>
                  <Table.Td ta="center">
                    <Badge color={r.score > 80 ? 'green' : r.score > 50 ? 'orange' : 'red'}>
                      {r.score}%
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">{r.avgLeadTime ? `${r.avgLeadTime} días` : '—'}</Table.Td>
                  <Table.Td ta="right">{r.totalItems}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="segmentacion" pt="md">
          <SimpleGrid cols={3} mb="md">
            {segmentation.map((s: any) => (
              <Card key={s.segment} withBorder>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">{s.segment}</Text>
                <Group justify="space-between" align="flex-end" mt="sm">
                  <Text size="xl" fw={800}>{s.count}</Text>
                  <RingProgress 
                    size={60} 
                    thickness={6} 
                    sections={[{ value: 100, color: 'blue' }]} 
                    label={<Text size="xs" ta="center" fw={700}>{Math.round((s.count / customerData.length) * 100)}%</Text>}
                  />
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          <Table stickyHeader stickyHeaderOffset={200}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Segmento</Table.Th>
                <Table.Th ta="right">Valor</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {segmentation.flatMap(s => s.customers).map((c: any) => (
                <Table.Tr key={c.id}>
                  <Table.Td>{c.name}</Table.Td>
                  <Table.Td>
                    <Badge variant="dot" size="sm">{c.segment}</Badge>
                  </Table.Td>
                  <Table.Td ta="right">{fmt(c.lifetimeValue)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal 
        opened={auditOpened} 
        onClose={() => setAuditOpened(false)} 
        title="Foto de Auditoría de Venta"
        size="lg"
      >
        {auditImage ? (
          <img 
            src={auditImage} 
            alt="Auditoría" 
            style={{ width: '100%', borderRadius: '8px', border: '1px solid #eee' }} 
          />
        ) : (
          <Text ta="center" py="xl" c="dimmed">No hay imagen disponible</Text>
        )}
      </Modal>
    </Stack>
  )
}
