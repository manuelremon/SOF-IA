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
  Title
} from '@mantine/core'
import { IconLock, IconAlertCircle } from '@tabler/icons-react'
import type { AuthUser } from '../stores/authStore'
import LogoApp from '../../resources/assets/LogoSof-IA.png'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
}

export default function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  const [users, setUsers] = useState<Array<{ value: string; label: string }>>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.api.users.list().then((res: any) => {
      if (res.ok && res.data) {
        setUsers(
          res.data
            .filter((u: any) => u.isActive)
            .map((u: any) => ({ value: u.name, label: u.name }))
        )
      }
    })
  }, [])

  const handleLogin = async (): Promise<void> => {
    if (!selectedUser || pin.length !== 4) return
    setError('')
    setLoading(true)
    try {
      const res = await window.api.users.authenticate(selectedUser, pin)
      if (res.ok && res.data) {
        onLogin(res.data as AuthUser)
      } else {
        setError('PIN incorrecto o usuario inactivo')
        setPin('')
      }
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  const handlePinComplete = (value: string): void => {
    setPin(value)
    if (value.length === 4 && selectedUser) {
      setTimeout(() => handleLogin(), 100)
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Center h="100vh" w="100%">
        <Paper shadow="xl" p={50} radius="lg" w={450} withBorder={false}>
          <Stack align="center" gap="xl">
            <Box style={{ textAlign: 'center' }}>
              <img src={LogoApp} alt="SOF-IA" style={{ height: 80, objectFit: 'contain', marginBottom: 12, borderRadius: 12 }} />
              <Title order={2} fw={900} style={{ letterSpacing: '-0.5px' }} mb={4}>¡Bienvenido!</Title>
              <Text size="sm" c="dimmed" fw={500}>
                Gestión inteligente para tu negocio
              </Text>
            </Box>

            <Divider w="100%" label="Identificación" labelPosition="center" />

            <Select
              label="Usuario de Sistema"
              placeholder="¿Quién está operando?"
              data={users}
              value={selectedUser}
              onChange={setSelectedUser}
              w="100%"
              size="md"
              searchable
            />

            {selectedUser && (
              <Stack align="center" gap="md">
                <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '1px' }}>
                  <IconLock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Seguridad PIN
                </Text>
                <PinInput
                  length={4}
                  type="number"
                  mask
                  size="xl"
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                  autoFocus
                />
              </Stack>
            )}

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" w="100%" radius="md">
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              size="lg"
              radius="md"
              loading={loading}
              disabled={!selectedUser || pin.length !== 4}
              onClick={handleLogin}
              color="sap"
              style={{ boxShadow: '0 8px 15px rgba(33, 150, 243, 0.3)' }}
            >
              Iniciar Jornada
            </Button>
            
            <Text size="xs" c="dimmed">SOF-IA v1.0 — 2026</Text>
          </Stack>
        </Paper>
      </Center>
    </Box>
  )
}
