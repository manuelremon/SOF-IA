import { useState, useEffect, Fragment } from 'react'
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
  Box,
  ActionIcon,
  useMantineTheme,
  useMantineColorScheme
} from '@mantine/core'
import {
  IconLayoutDashboard,
  IconPackage,
  IconBoxMultiple,
  IconUsers,
  IconTruck,
  IconClipboardList,
  IconBoxSeam,
  IconCash,
  IconReportAnalytics,
  IconSettings,
  IconLogout,
  IconHelpCircle,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react'
import { useAuthStore } from '../stores/authStore'
import AIChatDrawer from './AIChatDrawer'

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
      const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
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

  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()

  const isDark = colorScheme === 'dark'
  const primaryVariant = theme.colors[theme.primaryColor] || theme.colors.sap
  const navBg = isDark ? theme.colors.dark[8] : '#0056D6'
  const mainBg = isDark ? theme.colors.dark[7] : '#F8F9FA'

  return (
    <MantineAppShell
      navbar={{ width: collapsed ? 70 : 240, breakpoint: 0 }}
      padding="lg"
      styles={{
        main: { backgroundColor: mainBg, transition: 'padding 200ms ease' },
        navbar: {
          backgroundColor: navBg,
          borderRight: 'none',
          transition: 'width 200ms ease',
          boxShadow: '4px 0 10px rgba(0,0,0,0.05)'
        }
      }}
    >
      <MantineAppShell.Navbar p={0}>
        <Stack justify="space-between" h="100%" gap={0}>
          {/* Header */}
          <div>
            <Group
              justify={collapsed ? 'center' : 'space-between'}
              px={collapsed ? 0 : 'md'}
              py="md"
              wrap="nowrap"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              {!collapsed && (
                <Text fw={800} c="white" size="lg" style={{ letterSpacing: '1px' }}>
                  {businessName.split(' ')[0]}
                </Text>
              )}
              <UnstyledButton onClick={() => setCollapsed((v) => !v)} p={4}>
                {collapsed
                  ? <IconChevronRight size={18} color="rgba(255,255,255,0.5)" />
                  : <IconChevronLeft size={18} color="rgba(255,255,255,0.5)" />
                }
              </UnstyledButton>
            </Group>

            {/* Nav items */}
            <Stack gap={4} px={10} py="md">
              {visibleItems.map((item) => {
                const active = location.pathname === item.path
                const showBadge = item.path === '/dashboard' && lowStockCount > 0
                const separator = item.separator ? (
                  <Box key={`sep-${item.path}`} py={8}>
                    <Divider color="rgba(255,255,255,0.08)" />
                  </Box>
                ) : null

                const button = (
                  <UnstyledButton
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    px={collapsed ? 0 : 12}
                    py={10}
                    style={{
                      borderRadius: theme.radius.md,
                      backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 12,
                      transition: 'all 150ms ease',
                      width: '100%',
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)'
                    }}
                  >
                    <item.icon
                      size={22}
                      stroke={active ? 2.5 : 1.5}
                      style={{ flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <Text
                        size="sm"
                        fw={active ? 700 : 500}
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
                  <Tooltip key={item.path} label={item.label} position="right" withArrow offset={15}>
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

                return <Fragment key={item.path}>{separator}{element}</Fragment>
              })}
            </Stack>
          </div>

          {/* Footer */}
          <div>
            <Box px={10} py="md" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {!collapsed && (
                <Group justify="space-between" gap={6} mb={12} px={8}>
                  <Stack gap={0}>
                    <Text size="sm" c="white" fw={700} truncate>
                      {user?.name}
                    </Text>
                    <Text size="xs" c="rgba(255,255,255,0.5)" fw={500}>
                      {ROLE_LABELS[user?.role ?? ''] || user?.role}
                    </Text>
                  </Stack>
                  <ActionIcon variant="subtle" color="gray.4" onClick={handleLogout}>
                    <IconLogout size={18} />
                  </ActionIcon>
                </Group>
              )}
              
              <Stack gap={4}>
                {isAdmin && (
                  <Tooltip label="Configuración" position="right" disabled={!collapsed} offset={15}>
                    <UnstyledButton
                      onClick={() => navigate('/configuracion')}
                      px={collapsed ? 0 : 12}
                      py={8}
                      style={{
                        borderRadius: theme.radius.md,
                        backgroundColor: location.pathname.startsWith('/configuracion') ? 'rgba(255,255,255,0.15)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 12,
                        width: '100%',
                        transition: 'all 150ms ease',
                        color: location.pathname.startsWith('/configuracion') ? 'white' : 'rgba(255,255,255,0.7)'
                      }}
                    >
                      <IconSettings size={20} stroke={location.pathname.startsWith('/configuracion') ? 2.5 : 1.5} />
                      {!collapsed && <Text size="sm" fw={location.pathname.startsWith('/configuracion') ? 700 : 500}>Configuración</Text>}
                    </UnstyledButton>
                  </Tooltip>
                )}

                <Tooltip label="Ayuda" position="right" disabled={!collapsed} offset={15}>
                  <UnstyledButton
                    onClick={() => navigate('/ayuda')}
                    px={collapsed ? 0 : 12}
                    py={8}
                    style={{
                      borderRadius: theme.radius.md,
                      backgroundColor: location.pathname.startsWith('/ayuda') ? 'rgba(255,255,255,0.15)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 12,
                      width: '100%',
                      transition: 'all 150ms ease',
                      color: location.pathname.startsWith('/ayuda') ? 'white' : 'rgba(255,255,255,0.7)'
                    }}
                  >
                    <IconHelpCircle size={20} stroke={location.pathname.startsWith('/ayuda') ? 2.5 : 1.5} />
                    {!collapsed && <Text size="sm" fw={location.pathname.startsWith('/ayuda') ? 700 : 500}>Ayuda</Text>}
                  </UnstyledButton>
                </Tooltip>
              </Stack>

              <Box mt="md" pt="md" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <AIChatDrawer collapsed={collapsed} />
              </Box>
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
