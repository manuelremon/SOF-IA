import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell as MantineAppShell,
  Group,
  Text,
  ActionIcon,
  Badge
} from '@mantine/core'
import { IconClock, IconLogout } from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  vendedor: 'Vendedor',
  almacenista: 'Almacenista'
}

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

  // Listen for navigation from Electron native menu
  useEffect(() => {
    const cleanup = window.electronNav.onNavigate((path: string) => {
      if (path === '/logout') {
        logout()
        navigate('/')
      } else {
        navigate(path)
      }
    })
    return cleanup
  }, [navigate, logout])

  const handleLogout = (): void => {
    logout()
    navigate('/')
  }

  // Page title based on current route
  const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/ventas': 'Punto de Venta',
    '/inventario': 'Inventario',
    '/catalogo': 'Catálogo',
    '/clientes': 'Clientes',
    '/proveedores': 'Proveedores',
    '/compras': 'Órdenes de Compra',
    '/recepciones': 'Recepciones',
    '/reportes': 'Reportes',
    '/caja': 'Caja',
    '/usuarios': 'Usuarios',
    '/configuracion': 'Configuración'
  }

  const pageTitle = PAGE_TITLES[location.pathname] || ''

  return (
    <MantineAppShell
      header={{ height: 40 }}
      padding="md"
      styles={{
        main: { backgroundColor: '#F5F6F7' },
        header: { backgroundColor: '#354A5F', borderBottom: 'none' }
      }}
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Text fw={600} size="sm" c="white">
              {businessName}
            </Text>
            {pageTitle && (
              <>
                <Text size="xs" c="gray.5">›</Text>
                <Text size="sm" c="gray.3">{pageTitle}</Text>
              </>
            )}
          </Group>
          <Group gap="md">
            <Group gap={4}>
              <IconClock size={14} color="#adb5bd" />
              <Text size="xs" c="gray.3">{clock}</Text>
            </Group>
            <Group gap={6}>
              <Text size="xs" c="gray.3">{user?.name}</Text>
              <Badge size="xs" variant="light" color="gray">
                {ROLE_LABELS[user?.role ?? ''] || user?.role}
              </Badge>
            </Group>
            <ActionIcon variant="subtle" color="gray.3" size="sm" onClick={handleLogout} title="Cerrar sesión">
              <IconLogout size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}
