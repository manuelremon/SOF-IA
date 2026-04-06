import { useState, useEffect } from 'react'
import {
  Modal, Stack, Select, NumberInput, Button, Group, Text, Alert,
  SegmentedControl, Divider, ActionIcon, TextInput, Tooltip
} from '@mantine/core'
import { IconAlertCircle, IconDiscount, IconPlus } from '@tabler/icons-react'
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
  const [accountBalance, setAccountBalance] = useState<number>(0)
  const [accountCreditLimit, setAccountCreditLimit] = useState<number>(0)
  const [newCustOpened, setNewCustOpened] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustLoading, setNewCustLoading] = useState(false)

  const subtotal = getSubtotal()
  const generalDiscountTotal = getGeneralDiscountTotal()
  const subtotalAfterDiscount = getSubtotalWithDiscounts()
  const taxTotal = subtotalAfterDiscount * (taxRate / 100)
  const total = subtotalAfterDiscount + taxTotal
  const change = paymentMethod === 'efectivo' ? Math.max(0, amountTendered - total) : 0
  const accountExceedsLimit = paymentMethod === 'cuenta_corriente' && accountCreditLimit > 0 && (accountBalance + total) > accountCreditLimit

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
      setAccountBalance(0)
      setAccountCreditLimit(0)
    }
  }, [opened])

  // Load account info when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      window.api.customerAccount.get(parseInt(selectedCustomerId)).then((r: any) => {
        if (r.ok && r.data) {
          setAccountBalance(r.data.balance ?? 0)
          setAccountCreditLimit(r.data.creditLimit ?? 0)
        }
      })
    } else {
      setAccountBalance(0)
      setAccountCreditLimit(0)
      if (paymentMethod === 'cuenta_corriente') setPaymentMethod('efectivo')
    }
  }, [selectedCustomerId])

  const handleCreateCustomer = async (): Promise<void> => {
    if (!newCustName.trim()) return
    setNewCustLoading(true)
    try {
      const res = await window.api.customers.create({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || null
      })
      if (res.ok && res.data) {
        const created = res.data as any
        setCustomers((prev) => [...prev, created])
        setSelectedCustomerId(String(created.id))
        setNewCustOpened(false)
        setNewCustName('')
        setNewCustPhone('')
        notifications.show({ title: 'Cliente creado', message: created.name, color: 'green' })
      } else {
        notifications.show({ title: 'Error', message: (res as any).error || 'No se pudo crear', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al crear cliente', color: 'red' })
    }
    setNewCustLoading(false)
  }

  const handleDiscountApply = (): void => {
    setGeneralDiscount(discValue > 0 ? discType as DiscountType : null, discValue)
  }

  const handleComplete = async (): Promise<void> => {
    if (paymentMethod === 'efectivo' && amountTendered < total) return
    if (paymentMethod === 'cuenta_corriente' && !selectedCustomerId) return
    if (paymentMethod === 'cuenta_corriente' && accountExceedsLimit) return
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

        // Charge to customer account if paying on credit
        if (paymentMethod === 'cuenta_corriente' && selectedCustomerId) {
          await window.api.customerAccount.charge({
            customerId: parseInt(selectedCustomerId),
            saleId: saleData.id,
            amount: total,
            description: `Venta ${saleData.receiptNumber}`
          })
        }

        // Attach customer name for receipt
        if (selectedCustomerId) {
          const cust = customers.find((c) => c.id === parseInt(selectedCustomerId))
          if (cust) saleData.customerName = cust.name
        }
        clear()
        onComplete(saleData)
        const msg = paymentMethod === 'cuenta_corriente'
          ? `Recibo: ${saleData.receiptNumber} — Cargado a cuenta`
          : `Recibo: ${saleData.receiptNumber}`
        notifications.show({ title: 'Venta completada', message: msg, color: 'green' })
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
        <Group align="flex-end" gap="xs">
          <Select
            label="Cliente (opcional)"
            placeholder="Consumidor final"
            clearable
            searchable
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            data={customers.map((c) => ({ value: String(c.id), label: c.name }))}
            style={{ flex: 1 }}
          />
          <Tooltip label="Nuevo cliente">
            <ActionIcon
              variant="light"
              color="green"
              size="lg"
              h={36}
              onClick={() => setNewCustOpened(true)}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Inline new customer form */}
        <Modal
          opened={newCustOpened}
          onClose={() => setNewCustOpened(false)}
          title="Nuevo cliente"
          size="sm"
        >
          <Stack>
            <TextInput
              label="Nombre"
              placeholder="Nombre del cliente"
              value={newCustName}
              onChange={(e) => setNewCustName(e.currentTarget.value)}
              data-autofocus
            />
            <TextInput
              label="Teléfono (opcional)"
              placeholder="Ej: 11 2345-6789"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.currentTarget.value)}
            />
            <Button
              color="green"
              onClick={handleCreateCustomer}
              loading={newCustLoading}
              disabled={!newCustName.trim()}
            >
              Crear y seleccionar
            </Button>
          </Stack>
        </Modal>

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
            { value: 'transferencia', label: 'Transferencia' },
            ...(selectedCustomerId ? [{ value: 'cuenta_corriente', label: 'Cuenta corriente (Fiado)' }] : [])
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

        {paymentMethod === 'cuenta_corriente' && (
          <Alert variant="light" color={accountExceedsLimit ? 'red' : 'blue'} icon={<IconAlertCircle size={16} />}>
            <Group justify="space-between">
              <Text size="sm">Saldo actual:</Text>
              <Text size="sm" fw={600} c={accountBalance > 0 ? 'red' : 'green'}>{fmt(accountBalance)}</Text>
            </Group>
            {accountCreditLimit > 0 && (
              <Group justify="space-between">
                <Text size="sm">Límite de crédito:</Text>
                <Text size="sm" fw={600}>{fmt(accountCreditLimit)}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text size="sm">Nuevo saldo:</Text>
              <Text size="sm" fw={700} c="red">{fmt(accountBalance + total)}</Text>
            </Group>
            {accountExceedsLimit && (
              <Text size="xs" c="red" mt={4}>Excede el límite de crédito del cliente</Text>
            )}
          </Alert>
        )}

        <Button
          fullWidth
          size="md"
          color="sap"
          loading={loading}
          disabled={
            (paymentMethod === 'efectivo' && amountTendered < total) ||
            (paymentMethod === 'cuenta_corriente' && (!selectedCustomerId || accountExceedsLimit))
          }
          onClick={handleComplete}
        >
          Confirmar venta
        </Button>
      </Stack>
    </Modal>
  )
}
