import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TextInput,
  Paper,
  Stack,
  Group,
  Text,
  UnstyledButton,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Divider,
  Button
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconSearch, IconScan, IconBarcode, IconBoxMultiple, IconAlertTriangle, IconPlus } from '@tabler/icons-react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { Product } from '../../types'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

interface ProductSearchProps {
  onSelect: (product: Product) => void
  onCameraOpen: () => void
}

export default function ProductSearch({ onSelect, onCameraOpen }: ProductSearchProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const { settings } = useSettingsStore()
  const scannerMode = settings?.scanner_mode || 'both'

  // Cargar todos los productos al montar
  useEffect(() => {
    const load = async () => {
      const res = await window.api.products.search('')
      if (res.ok && res.data) {
        const products = res.data as Product[]
        setAllProducts(products)
        setFiltered(products)
      }
    }
    load()
  }, [])

  const filterProducts = useDebouncedCallback((q: string) => {
    if (q.length < 1) {
      setFiltered(allProducts)
      return
    }
    const lower = q.toLowerCase()
    setFiltered(
      allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.brand && p.brand.toLowerCase().includes(lower)) ||
          (p.presentation && p.presentation.toLowerCase().includes(lower)) ||
          (p.barcode && p.barcode.toLowerCase().includes(lower)) ||
          (p.sku && p.sku.toLowerCase().includes(lower))
      )
    )
  }, 150)

  const handleChange = (value: string): void => {
    setQuery(value)
    filterProducts(value)
  }

  const handleSelect = (product: Product): void => {
    onSelect(product)
    inputRef.current?.focus()
  }

  // Búsqueda directa por código de barras (lector USB o cámara)
  const searchByBarcode = useCallback(
    async (code: string) => {
      const res = await window.api.products.search(code)
      if (res.ok && res.data) {
        const products = res.data as Product[]
        if (products.length === 1) {
          handleSelect(products[0])
        } else if (products.length > 1) {
          setQuery(code)
          setFiltered(products)
        } else {
          setQuery(code)
          setFiltered([])
        }
      }
    },
    [allProducts]
  )

  // Exponer searchByBarcode para que VentasPage lo pueda llamar
  ;(ProductSearch as any)._searchByBarcode = searchByBarcode

  // Refrescar lista cuando se agrega un producto al carrito (stock cambia)
  const refreshProducts = useCallback(async () => {
    const res = await window.api.products.search('')
    if (res.ok && res.data) {
      const products = res.data as Product[]
      setAllProducts(products)
      // Re-aplicar filtro actual
      if (query.length < 1) {
        setFiltered(products)
      } else {
        const lower = query.toLowerCase()
        setFiltered(
          products.filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              (p.brand && p.brand.toLowerCase().includes(lower)) ||
              (p.presentation && p.presentation.toLowerCase().includes(lower)) ||
              (p.barcode && p.barcode.toLowerCase().includes(lower)) ||
              (p.sku && p.sku.toLowerCase().includes(lower))
          )
        )
      }
    }
  }, [query])

  return (
    <Stack gap="xs">
      <Group gap="xs" align="flex-end">
        <TextInput
          ref={inputRef}
          placeholder="Buscar producto por nombre, código o SKU..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => handleChange(e.currentTarget.value)}
          size="md"
          data-barcode-target="true"
          style={{ flex: 1 }}
        />
        {/* Search Input and Scanner Button */}
        <style>{`
          @keyframes innerBarScan {
            0% { transform: translateY(-4px); }
            100% { transform: translateY(4px); }
          }
          .icon-scan-custom path:last-child {
            stroke: #12f735 !important;
            filter: drop-shadow(0 0 2px rgba(18, 247, 53, 0.8));
            animation: innerBarScan 1s ease-in-out infinite alternate;
          }
        `}</style>
        <Tooltip label="Escanear" position="bottom">
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            h={42}
            w={42}
            onClick={() => {
              if (scannerMode === 'usb') {
                inputRef.current?.focus()
              } else {
                onCameraOpen()
              }
            }}
          >
            <IconScan size={22} className="icon-scan-custom" color="#228be6" />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Paper shadow="xs" withBorder>
        <Group px="sm" py={6} justify="space-between">
          <Group gap={6}>
            <IconBoxMultiple size={14} color="#868e96" />
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Stock
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </Text>
        </Group>
        <Divider />
        <ScrollArea h={420} scrollbarSize={6}>
          {filtered.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No se encontraron productos
            </Text>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.id}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f1f3f5' : undefined,
                  opacity: p.stock <= 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 150ms ease',
                  cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (p.stock > 0) e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                onClick={() => p.stock > 0 && handleSelect(p)}
              >
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={500} truncate>
                      {p.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {[p.brand, p.presentation].filter(Boolean).join(' • ')}
                    </Text>
                    {(p.barcode || p.sku) && (
                      <Group gap={4}>
                        <IconBarcode size={12} color="#868e96" />
                        <Text size="xs" c="dimmed" truncate>
                          {p.barcode || p.sku}
                        </Text>
                      </Group>
                    )}
                  </div>
                  <Group gap="xs" wrap="nowrap">
                    {p.costPrice > 0 && ((p.salePrice - p.costPrice) / p.salePrice) * 100 <= 5 && (
                      <Tooltip label="Margen muy bajo" position="left">
                        <span><IconAlertTriangle size={14} color="#fa5252" /></span>
                      </Tooltip>
                    )}
                    <Badge
                      size="sm"
                      variant="light"
                      color={p.stock > p.minStock ? 'green' : p.stock > 0 ? 'yellow' : 'red'}
                    >
                      {p.stock} {p.unit}
                    </Badge>
                    <Button 
                      size="compact-xs" 
                      variant="light" 
                      color="blue" 
                      radius="xl"
                      leftSection={<IconPlus size={12} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(p);
                      }}
                      disabled={p.stock <= 0}
                    >
                      Agregar
                    </Button>
                    <Text fw={600} size="sm" style={{ whiteSpace: 'nowrap', minWidth: 80, textAlign: 'right' }}>
                      {fmt(p.salePrice)}
                    </Text>
                  </Group>
                </Group>
              </div>
            ))
          )}
        </ScrollArea>
      </Paper>
    </Stack>
  )
}
