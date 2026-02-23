import { useState } from 'react'
import { Grid, Title, Stack } from '@mantine/core'
import ProductSearch from '../components/pos/ProductSearch'
import Cart from '../components/pos/Cart'
import PaymentModal from '../components/pos/PaymentModal'
import ReceiptModal from '../components/pos/ReceiptModal'
import { useCartStore } from '../stores/cartStore'
import type { Product } from '../types'

export default function VentasPage(): JSX.Element {
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [receiptOpened, setReceiptOpened] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const addItem = useCartStore((s) => s.addItem)

  const handleSelectProduct = (product: Product): void => {
    if (product.stock <= 0) return
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: product.salePrice,
      stock: product.stock
    })
  }

  const handleComplete = (sale: any): void => {
    setPaymentOpened(false)
    setLastSale(sale)
    setReceiptOpened(true)
  }

  return (
    <Stack gap="md">
      <Title order={3}>Punto de Venta</Title>
      <Grid>
        <Grid.Col span={7}>
          <Stack>
            <ProductSearch onSelect={handleSelectProduct} />
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
    </Stack>
  )
}
