import { useEffect, useState } from 'react'
import { Title, Stack, Group, Button, Table, Badge, ActionIcon, Paper, Menu } from '@mantine/core'
import { IconPlus, IconEdit, IconKey, IconDots } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import UserFormModal from '../components/users/UserFormModal'
import ChangePinModal from '../components/users/ChangePinModal'
import type { User } from '../types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  almacenista: 'Almacenista'
}

export default function UsuariosPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [selected, setSelected] = useState<User | null>(null)
  const [pinUser, setPinUser] = useState<User | null>(null)
  const [formOpened, formHandlers] = useDisclosure(false)
  const [pinOpened, pinHandlers] = useDisclosure(false)

  const load = (): void => {
    window.api.users.list().then((r: any) => { if (r.ok) setUsers(r.data) })
  }

  useEffect(() => { load() }, [])

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Usuarios</Title>
        <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
          Nuevo usuario
        </Button>
      </Group>

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Creado</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{ROLE_LABELS[u.role] || u.role}</Table.Td>
                <Table.Td>
                  <Badge color={u.isActive ? 'green' : 'gray'} variant="light">
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Table.Td>
                <Table.Td>{u.createdAt?.slice(0, 10)}</Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="subtle"><IconDots size={16} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelected(u); formHandlers.open() }}>
                        Editar
                      </Menu.Item>
                      <Menu.Item leftSection={<IconKey size={14} />} onClick={() => { setPinUser(u); pinHandlers.open() }}>
                        Cambiar PIN
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <UserFormModal opened={formOpened} onClose={formHandlers.close} user={selected} onSaved={load} />
      <ChangePinModal opened={pinOpened} onClose={pinHandlers.close} user={pinUser} />
    </Stack>
  )
}
