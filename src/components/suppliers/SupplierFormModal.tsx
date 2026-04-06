import { useEffect, useState } from 'react'
import {
  Modal, TextInput, Textarea, Button, Stack, Group, Tabs, Table, Text,
  Select, NumberInput, ActionIcon, Badge, Alert
} from '@mantine/core'
import {
  IconUser, IconPackage, IconPlus, IconTrash, IconDownload, IconUpload
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Supplier, Product } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface SupplierFormModalProps {
  opened: boolean
  onClose: () => void
  supplier: Supplier | null
  onSaved: () => void
}

export default function SupplierFormModal({ opened, onClose, supplier, onSaved }: SupplierFormModalProps): JSX.Element {
  const form = useForm({
    initialValues: { name: '', cuit: '', phone: '', email: '', address: '', notes: '' }
  })

  // Catalog state
  const [catalog, setCatalog] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [addProductId, setAddProductId] = useState<string | null>(null)
  const [addPrice, setAddPrice] = useState<number>(0)
  const [addCode, setAddCode] = useState('')
  const [importResult, setImportResult] = useState<any>(null)

  useEffect(() => {
    if (opened) {
      if (supplier) {
        form.setValues({
          name: supplier.name,
          cuit: supplier.cuit || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          notes: supplier.notes || ''
        })
        loadCatalog()
      } else {
        form.reset()
        setCatalog([])
      }
      setImportResult(null)
      window.api.products.list({ isActive: true }).then((r: any) => {
        if (r.ok) setProducts(r.data)
      })
    }
  }, [opened, supplier])

  const loadCatalog = (): void => {
    if (!supplier) return
    window.api.supplierProducts.list(supplier.id).then((r: any) => {
      if (r.ok) setCatalog(r.data)
    })
  }

  const handleSubmit = async (values: typeof form.values): Promise<void> => {
    try {
      const res = supplier
        ? await window.api.suppliers.update({ id: supplier.id, ...values })
        : await window.api.suppliers.create(values)
      if (res.ok) {
        notifications.show({ title: supplier ? 'Proveedor actualizado' : 'Proveedor creado', message: values.name, color: 'green' })
        onSaved()
        if (!supplier) onClose()
      } else {
        notifications.show({ title: 'Error', message: res.error || 'Error', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
  }

  const handleAddProduct = async (): Promise<void> => {
    if (!supplier || !addProductId || addPrice <= 0) return
    const res = await window.api.supplierProducts.add({
      supplierId: supplier.id,
      productId: parseInt(addProductId),
      supplierCode: addCode || undefined,
      supplierPrice: addPrice
    })
    if (res.ok) {
      setAddProductId(null)
      setAddPrice(0)
      setAddCode('')
      loadCatalog()
    }
  }

  const handleRemoveProduct = async (productId: number): Promise<void> => {
    if (!supplier) return
    await window.api.supplierProducts.remove(supplier.id, productId)
    loadCatalog()
  }

  const handleDownloadTemplate = async (): Promise<void> => {
    const r = await window.api.supplierProducts.downloadTemplate()
    if (r.ok && (r.data as any)?.success) {
      notifications.show({ title: 'Plantilla descargada', message: 'Completá el Excel y subilo', color: 'green' })
    }
  }

  const handleImportCsv = async (): Promise<void> => {
    if (!supplier) return
    const r = await window.api.supplierProducts.importXlsx(supplier.id)
    if (r.ok && r.data) {
      setImportResult(r.data)
      loadCatalog()
      if ((r.data as any).imported > 0) {
        notifications.show({
          title: 'Importación completada',
          message: `${(r.data as any).imported} producto(s) importados, ${(r.data as any).skipped} omitidos`,
          color: 'green'
        })
      }
    }
  }

  const catalogProductIds = new Set(catalog.map((c: any) => c.productId))
  const availableProducts = products.filter((p) => !catalogProductIds.has(p.id))

  const isEditing = !!supplier

  return (
    <Modal opened={opened} onClose={onClose} title={supplier ? 'Editar proveedor' : 'Nuevo proveedor'} size={isEditing ? 'xl' : 'md'}>
      {isEditing ? (
        <Tabs defaultValue="datos">
          <Tabs.List>
            <Tabs.Tab value="datos" leftSection={<IconUser size={14} />}>Datos</Tabs.Tab>
            <Tabs.Tab value="catalogo" leftSection={<IconPackage size={14} />}>
              Catálogo
              {catalog.length > 0 && (
                <Badge size="xs" ml={6} variant="filled" circle>{catalog.length}</Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="datos" pt="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput label="Nombre" required {...form.getInputProps('name')} />
                <TextInput label="CUIT" placeholder="Ej: 20-12345678-9" {...form.getInputProps('cuit')} />
                <Group grow>
                  <TextInput label="Teléfono" {...form.getInputProps('phone')} />
                  <TextInput label="Email" {...form.getInputProps('email')} />
                </Group>
                <TextInput label="Dirección" {...form.getInputProps('address')} />
                <Textarea label="Notas" {...form.getInputProps('notes')} />
                <Group justify="flex-end">
                  <Button variant="default" onClick={onClose}>Cerrar</Button>
                  <Button type="submit" color="sap">Guardar</Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="catalogo" pt="md">
            <Stack>
              {/* Import/Export buttons */}
              <Group>
                <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={handleDownloadTemplate}>
                  Descargar plantilla Excel
                </Button>
                <Button variant="light" size="xs" color="teal" leftSection={<IconUpload size={14} />} onClick={handleImportCsv}>
                  Importar Excel
                </Button>
              </Group>

              {importResult && (
                <Alert color={importResult.skipped > 0 ? 'orange' : 'green'} variant="light">
                  Importados: {importResult.imported} | Omitidos: {importResult.skipped}
                  {importResult.errors?.length > 0 && (
                    <Text size="xs" mt={4}>{importResult.errors.slice(0, 3).join(', ')}</Text>
                  )}
                </Alert>
              )}

              {/* Add product manually */}
              <Group align="flex-end" gap="xs">
                <Select
                  label="Agregar producto"
                  placeholder="Buscar producto..."
                  searchable
                  data={availableProducts.map((p) => ({ value: String(p.id), label: `${p.name} (${p.barcode || p.sku || 'sin código'})` }))}
                  value={addProductId}
                  onChange={setAddProductId}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Código prov."
                  placeholder="Opcional"
                  value={addCode}
                  onChange={(e) => setAddCode(e.currentTarget.value)}
                  w={120}
                />
                <NumberInput
                  label="Precio prov."
                  value={addPrice}
                  onChange={(v) => setAddPrice(Number(v) || 0)}
                  min={0}
                  decimalScale={2}
                  prefix="$ "
                  w={120}
                />
                <ActionIcon
                  variant="filled"
                  color="green"
                  size="lg"
                  h={36}
                  onClick={handleAddProduct}
                  disabled={!addProductId || addPrice <= 0}
                >
                  <IconPlus size={18} />
                </ActionIcon>
              </Group>

              {/* Catalog table */}
              <Table striped highlightOnHover fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Producto</Table.Th>
                    <Table.Th>Código barras</Table.Th>
                    <Table.Th>Cód. proveedor</Table.Th>
                    <Table.Th ta="right">Precio proveedor</Table.Th>
                    <Table.Th ta="right">Precio venta</Table.Th>
                    <Table.Th w={40} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {catalog.map((item: any) => (
                    <Table.Tr key={item.productId}>
                      <Table.Td fw={500}>{item.productName}</Table.Td>
                      <Table.Td c="dimmed">{item.barcode || item.sku || '—'}</Table.Td>
                      <Table.Td c="dimmed">{item.supplierCode || '—'}</Table.Td>
                      <Table.Td ta="right" fw={600}>{fmt(item.supplierPrice)}</Table.Td>
                      <Table.Td ta="right" c="dimmed">{fmt(item.salePrice)}</Table.Td>
                      <Table.Td>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleRemoveProduct(item.productId)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {catalog.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          Sin productos. Agregá manualmente o importá un Excel.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Nombre" required {...form.getInputProps('name')} />
            <TextInput label="CUIT" placeholder="Ej: 20-12345678-9" {...form.getInputProps('cuit')} />
            <Group grow>
              <TextInput label="Teléfono" {...form.getInputProps('phone')} />
              <TextInput label="Email" {...form.getInputProps('email')} />
            </Group>
            <TextInput label="Dirección" {...form.getInputProps('address')} />
            <Textarea label="Notas" {...form.getInputProps('notes')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>Cancelar</Button>
              <Button type="submit" color="sap">Crear</Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
