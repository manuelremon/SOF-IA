import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell as MantineAppShell,
  NavLink,
  Group,
  Text,
  ActionIcon,
  Box,
  Divider
} from '@mantine/core'
import {
  IconDashboard,
  IconShoppingCart,
  IconPackage,
  IconLayoutGrid,
  IconUsers,
  IconTruck,
  IconUserCog,
  IconSettings,
  IconLogout,
  IconClock
} from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: IconDashboard, path: '/', roles: ['admin', 'vendedor', 'almacenista'] },
  { label: 'Ventas', icon: IconShoppingCart, path: '/ventas', roles: ['admin', 'vendedor'] },
  { label: 'Inventario', icon: IconPackage, path: '/inventario', roles: ['admin', 'vendedor', 'almacenista'] },
  { label: 'Catálogo', icon: IconLayoutGrid, path: '/catalogo', roles: ['admin', 'vendedor', 'almacenista'] },
  { label: 'Clientes', icon: IconUsers, path: '/clientes', roles: ['admin', 'vendedor'] },
  { label: 'Proveedores', icon: IconTruck, path: '/proveedores', roles: ['admin', 'almacenista'] },
  { label: 'Usuarios', icon: IconUserCog, path: '/usuarios', roles: ['admin'] },
  { label: 'Configuración', icon: IconSettings, path: '/configuracion', roles: ['admin'] }
]

export default function AppShell(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [clock, setClock] = useState('')
  const [businessName, setBusinessName] = useState('SOF-IA')

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    setClock(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    window.api.settings.get('business_name').then((res: any) => {
      if (res.ok && res.data) setBusinessName(res.data)
    })
  }, [])

  const handleLogout = (): void => {
    logout()
    navigate('/')
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <MantineAppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      header={{ height: 56 }}
      padding="md"
      styles={{
        main: { backgroundColor: '#F5F6F7' },
        header: { backgroundColor: '#354A5F', borderBottom: 'none' },
        navbar: { backgroundColor: '#fff', borderRight: '1px solid #e0e0e0' }
      }}
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Text fw={700} size="lg" c="white">
              SOF-IA
            </Text>
            <Text size="xs" c="gray.4">
              |
            </Text>
            <Text size="sm" c="gray.3">
              {businessName}
            </Text>
          </Group>
          <Group gap="md">
            <Group gap={4}>
              <IconClock size={16} color="#adb5bd" />
              <Text size="sm" c="gray.3">
                {clock}
              </Text>
            </Group>
            <Text size="sm" c="gray.3">
              {user?.name} ({user?.role})
            </Text>
            <ActionIcon variant="subtle" color="gray.3" onClick={handleLogout} title="Cerrar sesión">
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="xs">
        <Box style={{ flex: 1 }}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              styles={{
                root: {
                  borderRadius: 4,
                  marginBottom: 2,
                  '&[data-active]': {
                    backgroundColor: '#e6f2ff',
                    color: '#0A6ED1'
                  }
                }
              }}
            />
          ))}
        </Box>
        <Divider my="xs" />
        <Text size="xs" c="dimmed" ta="center">
          SOF-IA v1.0.0
        </Text>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}
