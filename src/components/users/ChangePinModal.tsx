import { useState } from 'react'
import { Modal, PinInput, Button, Stack, Text, Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import type { User } from '../../types'

interface ChangePinModalProps {
  opened: boolean
  onClose: () => void
  user: User | null
}

export default function ChangePinModal({ opened, onClose, user }: ChangePinModalProps): JSX.Element {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (): Promise<void> => {
    if (!user || currentPin.length !== 4 || newPin.length !== 4) return
    setError('')
    try {
      const res = await window.api.users.changePin({ id: user.id, currentPin, newPin })
      if (res.ok) {
        notifications.show({ title: 'PIN actualizado', message: `PIN de ${user.name} cambiado`, color: 'green' })
        setCurrentPin('')
        setNewPin('')
        onClose()
      } else {
        setError(res.error || 'Error al cambiar PIN')
      }
    } catch {
      setError('Error de conexión')
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Cambiar PIN — ${user?.name}`} size="xs">
      <Stack align="center">
        <Text size="sm" fw={500}>PIN actual</Text>
        <PinInput length={4} type="number" mask value={currentPin} onChange={setCurrentPin} />
        <Text size="sm" fw={500}>Nuevo PIN</Text>
        <PinInput length={4} type="number" mask value={newPin} onChange={setNewPin} />
        {error && <Alert icon={<IconAlertCircle size={16} />} color="red" w="100%">{error}</Alert>}
        <Button
          fullWidth
          color="sap"
          disabled={currentPin.length !== 4 || newPin.length !== 4}
          onClick={handleSubmit}
        >
          Cambiar PIN
        </Button>
      </Stack>
    </Modal>
  )
}
