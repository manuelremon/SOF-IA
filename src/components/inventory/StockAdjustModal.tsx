import { Modal, NumberInput, TextInput, Button, Stack, Group, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Product } from '../../types'

interface StockAdjustModalProps {
  opened: boolean
  onClose: () => void
  product: Product | null
  onSaved: () => void
}

export default function StockAdjustModal({ opened, onClose, product, onSaved }: StockAdjustModalProps): JSX.Element {
  const form = useForm({ initialValues: { adjustment: 0, reason: '' } })

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    if (!product || values.adjustment === 0) return
    try {
      const res = await window.api.products.adjustStock({
        id: product.id,
        adjustment: values.adjustment,
        reason: values.reason || 'Ajuste manual'
      })
      if (res.ok) {
        notifications.show({ title: 'Stock ajustado', message: `${product.name}: ${values.adjustment > 0 ? '+' : ''}${values.adjustment}`, color: 'green' })
        form.reset()
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
    <Modal opened={opened} onClose={onClose} title="Ajuste de stock" size="sm">
      {product && (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Text fw={500}>{product.name}</Text>
            <Text size="sm" c="dimmed">Stock actual: {product.stock} {product.unit}</Text>
            <NumberInput
              label="Ajuste (positivo = entrada, negativo = salida)"
              {...form.getInputProps('adjustment')}
              decimalScale={2}
            />
            <TextInput label="Motivo" placeholder="Ej: Conteo físico" {...form.getInputProps('reason')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>Cancelar</Button>
              <Button type="submit" color="sap" disabled={form.values.adjustment === 0}>Aplicar ajuste</Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
