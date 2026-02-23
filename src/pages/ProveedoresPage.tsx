import { useEffect, useState } from 'react'
import { Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper } from '@mantine/core'
import { IconPlus, IconSearch, IconEdit } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import SupplierFormModal from '../components/suppliers/SupplierFormModal'
import type { Supplier } from '../types'

export default function ProveedoresPage(): JSX.Element {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [formOpened, formHandlers] = useDisclosure(false)

  const load = (): void => {
    window.api.suppliers.list({ search: search || undefined }).then((r: any) => {
      if (r.ok) setSuppliers(r.data)
    })
  }

  useEffect(() => { load() }, [search])

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Proveedores</Title>
        <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
          Nuevo proveedor
        </Button>
      </Group>

      <TextInput
        placeholder="Buscar proveedores..."
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
            {suppliers.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.name}</Table.Td>
                <Table.Td>{s.phone || '—'}</Table.Td>
                <Table.Td>{s.email || '—'}</Table.Td>
                <Table.Td>{s.address || '—'}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="subtle" onClick={() => { setSelected(s); formHandlers.open() }}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <SupplierFormModal opened={formOpened} onClose={formHandlers.close} supplier={selected} onSaved={load} />
    </Stack>
  )
}
