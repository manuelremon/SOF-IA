import { useEffect } from 'react'
import { Modal, TextInput, ColorInput, Button, Stack, Group } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Category } from '../../types'

interface CategoryFormModalProps {
  opened: boolean
  onClose: () => void
  category: Category | null
  onSaved: () => void
}

export default function CategoryFormModal({ opened, onClose, category, onSaved }: CategoryFormModalProps): JSX.Element {
  const form = useForm({
    initialValues: { name: '', color: '#0A6ED1' }
  })

  useEffect(() => {
    if (opened) {
      if (category) {
        form.setValues({ name: category.name, color: category.color || '#0A6ED1' })
      } else {
        form.reset()
      }
    }
  }, [opened, category])

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    try {
      const res = category
        ? await window.api.categories.update({ id: category.id, ...values })
        : await window.api.categories.create(values)
      if (res.ok) {
        notifications.show({ title: category ? 'Categoría actualizada' : 'Categoría creada', message: values.name, color: 'green' })
        onSaved()
        onClose()
      } else {
        notifications.show({ title: 'Error', message: res.error || 'Error al guardar', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={category ? 'Editar categoría' : 'Nueva categoría'} size="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Nombre" required {...form.getInputProps('name')} />
          <ColorInput label="Color" {...form.getInputProps('color')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" color="sap">{category ? 'Guardar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
