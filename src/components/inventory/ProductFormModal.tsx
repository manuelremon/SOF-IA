import { useEffect } from 'react'
import { Modal, TextInput, NumberInput, Select, Button, Stack, Group } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { Product, Category } from '../../types'

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
      description: ''
    }
  })

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
          description: product.description || ''
        })
      } else {
        form.reset()
      }
    }
  }, [opened, product])

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

  return (
    <Modal opened={opened} onClose={onClose} title={product ? 'Editar producto' : 'Nuevo producto'} size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Nombre" required {...form.getInputProps('name')} />
          <Select
            label="Categoría"
            placeholder="Sin categoría"
            clearable
            data={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            {...form.getInputProps('categoryId')}
          />
          <Group grow>
            <TextInput label="Código de barras" {...form.getInputProps('barcode')} />
            <TextInput label="SKU" {...form.getInputProps('sku')} />
          </Group>
          <Group grow>
            <NumberInput label="Precio costo" min={0} decimalScale={2} prefix="$ " {...form.getInputProps('costPrice')} />
            <NumberInput label="Precio venta" min={0} decimalScale={2} prefix="$ " {...form.getInputProps('salePrice')} />
          </Group>
          <Group grow>
            <NumberInput label="Stock" min={0} decimalScale={2} {...form.getInputProps('stock')} />
            <NumberInput label="Stock mínimo" min={0} decimalScale={2} {...form.getInputProps('minStock')} />
          </Group>
          <TextInput label="Unidad" {...form.getInputProps('unit')} />
          <TextInput label="Descripción" {...form.getInputProps('description')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" color="sap">
              {product ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
