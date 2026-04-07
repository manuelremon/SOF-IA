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
  Alert
} from '@mantine/core'
import { IconLock, IconAlertCircle } from '@tabler/icons-react'
import type { AuthUser } from '../stores/authStore'
import LogoApp from '../../resources/assets/LogoSof-IA.png'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
}

export default function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  const [users, setUsers] = useState<Array<{ value: string; label: string }>>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashSeen'))

  const handleSplashEnd = () => {
    sessionStorage.setItem('splashSeen', 'true')
    setShowSplash(false)
  }

  useEffect(() => {
    if (!showSplash) return undefined;
    const timer = setTimeout(handleSplashEnd, 3500);
    return () => clearTimeout(timer);
  }, [showSplash])

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
      {showSplash ? (
        <Box style={{ position: 'absolute', inset: 0, backgroundColor: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="loader">
            <div className="box box0">
              <div></div>
            </div>
            <div className="box box1">
              <div></div>
            </div>
            <div className="box box2">
              <div></div>
            </div>
            <div className="box box3">
              <div></div>
            </div>
            <div className="box box4">
              <div></div>
            </div>
            <div className="box box5">
              <div></div>
            </div>
            <div className="box box6">
              <div></div>
            </div>
            <div className="box box7">
              <div></div>
            </div>
            <div className="ground">
              <div></div>
            </div>
          </div>
          <Button 
            variant="subtle" 
            color="gray"
            style={{ position: 'absolute', bottom: 20, right: 20 }}
            onClick={handleSplashEnd}
          >
            Omitir
          </Button>
        </Box>
      ) : (
      <Center h="100vh">
        <Paper shadow="xl" p={40} radius="sm" w={400}>
          <Stack align="center" gap="lg">
            <Box style={{ textAlign: 'center' }}>
              <img src={LogoApp} alt="SOF-IA" style={{ height: 60, objectFit: 'contain', marginBottom: 8, borderRadius: 8 }} />
              <Text size="sm" c="dimmed">
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
      )}
    </Box>
  )
}
