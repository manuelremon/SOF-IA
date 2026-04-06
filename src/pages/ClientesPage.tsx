import { useEffect, useState } from 'react'
import {
  Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper, Badge,
  Text, Modal, NumberInput, Textarea, Tabs, SegmentedControl, ScrollArea
} from '@mantine/core'
import {
  IconPlus, IconSearch, IconEdit, IconCash, IconUsers, IconReceipt2
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

  const load = (): void => {
    window.api.customers.list({ search: search || undefined, isActive: true }).then(async (r: any) => {
      if (!r.ok) return
      const custs = r.data as Customer[]
      setCustomers(custs)

      // Load balances for all customers
      const bals: Record<number, number> = {}
      await Promise.all(
        custs.map(async (c) => {
          const res = await window.api.customerAccount.get(c.id)
          if (res.ok && res.data) bals[c.id] = (res.data as any).balance ?? 0
        })
      )
      setBalances(bals)
    })
  }

  useEffect(() => { load() }, [search])

  const openAccount = async (customer: Customer): Promise<void> => {
    setAccountCustomer(customer)
    const r = await window.api.customerAccount.get(customer.id)
    if (r.ok && r.data) {
      setAccountData(r.data)
      setCreditLimit((r.data as any).creditLimit ?? 0)
    }
    setPaymentAmount(0)
    setPaymentDesc('')
    accountHandlers.open()
  }

  const handlePayment = async (): Promise<void> => {
    if (!accountCustomer || paymentAmount <= 0) return
    setPaymentLoading(true)
    const res = await window.api.customerAccount.payment({
      customerId: accountCustomer.id,
      amount: paymentAmount,
      description: paymentDesc || 'Pago recibido'
    })
    if (res.ok) {
      notifications.show({ title: 'Pago registrado', message: `${accountCustomer.name}: ${fmt(paymentAmount)}`, color: 'green' })
      setPaymentAmount(0)
      setPaymentDesc('')
      // Refresh account data
      const r = await window.api.customerAccount.get(accountCustomer.id)
      if (r.ok) setAccountData(r.data)
      load()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error, color: 'red' })
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

  const filteredCustomers = filter === 'deudores'
    ? customers.filter((c) => (balances[c.id] ?? 0) > 0)
    : customers

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Clientes</Title>
        <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
          Nuevo cliente
        </Button>
      </Group>

      <Group>
        <TextInput
          placeholder="Buscar clientes..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { label: 'Todos', value: 'todos' },
            { label: 'Deudores', value: 'deudores' }
          ]}
        />
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Teléfono</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th ta="right">Saldo</Table.Th>
              <Table.Th w={90} ta="center">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredCustomers.map((c) => {
              const balance = balances[c.id] ?? 0
              return (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Text fw={500} size="sm">{c.name}</Text>
                  </Table.Td>
                  <Table.Td>{c.phone || '—'}</Table.Td>
                  <Table.Td>{c.email || '—'}</Table.Td>
                  <Table.Td ta="right">
                    {balance > 0 ? (
                      <Badge color="red" variant="light" size="lg">{fmt(balance)}</Badge>
                    ) : (
                      <Text size="sm" c="green">Sin deuda</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      <ActionIcon variant="subtle" onClick={() => { setSelected(c); formHandlers.open() }} title="Editar">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="blue" onClick={() => openAccount(c)} title="Cuenta corriente">
                        <IconReceipt2 size={16} />
                      </ActionIcon>
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

      <CustomerFormModal opened={formOpened} onClose={formHandlers.close} customer={selected} onSaved={load} />

      {/* Account detail modal */}
      <Modal
        opened={accountOpened}
        onClose={accountHandlers.close}
        title={`Cuenta corriente — ${accountCustomer?.name}`}
        size="lg"
      >
        {accountData && (
          <Stack>
            {/* Summary */}
            <Group grow>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed">Saldo</Text>
                <Text fw={800} size="xl" c={accountData.balance > 0 ? 'red' : 'green'}>
                  {fmt(accountData.balance)}
                </Text>
              </Paper>
              <Paper withBorder p="sm">
                <Text size="xs" c="dimmed" mb={4}>Límite de crédito</Text>
                <Group gap="xs">
                  <NumberInput
                    size="xs"
                    value={creditLimit}
                    onChange={(v) => setCreditLimit(Number(v) || 0)}
                    min={0}
                    decimalScale={2}
                    prefix="$ "
                    style={{ flex: 1 }}
                  />
                  <Button size="xs" variant="light" onClick={handleUpdateCreditLimit}>
                    Guardar
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>0 = sin límite</Text>
              </Paper>
            </Group>

            {/* Register payment */}
            <Paper withBorder p="sm">
              <Text fw={600} size="sm" mb="xs">Registrar pago</Text>
              <Group align="flex-end" gap="xs">
                <NumberInput
                  label="Monto"
                  value={paymentAmount}
                  onChange={(v) => setPaymentAmount(Number(v) || 0)}
                  min={0}
                  decimalScale={2}
                  prefix="$ "
                  size="sm"
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Descripción"
                  placeholder="Ej: Pago en efectivo"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.currentTarget.value)}
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button
                  color="green"
                  size="sm"
                  leftSection={<IconCash size={16} />}
                  onClick={handlePayment}
                  loading={paymentLoading}
                  disabled={paymentAmount <= 0}
                >
                  Registrar pago
                </Button>
              </Group>
            </Paper>

            {/* Movements history */}
            <Text fw={600} size="sm">Historial de movimientos</Text>
            <ScrollArea h={250}>
              <Table striped fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th ta="right">Monto</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(accountData.movements ?? []).map((m: any) => (
                    <Table.Tr key={m.id}>
                      <Table.Td>{m.createdAt?.slice(0, 16)}</Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={m.type === 'cargo' ? 'red' : 'green'} variant="light">
                          {m.type === 'cargo' ? 'Cargo' : 'Pago'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{m.description || '—'}</Table.Td>
                      <Table.Td ta="right">
                        <Text fw={600} c={m.type === 'cargo' ? 'red' : 'green'}>
                          {m.type === 'cargo' ? '+' : '-'}{fmt(m.amount)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {(!accountData.movements || accountData.movements.length === 0) && (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text c="dimmed" ta="center">Sin movimientos</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
