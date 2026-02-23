import { useEffect } from 'react'
import { Modal, TextInput, Textarea, Button, Stack, Group } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Customer } from '../../types'

interface CustomerFormModalProps {
  opened: boolean
  onClose: () => void
  customer: Customer | null
  onSaved: () => void
}

export default function CustomerFormModal({ opened, onClose, customer, onSaved }: CustomerFormModalProps): JSX.Element {
  const form = useForm({
    initialValues: { name: '', phone: '', email: '', address: '', notes: '' }
  })

  useEffect(() => {
    if (opened) {
      if (customer) {
        form.setValues({
          name: customer.name,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          notes: customer.notes || ''
        })
      } else {
        form.reset()
      }
    }
  }, [opened, customer])

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    try {
      const res = customer
        ? await window.api.customers.update({ id: customer.id, ...values })
        : await window.api.customers.create(values)
      if (res.ok) {
        notifications.show({ title: customer ? 'Cliente actualizado' : 'Cliente creado', message: values.name, color: 'green' })
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
    <Modal opened={opened} onClose={onClose} title={customer ? 'Editar cliente' : 'Nuevo cliente'} size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Nombre" required {...form.getInputProps('name')} />
          <Group grow>
            <TextInput label="Teléfono" {...form.getInputProps('phone')} />
            <TextInput label="Email" {...form.getInputProps('email')} />
          </Group>
          <TextInput label="Dirección" {...form.getInputProps('address')} />
          <Textarea label="Notas" {...form.getInputProps('notes')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" color="sap">{customer ? 'Guardar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
