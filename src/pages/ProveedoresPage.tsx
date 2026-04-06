import { useEffect, useState } from 'react'
import { Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper, Menu, Text, Modal } from '@mantine/core'
import { IconPlus, IconSearch, IconEdit, IconTrash, IconDots, IconAlertTriangle, IconList } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import SupplierFormModal from '../components/suppliers/SupplierFormModal'
import SupplierCatalogModal from '../components/suppliers/SupplierCatalogModal'
import { useAuthStore } from '../stores/authStore'
import type { Supplier } from '../types'

export default function ProveedoresPage(): JSX.Element {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [formOpened, formHandlers] = useDisclosure(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [catalogSupplier, setCatalogSupplier] = useState<Supplier | null>(null)
  const [catalogOpened, catalogHandlers] = useDisclosure(false)

  const load = (): void => {
    window.api.suppliers.list({ search: search || undefined, isActive: true }).then((r: any) => {
      if (r.ok) setSuppliers(r.data)
    })
  }

  useEffect(() => { load() }, [search])

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    const res = await window.api.suppliers.delete(deleteTarget.id)
    if (res.ok) {
      notifications.show({ title: 'Proveedor eliminado', message: deleteTarget.name, color: 'green' })
      setDeleteTarget(null)
      load()
    } else {
      notifications.show({ title: 'Error', message: (res as any).error || 'No se pudo eliminar', color: 'red' })
      setDeleteTarget(null)
    }
  }

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
              <Table.Th>CUIT</Table.Th>
              <Table.Th>Teléfono</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Dirección</Table.Th>
              <Table.Th ta="center">Catálogo</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {suppliers.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.name}</Table.Td>
                <Table.Td>{s.cuit || '—'}</Table.Td>
                <Table.Td>{s.phone || '—'}</Table.Td>
                <Table.Td>{s.email || '—'}</Table.Td>
                <Table.Td>{s.address || '—'}</Table.Td>
                <Table.Td ta="center">
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconList size={14} />}
                    onClick={() => { setCatalogSupplier(s); catalogHandlers.open() }}
                  >
                    Ver
                  </Button>
                </Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="subtle"><IconDots size={16} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelected(s); formHandlers.open() }}>
                        Editar
                      </Menu.Item>
                      {isAdmin && (
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => { setDeleteTarget(s); setDeleteStep(1) }}>
                          Eliminar
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <SupplierFormModal opened={formOpened} onClose={formHandlers.close} supplier={selected} onSaved={load} />
      <SupplierCatalogModal opened={catalogOpened} onClose={catalogHandlers.close} supplier={catalogSupplier} />

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        {deleteStep === 1 ? (
          <Stack>
            <Group gap="sm">
              <IconAlertTriangle size={20} color="#fa5252" />
              <Text size="sm">
                ¿Querés eliminar al proveedor <Text span fw={700}>"{deleteTarget?.name}"</Text>?
              </Text>
            </Group>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button color="orange" onClick={() => setDeleteStep(2)}>Sí, continuar</Button>
            </Group>
          </Stack>
        ) : (
          <Stack>
            <Group gap="sm">
              <IconAlertTriangle size={20} color="#fa5252" />
              <Text size="sm" c="red" fw={600}>
                Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor <Text span fw={700}>"{deleteTarget?.name}"</Text> y todos sus datos asociados.
              </Text>
            </Group>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button color="red" onClick={handleDelete}>Confirmar eliminación</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
