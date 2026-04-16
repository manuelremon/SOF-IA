import { useEffect, useState } from 'react'
import { Title, Stack, Group, Button, TextInput, Table, ActionIcon, Paper, Menu, Text, Modal, Badge, Tooltip, Box } from '@mantine/core'
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
              <Title order={2} fw={800}>Proveedores</Title>
              <Text size="sm" c="dimmed">Directorio de abastecimiento y gestión de catálogos</Text>
            </div>
            <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
              Nuevo Proveedor
            </Button>
          </Group>

          <Paper p="md" shadow="sm">
            <TextInput
              placeholder="Buscar por nombre, CUIT, email o contacto..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="md"
            />
          </Paper>
        </Stack>
      </Box>

      <Paper withBorder={false} bg="transparent" p={0}>
        <Table striped highlightOnHover verticalSpacing="sm" stickyHeader stickyHeaderOffset={160}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Razón Social</Table.Th>
              <Table.Th>Identificación (CUIT)</Table.Th>
              <Table.Th>Contacto & Comunicación</Table.Th>
              <Table.Th>Ubicación / Dirección</Table.Th>
              <Table.Th ta="center">Catálogo</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {suppliers.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>
                  <Text fw={700} size="sm">{s.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" color="gray" radius="xs">{s.cuit || 'N/A'}</Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>{s.phone || 'Sin teléfono'}</Text>
                    <Text size="xs" c="dimmed">{s.email || 'Sin email'}</Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1}>{s.address || '—'}</Text>
                </Table.Td>
                <Table.Td ta="center">
                  <Button
                    variant="light"
                    color="blue"
                    size="compact-xs"
                    radius="xl"
                    leftSection={<IconList size={14} />}
                    onClick={() => { setCatalogSupplier(s); catalogHandlers.open() }}
                  >
                    Ver Catálogo
                  </Button>
                </Table.Td>
                <Table.Td ta="right">
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray"><IconDots size={18} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelected(s); formHandlers.open() }}>
                        Editar datos
                      </Menu.Item>
                      {isAdmin && (
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => { setDeleteTarget(s); setDeleteStep(1) }}>
                          Eliminar proveedor
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
            {suppliers.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="xl">No se encontraron proveedores registrados</Text>
                </Table.Td>
              </Table.Tr>
            )}
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
