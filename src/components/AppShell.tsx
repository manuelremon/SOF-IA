import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell as MantineAppShell,
  Group,
  Text,
  UnstyledButton,
  Stack,
  Badge,
  Tooltip,
  Divider,
  Box
} from '@mantine/core'
import {
  IconLayoutDashboard,
  IconShoppingCart,
  IconPackage,
  IconBoxMultiple,
  IconUsers,
  IconTruck,
  IconClipboardList,
  IconBoxSeam,
  IconCash,
  IconReportAnalytics,
  IconSettings,
  IconUserCog,
  IconLogout,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  vendedor: 'Vendedor',
  almacenista: 'Almacenista'
}

interface NavItem {
  path: string
  label: string
  icon: typeof IconLayoutDashboard
  adminOnly?: boolean
  separator?: boolean
}

const NAV_ITEMS: NavItem[] = [
  // Operación diaria — detrás del mostrador
  { path: '/caja', label: 'Caja', icon: IconCash },
  { path: '/clientes', label: 'Clientes', icon: IconUsers },
  // Productos
  { path: '/catalogo', label: 'Catálogo', icon: IconPackage, separator: true },
  { path: '/stock', label: 'Stock', icon: IconBoxMultiple },
  // Abastecimiento
  { path: '/compras', label: 'Compras', icon: IconClipboardList, separator: true },
  { path: '/recepciones', label: 'Recepciones', icon: IconBoxSeam },
  { path: '/proveedores', label: 'Proveedores', icon: IconTruck },
  // Análisis — lo que ve el dueño
  { path: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard, separator: true },
  { path: '/reportes', label: 'Reportes', icon: IconReportAnalytics },
  // Administración
]

