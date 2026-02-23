import { useEffect } from 'react'
import { Modal, TextInput, Textarea, Button, Stack, Group } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Supplier } from '../../types'

interface SupplierFormModalProps {
  opened: boolean
  onClose: () => void
  supplier: Supplier | null
  onSaved: () => void
}

export default function SupplierFormModal({ opened, onClose, supplier, onSaved }: SupplierFormModalProps): JSX.Element {
  const form = useForm({
    initialValues: { name: '', phone: '', email: '', address: '', notes: '' }
  })

  useEffect(() => {
    if (opened) {
      if (supplier) {
        form.setValues({
          name: supplier.name,
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          notes: supplier.notes || ''
        })
      } else {
        form.reset()
      }
    }
  }, [opened, supplier])

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    try {
      const res = supplier
        ? await window.api.suppliers.update({ id: supplier.id, ...values })
        : await window.api.suppliers.create(values)
      if (res.ok) {
        notifications.show({ title: supplier ? 'Proveedor actualizado' : 'Proveedor creado', message: values.name, color: 'green' })
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
    <Modal opened={opened} onClose={onClose} title={supplier ? 'Editar proveedor' : 'Nuevo proveedor'} size="md">
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
            <Button type="submit" color="sap">{supplier ? 'Guardar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
