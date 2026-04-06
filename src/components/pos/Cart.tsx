import { useState } from 'react'
import {
  Table, ActionIcon, NumberInput, Text, Group, Paper, Button, Stack,
  Popover, SegmentedControl, Badge
} from '@mantine/core'
import { IconTrash, IconDiscount, IconFlame } from '@tabler/icons-react'
import { useCartStore } from '../../stores/cartStore'
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
  const { items, removeItem, updateQuantity, getSubtotal, getGeneralDiscountTotal, getEstimatedMarginPercent, getEstimatedProfit } = useCartStore()
  const subtotal = getSubtotal()
  const generalDiscountTotal = getGeneralDiscountTotal()
  const subtotalNet = subtotal - generalDiscountTotal
  const marginPercent = getEstimatedMarginPercent()
  const profit = getEstimatedProfit()
  const marginColor = marginPercent > 25 ? 'green' : marginPercent > 10 ? 'yellow' : 'red'

  return (
    <Paper withBorder p="md" h="100%">
      <Stack justify="space-between" h="100%">
        <div>
          <Text fw={600} mb="sm">
            Carrito ({items.length} items)
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Producto</Table.Th>
                <Table.Th w={90}>Cant.</Table.Th>
                <Table.Th ta="right">Precio</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
                <Table.Th w={70} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => {
                const gross = item.unitPrice * item.quantity
                let itemDiscount = 0
                if (item.discountType === 'porcentaje' && item.discountValue) {
                  itemDiscount = gross * (item.discountValue / 100)
                } else if (item.discountType === 'monto' && item.discountValue) {
                  itemDiscount = Math.min(item.discountValue, gross)
                }
                const lineNet = gross - itemDiscount

                return (
                  <Table.Tr key={item.productId}>
                    <Table.Td>
                      <Text size="sm" lineClamp={1}>
                        {item.productName}
                      </Text>
                      {itemDiscount > 0 && (
                        <Badge size="xs" color="orange" variant="light">
                          -{item.discountType === 'porcentaje' ? `${item.discountValue}%` : fmt(item.discountValue!)}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.quantity}
                        onChange={(v) => updateQuantity(item.productId, Number(v) || 0)}
                        min={1}
                        max={item.stock}
                        size="xs"
                        w={70}
                      />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm">{fmt(item.unitPrice)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" fw={500}>
                        {fmt(lineNet)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <ItemDiscountPopover
                          productId={item.productId}
                          currentType={item.discountType}
                          currentValue={item.discountValue}
                        />
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
              {items.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" size="sm" py="xl">
                      Carrito vacío
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>

        <div>
          <Group justify="space-between" mb={4} pt="sm" style={{ borderTop: '1px solid #e0e0e0' }}>
            <Text size="lg" fw={700}>
              Subtotal
            </Text>
            <Text size="lg" fw={700}>
              {fmt(generalDiscountTotal > 0 ? subtotalNet : subtotal)}
            </Text>
          </Group>
          {items.length > 0 && (
            <Group justify="space-between" mb="sm">
              <Group gap={4}>
                <IconFlame size={14} color={marginColor === 'green' ? '#40c057' : marginColor === 'yellow' ? '#fab005' : '#fa5252'} />
                <Text size="xs" c="dimmed">Margen est.</Text>
              </Group>
              <Badge size="sm" variant="light" color={marginColor}>
                {marginPercent.toFixed(1)}% ({fmt(profit)})
              </Badge>
            </Group>
          )}
          <Button fullWidth size="lg" color="sap" disabled={items.length === 0} onClick={onPay}>
            Cobrar
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}
