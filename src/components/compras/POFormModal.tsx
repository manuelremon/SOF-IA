import { useEffect, useState } from 'react'
import {
  Modal, TextInput, Textarea, Button, Stack, Group, Select, NumberInput,
  Table, ActionIcon, Text
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import type { Supplier, Product, PurchaseOrder } from '../../types'
import { useAuthStore } from '../../stores/authStore'

interface POFormModalProps {
  opened: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder | null
  onSaved: () => void
}

interface LineItem {
  productId: number | null
  productName: string
  quantityOrdered: number
  unitCost: number
}

export default function POFormModal({ opened, onClose, purchaseOrder, onSaved }: POFormModalProps): JSX.Element {
  const { user } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<LineItem[]>([{ productId: null, productName: '', quantityOrdered: 1, unitCost: 0 }])

  const form = useForm({
    initialValues: {
      supplierId: '' as string,
      orderDate: '',
      expectedDate: '',
      notes: ''
    }
  })

  useEffect(() => {
    if (opened) {
      window.api.suppliers.list({ isActive: true }).then((r: any) => {
        if (r.ok) setSuppliers(r.data)
      })
      window.api.products.list({ isActive: true }).then((r: any) => {
        if (r.ok) setProducts(r.data)
      })

      if (purchaseOrder) {
        form.setValues({
          supplierId: String(purchaseOrder.supplierId),
          orderDate: purchaseOrder.orderDate || '',
          expectedDate: purchaseOrder.expectedDate || '',
          notes: purchaseOrder.notes || ''
        })
        if (purchaseOrder.items && purchaseOrder.items.length > 0) {
          setLines(
            purchaseOrder.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              quantityOrdered: i.quantityOrdered,
              unitCost: i.unitCost
            }))
          )
        }
      } else {
        form.reset()
        setLines([{ productId: null, productName: '', quantityOrdered: 1, unitCost: 0 }])
      }
    }
  }, [opened, purchaseOrder])

  const addLine = (): void => {
    setLines([...lines, { productId: null, productName: '', quantityOrdered: 1, unitCost: 0 }])
  }

  const removeLine = (idx: number): void => {
    if (lines.length <= 1) return
    setLines(lines.filter((_, i) => i !== idx))
  }

  const updateLine = (idx: number, field: keyof LineItem, value: any): void => {
    const updated = [...lines]
    if (field === 'productId' && value) {
      const p = products.find((pr) => pr.id === Number(value))
      if (p) {
        updated[idx] = { ...updated[idx], productId: p.id, productName: p.name, unitCost: p.costPrice }
      }
    } else {
      (updated[idx] as any)[field] = value
    }
    setLines(updated)
  }

  const subtotal = lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitCost, 0)

  const handleSubmit = async (): Promise<void> => {
    const supplierId = Number(form.values.supplierId)
    if (!supplierId) {
      notifications.show({ title: 'Error', message: 'Seleccioná un proveedor', color: 'red' })
      return
    }
    const validLines = lines.filter((l) => l.productId && l.quantityOrdered > 0)
    if (validLines.length === 0) {
      notifications.show({ title: 'Error', message: 'Agregá al menos un producto', color: 'red' })
      return
    }

    const payload = {
      ...(purchaseOrder ? { id: purchaseOrder.id } : {}),
      supplierId,
      userId: user?.id,
      orderDate: form.values.orderDate || undefined,
      expectedDate: form.values.expectedDate || undefined,
      notes: form.values.notes || undefined,
      items: validLines.map((l) => ({
        productId: l.productId!,
        productName: l.productName,
        quantityOrdered: l.quantityOrdered,
        unitCost: l.unitCost
      }))
    }

    try {
      const res = purchaseOrder
        ? await window.api.purchaseOrders.update(payload)
        : await window.api.purchaseOrders.create(payload)
      if (res.ok) {
        notifications.show({
          title: purchaseOrder ? 'Orden actualizada' : 'Orden creada',
          message: `Total: $${subtotal.toFixed(2)}`,
          color: 'green'
        })
        onSaved()
        onClose()
      } else {
        notifications.show({ title: 'Error', message: (res as any).error || 'Error', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
  }

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: `${p.name} (Stock: ${p.stock})`
  }))

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.id),
    label: s.name
  }))

  return (
    <Modal opened={opened} onClose={onClose} title={purchaseOrder ? 'Editar orden de compra' : 'Nueva orden de compra'} size="xl">
      <Stack>
        <Group grow>
          <Select
            label="Proveedor"
            placeholder="Seleccionar proveedor"
            data={supplierOptions}
            searchable
            required
            value={form.values.supplierId}
            onChange={(val) => form.setFieldValue('supplierId', val || '')}
          />
          <TextInput
            label="Fecha de orden"
            type="date"
            {...form.getInputProps('orderDate')}
          />
          <TextInput
            label="Fecha esperada"
            type="date"
            {...form.getInputProps('expectedDate')}
          />
        </Group>

        <Textarea label="Notas" {...form.getInputProps('notes')} />

        <Group justify="space-between">
          <Text fw={600} size="sm">Productos</Text>
          <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={addLine}>
            Agregar línea
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Producto</Table.Th>
              <Table.Th w={120}>Cantidad</Table.Th>
              <Table.Th w={140}>Costo unit.</Table.Th>
              <Table.Th w={120}>Total</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lines.map((line, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <Select
                    placeholder="Seleccionar producto"
                    data={productOptions}
                    searchable
                    size="xs"
                    value={line.productId ? String(line.productId) : null}
                    onChange={(val) => updateLine(idx, 'productId', val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={0.01}
                    step={1}
                    decimalScale={2}
                    value={line.quantityOrdered}
                    onChange={(val) => updateLine(idx, 'quantityOrdered', Number(val) || 0)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={0}
                    step={0.01}
                    decimalScale={2}
                    prefix="$"
                    value={line.unitCost}
                    onChange={(val) => updateLine(idx, 'unitCost', Number(val) || 0)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="sm">${(line.quantityOrdered * line.unitCost).toFixed(2)}</Text>
                </Table.Td>
                <Table.Td>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeLine(idx)} disabled={lines.length <= 1}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end">
          <Text fw={700}>Subtotal: ${subtotal.toFixed(2)}</Text>
        </Group>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button color="sap" onClick={handleSubmit}>
            {purchaseOrder ? 'Guardar cambios' : 'Crear orden'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
