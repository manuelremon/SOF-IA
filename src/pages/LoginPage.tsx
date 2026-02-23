import { useState, useEffect } from 'react'
import {
  Center,
  Paper,
  Title,
  Text,
  Select,
  PinInput,
  Button,
  Stack,
  Alert,
  Box
} from '@mantine/core'
import { IconLock, IconAlertCircle } from '@tabler/icons-react'
import type { AuthUser } from '../stores/authStore'

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
        background: 'linear-gradient(135deg, #354A5F 0%, #0A6ED1 100%)'
      }}
    >
      <Center h="100vh">
        <Paper shadow="xl" p={40} radius="sm" w={400}>
          <Stack align="center" gap="lg">
            <Box>
              <Title order={2} ta="center" c="#354A5F">
                SOF-IA
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                Inicie sesión para continuar
              </Text>
            </Box>

            <Select
              label="Usuario"
              placeholder="Seleccione su usuario"
              data={users}
              value={selectedUser}
              onChange={setSelectedUser}
              w="100%"
              searchable
            />

            {selectedUser && (
              <Stack align="center" gap="xs">
                <Text size="sm" fw={500}>
                  <IconLock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Ingrese su PIN
                </Text>
                <PinInput
                  length={4}
                  type="number"
                  mask
                  size="lg"
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                  autoFocus
                />
              </Stack>
            )}

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" w="100%">
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              size="md"
              loading={loading}
              disabled={!selectedUser || pin.length !== 4}
              onClick={handleLogin}
              color="sap"
            >
              Ingresar
            </Button>
          </Stack>
        </Paper>
      </Center>
    </Box>
  )
}
