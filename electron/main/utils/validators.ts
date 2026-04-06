import { z } from 'zod'

export const SaleItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountType: z.string().nullable().optional(),
  discountValue: z.number().optional()
})

export const CompleteSaleSchema = z.object({
  userId: z.number().optional(),
  customerId: z.number().optional(),
  paymentMethod: z.string(),
  amountTendered: z.number().min(0),
  taxRate: z.number().min(0),
  items: z.array(SaleItemSchema).min(1),
  discountType: z.string().nullable().optional(),
  discountValue: z.number().optional(),
  notes: z.string().optional()
})

// Tipos inferidos
export type CompleteSaleInput = z.infer<typeof CompleteSaleSchema>
