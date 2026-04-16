import { useEffect, useState } from 'react'
import {
  Modal, TextInput, NumberInput, Select, Button, Stack, Group, Text,
  Table, ActionIcon, Divider, Loader
} from '@mantine/core'
import { IconPlus, IconTrash, IconBarcode, IconSparkles } from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useSettingsStore } from '../../stores/settingsStore'
import type { Product, Category, Supplier } from '../../types'
import CameraScanner from '../pos/CameraScanner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface ProductFormModalProps {
  opened: boolean
  onClose: () => void
  product: Product | null
  categories: Category[]
  onSaved: () => void
}

export default function ProductFormModal({ opened, onClose, product, categories, onSaved }: ProductFormModalProps): JSX.Element {
  const form = useForm({
    initialValues: {
      name: '',
      categoryId: '' as string,
      barcode: '',
      sku: '',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      unit: 'unidad',
      brand: '',
      presentation: '',
      description: ''
    }
  })

  // Suppliers for this product
  const [productSuppliers, setProductSuppliers] = useState<any[]>([])
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])
  const [addSupplierId, setAddSupplierId] = useState<string | null>(null)
  const [addSupPrice, setAddSupPrice] = useState<number>(0)
  const [cameraOpened, setCameraOpened] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)

  const { settings } = useSettingsStore()
  const scannerMode = settings?.scanner_mode || 'both'
  const allowCamera = scannerMode === 'both' || scannerMode === 'camera'

  useEffect(() => {
    if (opened) {
      if (product) {
        form.setValues({
          name: product.name,
          categoryId: product.categoryId ? String(product.categoryId) : '',
          barcode: product.barcode || '',
          sku: product.sku || '',
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          stock: product.stock,
          minStock: product.minStock,
          unit: product.unit,
          brand: product.brand || '',
          presentation: product.presentation || '',
          description: product.description || ''
        })
        loadProductSuppliers()
      } else {
        form.reset()
        setProductSuppliers([])
      }
      window.api.suppliers.list({ isActive: true }).then((r: any) => {
        if (r.ok) setAllSuppliers(r.data)
      })
    }
  }, [opened, product])

  const loadProductSuppliers = (): void => {
    if (!product) return
    window.api.supplierProducts.listByProduct(product.id).then((r: any) => {
      if (r.ok) setProductSuppliers(r.data)
    })
  }

  const handleBarcodeLookup = async (code: string): Promise<void> => {
    if (!code || code.length < 8) return
    
    setLookupLoading(true)
    try {
      const res = await window.api.products.lookup(code)
      if (res.ok && res.data && res.data.found) {
        const d = res.data
        form.setValues({
          ...form.values,
          name: d.name || form.values.name,
          brand: d.brand || form.values.brand,
          presentation: d.presentation || form.values.presentation,
          description: d.description || form.values.description,
          categoryId: d.categoryId ? String(d.categoryId) : form.values.categoryId,
          salePrice: d.suggestedPrice || form.values.salePrice
        })
        notifications.show({
          title: 'Producto identificado',
          message: `Se autocompletaron los datos para: ${d.name}${d.suggestedPrice ? ' (Precio sugerido: $ ' + d.suggestedPrice + ')' : ''}`,
          color: 'blue',
          icon: <IconSparkles size={16} />
        })
      }
    } catch (err) {
      console.error('Lookup error', err)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleVisualIdentification = (d: any): void => {
    if (!d || !d.found) return

    form.setValues({
      ...form.values,
      barcode: d.barcode || form.values.barcode,
      name: d.name || form.values.name,
      brand: d.brand || form.values.brand,
      presentation: d.presentation || form.values.presentation,
      description: d.description || form.values.description,
      categoryId: d.categoryId ? String(d.categoryId) : form.values.categoryId,
      salePrice: d.suggestedPrice || form.values.salePrice
    })

    notifications.show({
      title: 'Identificación Visual Exitosa',
      message: `SOF-IA reconoció: ${d.name}${d.suggestedPrice ? ' - Precio Sugerido: $ ' + d.suggestedPrice : ''}`,
      color: 'blue',
      icon: <IconSparkles size={16} />
    })
    setCameraOpened(false)
  }

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    const payload = {
      ...values,
      categoryId: values.categoryId ? Number(values.categoryId) : undefined
    }
    try {
      const res = product
        ? await window.api.products.update({ id: product.id, ...payload })
        : await window.api.products.create(payload)
      if (res.ok) {
        notifications.show({ title: product ? 'Producto actualizado' : 'Producto creado', message: values.name, color: 'green' })
        onSaved()
        onClose()
      } else {
        notifications.show({ title: 'Error', message: res.error || 'Error al guardar', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
  }

  const handleAddSupplier = async (): Promise<void> => {
    if (!product || !addSupplierId || addSupPrice <= 0) return
    const res = await window.api.supplierProducts.add({
      supplierId: parseInt(addSupplierId),
      productId: product.id,
      supplierPrice: addSupPrice
    })
    if (res.ok) {
      setAddSupplierId(null)
      setAddSupPrice(0)
      loadProductSuppliers()
    }
  }

  const handleRemoveSupplier = async (supplierId: number): Promise<void> => {
    if (!product) return
    await window.api.supplierProducts.remove(supplierId, product.id)
    loadProductSuppliers()
  }

  const linkedSupplierIds = new Set(productSuppliers.map((s: any) => s.supplierId))
  const availableSuppliers = allSuppliers.filter((s) => !linkedSupplierIds.has(s.id))

  return (
    <Modal opened={opened} onClose={onClose} title={product ? 'Editar producto' : 'Nuevo producto'} size={product ? 'lg' : 'md'}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group grow align="flex-end">
            <TextInput
              label="Código de barras"
              placeholder="Escanea o escribe..."
              rightSection={
                lookupLoading ? (
                  <Loader size="xs" />
                ) : allowCamera ? (
                  <ActionIcon onClick={() => setCameraOpened(true)} variant="subtle" color="blue">
                    <IconBarcode size={16} />
                  </ActionIcon>
                ) : undefined
              }
              {...form.getInputProps('barcode')}
              onBlur={(e) => {
                if (!product) handleBarcodeLookup(e.currentTarget.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !product) {
                  e.preventDefault()
                  handleBarcodeLookup(form.values.barcode)
                }
              }}
            />
            <TextInput label="SKU" {...form.getInputProps('sku')} />
          </Group>

          <TextInput label="Artículo" placeholder="Ej: Acondicionador" required {...form.getInputProps('name')} />
          
          <Group grow>
            <TextInput label="Marca" placeholder="Ej: Plusbelle" {...form.getInputProps('brand')} />
            <TextInput label="Presentación" placeholder="Ej: 1L, 900ml" {...form.getInputProps('presentation')} />
          </Group>
          
          <TextInput label="Desc. Adicional" placeholder="Sabores, características..." {...form.getInputProps('description')} />
          
          <Select
            label="Categoría"
            placeholder="Sin categoría"
            clearable
            searchable
            data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            {...form.getInputProps('categoryId')}
          />
          
          <Group grow>
            <NumberInput label="Precio costo" min={0} decimalScale={2} prefix="$ " {...form.getInputProps('costPrice')} />
            <NumberInput label="Precio venta" min={0} decimalScale={2} prefix="$ " {...form.getInputProps('salePrice')} />
          </Group>
          <Group grow>
            <NumberInput label="Stock" min={0} decimalScale={2} {...form.getInputProps('stock')} />
            <NumberInput label="Stock mínimo" min={0} decimalScale={2} {...form.getInputProps('minStock')} />
          </Group>
          <TextInput label="Unidad" {...form.getInputProps('unit')} />

          {/* Suppliers section — only when editing */}
          {product && (
            <>
              <Divider label="Proveedores de este producto" labelPosition="center" />

              {productSuppliers.length > 0 ? (
                <Table fz="sm" striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Proveedor</Table.Th>
                      <Table.Th>CUIT</Table.Th>
                      <Table.Th ta="right">Precio proveedor</Table.Th>
                      <Table.Th w={40} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {productSuppliers.map((sp: any) => (
                      <Table.Tr key={sp.supplierId}>
                        <Table.Td fw={500}>{sp.supplierName}</Table.Td>
                        <Table.Td c="dimmed">{sp.cuit || '—'}</Table.Td>
                        <Table.Td ta="right" fw={600}>{fmt(sp.supplierPrice)}</Table.Td>
                        <Table.Td>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleRemoveSupplier(sp.supplierId)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text size="sm" c="dimmed" ta="center">Sin proveedores asignados</Text>
              )}

              <Group align="flex-end" gap="xs">
                <Select
                  placeholder="Agregar proveedor..."
                  searchable
                  data={availableSuppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                  value={addSupplierId}
                  onChange={setAddSupplierId}
                  style={{ flex: 1 }}
                  size="xs"
                />
                <NumberInput
                  placeholder="Precio"
                  value={addSupPrice}
                  onChange={(v) => setAddSupPrice(Number(v) || 0)}
                  min={0}
                  decimalScale={2}
                  prefix="$ "
                  w={110}
                  size="xs"
                />
                <ActionIcon
                  variant="filled"
                  color="green"
                  size="md"
                  onClick={handleAddSupplier}
                  disabled={!addSupplierId || addSupPrice <= 0}
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Group>
            </>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" color="sap" loading={lookupLoading}>{product ? 'Guardar cambios' : 'Crear producto'}</Button>
          </Group>
        </Stack>
      </form>

      <CameraScanner
        opened={cameraOpened}
        onScan={(code) => {
          setCameraOpened(false)
          form.setFieldValue('barcode', code)
          if (!product) handleBarcodeLookup(code)
        }}
        onIdentify={!product ? handleVisualIdentification : undefined}
        onClose={() => setCameraOpened(false)}
      />
    </Modal>
  )
}
