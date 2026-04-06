import { useEffect, useState } from 'react'
import {
  Modal, TextInput, Textarea, Button, Stack, Group, Select, NumberInput,
  Table, ActionIcon, Text, Tooltip, Alert
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
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
  const [supplierCatalog, setSupplierCatalog] = useState<any[]>([])
  const [lines, setLines] = useState<LineItem[]>([{ productId: null, productName: '', quantityOrdered: 1, unitCost: 0 }])
  const [newSupOpened, setNewSupOpened] = useState(false)
  const [newSupName, setNewSupName] = useState('')
  const [newSupPhone, setNewSupPhone] = useState('')
  const [newSupEmail, setNewSupEmail] = useState('')
  const [newSupAddress, setNewSupAddress] = useState('')
  const [newSupNotes, setNewSupNotes] = useState('')
  const [newSupCuit, setNewSupCuit] = useState('')
  const [newSupLoading, setNewSupLoading] = useState(false)
  const [priceWarnings, setPriceWarnings] = useState<Array<{ productName: string; currentPrice: number; cheapestPrice: number; cheapestSupplier: string }>>([])
  const [warningConfirmed, setWarningConfirmed] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const form = useForm({
    initialValues: {
      supplierId: '' as string,
      orderDate: today,
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

      setSupplierCatalog([])

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

  // Load supplier catalog when supplier changes
  useEffect(() => {
    const supplierId = Number(form.values.supplierId)
    if (supplierId > 0) {
      window.api.supplierProducts.list(supplierId).then((r: any) => {
        if (r.ok && r.data) setSupplierCatalog(r.data as any[])
        else setSupplierCatalog([])
      })
    } else {
      setSupplierCatalog([])
    }
  }, [form.values.supplierId])

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
      const productId = Number(value)
      const p = products.find((pr) => pr.id === productId)
      if (p) {
        // Use supplier price if available, otherwise product cost price
        const catalogItem = supplierCatalog.find((c: any) => c.productId === productId)
        const unitCost = catalogItem ? catalogItem.supplierPrice : p.costPrice
        updated[idx] = { ...updated[idx], productId: p.id, productName: p.name, unitCost }
      }
    } else {
      (updated[idx] as any)[field] = value
    }
    setLines(updated)
  }

  const handleCreateSupplier = async (): Promise<void> => {
    if (!newSupName.trim()) return
    setNewSupLoading(true)
    try {
      const res = await window.api.suppliers.create({
        name: newSupName.trim(),
        cuit: newSupCuit.trim() || null,
        phone: newSupPhone.trim() || null,
        email: newSupEmail.trim() || null,
        address: newSupAddress.trim() || null,
        notes: newSupNotes.trim() || null
      })
      if (res.ok && res.data) {
        const created = res.data as any
        setSuppliers((prev) => [...prev, created])
        form.setFieldValue('supplierId', String(created.id))
        setNewSupOpened(false)
        setNewSupName('')
        setNewSupPhone('')
        setNewSupEmail('')
        setNewSupAddress('')
        setNewSupNotes('')
        setNewSupCuit('')
        notifications.show({ title: 'Proveedor creado', message: created.name, color: 'green' })
      } else {
        notifications.show({ title: 'Error', message: (res as any).error || 'No se pudo crear', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error al crear proveedor', color: 'red' })
    }
    setNewSupLoading(false)
  }

  const subtotal = lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitCost, 0)

  const doSubmit = async (): Promise<void> => {
    const supplierId = Number(form.values.supplierId)
    const validLines = lines.filter((l) => l.productId && l.quantityOrdered > 0)

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
        setPriceWarnings([])
        setWarningConfirmed(false)
        onSaved()
        onClose()
      } else {
        notifications.show({ title: 'Error', message: (res as any).error || 'Error', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
  }

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

    // If already confirmed warnings, just submit
    if (warningConfirmed) {
      await doSubmit()
      return
    }

    // Check for cheaper suppliers
    const productIds = validLines.map((l) => l.productId!).filter(Boolean)
    const res = await window.api.supplierProducts.cheapest(productIds)
    if (!res.ok) { await doSubmit(); return }

    const cheapestMap = res.data as Record<number, { supplierId: number; supplierName: string; supplierPrice: number }>
    const warnings: typeof priceWarnings = []

    for (const line of validLines) {
      if (!line.productId) continue
      const cheapest = cheapestMap[line.productId]
      if (cheapest && cheapest.supplierId !== supplierId && cheapest.supplierPrice < line.unitCost) {
        warnings.push({
          productName: line.productName,
          currentPrice: line.unitCost,
          cheapestPrice: cheapest.supplierPrice,
          cheapestSupplier: cheapest.supplierName
        })
      }
    }

    if (warnings.length > 0) {
      setPriceWarnings(warnings)
      return // Don't submit yet, show warnings
    }

    await doSubmit()
  }

  // If supplier has catalog, show only their products; otherwise show all
  const hasSupplierCatalog = supplierCatalog.length > 0
  const catalogProductIds = new Set(supplierCatalog.map((c: any) => c.productId))
  const filteredProducts = hasSupplierCatalog
    ? products.filter((p) => catalogProductIds.has(p.id))
    : products

  const productOptions = filteredProducts.map((p) => {
    const catalogItem = supplierCatalog.find((c: any) => c.productId === p.id)
    const priceLabel = catalogItem ? `$${catalogItem.supplierPrice}` : `$${p.costPrice}`
    return {
      value: String(p.id),
      label: `${p.name} (${priceLabel} — Stock: ${p.stock})`
    }
  })

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.id),
    label: s.name
  }))

  return (
    <Modal opened={opened} onClose={onClose} title={purchaseOrder ? 'Editar orden de compra' : 'Nueva orden de compra'} size="xl">
      <Stack>
        <Group grow align="flex-end">
          <Group gap="xs" align="flex-end" style={{ flex: 1 }}>
            <Select
              label="Proveedor"
              placeholder="Seleccionar proveedor"
              data={supplierOptions}
              searchable
              required
              value={form.values.supplierId}
              onChange={(val) => form.setFieldValue('supplierId', val || '')}
              style={{ flex: 1 }}
            />
            <Tooltip label="Nuevo proveedor">
              <ActionIcon variant="light" color="green" size="lg" h={36} onClick={() => setNewSupOpened(true)}>
                <IconPlus size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <TextInput
            label="Fecha de orden"
            type="date"
            {...form.getInputProps('orderDate')}
          />
          <TextInput
            label="Fecha esperada"
            type="date"
            min={today}
            {...form.getInputProps('expectedDate')}
          />
        </Group>

        <Modal opened={newSupOpened} onClose={() => setNewSupOpened(false)} title="Nuevo proveedor" size="md">
          <Stack>
            <TextInput
              label="Nombre"
              placeholder="Nombre del proveedor"
              value={newSupName}
              onChange={(e) => setNewSupName(e.currentTarget.value)}
              required
              data-autofocus
            />
            <TextInput
              label="CUIT"
              placeholder="Ej: 20-12345678-9"
              value={newSupCuit}
              onChange={(e) => setNewSupCuit(e.currentTarget.value)}
            />
            <Group grow>
              <TextInput
                label="Teléfono"
                placeholder="Ej: 11 2345-6789"
                value={newSupPhone}
                onChange={(e) => setNewSupPhone(e.currentTarget.value)}
              />
              <TextInput
                label="Email"
                placeholder="proveedor@email.com"
                value={newSupEmail}
                onChange={(e) => setNewSupEmail(e.currentTarget.value)}
              />
            </Group>
            <TextInput
              label="Dirección"
              placeholder="Dirección del proveedor"
              value={newSupAddress}
              onChange={(e) => setNewSupAddress(e.currentTarget.value)}
            />
            <Textarea
              label="Notas"
              placeholder="Observaciones, condiciones de pago, etc."
              value={newSupNotes}
              onChange={(e) => setNewSupNotes(e.currentTarget.value)}
              rows={2}
            />
            <Button color="green" onClick={handleCreateSupplier} loading={newSupLoading} disabled={!newSupName.trim()}>
              Crear y seleccionar
            </Button>
          </Stack>
        </Modal>

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

        {priceWarnings.length > 0 && !warningConfirmed && (
          <Alert variant="light" color="orange" icon={<IconAlertTriangle size={18} />} title="Hay proveedores con mejor precio">
            <Stack gap={4}>
              {priceWarnings.map((w, i) => (
                <Text size="sm" key={i}>
                  <Text span fw={600}>{w.productName}</Text>: estás pagando <Text span fw={700} c="red">${w.currentPrice.toFixed(2)}</Text> pero <Text span fw={600} c="green">{w.cheapestSupplier}</Text> lo tiene a <Text span fw={700} c="green">${w.cheapestPrice.toFixed(2)}</Text>
                </Text>
              ))}
              <Group mt="xs">
                <Button size="xs" variant="light" color="orange" onClick={() => { setWarningConfirmed(true) }}>
                  Entendido, crear igual
                </Button>
                <Button size="xs" variant="subtle" onClick={() => setPriceWarnings([])}>
                  Volver a editar
                </Button>
              </Group>
            </Stack>
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button color="sap" onClick={handleSubmit}>
            {warningConfirmed ? 'Confirmar y crear' : (purchaseOrder ? 'Guardar cambios' : 'Crear orden')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
