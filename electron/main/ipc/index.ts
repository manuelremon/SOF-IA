import { registerProductHandlers } from './products'
import { registerSalesHandlers } from './sales'
import { registerCustomerHandlers } from './customers'
import { registerSupplierHandlers } from './suppliers'
import { registerUserHandlers } from './users'
import { registerSettingsHandlers } from './settings'
import { registerDashboardHandlers } from './dashboard'

export function registerAllHandlers(): void {
  registerProductHandlers()
  registerSalesHandlers()
  registerCustomerHandlers()
  registerSupplierHandlers()
  registerUserHandlers()
  registerSettingsHandlers()
  registerDashboardHandlers()
}
