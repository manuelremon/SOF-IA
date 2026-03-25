import { useState, useEffect } from 'react'
import {
  Modal, Stack, Select, NumberInput, Button, Group, Text, Alert,
  SegmentedControl, Divider
} from '@mantine/core'
import { IconAlertCircle, IconDiscount } from '@tabler/icons-react'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { notifications } from '@mantine/notifications'
import type { Customer, DiscountType } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface PaymentModalProps {
  opened: boolean
  onClose: () => void
  onComplete: (sale: any) => void
}

export default function PaymentModal({ opened, onClose, onComplete }: PaymentModalProps): JSX.Element {
  const { items, getSubtotal, getGeneralDiscountTotal, getSubtotalWithDiscounts, generalDiscountType, generalDiscountValue, setGeneralDiscount, clear } = useCartStore()
  const { user } = useAuthStore()
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo')
  const [amountTendered, setAmountTendered] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [discType, setDiscType] = useState<string>('porcentaje')
  const [discValue, setDiscValue] = useState<number>(0)

  const subtotal = getSubtotal()
  const generalDiscountTotal = getGeneralDiscountTotal()
  const subtotalAfterDiscount = getSubtotalWithDiscounts()
  const taxTotal = subtotalAfterDiscount * (taxRate / 100)
  const total = subtotalAfterDiscount + taxTotal
  const change = paymentMethod === 'efectivo' ? Math.max(0, amountTendered - total) : 0

  useEffect(() => {
    if (opened) {
      setAmountTendered(0)
      setPaymentMethod('efectivo')
      setSelectedCustomerId(null)
      setDiscType(generalDiscountType ?? 'porcentaje')
      setDiscValue(generalDiscountValue)
      window.api.settings.get('tax_rate').then((r: any) => {
        if (r.ok && r.data) setTaxRate(parseFloat(r.data) || 0)
      })
      window.api.customers.list({ isActive: true }).then((r: any) => {
        if (r.ok && r.data) setCustomers(r.data)
      })
    }
  }, [opened])

  const handleDiscountApply = (): void => {
    setGeneralDiscount(discValue > 0 ? discType as DiscountType : null, discValue)
  }

  const handleComplete = async (): Promise<void> => {
    if (paymentMethod === 'efectivo' && amountTendered < total) return
    setLoading(true)
    try {
      const res = await window.api.sales.complete({
        userId: user?.id,
        customerId: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
        paymentMethod,
        amountTendered: paymentMethod === 'efectivo' ? amountTendered : total,
        taxRate,
        discountType: generalDiscountType,
        discountValue: generalDiscountValue,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountType: i.discountType,
          discountValue: i.discountValue ?? 0
        }))
      })
      if (res.ok && res.data) {
        const saleData = res.data as any
        // Attach customer name for receipt
        if (selectedCustomerId) {
          const cust = customers.find((c) => c.id === parseInt(selectedCustomerId))
          if (cust) saleData.customerName = cust.name
        }
        clear()
        onComplete(saleData)
        notifications.show({ title: 'Venta completada', message: `Recibo: ${saleData.receiptNumber}`, color: 'green' })
      } else {
        notifications.show({ title: 'Error', message: res.error || 'No se pudo completar la venta', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al procesar la venta', color: 'red' })
    }
    setLoading(false)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Cobrar venta" size="md">
      <Stack>
        {/* Customer selection */}
        <Select
          label="Cliente (opcional)"
          placeholder="Consumidor final"
          clearable
          searchable
          value={selectedCustomerId}
          onChange={setSelectedCustomerId}
          data={customers.map((c) => ({ value: String(c.id), label: c.name }))}
        />

        <Divider label="Resumen" />

        <Group justify="space-between">
          <Text>Subtotal:</Text>
          <Text fw={500}>{fmt(subtotal)}</Text>
        </Group>

        {/* General discount */}
        <Group justify="space-between" align="flex-end" gap="xs">
          <Group gap="xs" style={{ flex: 1 }}>
            <IconDiscount size={16} color="orange" />
            <Text size="sm" c="orange">Descuento general:</Text>
          </Group>
          <Group gap={4}>
            <SegmentedControl
              size="xs"
              value={discType}
              onChange={setDiscType}
              data={[{ label: '%', value: 'porcentaje' }, { label: '$', value: 'monto' }]}
            />
            <NumberInput
              size="xs"
              w={80}
              value={discValue}
              onChange={(v) => setDiscValue(Number(v) || 0)}
              min={0}
              max={discType === 'porcentaje' ? 100 : undefined}
              decimalScale={2}
              onBlur={handleDiscountApply}
            />
          </Group>
        </Group>
        {generalDiscountTotal > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="orange">Descuento:</Text>
            <Text size="sm" c="orange" fw={500}>-{fmt(generalDiscountTotal)}</Text>
          </Group>
        )}

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
