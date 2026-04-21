import { useEffect, useState } from 'react'
import { Title, Stack, Group, Button, Table, Badge, ActionIcon, Paper, Menu, Text } from '@mantine/core'
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
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} fw={800}>Gestión de Personal</Title>
        </div>
        <Button leftSection={<IconPlus size={16} />} color="sap" onClick={() => { setSelected(null); formHandlers.open() }}>
          Nuevo Usuario
        </Button>
      </Group>

      <Paper withBorder={false} bg="transparent" p={0}>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre de Usuario</Table.Th>
              <Table.Th>Rol de Sistema</Table.Th>
              <Table.Th ta="center">Estado</Table.Th>
              <Table.Th>Fecha de Alta</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td><Text fw={700} size="sm">{u.name}</Text></Table.Td>
                <Table.Td>
                  <Badge variant="light" color={u.role === 'admin' ? 'sap' : 'gray'} radius="sm">
                    {ROLE_LABELS[u.role] || u.role}
                  </Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge color={u.isActive ? 'green' : 'gray'} variant="filled" size="sm">
                    {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </Badge>
                </Table.Td>
                <Table.Td><Text size="sm">{u.createdAt?.slice(0, 10)}</Text></Table.Td>
                <Table.Td ta="right">
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray"><IconDots size={18} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelected(u); formHandlers.open() }}>
                        Editar perfil
                      </Menu.Item>
                      <Menu.Item leftSection={<IconKey size={14} />} onClick={() => { setPinUser(u); pinHandlers.open() }}>
                        Modificar PIN
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
