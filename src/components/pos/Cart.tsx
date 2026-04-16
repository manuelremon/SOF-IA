import { useState } from 'react'
import {
  Table, ActionIcon, NumberInput, Text, Group, Paper, Button, Stack,
  Popover, SegmentedControl, Badge, Tooltip
} from '@mantine/core'
import { IconTrash, IconDiscount, IconFlame, IconScale } from '@tabler/icons-react'
import { useCartStore } from '../../stores/cartStore'
import { notifications } from '@mantine/notifications'
import type { DiscountType } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface CartProps {
  onPay: () => void
}

function ItemDiscountPopover({ productId, currentType, currentValue }: {
  productId: number
  currentType?: DiscountType
  currentValue?: number
}): JSX.Element {
  const setItemDiscount = useCartStore((s) => s.setItemDiscount)
  const [type, setType] = useState<string>(currentType ?? 'porcentaje')
  const [value, setValue] = useState<number>(currentValue ?? 0)

  const apply = (): void => {
    setItemDiscount(productId, value > 0 ? type as DiscountType : null, value)
  }

  return (
    <Popover width={220} position="left" withArrow>
      <Popover.Target>
        <ActionIcon
          variant={currentValue ? 'filled' : 'subtle'}
          color={currentValue ? 'orange' : 'gray'}
          size="sm"
        >
          <IconDiscount size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="xs" fw={600}>Descuento</Text>
          <SegmentedControl
            size="xs"
            value={type}
            onChange={setType}
            data={[
              { label: '%', value: 'porcentaje' },
              { label: '$', value: 'monto' }
            ]}
          />
          <NumberInput
            size="xs"
            value={value}
            onChange={(v) => setValue(Number(v) || 0)}
            min={0}
            max={type === 'porcentaje' ? 100 : undefined}
            decimalScale={2}
            placeholder={type === 'porcentaje' ? '0 %' : '$ 0'}
          />
          <Button size="xs" onClick={apply} fullWidth>Aplicar</Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

export default function Cart({ onPay }: CartProps): JSX.Element {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    getSubtotal, 
    getGeneralDiscountTotal, 
    getEstimatedMarginPercent, 
    getEstimatedProfit 
  } = useCartStore()
  
  const subtotal = getSubtotal()
  const generalDiscountTotal = getGeneralDiscountTotal()
  const subtotalNet = subtotal - generalDiscountTotal
  const marginPercent = getEstimatedMarginPercent()
  const profit = getEstimatedProfit()
  const marginColor = marginPercent > 25 ? 'green' : marginPercent > 10 ? 'yellow' : 'red'

  return (
    <Paper withBorder p="md" h="100%" bg="gray.0" style={{ borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
      <Stack justify="space-between" h="100%" gap="md">
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconFlame size={24} color="var(--mantine-color-blue-filled)" />
              <Text fw={800} size="xl" c="blue.9" style={{ letterSpacing: '-0.5px' }}>
                CARRITO
              </Text>
            </Group>
            <Badge size="lg" variant="filled" color="blue.9" radius="sm">
              {items.reduce((acc, item) => acc + item.quantity, 0)} UNIDADES
            </Badge>
          </Group>

          <Paper withBorder p={0} bg="white" style={{ borderRadius: '8px', overflow: 'auto', flex: 1 }}>
            <Table highlightOnHover verticalSpacing="sm" stickyHeader>
              <Table.Thead bg="gray.1">
                <Table.Tr>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th w={100} ta="center">Cant.</Table.Th>
                  <Table.Th ta="right">Precio</Table.Th>
                  <Table.Th ta="right">Total</Table.Th>
                  <Table.Th w={80} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => {
                  const gross = item.unitPrice * item.quantity
                  let itemDiscount = 0
                  if (item.discountType === 'porcentaje' && item.discountValue) {
                    itemDiscount = (gross * item.discountValue) / 100
                  } else if (item.discountType === 'monto' && item.discountValue) {
                    itemDiscount = Math.min(item.discountValue, gross)
                  }
                  const total = gross - itemDiscount
                  
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={600} size="sm" lineClamp={1}>{item.name}</Text>
                          {itemDiscount > 0 && (
                            <Badge size="xs" color="orange" variant="light" w="fit-content">
                              -{item.discountType === 'porcentaje' ? `${item.discountValue}%` : fmt(item.discountValue!)}
                            </Badge>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          value={item.quantity}
                          onChange={(v) => updateQuantity(item.id, Number(v) || 0)}
                          size="sm"
                          min={0.1}
                          w={80}
                          styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
                        />
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" c="dimmed">{fmt(item.unitPrice)}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={700} size="sm">{fmt(total)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <ItemDiscountPopover
                            productId={item.id}
                            currentType={item.discountType}
                            currentValue={item.discountValue}
                          />
                          <ActionIcon color="red" variant="subtle" onClick={() => removeItem(item.id)}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
                {items.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Stack align="center" gap="xs" py={40}>
                        <Text c="dimmed" size="sm">El carrito está vacío</Text>
                        <Text c="dimmed" size="xs">Escanea un producto para comenzar</Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </div>

        <Stack gap="xs">
          {items.length > 0 && (
            <Paper withBorder p="xs" bg="gray.0" style={{ borderStyle: 'dashed' }}>
              <Group justify="space-between">
                <Group gap={4}>
                  <IconScale size={14} c={marginColor} />
                  <Text size="xs" c="dimmed">Margen est.:</Text>
                  <Text size="xs" fw={700} c={marginColor}>{marginPercent.toFixed(1)}%</Text>
                </Group>
                <Text size="xs" fw={700} c={marginColor}>Ganancia: {fmt(profit)}</Text>
              </Group>
            </Paper>
          )}

          <Paper withBorder p="md" bg="blue.9" style={{ borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" style={{ opacity: 0.8 }}>Subtotal</Text>
                <Text fw={600} size="md">{fmt(subtotal)}</Text>
              </Group>
              
              {generalDiscountTotal > 0 && (
                <Group justify="space-between" c="orange.2">
                  <Text size="sm" fw={600}>Descuento Global</Text>
                  <Text fw={700}>-{fmt(generalDiscountTotal)}</Text>
                </Group>
              )}

              <Group justify="space-between" mt={4}>
                <Text size="xl" fw={900} style={{ fontSize: '28px', lineHeight: 1 }}>TOTAL</Text>
                <Text size="xl" fw={900} style={{ fontSize: '28px', lineHeight: 1 }}>{fmt(subtotalNet)}</Text>
              </Group>

              <Button 
                size="xl" 
                color="green.6" 
                mt="md" 
                onClick={onPay} 
                fullWidth
                disabled={items.length === 0}
                style={{ 
                  height: '60px', 
                  fontSize: '20px', 
                  fontWeight: 900,
                  boxShadow: '0 4px 0 var(--mantine-color-green-8)'
                }}
              >
                FINALIZAR VENTA
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Paper>
  )
}
