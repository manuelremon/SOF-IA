import { useState, useEffect } from 'react'
import { Modal, Stack, Select, NumberInput, Button, Group, Text, Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { notifications } from '@mantine/notifications'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface PaymentModalProps {
  opened: boolean
  onClose: () => void
  onComplete: (sale: any) => void
}

export default function PaymentModal({ opened, onClose, onComplete }: PaymentModalProps): JSX.Element {
  const { items, getSubtotal, clear } = useCartStore()
  const { user } = useAuthStore()
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo')
  const [amountTendered, setAmountTendered] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const subtotal = getSubtotal()
  const taxTotal = subtotal * (taxRate / 100)
  const total = subtotal + taxTotal
  const change = paymentMethod === 'efectivo' ? Math.max(0, amountTendered - total) : 0

  useEffect(() => {
    if (opened) {
      setAmountTendered(0)
      setPaymentMethod('efectivo')
      window.api.settings.get('tax_rate').then((r: any) => {
        if (r.ok && r.data) setTaxRate(parseFloat(r.data) || 0)
      })
    }
  }, [opened])

  const handleComplete = async (): Promise<void> => {
    if (paymentMethod === 'efectivo' && amountTendered < total) return
    setLoading(true)
    try {
      const res = await window.api.sales.complete({
        userId: user?.id,
        paymentMethod,
        amountTendered: paymentMethod === 'efectivo' ? amountTendered : total,
        taxRate,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      })
      if (res.ok && res.data) {
        clear()
        onComplete(res.data)
        notifications.show({ title: 'Venta completada', message: `Recibo: ${(res.data as any).receiptNumber}`, color: 'green' })
      } else {
        notifications.show({ title: 'Error', message: res.error || 'No se pudo completar la venta', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al procesar la venta', color: 'red' })
    }
    setLoading(false)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Cobrar venta" size="sm">
      <Stack>
        <Group justify="space-between">
          <Text>Subtotal:</Text>
          <Text fw={500}>{fmt(subtotal)}</Text>
        </Group>
        {taxRate > 0 && (
          <Group justify="space-between">
            <Text>IVA ({taxRate}%):</Text>
            <Text fw={500}>{fmt(taxTotal)}</Text>
          </Group>
        )}
        <Group justify="space-between" py="xs" style={{ borderTop: '2px solid #0A6ED1', borderBottom: '2px solid #0A6ED1' }}>
          <Text size="lg" fw={700}>
            TOTAL
          </Text>
          <Text size="lg" fw={700} c="sap">
            {fmt(total)}
          </Text>
        </Group>

        <Select
          label="Método de pago"
          value={paymentMethod}
          onChange={(v) => setPaymentMethod(v ?? 'efectivo')}
          data={[
            { value: 'efectivo', label: 'Efectivo' },
            { value: 'tarjeta', label: 'Tarjeta' },
            { value: 'transferencia', label: 'Transferencia' }
          ]}
        />

        {paymentMethod === 'efectivo' && (
          <>
            <NumberInput
              label="Monto recibido"
              value={amountTendered}
              onChange={(v) => setAmountTendered(Number(v) || 0)}
              min={0}
              decimalScale={2}
              prefix="$ "
              thousandSeparator="."
              decimalSeparator=","
              size="md"
            />
            {amountTendered >= total && (
              <Group justify="space-between">
                <Text fw={500}>Vuelto:</Text>
                <Text fw={700} size="lg" c="green">
                  {fmt(change)}
                </Text>
              </Group>
            )}
          </>
        )}

        {paymentMethod === 'efectivo' && amountTendered > 0 && amountTendered < total && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            El monto recibido es menor al total
          </Alert>
        )}

        <Button
          fullWidth
          size="md"
          color="sap"
          loading={loading}
          disabled={paymentMethod === 'efectivo' && amountTendered < total}
          onClick={handleComplete}
        >
          Confirmar venta
        </Button>
      </Stack>
    </Modal>
  )
}