export default function AppShell(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [businessName, setBusinessName] = useState('SOF-IA')
  const [collapsed, setCollapsed] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const updateTitle = () => {
      const now = new Date()
      const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
      const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
      document.title = `${businessName}               - ${dateStr}     -     ${timeStr}`
    }
    
    updateTitle()
    const timer = setInterval(updateTitle, 1000)
    return () => clearInterval(timer)
  }, [businessName])

  useEffect(() => {
    window.api.settings.get('business_name').then((res: any) => {
      if (res.ok && res.data) setBusinessName(res.data)
    })
    window.api.products.lowStock().then((res: any) => {
      if (res.ok && res.data) setLowStockCount((res.data as any[]).length)
    })
  }, [])

  useEffect(() => {
    const cleanup = window.electronNav.onNavigate((path: string) => {
      if (path === '/logout') {
        handleLogout()
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

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <MantineAppShell
      navbar={{ width: collapsed ? 70 : 220, breakpoint: 0 }}
      padding="md"
      styles={{
        main: { backgroundColor: '#F5F6F7' },
        navbar: {
          backgroundColor: '#354A5F',
          borderRight: 'none',
          transition: 'width 200ms ease'
        }
      }}
    >
      <MantineAppShell.Navbar p={0}>
        <Stack justify="space-between" h="100%">
          {/* Header */}
          <div>
            <Group
              justify={collapsed ? 'center' : 'space-between'}
              px={collapsed ? 0 : 'md'}
              py="sm"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              {!collapsed && (
                <Text fw={700} size="sm" c="white" truncate>
                  {businessName}
                </Text>
              )}
              <UnstyledButton onClick={() => setCollapsed((v) => !v)} p={4}>
                {collapsed
                  ? <IconChevronRight size={16} color="#adb5bd" />
                  : <IconChevronLeft size={16} color="#adb5bd" />
                }
              </UnstyledButton>
            </Group>

            {/* Nav items */}
            <Stack gap={2} px={6} py="xs">
              {visibleItems.map((item) => {
                const active = location.pathname === item.path
                const showBadge = item.path === '/dashboard' && lowStockCount > 0
                const separator = item.separator ? (
                  <Divider key={`sep-${item.path}`} color="rgba(255,255,255,0.08)" my={4} />
                ) : null

                const button = (
                  <UnstyledButton
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    px={collapsed ? 0 : 12}
                    py={8}
                    style={{
                      borderRadius: 6,
                      backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 10,
                      transition: 'background-color 150ms ease',
                      width: '100%'
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          backgroundColor: active
                            ? 'rgba(255,255,255,0.12)'
                            : 'rgba(255,255,255,0.06)'
                        }
                      }
                    }}
                  >
                    <item.icon
                      size={20}
                      color={active ? '#ffffff' : '#adb5bd'}
                      style={{ flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <Text
                        size="sm"
                        c={active ? 'white' : 'gray.4'}
                        fw={active ? 600 : 400}
                        truncate
                        style={{ flex: 1 }}
                      >
                        {item.label}
                      </Text>
                    )}
                    {!collapsed && showBadge && (
                      <Badge size="xs" color="red" variant="filled" circle>
                        {lowStockCount}
                      </Badge>
                    )}
                  </UnstyledButton>
                )

                const element = collapsed ? (
                  <Tooltip key={item.path} label={item.label} position="right" withArrow>
                    <div style={{ position: 'relative' }}>
                      {button}
                      {showBadge && (
                        <Badge
                          size="xs" color="red" variant="filled" circle
                          style={{ position: 'absolute', top: 2, right: 4 }}
                        >
                          {lowStockCount}
                        </Badge>
                      )}
                    </div>
                  </Tooltip>
                ) : button

                return <>{separator}{element}</>
              })}
            </Stack>
          </div>

          {/* Footer */}
          <div>
            <Divider color="rgba(255,255,255,0.1)" />
            <Box px={collapsed ? 6 : 'md'} py="sm">

              {!collapsed && (
                <Group justify="center" gap={6} mb={8}>
                  <Text size="xs" c="gray.4" fw={500} truncate>
                    {user?.name}
                  </Text>
                  <Badge size="xs" variant="light" color="gray">
                    {ROLE_LABELS[user?.role ?? ''] || user?.role}
                  </Badge>
                </Group>
              )}
              {isAdmin && (
                <Tooltip label="Configuración" position="right" disabled={!collapsed}>
                  <UnstyledButton
                    onClick={() => navigate('/configuracion')}
                    px={collapsed ? 0 : 12}
                    py={6}
                    mb={4}
                    style={{
                      borderRadius: 6,
                      backgroundColor: location.pathname.startsWith('/configuracion') ? 'rgba(255,255,255,0.12)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 10,
                      width: '100%',
                      transition: 'background-color 150ms ease'
                    }}
                    styles={{
                      root: {
                        '&:hover': { backgroundColor: location.pathname.startsWith('/configuracion') ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)' }
                      }
                    }}
                  >
                    <IconSettings size={18} color={location.pathname.startsWith('/configuracion') ? '#ffffff' : '#adb5bd'} />
                    {!collapsed && (
                      <Text size="sm" c={location.pathname.startsWith('/configuracion') ? 'white' : 'gray.4'} fw={location.pathname.startsWith('/configuracion') ? 600 : 400}>
                        Configuración
                      </Text>
                    )}
                  </UnstyledButton>
                </Tooltip>
              )}
              <Tooltip label="Cerrar sesión" position="right" disabled={!collapsed}>
                <UnstyledButton
                  onClick={handleLogout}
                  px={collapsed ? 0 : 12}
                  py={6}
                  style={{
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    width: '100%',
                    backgroundColor: 'transparent'
                  }}
                  styles={{
                    root: {
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' }
                    }
                  }}
                >
                  <IconLogout size={18} color="#fa5252" />
                  {!collapsed && (
                    <Text size="sm" c="red.4">Cerrar sesión</Text>
                  )}
                </UnstyledButton>
              </Tooltip>
            </Box>
          </div>
        </Stack>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  )
}
