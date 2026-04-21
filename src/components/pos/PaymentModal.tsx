import { useState, useEffect } from 'react'
import {
  Modal, Stack, Select, NumberInput, Button, Group, Text, Alert,
  SegmentedControl, Divider, ActionIcon, TextInput, Tooltip, Switch,
  Paper, Grid, Badge, rem, Box, Collapse, SimpleGrid, UnstyledButton
} from '@mantine/core'
import {
  IconAlertCircle, IconDiscount, IconPlus, IconFileInvoice, IconCash, IconCreditCard,
  IconBuildingBank, IconWallet, IconUser, IconCheck
} from '@tabler/icons-react'
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

  // AFIP state
  const [emitirAfip, setEmitirAfip] = useState(false)
  const [afipPtoVta, setAfipPtoVta] = useState(1)
  const [afipInvoiceType, setAfipInvoiceType] = useState<string>('11') 
  const [afipDocType, setAfipDocType] = useState<string>('99') 
  const [afipDocNumber, setAfipDocNumber] = useState<string>('')

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
      setEmitirAfip(false)
      window.api.settings.get('tax_rate').then((r: any) => {
        if (r.ok && r.data) setTaxRate(parseFloat(r.data) || 0)
      })
      window.api.settings.get('afip_pto_vta').then((r: any) => {
        if (r.ok && r.data) setAfipPtoVta(parseInt(r.data) || 1)
      })
      window.api.customers.list({ isActive: true }).then((r: any) => {
        if (r.ok && r.data) setCustomers(r.data)
      })
      setAccountBalance(0)
      setAccountCreditLimit(0)
    }
  }, [opened, generalDiscountType, generalDiscountValue])

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
  }, [selectedCustomerId, paymentMethod])

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
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al crear cliente', color: 'red' })
    }
    setNewCustLoading(false)
  }

  const handleComplete = async (): Promise<void> => {
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
        })),
        afipInvoiceType: emitirAfip ? parseInt(afipInvoiceType) : undefined,
        afipDocType: emitirAfip ? parseInt(afipDocType) : undefined,
        afipDocNumber: emitirAfip ? afipDocNumber : undefined
      })
      if (res.ok && res.data) {
        const saleData = res.data as any
        if (paymentMethod === 'cuenta_corriente' && selectedCustomerId) {
          await window.api.customerAccount.charge({
            customerId: parseInt(selectedCustomerId),
            saleId: saleData.id,
            amount: total,
            description: `Venta ${saleData.receiptNumber}`
          })
        }
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
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={900} size="xl" style={{ letterSpacing: '-0.5px' }}>FINALIZAR VENTA</Text>} 
      size="80%"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="lg">
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb="xs">Información del Cliente</Text>
              <Group align="flex-end" gap="xs">
                <Select
                  placeholder="Consumidor final"
                  clearable
                  searchable
                  leftSection={<IconUser size={18} />}
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  data={customers.map((c) => ({ value: String(c.id), label: c.name }))}
                  style={{ flex: 1 }}
                  size="md"
                />
                <ActionIcon variant="filled" color="blue" size="42" radius="md" onClick={() => setNewCustOpened(true)}>
                  <IconPlus size={22} />
                </ActionIcon>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="xs" fw={800} c="dimmed" tt="uppercase" mb="md">Método de Pago</Text>
              <SimpleGrid cols={2} spacing="sm">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: IconCash, color: 'green' },
                  { id: 'tarjeta', label: 'Tarjeta', icon: IconCreditCard, color: 'blue' },
                  { id: 'transferencia', label: 'Transferencia', icon: IconBuildingBank, color: 'violet' },
                  { id: 'cuenta_corriente', label: 'Cuenta C.', icon: IconWallet, color: 'orange', disabled: !selectedCustomerId }
                ].map((m) => (
                  <UnstyledButton
                    key={m.id}
                    onClick={() => !m.disabled && setPaymentMethod(m.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `2px solid ${paymentMethod === m.id ? `var(--mantine-color-${m.color}-filled)` : 'var(--mantine-color-default-border)'}`,
                      backgroundColor: paymentMethod === m.id ? `var(--mantine-color-${m.color}-light)` : 'white',
                      opacity: m.disabled ? 0.4 : 1,
                      cursor: m.disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 200ms ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <m.icon size={28} color={paymentMethod === m.id ? `var(--mantine-color-${m.color}-filled)` : '#868e96'} />
                    <Text size="sm" fw={700} c={paymentMethod === m.id ? `${m.color}.9` : 'gray.7'}>{m.label}</Text>
                  </UnstyledButton>
                ))}
              </SimpleGrid>

              <Box mt="xl">
                {paymentMethod === 'efectivo' && (
                  <Stack gap="md">
                    <NumberInput
                      label="Monto recibido"
                      value={amountTendered}
                      onChange={(v) => setAmountTendered(Number(v) || 0)}
                      min={0} decimalScale={2} prefix="$ " size="lg" autoFocus
                      styles={{ input: { fontSize: rem(24), fontWeight: 900 } }}
                    />
                    {amountTendered >= total && (
                      <Paper p="md" radius="md" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-2)' }}>
                        <Group justify="space-between">
                          <Text fw={700} c="green.9">Vuelto sugerido:</Text>
                          <Text fw={900} size="xl" c="green.9">{fmt(change)}</Text>
                        </Group>
                      </Paper>
                    )}
                  </Stack>
                )}
                {paymentMethod === 'cuenta_corriente' && (
                   <Alert variant="light" color={accountExceedsLimit ? 'red' : 'orange'} icon={<IconAlertCircle size={18} />}>
                     <Stack gap={4}>
                       <Group justify="space-between"><Text size="sm">Saldo previo:</Text><Text size="sm" fw={700}>{fmt(accountBalance)}</Text></Group>
                       <Group justify="space-between"><Text size="sm">Total a cargar:</Text><Text size="sm" fw={900}>{fmt(total)}</Text></Group>
                       <Divider my={4} style={{ borderStyle: 'dashed' }} />
                       <Group justify="space-between"><Text fw={800}>Nuevo Saldo:</Text><Text fw={900} c="red.8">{fmt(accountBalance + total)}</Text></Group>
                       {accountExceedsLimit && <Badge color="red" variant="filled" fullWidth mt="xs">LÍMITE EXCEDIDO</Badge>}
                     </Stack>
                   </Alert>
                )}
              </Box>
            </Paper>

            <Paper withBorder p="md" radius="md" bg={emitirAfip ? 'blue.0' : 'white'}>
               <Group justify="space-between" mb="xs">
                 <Group gap="sm">
                   <IconFileInvoice size={20} color={emitirAfip ? 'var(--mantine-color-blue-7)' : '#868e96'} />
                   <Text fw={700} c={emitirAfip ? 'blue.9' : 'gray.7'}>Facturación Electrónica</Text>
                 </Group>
                 <Switch checked={emitirAfip} onChange={(e) => setEmitirAfip(e.currentTarget.checked)} size="md" />
               </Group>
               <Collapse in={emitirAfip}>
                 <Grid gutter="sm" mt="md">
                   <Grid.Col span={6}><Select label="Comprobante" value={afipInvoiceType} onChange={(v) => setAfipInvoiceType(v || '11')} data={[{ label: 'Factura C', value: '11' }, { label: 'Factura B', value: '6' }, { label: 'Factura A', value: '1' }]} size="xs" /></Grid.Col>
                   <Grid.Col span={6}><Select label="Doc. Cliente" value={afipDocType} onChange={(v) => setAfipDocType(v || '99')} data={[{ label: 'DNI', value: '96' }, { label: 'CUIT', value: '80' }, { label: 'Cons. Final', value: '99' }]} size="xs" /></Grid.Col>
                   {afipDocType !== '99' && <Grid.Col span={12}><TextInput label="Número de Documento" value={afipDocNumber} onChange={(e) => setAfipDocNumber(e.currentTarget.value)} placeholder="CUIT o DNI sin guiones" size="sm" /></Grid.Col>}
                 </Grid>
               </Collapse>
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack justify="space-between" h="100%">
            <Paper withBorder radius="md" p="xl" bg="blue.9" style={{ color: 'white' }}>
              <Stack gap="md">
                <Text size="xs" fw={800} tt="uppercase" style={{ opacity: 0.7 }}>Resumen de Operación</Text>
                <Group justify="space-between"><Text size="sm">Items</Text><Text size="sm" fw={700}>{items.length}</Text></Group>
                <Group justify="space-between"><Text size="sm">Subtotal</Text><Text size="sm" fw={700}>{fmt(subtotal)}</Text></Group>
                <Group justify="space-between">
                  <Group gap={6}><IconDiscount size={16} /><Text size="sm">Descuento Global</Text></Group>
                  <Group gap={4}>
                    <NumberInput size="xs" w={60} variant="unstyled" value={discValue} 
                      onChange={(v) => { setDiscValue(Number(v) || 0); setGeneralDiscount(Number(v) > 0 ? discType as DiscountType : null, Number(v)); }}
                      styles={{ input: { color: 'white', fontWeight: 800, textAlign: 'right', padding: 0 } }} />
                    <Text size="xs" fw={800}>{discType === 'porcentaje' ? '%' : '$'}</Text>
                  </Group>
                </Group>
                {taxRate > 0 && <Group justify="space-between"><Text size="sm">IVA ({taxRate}%)</Text><Text size="sm" fw={700}>{fmt(taxTotal)}</Text></Group>}
                <Divider my="sm" color="white" style={{ opacity: 0.2 }} />
                <Stack gap={0} align="center" py="md">
                  <Text size="xs" fw={800} tt="uppercase" mb={4} style={{ opacity: 0.8 }}>Total a Pagar</Text>
                  <Text size="50px" fw={900} style={{ lineHeight: 0.9 }}>{fmt(total)}</Text>
                </Stack>
              </Stack>
            </Paper>

            <Button size="xl" h={80} radius="md" color="green.6" fullWidth
              disabled={(paymentMethod === 'efectivo' && amountTendered < total) || (paymentMethod === 'cuenta_corriente' && (!selectedCustomerId || accountExceedsLimit)) || items.length === 0}
              loading={loading} onClick={handleComplete} leftSection={<IconCheck size={28} />}
              style={{ boxShadow: '0 8px 15px rgba(40, 167, 69, 0.25)', fontSize: rem(22), fontWeight: 900 }}
            >
              CONFIRMAR VENTA
            </Button>
          </Stack>
        </Grid.Col>
      </Grid>

      <Modal opened={newCustOpened} onClose={() => setNewCustOpened(false)} title="Nuevo cliente" size="sm">
        <Stack>
          <TextInput label="Nombre" placeholder="Nombre completo" value={newCustName} onChange={(e) => setNewCustName(e.currentTarget.value)} autoFocus />
          <TextInput label="Teléfono" placeholder="Ej: 11 23456789" value={newCustPhone} onChange={(e) => setNewCustPhone(e.currentTarget.value)} />
          <Button color="green" onClick={handleCreateCustomer} loading={newCustLoading} disabled={!newCustName.trim()}>Crear y seleccionar</Button>
        </Stack>
      </Modal>
    </Modal>
  )
}
