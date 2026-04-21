import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper, Badge,
  Text, Modal, NumberInput, Textarea, SegmentedControl, ScrollArea, Loader, Tooltip, Box, SimpleGrid, Divider
} from '@mantine/core'
import {
  IconPlus, IconSearch, IconEdit, IconReceipt2, IconBrandWhatsapp, IconBrain
} from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import type { Customer } from '../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

export default function ClientesPage(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [formOpened, formHandlers] = useDisclosure(false)
  const [filter, setFilter] = useState('todos')

  // Account balances per customer
  const [balances, setBalances] = useState<Record<number, number>>({})

  // Account detail modal
  const [accountCustomer, setAccountCustomer] = useState<Customer | null>(null)
  const [accountData, setAccountData] = useState<any>(null)
  const [accountOpened, accountHandlers] = useDisclosure(false)

  // Payment modal
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentDesc, setPaymentDesc] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Credit limit
  const [creditLimit, setCreditLimit] = useState<number>(0)

  // AI Marketing state
  const [aiMarketingOpened, setAiMarketingOpened] = useState(false)
  const [aiMessage, setAiMarketingMessage] = useState('')
  const [marketingCustomer, setMarketingCustomer] = useState<Customer | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const load = (): void => {
    window.api.customers.list({ search: search || undefined, isActive: true }).then(async (r: any) => {
      if (!r.ok) return
      const custs = r.data as Customer[]
      setCustomers(custs)

      // Fetch balances for each customer
      const bals: Record<number, number> = {}
      await Promise.all(
        custs.map(async (c) => {
          const res = await window.api.customerAccount.getBalance(c.id)
          if (res.ok) bals[c.id] = res.data as number
        })
      )
      setBalances(bals)
    })
  }

  useEffect(() => {
    load()
  }, [search])

  const openAccount = async (customer: Customer): Promise<void> => {
    setAccountCustomer(customer)
    const res = await window.api.customerAccount.get(customer.id)
    if (res.ok) {
      setAccountData(res.data)
      setCreditLimit(res.data.creditLimit)
      accountHandlers.open()
    }
  }

  const handleAddPayment = async (): Promise<void> => {
    if (!accountCustomer || !paymentAmount) return
    setPaymentLoading(true)
    const res = await window.api.customerAccount.payment({
      customerId: accountCustomer.id,
      amount: paymentAmount,
      notes: paymentDesc || undefined
    })
    if (res.ok) {
      notifications.show({ title: 'Pago registrado', message: fmt(paymentAmount), color: 'green' })
      setPaymentAmount(0)
      setPaymentDesc('')
      const r = await window.api.customerAccount.get(accountCustomer.id)
      if (r.ok) setAccountData(r.data)
      load()
    }
    setPaymentLoading(false)
  }

  const handleUpdateCreditLimit = async (): Promise<void> => {
    if (!accountCustomer) return
    const res = await window.api.customerAccount.updateLimit(accountCustomer.id, creditLimit)
    if (res.ok) {
      notifications.show({ title: 'Límite actualizado', message: fmt(creditLimit), color: 'green' })
      const r = await window.api.customerAccount.get(accountCustomer.id)
      if (r.ok) setAccountData(r.data)
    }
  }

  const openAiMarketing = async (customer: Customer) => {
    setMarketingCustomer(customer)
    setAiMarketingOpened(true)
    setIsGenerating(true)
    try {
      const res = await window.api.customerInsight.generateMessage(customer.id)
      if (res.ok) {
        setAiMarketingMessage(res.data)
      } else {
        notifications.show({ title: 'Error IA', message: res.error, color: 'red' })
      }
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo generar el mensaje', color: 'red' })
    } finally {
      setIsGenerating(false)
    }
  }

  const sendWhatsApp = () => {
    if (!marketingCustomer?.phone || !aiMessage) return
    const cleanPhone = marketingCustomer.phone.replace(/\D/g, '')
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(aiMessage)}`
    window.open(url, '_blank')
    setAiMarketingOpened(false)
  }

  const filteredCustomers = filter === 'deudores'
    ? customers.filter((c) => (balances[c.id] ?? 0) > 0)
    : customers

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
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={2} fw={800}>Gestión de Clientes</Title>
            </div>
            <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
              Nuevo Cliente
            </Button>
          </Group>

          <Paper p="md" shadow="sm">
            <Group grow align="flex-end">
              <TextInput
                placeholder="Buscar por nombre, DNI o teléfono..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                size="md"
              />
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                data={[
                  { label: 'Todos los clientes', value: 'todos' },
                  { label: 'Con deuda activa', value: 'deudores' }
                ]}
                size="md"
              />
            </Group>
          </Paper>
        </Stack>
      </Box>

      <Paper withBorder={false} bg="transparent" p={0}>
        <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={160}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre Completo</Table.Th>
              <Table.Th>Contacto</Table.Th>
              <Table.Th ta="right">Saldo Actual</Table.Th>
              <Table.Th ta="center">Estado Cuenta</Table.Th>
              <Table.Th ta="center">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredCustomers.map((c) => {
              const balance = balances[c.id] ?? 0
              return (
                <Table.Tr key={c.id}>
                  <Table.Td><Text fw={700} size="sm">{c.name}</Text></Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{c.phone || '—'}</Text>
                      <Text size="xs" c="dimmed">{c.email || 'Sin email'}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text fw={800} c={balance > 0 ? 'red.7' : 'green.7'}>
                      {fmt(balance)}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    {balance > 0 ? (
                      <Badge color="red" variant="light">DEUDOR</Badge>
                    ) : (
                      <Badge color="green" variant="light">AL DÍA</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      <Tooltip label="Marketing IA (WhatsApp)">
                        <ActionIcon variant="subtle" color="green" onClick={() => openAiMarketing(c)}>
                          <IconBrandWhatsapp size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Editar Perfil">
                        <ActionIcon variant="subtle" onClick={() => { setSelected(c); formHandlers.open() }}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Cuenta Corriente">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openAccount(c)}>
                          <IconReceipt2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {filteredCustomers.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="xl">
                    {filter === 'deudores' ? 'No hay clientes con deuda' : 'No se encontraron clientes'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={aiMarketingOpened}
        onClose={() => setAiMarketingOpened(false)}
        title={
          <Group gap="xs">
            <IconBrain size={20} color="#228be6" />
            <Text fw={600}>Marketing Predictivo SOF-IA</Text>
          </Group>
        }
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            SOF-IA ha analizado las preferencias de <b>{marketingCustomer?.name}</b> para generar un mensaje de fidelización personalizado.
          </Text>
          
          {isGenerating ? (
            <Group justify="center" py="xl">
              <Stack align="center" gap="xs">
                <Loader size="sm" />
                <Text size="xs" c="dimmed">Generando propuesta irresistible...</Text>
              </Stack>
            </Group>
          ) : (
            <>
              <Textarea
                label="Mensaje propuesto"
                rows={6}
                value={aiMessage}
                onChange={(e) => setAiMarketingMessage(e.currentTarget.value)}
              />
              <Group justify="flex-end">
                <Button variant="subtle" color="gray" onClick={() => setAiMarketingOpened(false)}>
                  Cancelar
                </Button>
                <Button 
                  leftSection={<IconBrandWhatsapp size={18} />} 
                  color="green" 
                  onClick={sendWhatsApp}
                  disabled={!marketingCustomer?.phone}
                >
                  Enviar por WhatsApp
                </Button>
              </Group>
              {!marketingCustomer?.phone && (
                <Text size="xs" c="red" ta="center">El cliente no tiene un teléfono registrado.</Text>
              )}
            </>
          )}
        </Stack>
      </Modal>

      <CustomerFormModal
        opened={formOpened}
        onClose={formHandlers.close}
        customer={selected}
        onSaved={load}
      />

      {/* Account detail modal */}
      <Modal
        opened={accountOpened}
        onClose={accountHandlers.close}
        title={`Cuenta corriente — ${accountCustomer?.name}`}
        size="lg"
      >
        {accountData && (
          <Stack gap="md">
            <SimpleGrid cols={3}>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Saldo Deudor</Text>
                <Text size="xl" fw={800} c="red">{fmt(accountData.balance)}</Text>
              </Paper>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Límite Crédito</Text>
                <Text size="xl" fw={800}>{fmt(accountData.creditLimit)}</Text>
              </Paper>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Disponible</Text>
                <Text size="xl" fw={800} c="green">{fmt(accountData.creditLimit - accountData.balance)}</Text>
              </Paper>
            </SimpleGrid>

            <Divider label="Nuevo Pago / Entrega" labelPosition="center" />
            <Group align="flex-end">
              <NumberInput
                label="Monto a abonar"
                value={paymentAmount}
                onChange={(v) => setPaymentAmount(Number(v) || 0)}
                min={0}
                prefix="$ "
                flex={1}
              />
              <TextInput
                label="Referencia"
                placeholder="Ej: Pago efectivo local"
                value={paymentDesc}
                onChange={(e) => setPaymentDesc(e.currentTarget.value)}
                flex={2}
              />
              <Button color="green" onClick={handleAddPayment} loading={paymentLoading}>
                Registrar Pago
              </Button>
            </Group>

            <Divider label="Ajustes de Cuenta" labelPosition="center" />
            <Group align="flex-end">
              <NumberInput
                label="Modificar Límite de Crédito"
                value={creditLimit}
                onChange={(v) => setCreditLimit(Number(v) || 0)}
                min={0}
                prefix="$ "
                flex={1}
              />
              <Button variant="light" color="blue" onClick={handleUpdateCreditLimit}>
                Actualizar Límite
              </Button>
            </Group>

            <Divider label="Historial de Movimientos" labelPosition="center" />
            <ScrollArea h={300}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Concepto</Table.Th>
                    <Table.Th ta="right">Debe (+)</Table.Th>
                    <Table.Th ta="right">Haber (-)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {accountData.movements.map((m: any) => (
                    <Table.Tr key={m.id}>
                      <Table.Td>{m.createdAt.slice(0, 16)}</Table.Td>
                      <Table.Td>
                        <Text size="sm">{m.type === 'sale' ? `Venta #${m.saleReceipt}` : m.notes || 'Pago entregado'}</Text>
                      </Table.Td>
                      <Table.Td ta="right" c="red">{m.type === 'sale' ? fmt(m.amount) : '—'}</Table.Td>
                      <Table.Td ta="right" c="green">{m.type === 'payment' ? fmt(m.amount) : '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
