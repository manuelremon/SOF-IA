import { useEffect, useState } from 'react'
import { Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper } from '@mantine/core'
import { IconPlus, IconSearch, IconEdit } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import type { Customer } from '../types'

export default function ClientesPage(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [formOpened, formHandlers] = useDisclosure(false)

  const load = (): void => {
    window.api.customers.list({ search: search || undefined }).then((r: any) => {
      if (r.ok) setCustomers(r.data)
    })
  }

  useEffect(() => { load() }, [search])

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Clientes</Title>
        <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
          Nuevo cliente
        </Button>
      </Group>

      <TextInput
        placeholder="Buscar clientes..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Teléfono</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Dirección</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {customers.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>{c.phone || '—'}</Table.Td>
                <Table.Td>{c.email || '—'}</Table.Td>
                <Table.Td>{c.address || '—'}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="subtle" onClick={() => { setSelected(c); formHandlers.open() }}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <CustomerFormModal opened={formOpened} onClose={formHandlers.close} customer={selected} onSaved={load} />
    </Stack>
  )
}
