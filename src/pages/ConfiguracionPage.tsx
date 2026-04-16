import { useEffect, useState } from 'react'
import { Title, Stack, Paper, TextInput, NumberInput, Button, Group, Divider, Text, Tabs, Select, Switch, Tooltip, Collapse, Alert, rem } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy, IconDatabaseExport, IconDatabaseImport, IconFileSpreadsheet, IconSettings, IconUsers, IconPalette, IconVolume, IconBuildingBank, IconBrandWhatsapp, IconRobot, IconBrain, IconEye, IconEyeOff, IconCloud, IconRefresh } from '@tabler/icons-react'
import type { AppSettings } from '../types'
import UsuariosPage from './UsuariosPage'
import { useSettingsStore } from '../stores/settingsStore'
import TicketPrint from '../components/pos/TicketPrint'

export default function ConfiguracionPage(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>({
    business_name: '',
    business_address: '',
    business_city: '',
    business_province: '',
    business_postal_code: '',
    business_phone: '',
    business_phone_alt: '',
    business_email: '',
    mp_access_token: '',
    mp_pos_id: 'CAJA_01',
    whatsapp_access_token: '',
    whatsapp_phone_id: '',
    business_tax_id: '',
    tax_rate: '21',
    currency: 'ARS',
    receipt_footer: '',
    theme: 'sap',
    color_scheme: 'light',
    sounds_enabled: 'true',
    font_size_scale: '0',
    font_family: 'inter',
    scanner_mode: 'both',
    auto_backup_interval_hours: '3',
    aiApiKey: '',
    ai_model: 'gemini-1.5-flash',
    autopilot_coverage_days: '30',
    autopilot_lead_time_days: '7',
    cloud_sync_enabled: 'false',
    cloud_sync_url: '',
    cloud_sync_token: '',
    cloud_sync_interval_mins: '15',
    afip_cuit: '',
    afip_pto_vta: '1',
    afip_env: 'test',
    afip_cert_path: '',
    afip_key_path: ''
  })
  const [loading, setLoading] = useState(false)
  const [showTicketPreview, setShowTicketPreview] = useState(false)

  const mockSale = {
    receiptNumber: '0001-00000123',
    createdAt: new Date().toISOString(),
    userName: 'Admin',
    customerName: 'Cliente Ejemplo',
    subtotal: 1500,
    discountTotal: 100,
    taxTotal: 294,
    total: 1694,
    paymentMethod: 'efectivo',
    change: 306,
    items: [
      { id: 1, productName: 'Producto de Ejemplo A', quantity: 2, unitPrice: 500, lineTotal: 1000 },
      { id: 2, productName: 'Producto de Ejemplo B', quantity: 1, unitPrice: 500, lineTotal: 500 }
    ]
  }

  useEffect(() => {
    window.api.settings.getAll().then((r: any) => {
      if (r.ok && r.data) {
        setSettings((prev) => ({ ...prev, ...r.data }))
      }
    })
  }, [])

  const handleSave = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await window.api.settings.setBatch(settings as Record<string, string>)
      if (res.ok) {
        useSettingsStore.getState().loadSettings()
        window.api.ai.resetClient?.() // Refrescar la IA internamente
        notifications.show({ title: 'Configuración guardada', message: 'Los cambios se aplicaron correctamente', color: 'green' })
      } else {
        notifications.show({ title: 'Error', message: 'No se pudo guardar', color: 'red' })
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Error de conexión', color: 'red' })
    }
    setLoading(false)
  }

  const update = (key: string, value: string): void => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} fw={800}>Configuración</Title>
        <Text size="sm" c="dimmed">Preferencias del sistema, integraciones y personalización</Text>
      </div>

      <Tabs defaultValue="general" variant="pills" radius="md">
        <Tabs.List mb="lg">
          <Tabs.Tab value="general" leftSection={<IconSettings size={16} />}>General</Tabs.Tab>
          <Tabs.Tab value="usuarios" leftSection={<IconUsers size={16} />}>Personal</Tabs.Tab>
          <Tabs.Tab value="ia" leftSection={<IconBrain size={16} />}>Inteligencia Artificial</Tabs.Tab>
          <Tabs.Tab value="autopilot" leftSection={<IconRobot size={16} />}>Autopilot</Tabs.Tab>
          <Tabs.Tab value="integraciones" leftSection={<IconBuildingBank size={16} />}>Conectividad</Tabs.Tab>
          <Tabs.Tab value="afip" leftSection={<IconFileInvoice size={16} />}>Facturación AFIP</Tabs.Tab>
          <Tabs.Tab value="sync" leftSection={<IconCloud size={16} />}>Nube & Sync</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Stack gap="lg">
            <Paper p="lg">
              <Title order={4} mb="lg">Identidad del Local</Title>
              <Stack gap="md">
                <TextInput
                  label="Nombre Comercial"
                  placeholder="Ej: Almacén Sofía"
                  value={settings.business_name}
                  onChange={(e) => update('business_name', e.currentTarget.value)}
                  size="md"
                />
                <Group grow>
                  <TextInput
                    label="Dirección Física"
                    value={settings.business_address}
                    onChange={(e) => update('business_address', e.currentTarget.value)}
                  />
                  <TextInput
                    label="Ciudad"
                    value={settings.business_city}
                    onChange={(e) => update('business_city', e.currentTarget.value)}
                  />
                </Group>
                <Group grow>
                  <TextInput
                    label="Provincia"
                    value={settings.business_province}
                    onChange={(e) => update('business_province', e.currentTarget.value)}
                  />
                  <TextInput
                    label="CUIT / Identificación Fiscal"
                    value={settings.business_tax_id}
                    onChange={(e) => update('business_tax_id', e.currentTarget.value)}
                  />
                </Group>
              </Stack>
            </Paper>

            <Paper p="lg">
              <Title order={4} mb="lg">Regionalización</Title>
              <Group grow>
                <NumberInput
                  label="Tasa de IVA General (%)"
                  value={parseFloat(settings.tax_rate) || 0}
                  onChange={(v) => update('tax_rate', String(v))}
                  min={0}
                  max={100}
                  decimalScale={2}
                  suffix=" %"
                />
                <TextInput
                  label="Símbolo de Moneda"
                  value={settings.currency}
                  onChange={(e) => update('currency', e.currentTarget.value)}
                />
              </Group>
            </Paper>

            <Paper p="lg">
              <Title order={4} mb="md">Hardware y Periféricos</Title>
              <Select
                label="Modo de Escáner de Código de Barras"
                description="Habilita cámara web o escáner físico"
                data={[
                  { value: 'both', label: 'Híbrido (Pistola USB + Cámara Web)' },
                  { value: 'usb', label: 'Solo Pistola Láser (USB)' },
                  { value: 'camera', label: 'Solo Cámara Web' }
                ]}
                value={settings.scanner_mode || 'both'}
                onChange={(v) => update('scanner_mode', v || 'both')}
                allowDeselect={false}
              />
            </Paper>

            <Paper p="lg">
              <Group justify="space-between" mb="sm">
                <Title order={4}>Recibos</Title>
                <Button 
                  size="compact-xs" 
                  variant="subtle" 
                  leftSection={showTicketPreview ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                  onClick={() => setShowTicketPreview(!showTicketPreview)}
                >
                  {showTicketPreview ? 'Ocultar Previsualización' : 'Ver Previsualización'}
                </Button>
              </Group>
              <Stack>
                <TextInput
                  label="Pie de recibo"
                  value={settings.receipt_footer}
                  onChange={(e) => update('receipt_footer', e.currentTarget.value)}
                  placeholder="Gracias por su compra"
                />
                
                <Collapse in={showTicketPreview}>
                  <Text size="xs" c="dimmed" mb="xs">Previsualización de Impresión (80mm):</Text>
                  <Paper withBorder p="xs" bg="gray.0" style={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
                    <div style={{ backgroundColor: 'white', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                      <TicketPrint 
                        sale={mockSale}
                        businessName={settings.business_name}
                        businessAddress={settings.business_address}
                        businessPhone={settings.business_phone}
                        businessTaxId={settings.business_tax_id}
                        receiptFooter={settings.receipt_footer}
                      />
                    </div>
                  </Paper>
                </Collapse>
              </Stack>
            </Paper>

            <Paper p="lg">
              <Title order={4} mb="md">Personalización Visual</Title>
              <Group grow align="flex-start">
                <Select
                  label="Tipografía del Sistema"
                  data={[
                    { value: 'inter', label: 'Inter (Moderna)' },
                    { value: 'roboto', label: 'Roboto (Clásica)' },
                    { value: 'montserrat', label: 'Montserrat (Elegante)' },
                    { value: 'outfit', label: 'Outfit (SaaS Look)' }
                  ]}
                  value={settings.font_family || 'inter'}
                  onChange={(v) => update('font_family', v || 'inter')}
                />
                <Stack gap={4}>
                  <Text size="sm" fw={500}>Interfaz de Usuario</Text>
                  <Switch
                    label="Modo Oscuro"
                    size="md"
                    checked={settings.color_scheme === 'dark'}
                    onChange={(e) => update('color_scheme', e.currentTarget.checked ? 'dark' : 'light')}
                  />
                </Stack>
              </Group>
            </Paper>

            <Group justify="flex-end">
              <Button
                size="lg"
                leftSection={<IconDeviceFloppy size={20} />}
                color="sap"
                loading={loading}
                onClick={handleSave}
                style={{ boxShadow: '0 8px 15px rgba(33, 150, 243, 0.2)' }}
              >
                Guardar Cambios Globales
              </Button>
            </Group>

            <Divider my="xl" label="Mantenimiento y Datos" labelPosition="center" />

            <Paper p="lg">
              <Title order={4} mb="sm">Respaldo de datos</Title>
              <Text size="sm" c="dimmed" mb="md">Los backups automáticos se guardarán silenciosamente según el intervalo configurado.</Text>
              <Group mb="md" align="flex-end">
                <NumberInput
                  label="Guardado automático (horas)"
                  value={Number(settings.auto_backup_interval_hours) ?? 3}
                  onChange={(v) => update('auto_backup_interval_hours', String(v))}
                  min={0}
                  max={720}
                  w={250}
                />
              </Group>
              <Group>
                <Button
                  variant="light"
                  leftSection={<IconDatabaseExport size={16} />}
                  onClick={async () => {
                    const r = await window.api.backup.create()
                    if (r.ok && (r.data as any)?.success) {
                      notifications.show({ title: 'Backup creado', message: 'Base de datos respaldada correctamente', color: 'green' })
                    } else if ((r.data as any)?.error !== 'Cancelado') {
                      notifications.show({ title: 'Error', message: (r.data as any)?.error || 'Error al crear backup', color: 'red' })
                    }
                  }}
                >
                  Crear backup
                </Button>
                <Button
                  variant="light"
                  color="orange"
                  leftSection={<IconDatabaseImport size={16} />}
                  onClick={async () => {
                    const r = await window.api.backup.restore()
                    if (r.ok && (r.data as any)?.success) {
                      notifications.show({ title: 'Backup restaurado', message: 'Reinicie la aplicación para aplicar los cambios', color: 'green' })
                    } else if ((r.data as any)?.error !== 'Cancelado') {
                      notifications.show({ title: 'Error', message: (r.data as any)?.error || 'Error al restaurar', color: 'red' })
                    }
                  }}
                >
                  Restaurar backup
                </Button>
              </Group>
            </Paper>

            <Paper p="lg">
              <Title order={4} mb="sm">Exportar información (CSV)</Title>
              <Group>
                <Button
                  variant="light"
                  color="teal"
                  leftSection={<IconFileSpreadsheet size={16} />}
                  onClick={async () => {
                    const r = await window.api.export.products()
                    if (r.ok && (r.data as any)?.success) {
                      notifications.show({ title: 'Exportado', message: 'Productos exportados correctamente', color: 'green' })
                    }
                  }}
                >
                  Exportar productos
                </Button>
                <Button
                  variant="light"
                  color="teal"
                  leftSection={<IconFileSpreadsheet size={16} />}
                  onClick={async () => {
                    const r = await window.api.export.customers()
                    if (r.ok && (r.data as any)?.success) {
                      notifications.show({ title: 'Exportado', message: 'Clientes exportados correctamente', color: 'green' })
                    }
                  }}
                >
                  Exportar clientes
                </Button>
                <Button
                  variant="light"
                  color="teal"
                  leftSection={<IconFileSpreadsheet size={16} />}
                  onClick={async () => {
                    const r = await window.api.export.sales()
                    if (r.ok && (r.data as any)?.success) {
                      notifications.show({ title: 'Exportado', message: 'Ventas exportadas correctamente', color: 'green' })
                    }
                  }}
                >
                  Exportar ventas
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="usuarios" pt="md">
          <UsuariosPage />
        </Tabs.Panel>

        <Tabs.Panel value="ia" pt="md">
          <Stack gap="md">
            <Paper p="lg">
              <Title order={4} mb="sm">Configuración del Asistente SOF-IA</Title>
              <Text size="sm" c="dimmed" mb="md">
                Para que el asistente inteligente funcione, necesitas proveer una clave API válida de Google Gemini. Al guardar, el agente recargará su comportamiento.
              </Text>
              <Stack>
                <Group grow>
                  <TextInput
                    label="Clave API (API Key)"
                    placeholder="AIzaSy..."
                    value={settings.aiApiKey || ''}
                    onChange={(e) => update('aiApiKey', e.currentTarget.value)}
                    type="password"
                  />
                  <Select
                    label="Modelo de IA"
                    data={[
                      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Rápido)' },
                      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Inteligente)' },
                      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' }
                    ]}
                    value={settings.ai_model || 'gemini-1.5-flash'}
                    onChange={(v) => update('ai_model', v || 'gemini-1.5-flash')}
                  />
                </Group>
                <Button color="blue" mt="md" onClick={handleSave} loading={loading}>
                  Guardar configuración de IA
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="autopilot" pt="md">
          <Stack gap="md">
            <Paper p="lg">
              <Title order={4} mb="sm">Parámetros de Reposición Inteligente</Title>
              <Text size="sm" c="dimmed" mb="md">
                El Autopilot calcula automáticamente qué productos necesitas comprar basándose en tu velocidad de ventas actual y el stock disponible.
              </Text>
              <Group grow align="flex-end">
                <NumberInput
                  label="Días de Cobertura Deseados"
                  description="Cuántos días de ventas quieres cubrir con tu stock"
                  value={Number(settings.autopilot_coverage_days) || 30}
                  onChange={(v) => update('autopilot_coverage_days', String(v))}
                  min={1}
                  max={365}
                />
                <NumberInput
                  label="Tiempo de Entrega (Días)"
                  description="Días promedio que tarda un proveedor en entregarte"
                  value={Number(settings.autopilot_lead_time_days) || 7}
                  onChange={(v) => update('autopilot_lead_time_days', String(v))}
                  min={0}
                  max={90}
                />
              </Group>
              <Button color="sap" mt="xl" onClick={handleSave} loading={loading}>
                Guardar parámetros de Autopilot
              </Button>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="integraciones" pt="md">
          <Stack gap="md">
            <Paper p="lg">
              <Group justify="space-between" align="center" mb="sm">
                <Group gap="sm">
                  <IconBuildingBank size={24} color="#1c7ed6" />
                  <Title order={4}>Mercado Pago (Cobros con QR)</Title>
                </Group>
                {settings.mp_access_token ? (
                  <Text size="sm" c="teal" fw={600}>✓ Cuenta vinculada</Text>
                ) : (
                  <Text size="sm" c="red" fw={600}>No vinculado</Text>
                )}
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Vincula de forma segura la cuenta de Mercado Pago de tu comercio. Esto habilitará el botón de pago automático y los códigos QR dinámicos directos en tu caja.
              </Text>
              <Button 
                color="blue" 
                onClick={async () => {
                  try {
                    const res = await window.api.mp.login()
                    if (res.ok) {
                      notifications.show({ title: 'Éxito', message: '¡Cuenta de Mercado Pago vinculada correctamente!', color: 'green' })
                      useSettingsStore.getState().loadSettings()
                      update('mp_access_token', 'vinculado_temporal') // Para refrescar UI rápido
                    } else {
                      notifications.show({ title: 'Error de Vinculación', message: res.error || 'Autenticación cancelada', color: 'red' })
                    }
                  } catch (e: any) {
                    notifications.show({ title: 'Aviso', message: 'El proceso fue cancelado o hubo un error inesperado.' })
                  }
                }}
              >
                {settings.mp_access_token ? 'Cambiar cuenta de Mercado Pago' : 'Vincular cuenta de Mercado Pago'}
              </Button>
            </Paper>

            <Paper p="lg">
              <Group justify="space-between" align="center" mb="sm">
                <Group gap="sm">
                  <IconBrandWhatsapp size={24} color="#25D366" />
                  <Title order={4}>WhatsApp Automático</Title>
                </Group>
                {settings.whatsapp_access_token ? (
                  <Text size="sm" c="teal" fw={600}>✓ Sesión activa</Text>
                ) : (
                  <Text size="sm" c="red" fw={600}>No vinculado</Text>
                )}
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Vincula tu número de WhatsApp simplemente escaneando un código QR con tu celular secundario. Te permitirá enviar tickets digitales y notificaciones directo a tus clientes.
              </Text>
              <Button 
                color="teal" 
                onClick={() => notifications.show({ title: 'Próximamente', message: 'Se desplegará el QR en pantalla para vincular como Dispositivo Adicional.', color: 'blue' })}
              >
                {settings.whatsapp_access_token ? 'Desconectar sesión de WhatsApp' : 'Escanear QR para vincular WhatsApp'}
              </Button>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="afip" pt="md">
          <Stack gap="md">
            <Paper p="lg">
              <Group justify="space-between" align="center" mb="sm">
                <Group gap="sm">
                  <IconFileInvoice size={24} color="#0A6ED1" />
                  <Title order={4}>Facturación Electrónica AFIP</Title>
                </Group>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Configure los certificados y el punto de venta para emitir comprobantes oficiales.
              </Text>
              
              <Stack gap="md">
                <Group grow>
                  <TextInput
                    label="CUIT del Emisor"
                    placeholder="20123456789"
                    value={settings.afip_cuit || ''}
                    onChange={(e) => update('afip_cuit', e.currentTarget.value)}
                  />
                  <NumberInput
                    label="Punto de Venta"
                    value={parseInt(settings.afip_pto_vta || '1')}
                    onChange={(v) => update('afip_pto_vta', String(v))}
                    min={1}
                  />
                </Group>
                
                <Select
                  label="Entorno AFIP"
                  data={[
                    { value: 'test', label: 'Homologación (Pruebas)' },
                    { value: 'prod', label: 'Producción (Real)' }
                  ]}
                  value={settings.afip_env || 'test'}
                  onChange={(v) => update('afip_env', v || 'test')}
                />

                <Group grow>
                  <TextInput
                    label="Ruta al Certificado (.crt)"
                    placeholder="C:\...\afip.crt"
                    value={settings.afip_cert_path || ''}
                    onChange={(e) => update('afip_cert_path', e.currentTarget.value)}
                  />
                  <TextInput
                    label="Ruta a la Clave Privada (.key)"
                    placeholder="C:\...\afip.key"
                    value={settings.afip_key_path || ''}
                    onChange={(e) => update('afip_key_path', e.currentTarget.value)}
                  />
                </Group>

                <Alert icon={<IconRefresh size={16} />} color="blue" variant="light">
                  Asegúrese de que las rutas sean accesibles por la aplicación.
                </Alert>

                <Button color="sap" mt="md" onClick={handleSave} loading={loading}>
                  Guardar Configuración AFIP
                </Button>

                <Divider label="Prueba de Conexión" />
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const res = await window.api.afip.getServerStatus()
                      if (res.ok) {
                        notifications.show({ title: 'Conexión Exitosa', message: 'Servidores de AFIP operativos', color: 'green' })
                      } else {
                        notifications.show({ title: 'Error de Conexión', message: res.error, color: 'red' })
                      }
                    } catch (e: any) {
                      notifications.show({ title: 'Error', message: e.message, color: 'red' })
                    }
                  }}
                >
                  Verificar Estado de Servidores AFIP
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="sync" pt="md">
          <Stack gap="md">
            <Paper p="lg">
              <Group justify="space-between" align="center" mb="sm">
                <Group gap="sm">
                  <IconCloud size={24} color="#228be6" />
                  <Title order={4}>Sincronización en la Nube (Web Dashboard)</Title>
                </Group>
                <Switch
                  label="Habilitar sincronización"
                  checked={settings.cloud_sync_enabled === 'true'}
                  onChange={(e) => update('cloud_sync_enabled', e.currentTarget.checked ? 'true' : 'false')}
                />
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Envía automáticamente el estado de tus ventas y caja a un panel web externo. Esto te permite supervisar tu negocio desde cualquier lugar del mundo.
              </Text>
              
              <Collapse in={settings.cloud_sync_enabled === 'true'}>
                <Stack>
                  <TextInput
                    label="URL del Dashboard (Endpoint)"
                    placeholder="https://tu-dashboard.com/api/sync"
                    value={settings.cloud_sync_url || ''}
                    onChange={(e) => update('cloud_sync_url', e.currentTarget.value)}
                  />
                  <Group grow>
                    <TextInput
                      label="Token de Autorización"
                      placeholder="Bearer token..."
                      value={settings.cloud_sync_token || ''}
                      onChange={(e) => update('cloud_sync_token', e.currentTarget.value)}
                      type="password"
                    />
                    <NumberInput
                      label="Intervalo de Sincronización (minutos)"
                      value={Number(settings.cloud_sync_interval_mins) || 15}
                      onChange={(v) => update('cloud_sync_interval_mins', String(v))}
                      min={1}
                      max={1440}
                    />
                  </Group>
                  <Alert icon={<IconRefresh size={16} />} color="blue" variant="light">
                    SOF-IA enviará un snapshot cada {settings.cloud_sync_interval_mins} minutos mientras la app esté abierta.
                  </Alert>
                </Stack>
              </Collapse>

              <Button color="blue" mt="xl" onClick={handleSave} loading={loading}>
                Activar Sincronización en la Nube
              </Button>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
