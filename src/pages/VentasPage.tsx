import { useState, useCallback } from 'react'
import { Grid, Title, Stack, Group, Badge, Tooltip, Box } from '@mantine/core'
import { IconBarcode } from '@tabler/icons-react'
import ProductSearch from '../components/pos/ProductSearch'
import Cart from '../components/pos/Cart'
import PaymentModal from '../components/pos/PaymentModal'
import ReceiptModal from '../components/pos/ReceiptModal'
import CameraScanner from '../components/pos/CameraScanner'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { useCartStore } from '../stores/cartStore'
import { notifications } from '@mantine/notifications'
import type { Product } from '../types'

export default function VentasPage(): JSX.Element {
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [receiptOpened, setReceiptOpened] = useState(false)
  const [cameraOpened, setCameraOpened] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [scanIndicator, setScanIndicator] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const handleSelectProduct = useCallback((product: Product): void => {
    if (product.stock <= 0) return
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.salePrice,
      costPrice: product.costPrice,
      stock: product.stock
    })
  }, [addItem])

  // Buscar producto por código de barras y agregar al carrito
  const handleBarcodeScan = useCallback(async (code: string) => {
    setScanIndicator(code)
    setTimeout(() => setScanIndicator(''), 2000)

    const res = await window.api.products.search(code)
    if (res.ok && res.data) {
      const products = res.data as Product[]
      // Buscar match exacto por barcode o SKU
      const exact = products.find(
        (p) => p.barcode === code || p.sku === code
      )
      if (exact && exact.stock > 0) {
        handleSelectProduct(exact)
      } else if (products.length === 1 && products[0].stock > 0) {
        handleSelectProduct(products[0])
      }
    }
  }, [handleSelectProduct])

  // Lector USB: escucha entrada rápida de teclado
  useBarcodeScanner(handleBarcodeScan)

  const handleComplete = (sale: any): void => {
    setPaymentOpened(false)
    setLastSale(sale)
    setReceiptOpened(true)
  }

  const handleCameraScan = useCallback((code: string) => {
    setCameraOpened(false)
    handleBarcodeScan(code)
  }, [handleBarcodeScan])

  const handleIdentify = async (data: any) => {
    setCameraOpened(false)
    if (!data.name) return
    const res = await window.api.products.search(data.name)
    if (res.ok && res.data?.length > 0) {
      handleSelectProduct(res.data[0])
    } else {
      notifications.show({ title: 'IA Vision', message: `Identificado: ${data.name}. No está en catálogo.`, color: 'yellow' })
    }
  }

  return (
    <Stack gap="md">
      <Box style={{ 
        position: 'sticky', 
        top: -24, 
        zIndex: 100, 
        backgroundColor: 'var(--mantine-color-body)', 
        margin: '-24px -24px 0 -24px', 
        padding: '24px 24px 16px 24px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
      }}>
        <Group justify="space-between" align="center">
          <Title order={3}>Punto de Venta</Title>
          {scanIndicator && (
            <Tooltip label="Código escaneado">
              <Badge
                size="lg"
                variant="light"
                color="blue"
                leftSection={<IconBarcode size={14} />}
              >
                {scanIndicator}
              </Badge>
            </Tooltip>
          )}
        </Group>
      </Box>
      <Grid>
        <Grid.Col span={7}>
          <Stack>
            <ProductSearch
              onSelect={handleSelectProduct}
              onCameraOpen={() => setCameraOpened(true)}
            />
          </Stack>
        </Grid.Col>
        <Grid.Col span={5}>
          <Cart onPay={() => setPaymentOpened(true)} />
        </Grid.Col>
      </Grid>

      <PaymentModal
        opened={paymentOpened}
        onClose={() => setPaymentOpened(false)}
        onComplete={handleComplete}
      />
      <ReceiptModal
        opened={receiptOpened}
        onClose={() => setReceiptOpened(false)}
        sale={lastSale}
      />
      <CameraScanner
        opened={cameraOpened}
        onClose={() => setCameraOpened(false)}
        onScan={handleCameraScan}
        onIdentify={handleIdentify}
      />
    </Stack>
  )
}
