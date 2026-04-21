import { useState, useEffect } from 'react'
import {
  Center,
  Paper,
  Text,
  Select,
  PinInput,
  Button,
  Stack,
  Box,
  Alert,
  Divider,
  Title,
  SimpleGrid,
  UnstyledButton,
  Avatar,
  Group,
  ActionIcon,
  TextInput,
  Modal
} from '@mantine/core'
import { IconLock, IconAlertCircle, IconBuildingStore, IconArrowLeft, IconChevronRight, IconPlus } from '@tabler/icons-react'
import type { AuthUser } from '../stores/authStore'
import LogoApp from '../../resources/assets/LogoSof-IA.png'

interface LoginPageProps {
  onLogin: (user: AuthUser, businessId: number) => void
}

interface Business {
  id: number
  name: string
  description: string
  industry: string
  logoPath: string
}

export default function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  // Navigation State
  const [step, setStep] = useState<'auth' | 'business'>('auth')
  
  // Auth State
  const [allUsers, setAllUsers] = useState<Array<{ value: string; label: string }>>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null)
  const [pin, setPin] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Business State
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [createOpened, setCreateOpened] = useState(false)
  const [newBiz, setNewBiz] = useState({ name: '', industry: 'comercio' })

  // Initial Load: All users for identification
  useEffect(() => {
    window.api.users.list().then((res: any) => {
      if (res.ok && res.data) {
        setAllUsers(
          res.data
            .filter((u: any) => u.isActive)
            .map((u: any) => ({ value: u.name, label: u.name }))
        )
      }
    })
  }, [])

  // Handle Authentication
  const handleAuth = async (): Promise<void> => {
    if (!selectedUser || pin.length !== 4) return
    setAuthError('')
    setAuthLoading(true)
    try {
      const res = await window.api.users.authenticate(selectedUser, pin)
      if (res.ok) {
        if (res.data) {
          const user = res.data as AuthUser
          setAuthenticatedUser(user)
          
          // Load allowed businesses for this user
          const bizRes = await window.api.businesses.listByUser(user.id, user.role)
          if (bizRes.ok) {
            setBusinesses(bizRes.data || [])
            setStep('business')
          } else {
            setAuthError(`Error al cargar locales: ${bizRes.error || 'Error desconocido'}`)
          }
        } else {
          setAuthError('PIN incorrecto')
          setPin('')
        }
      } else {
        setAuthError(`Error de sistema: ${res.error || 'Fallo en la base de datos'}`)
      }
    } catch (err: any) {
      setAuthError(`Error inesperado: ${err.message || 'Error de servidor'}`)
    }
    setAuthLoading(false)
  }

  const handleCreateBusiness = async () => {
    if (!newBiz.name) return
    const res = await window.api.businesses.create(newBiz)
    if (res.ok) {
      setCreateOpened(false)
      // Refresh list
      const bizRes = await window.api.businesses.listByUser(authenticatedUser!.id, authenticatedUser!.role)
      if (bizRes.ok) setBusinesses(bizRes.data)
    }
  }

  const renderAuthStep = () => (
    <Stack align="center" gap="xl" w="100%">
      <Box style={{ textAlign: 'center' }}>
        <img src={LogoApp} alt="SOF-IA" style={{ height: 80, objectFit: 'contain', marginBottom: 12, borderRadius: 12 }} />
        <Title order={2} fw={900} style={{ letterSpacing: '-0.5px' }} mb={4}>¡Bienvenido!</Title>
        <Text size="sm" c="dimmed" fw={500}>Identifícate para comenzar</Text>
      </Box>

      <Divider w="100%" label="Acceso Personal" labelPosition="center" />

      <Select
        label="Usuario"
        placeholder="Selecciona tu nombre"
        data={allUsers}
        value={selectedUser}
        onChange={setSelectedUser}
        w="100%"
        size="md"
        searchable
      />

      {selectedUser && (
        <Stack align="center" gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '1px' }}>
            PIN de Seguridad
          </Text>
          <PinInput
            length={4}
            type="number"
            mask
            size="xl"
            value={pin}
            onChange={setPin}
            onComplete={() => setTimeout(handleAuth, 100)}
            autoFocus
          />
        </Stack>
      )}

      {authError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" w="100%">
          {authError}
        </Alert>
      )}

      <Button
        fullWidth
        size="lg"
        radius="md"
        loading={authLoading}
        disabled={!selectedUser || pin.length !== 4}
        onClick={handleAuth}
        color="sap"
      >
        Continuar
      </Button>
    </Stack>
  )

  const renderBusinessStep = () => (
    <Stack gap="xl" w="100%">
      <Group justify="space-between" align="center">
        <ActionIcon variant="subtle" color="gray" onClick={() => { setStep('auth'); setPin(''); setAuthenticatedUser(null); }}>
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Stack gap={0} align="center" style={{ flex: 1 }}>
          <Text fw={800} size="lg">Hola, {authenticatedUser?.name}</Text>
          <Text size="xs" c="dimmed">Selecciona un local para operar</Text>
        </Stack>
        {authenticatedUser?.role === 'admin' && (
          <ActionIcon variant="light" color="blue" onClick={() => setCreateOpened(true)}>
            <IconPlus size={20} />
          </ActionIcon>
        )}
      </Group>

      <SimpleGrid cols={1} spacing="md" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
        {businesses.map((biz) => (
          <UnstyledButton
            key={biz.id}
            onClick={() => onLogin(authenticatedUser!, biz.id)}
            p="md"
            style={(theme) => ({
              backgroundColor: 'white',
              borderRadius: theme.radius.md,
              border: '1px solid #e9ecef',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: 'var(--mantine-color-blue-4)' }
            })}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="md">
                <Avatar size="lg" radius="md" color="blue">
                  <IconBuildingStore size={24} />
                </Avatar>
                <Stack gap={0}>
                  <Text fw={700} size="md">{biz.name}</Text>
                  <Text size="xs" c="dimmed">{biz.industry?.toUpperCase() || 'COMERCIO'}</Text>
                </Stack>
              </Group>
              <IconChevronRight size={18} color="#adb5bd" />
            </Group>
          </UnstyledButton>
        ))}
        
        {businesses.length === 0 && (
          <Paper p="xl" withBorder style={{ borderStyle: 'dashed', textAlign: 'center' }}>
            <Text size="sm" c="dimmed">No tienes locales asignados.</Text>
            {authenticatedUser?.role === 'admin' && (
              <Button variant="light" mt="md" size="xs" onClick={() => setCreateOpened(true)}>Crear mi primer local</Button>
            )}
          </Paper>
        )}
      </SimpleGrid>

      <Modal opened={createOpened} onClose={() => setCreateOpened(false)} title="Nuevo Negocio" size="sm">
        <Stack gap="md">
          <TextInput label="Nombre del Local" placeholder="Ej: Sucursal Centro" required value={newBiz.name} onChange={(e) => setNewBiz({...newBiz, name: e.target.value})} />
          <Select label="Rubro" data={['comercio', 'gastronomia', 'servicios']} value={newBiz.industry} onChange={(v) => setNewBiz({...newBiz, industry: v || 'comercio' })} />
          <Button fullWidth onClick={handleCreateBusiness} disabled={!newBiz.name}>Crear Local</Button>
        </Stack>
      </Modal>
    </Stack>
  )

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Center w="100%">
        <Paper shadow="xl" p={40} radius="lg" w={450} withBorder={false}>
          {step === 'auth' ? renderAuthStep() : renderBusinessStep()}
        </Paper>
      </Center>
    </Box>
  )
}
