import { setupAIHandlers } from './ai'
import { registerProductHandlers } from './products'
import { registerSalesHandlers } from './sales'
import { registerCustomerHandlers } from './customers'
import { registerSupplierHandlers } from './suppliers'
import { registerUserHandlers } from './users'
import { registerSettingsHandlers } from './settings'
import { registerDashboardHandlers } from './dashboard'
import { registerPurchaseOrderHandlers } from './purchaseOrders'
import { registerGoodsReceiptHandlers } from './goodsReceipts'
import { registerReportHandlers } from './reports'
import { registerCashRegisterHandlers } from './cashRegister'
import { registerSupplierScorecardHandlers } from './supplierScorecard'
import { registerPulseHandlers } from './pulse'
import { registerCustomerInsightHandlers } from './customerInsight'
import { registerAutopilotHandlers } from './autopilot'
import { registerCustomerAccountHandlers } from './customerAccount'
import { registerBackupHandlers } from './backup'
import { registerSupplierProductHandlers } from './supplierProduct'
import { registerMpHandlers } from './mpAuth'
import { registerContextualHandlers } from './contextual'
import { registerDraftOrderHandlers } from './draftOrders'
import { registerDynamicPricingHandlers } from './pricing'
import { registerHardwareHandlers } from './hardware'
import { registerAfipHandlers } from './afip'

export function registerAllHandlers(): void {
  registerProductHandlers()
  registerSalesHandlers()
  registerCustomerHandlers()
  registerSupplierHandlers()
  registerUserHandlers()
  registerSettingsHandlers()
  registerDashboardHandlers()
  registerPurchaseOrderHandlers()
  registerGoodsReceiptHandlers()
  registerReportHandlers()
  registerCashRegisterHandlers()
  registerSupplierScorecardHandlers()
  registerPulseHandlers()
  registerCustomerInsightHandlers()
  registerAutopilotHandlers()
  registerCustomerAccountHandlers()
  registerBackupHandlers()
  registerSupplierProductHandlers()
  registerMpHandlers()
  registerContextualHandlers()
  registerDraftOrderHandlers()
  registerDynamicPricingHandlers()
  registerHardwareHandlers()
  registerAfipHandlers()
  setupAIHandlers()
}
