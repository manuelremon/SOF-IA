# SOF-IA — Sistema de Gestión para Pequeños Negocios

## 🛠 Arquitectura Técnica
- **Frontend**: React 18 + Mantine UI + Tabler Icons. State management con Zustand.
- **Backend (Main Process)**: Electron con `electron-vite`.
- **Base de Datos**: SQLite gestionado a través de `better-sqlite3` y el ORM **Drizzle**.
- **Comunicación**: IPC (Inter-Process Communication) expuesto a través de un `preload` script en `window.api`.

## 📂 Estructura del Proyecto
- `electron/main/db/schema.ts`: Definición de tablas de la base de datos.
- `electron/main/db/connection.ts`: Inicialización de la DB, migraciones manuales y seeding inicial.
- `electron/main/services/`: Lógica de negocio (Servicios de backend).
- `electron/main/ipc/`: Handlers que exponen los servicios al frontend.
- `src/pages/`: Vistas principales de la aplicación.
- `src/stores/`: Tiendas de estado global (auth, cart).
- `resources/migrations/`: Archivos de migración de Drizzle.

## 🗄 Modelo de Datos (Tablas Clave)
- **users**: Gestión de accesos con PIN (hasheado con SHA-256). Roles: `admin`, `vendedor`, `almacenista`.
- **products**: Catálogo de productos con stock, precios de costo/venta y alertas de stock mínimo.
- **categories**: Clasificación de productos.
- **sales & sale_items**: Registro de transacciones. Soporta descuentos por item y generales.
- **purchase_orders & purchase_order_items**: Gestión de compras a proveedores. Estados: `borrador`, `enviado`, `recibido_parcial`, `recibido`, `cancelado`.
- **goods_receipts & goods_receipt_items**: Recepción efectiva de mercadería (actualiza stock).
- **suppliers & supplier_products**: Catálogo de proveedores y vinculación con productos locales.
- **cash_registers**: Seguimiento de aperturas/cierres de caja y arqueos.
- **customer_accounts**: Cuentas corrientes (fiado) para clientes.
- **app_settings**: Configuración general del negocio (nombre, CUIT, IVA, etc.).

## 🔄 Flujos Críticos
1. **Venta (POS)**: 
   - Se gestiona en `CajaPage.tsx`.
   - Utiliza `cartStore.ts` para el carrito.
   - `salesService.completeSale` valida stock, crea la venta, descuenta stock y registra en caja si está abierta.
2. **Compra e Inventario**:
   - Creación de OC (`purchaseOrderService`).
   - Recepción de mercadería (`goodsReceiptService`) incrementa el stock de productos automáticamente.
   - Posibilidad de recepción directa sin OC previa.
3. **Caja (Cash Control)**:
   - Requiere apertura (`cashRegisterService.open`) con monto inicial.
   - Las ventas en efectivo se suman al `cash_in_register`.
   - El cierre calcula diferencias entre el conteo manual y el esperado.

## 🔑 Configuración de Desarrollo
- **Scripts**: 
  - `npm run dev`: Inicia Electron en modo desarrollo.
  - `npm run drizzle:generate`: Genera migraciones tras cambios en `schema.ts`.
  - `npm run drizzle:push`: Aplica cambios directamente a la DB (usar con precaución).
- **DB Path**: La base de datos se guarda en `%AppData%/sof-ia/db/sofia.db` en producción.

## 📝 Notas Relevantes para Gemini
- Las contraseñas (PIN) siempre se manejan hasheadas en la DB.
- El sistema utiliza `sql` tags de Drizzle para operaciones atómicas de stock (e.g., `stock = stock - quantity`).
- El frontend usa un hook personalizado `useBarcodeScanner` para capturar entradas de escáner en cualquier parte de la app.
- No se deben modificar los archivos en `out/` o `node_modules/`.
- Al modificar el esquema, recordar ejecutar `drizzle-kit generate`.
