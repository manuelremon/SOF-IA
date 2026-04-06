import { useState, useEffect } from 'react'
import {
  Modal, Stack, Select, SegmentedControl, NumberInput, Button, Table, Text,
  Group, Badge, ScrollArea
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { Category } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface BulkPriceModalProps {
  opened: boolean
  onClose: () => void
  onApplied: () => void
}

export default function BulkPriceModal({ opened, onClose, onApplied }: BulkPriceModalProps): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [adjType, setAdjType] = useState<string>('porcentaje')
  const [adjValue, setAdjValue] = useState<number>(0)
  const [target, setTarget] = useState<string>('salePrice')
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (opened) {
      window.api.categories.list().then((r: any) => {
        if (r.ok) setCategories(r.data)
      })
      setPreview([])
      setAdjValue(0)
      setCategoryId(null)
    }
  }, [opened])

  const handlePreview = async (): Promise<void> => {
    if (adjValue === 0) return
    setLoading(true)
    const filters = categoryId ? { categoryId: parseInt(categoryId) } : { all: true }
    const adjustment = { type: adjType, value: adjValue, target }
    const r = await window.api.products.bulkPricePreview(filters, adjustment)
    if (r.ok) setPreview(r.data as any[])
    setLoading(false)
  }

  const handleApply = async (): Promise<void> => {
    if (preview.length === 0) return
    setLoading(true)
    const updates = preview.map((p: any) => ({
      id: p.id,
      newCostPrice: p.newCostPrice,
      newSalePrice: p.newSalePrice
    }))
    const r = await window.api.products.bulkPriceApply(updates)
    if (r.ok) {
      notifications.show({
        title: 'Precios actualizados',
        message: `Se actualizaron ${preview.length} producto(s)`,
        color: 'green'
      })
      onApplied()
      onClose()
    } else {
      notifications.show({ title: 'Error', message: (r as any).error, color: 'red' })
    }
    setLoading(false)
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Actualización masiva de precios" size="lg">
      <Stack>
        <Select
          label="Categoría"
          placeholder="Todas las categorías"
          clearable
          data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          value={categoryId}
          onChange={setCategoryId}
        />

        <Group grow>
          <div>
            <Text size="sm" fw={500} mb={4}>Tipo de ajuste</Text>
            <SegmentedControl
              fullWidth
              value={adjType}
              onChange={setAdjType}
              data={[
                { label: 'Porcentaje %', value: 'porcentaje' },
                { label: 'Monto fijo $', value: 'monto' }
              ]}
            />
          </div>
          <NumberInput
            label={adjType === 'porcentaje' ? 'Porcentaje (%)' : 'Monto ($)'}
            value={adjValue}
            onChange={(v) => setAdjValue(Number(v) || 0)}
            decimalScale={2}
            prefix={adjType === 'monto' ? '$ ' : ''}
            suffix={adjType === 'porcentaje' ? ' %' : ''}
          />
        </Group>

        <div>
          <Text size="sm" fw={500} mb={4}>Aplicar a</Text>
          <SegmentedControl
            fullWidth
            value={target}
            onChange={setTarget}
            data={[
              { label: 'Precio de venta', value: 'salePrice' },
              { label: 'Precio de costo', value: 'costPrice' },
              { label: 'Ambos', value: 'both' }
            ]}
          />
        </div>

        <Button onClick={handlePreview} loading={loading} variant="light" disabled={adjValue === 0}>
          Vista previa
        </Button>

        {preview.length > 0 && (
          <>
            <Badge size="lg" variant="light">
              {preview.length} producto(s) afectados
            </Badge>
            <ScrollArea h={300}>
              <Table striped fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Producto</Table.Th>
                    <Table.Th ta="right">Costo actual</Table.Th>
                    <Table.Th ta="right">Costo nuevo</Table.Th>
                    <Table.Th ta="right">Venta actual</Table.Th>
                    <Table.Th ta="right">Venta nuevo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {preview.map((p: any) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.name}</Table.Td>
                      <Table.Td ta="right">{fmt(p.currentCostPrice)}</Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" c={p.newCostPrice !== p.currentCostPrice ? 'blue' : undefined} fw={p.newCostPrice !== p.currentCostPrice ? 600 : undefined}>
                          {fmt(p.newCostPrice)}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">{fmt(p.currentSalePrice)}</Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" c={p.newSalePrice !== p.currentSalePrice ? 'blue' : undefined} fw={p.newSalePrice !== p.currentSalePrice ? 600 : undefined}>
                          {fmt(p.newSalePrice)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            <Button color="blue" onClick={handleApply} loading={loading}>
              Aplicar cambios a {preview.length} producto(s)
            </Button>
          </>
        )}
      </Stack>
    </Modal>
  )
}
