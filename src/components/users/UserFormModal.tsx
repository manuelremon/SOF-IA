import { useEffect } from 'react'
import { Modal, TextInput, Select, PinInput, Button, Stack, Group, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { User } from '../../types'

interface UserFormModalProps {
  opened: boolean
  onClose: () => void
  user: User | null
  onSaved: () => void
}

export default function UserFormModal({ opened, onClose, user, onSaved }: UserFormModalProps): JSX.Element {
  const form = useForm({
    initialValues: { name: '', pin: '', role: 'vendedor' }
  })

  useEffect(() => {
    if (opened) {
      if (user) {
        form.setValues({ name: user.name, pin: '', role: user.role })
      } else {
        form.reset()
      }
    }
  }, [opened, user])

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    if (!user && values.pin.length !== 4) {
      notifications.show({ title: 'Error', message: 'El PIN debe ser de 4 dígitos', color: 'red' })
      return
    }
    try {
      const res = user
        ? await window.api.users.update({ id: user.id, name: values.name, role: values.role })
        : await window.api.users.create(values)
      if (res.ok) {
        notifications.show({ title: user ? 'Usuario actualizado' : 'Usuario creado', message: values.name, color: 'green' })
        onSaved()
        onClose()
      } else {
        notifications.show({ title: 'Error', message: res.error || 'Error', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={user ? 'Editar usuario' : 'Nuevo usuario'} size="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Nombre" required {...form.getInputProps('name')} />
          <Select
            label="Rol"
            data={[
              { value: 'admin', label: 'Administrador' },
              { value: 'vendedor', label: 'Vendedor' },
              { value: 'almacenista', label: 'Almacenista' }
            ]}
            {...form.getInputProps('role')}
          />
          {!user && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>PIN (4 dígitos)</Text>
              <PinInput
                length={4}
                type="number"
                mask
                value={form.values.pin}
                onChange={(v) => form.setFieldValue('pin', v)}
              />
            </Stack>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" color="sap">{user ? 'Guardar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
