import { useEffect, useState } from 'react'
import {
  Modal, Stack, Group, Table, Text, ActionIcon, Select, NumberInput,
  TextInput, Button, Badge, Alert, ScrollArea
} from '@mantine/core'
import {
  IconPlus, IconTrash, IconDownload, IconUpload, IconEdit, IconCheck, IconX,
  IconFileSpreadsheet
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import type { Supplier, Product } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface SupplierCatalogModalProps {
  opened: boolean
  onClose: () => void
  supplier: Supplier | null
}

export default function SupplierCatalogModal({ opened, onClose, supplier }: SupplierCatalogModalProps): JSX.Element {
  const [catalog, setCatalog] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [importResult, setImportResult] = useState<any>(null)

  // Add product
  const [addProductId, setAddProductId] = useState<string | null>(null)
  const [addPrice, setAddPrice] = useState<number>(0)
  const [addCode, setAddCode] = useState('')

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [editCode, setEditCode] = useState('')

  useEffect(() => {
    if (opened && supplier) {
      loadCatalog()
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

  const handleAdd = async (): Promise<void> => {
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

  const handleRemove = async (productId: number): Promise<void> => {
    if (!supplier) return
    await window.api.supplierProducts.remove(supplier.id, productId)
    loadCatalog()
  }

  const startEdit = (item: any): void => {
    setEditingId(item.productId)
    setEditPrice(item.supplierPrice)
    setEditCode(item.supplierCode || '')
  }

  const cancelEdit = (): void => {
    setEditingId(null)
  }

  const saveEdit = async (): Promise<void> => {
    if (!supplier || editingId === null) return
    await window.api.supplierProducts.add({
      supplierId: supplier.id,
      productId: editingId,
      supplierCode: editCode || undefined,
      supplierPrice: editPrice
    })
    setEditingId(null)
    loadCatalog()
    notifications.show({ title: 'Actualizado', message: 'Precio actualizado', color: 'green' })
  }

  const handleDownloadTemplate = async (): Promise<void> => {
    const r = await window.api.supplierProducts.downloadTemplate()
    if (r.ok && (r.data as any)?.success) {
      notifications.show({ title: 'Plantilla descargada', message: 'Completá el Excel y subilo', color: 'green' })
    }
  }

  const handleExportCatalog = async (): Promise<void> => {
    if (!supplier) return
    const r = await window.api.supplierProducts.exportCatalog(supplier.id, supplier.name)
    if (r.ok && (r.data as any)?.success) {
      notifications.show({ title: 'Catálogo exportado', message: `${catalog.length} artículos exportados`, color: 'green' })
    }
  }

  const handleImport = async (): Promise<void> => {
    if (!supplier) return
    const r = await window.api.supplierProducts.importXlsx(supplier.id)
    if (r.ok && r.data) {
      setImportResult(r.data)
      loadCatalog()
      const d = r.data as any
      if (d.imported > 0) {
        notifications.show({
          title: 'Importación completada',
          message: `${d.imported} importados, ${d.skipped} omitidos`,
          color: 'green'
        })
      }
    }
  }

  const catalogProductIds = new Set(catalog.map((c: any) => c.productId))
  const availableProducts = products.filter((p) => !catalogProductIds.has(p.id))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Catálogo — ${supplier?.name}`}
      size="xl"
    >
      <Stack>
        {/* Import/Export */}
        <Group>
          <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={handleDownloadTemplate}>
            Descargar plantilla Excel
          </Button>
          <Button variant="light" size="xs" color="teal" leftSection={<IconUpload size={14} />} onClick={handleImport}>
            Importar Excel
          </Button>
          {catalog.length > 0 && (
            <Button variant="light" size="xs" color="blue" leftSection={<IconFileSpreadsheet size={14} />} onClick={handleExportCatalog}>
              Exportar catálogo
            </Button>
          )}
          <Badge size="lg" variant="light">{catalog.length} artículo{catalog.length !== 1 ? 's' : ''}</Badge>
        </Group>

        {importResult && (
          <Alert color={importResult.skipped > 0 ? 'orange' : 'green'} variant="light">
            Importados: {importResult.imported} | Omitidos: {importResult.skipped}
            {importResult.errors?.length > 0 && (
              <Text size="xs" mt={4}>{importResult.errors.slice(0, 3).join(', ')}</Text>
            )}
          </Alert>
        )}

        {/* Add product */}
        <Group align="flex-end" gap="xs">
          <Select
            label="Agregar artículo"
            placeholder="Buscar producto..."
            searchable
            data={availableProducts.map((p) => ({
              value: String(p.id),
              label: `${p.barcode || p.sku || ''} — ${p.name}`
            }))}
            value={addProductId}
            onChange={setAddProductId}
            style={{ flex: 1 }}
            size="xs"
          />
          <TextInput label="Cód. prov." placeholder="Opcional" value={addCode} onChange={(e) => setAddCode(e.currentTarget.value)} w={100} size="xs" />
          <NumberInput label="Precio" value={addPrice} onChange={(v) => setAddPrice(Number(v) || 0)} min={0} decimalScale={2} prefix="$ " w={110} size="xs" />
          <ActionIcon variant="filled" color="green" size="md" onClick={handleAdd} disabled={!addProductId || addPrice <= 0}>
            <IconPlus size={16} />
          </ActionIcon>
        </Group>

        {/* Catalog table */}
        <ScrollArea h={400}>
          <Table striped highlightOnHover fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th>Producto</Table.Th>
                <Table.Th>Cód. proveedor</Table.Th>
                <Table.Th ta="right">Precio proveedor</Table.Th>
                <Table.Th ta="right">Precio venta</Table.Th>
                <Table.Th w={80} ta="center">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {catalog.map((item: any) => (
                <Table.Tr key={item.productId}>
                  <Table.Td c="dimmed">{item.barcode || item.sku || '—'}</Table.Td>
                  <Table.Td fw={500}>{item.productName}</Table.Td>
                  {editingId === item.productId ? (
                    <>
                      <Table.Td>
                        <TextInput size="xs" value={editCode} onChange={(e) => setEditCode(e.currentTarget.value)} w={90} />
                      </Table.Td>
                      <Table.Td ta="right">
                        <NumberInput size="xs" value={editPrice} onChange={(v) => setEditPrice(Number(v) || 0)} min={0} decimalScale={2} prefix="$ " w={100} />
                      </Table.Td>
                    </>
                  ) : (
                    <>
                      <Table.Td c="dimmed">{item.supplierCode || '—'}</Table.Td>
                      <Table.Td ta="right" fw={600}>{fmt(item.supplierPrice)}</Table.Td>
                    </>
                  )}
                  <Table.Td ta="right" c="dimmed">{fmt(item.salePrice)}</Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      {editingId === item.productId ? (
                        <>
                          <ActionIcon variant="subtle" color="green" size="sm" onClick={saveEdit}>
                            <IconCheck size={14} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="gray" size="sm" onClick={cancelEdit}>
                            <IconX size={14} />
                          </ActionIcon>
                        </>
                      ) : (
                        <>
                          <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => startEdit(item)} title="Editar">
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleRemove(item.productId)} title="Quitar">
                            <IconTrash size={14} />
                          </ActionIcon>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {catalog.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      Sin artículos. Agregá manualmente o importá un CSV.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Modal>
  )
}
