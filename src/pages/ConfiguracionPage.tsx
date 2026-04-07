import { useEffect, useState } from 'react'
import { Title, Stack, Paper, TextInput, NumberInput, Button, Group, Divider, Text, Tabs, Select, Switch, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy, IconDatabaseExport, IconDatabaseImport, IconFileSpreadsheet, IconSettings, IconUsers, IconPalette, IconVolume } from '@tabler/icons-react'
import type { AppSettings } from '../types'
import UsuariosPage from './UsuariosPage'
import { useSettingsStore } from '../stores/settingsStore'

export default function ConfiguracionPage(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_tax_id: '',
    tax_rate: '21',
    currency: 'ARS',
    receipt_footer: '',
    theme: 'sap',
    color_scheme: 'light',
    sounds_enabled: 'true',
    font_size_scale: '0',
    font_family: 'inter',
    scanner_mode: 'both'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.api.settings.getAll().then((r: any) => {
      if (r.ok && r.data) setSettings(r.data as AppSettings)
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
    <Stack gap="md">
      <Title order={3}>Configuración del Sistema</Title>

      <Tabs defaultValue="general" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="general" leftSection={<IconSettings size={14} />}>
            General
          </Tabs.Tab>
          <Tabs.Tab value="usuarios" leftSection={<IconUsers size={14} />}>
            Usuarios y Permisos
          </Tabs.Tab>
          <Tabs.Tab value="ia" leftSection={<IconSettings size={14} />}>
            Asistente IA
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <Stack gap="md">
            <Paper withBorder p="md">
              <Text fw={600} mb="sm">
                Datos del Negocio
              </Text>
              <Stack>
                <TextInput
                  label="Nombre del negocio"
                  value={settings.business_name}
                  onChange={(e) => update('business_name', e.currentTarget.value)}
                />
                <TextInput
                  label="Dirección"
                  value={settings.business_address}
                  onChange={(e) => update('business_address', e.currentTarget.value)}
                />
                <Group grow>
                  <TextInput
                    label="Teléfono"
                    value={settings.business_phone}
                    onChange={(e) => update('business_phone', e.currentTarget.value)}
                  />
                  <TextInput
                    label="CUIT/RUC/Tax ID"
                    value={settings.business_tax_id}
                    onChange={(e) => update('business_tax_id', e.currentTarget.value)}
                  />
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md">
              <Text fw={600} mb="sm">
                Impuesto y Moneda
              </Text>
              <Stack>
                <Group grow>
                  <NumberInput
                    label="Tasa de impuesto (%)"
                    value={parseFloat(settings.tax_rate) || 0}
                    onChange={(v) => update('tax_rate', String(v))}
                    min={0}
                    max={100}
                    decimalScale={2}
                    suffix=" %"
                  />
                  <TextInput
                    label="Moneda"
                    value={settings.currency}
                    onChange={(e) => update('currency', e.currentTarget.value)}
                  />
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder p="md">
              <Text fw={600} mb="sm">
                Hardware y Periféricos
              </Text>
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

            <Paper withBorder p="md">
              <Text fw={600} mb="sm">
                Recibos
              </Text>
              <TextInput
                label="Pie de recibo"
                value={settings.receipt_footer}
                onChange={(e) => update('receipt_footer', e.currentTarget.value)}
              />
            </Paper>

            <Paper withBorder p="md">
              <Group mb="sm" gap="xs">
                <IconPalette size={20} color="gray" />
                <Text fw={600}>Apariencia y Sistema</Text>
              </Group>
              <Stack>
                <Group justify="space-between" align="flex-start" grow>
                  <Select
                    label="Tema visual"
                    description="Elige la apariencia de la aplicación"
                    data={[
                      { value: 'sap', label: 'Estándar' },
                      { value: 'teal', label: 'Bosque' },
                      { value: 'orange', label: 'Golden Hour' },
                      { value: 'violet', label: 'Top' }
                    ]}
                    value={settings.theme || 'sap'}
                    onChange={(v) => update('theme', v || 'sap')}
                    allowDeselect={false}
                  />
                  <Switch
                    label="Modo Oscuro"
                    description="Activa el modo nocturno"
                    size="md"
                    color="dark.4"
                    checked={settings.color_scheme === 'dark'}
                    onChange={(e) => update('color_scheme', e.currentTarget.checked ? 'dark' : 'light')}
                  />
                </Group>
                <Group justify="space-between" align="flex-start" grow>
                  <Select
                    label="Tipografía"
                    description="Fuente del sistema"
                    data={[
                      { value: 'inter', label: 'Inter (Por defecto)' },
                      { value: 'roboto', label: 'Roboto' },
                      { value: 'open-sans', label: 'Open Sans' },
                      { value: 'montserrat', label: 'Montserrat' },
                      { value: 'outfit', label: 'Outfit' }
                    ]}
                    value={settings.font_family || 'inter'}
                    onChange={(v) => update('font_family', v || 'inter')}
                    allowDeselect={false}
                  />
                  <Select
                    label="Tamaño de letra"
                    description="Ajuste de escala global"
                    data={[
                      { value: '-3', label: 'Extra Pequeña (-3x)' },
                      { value: '-2', label: 'Muy Pequeña (-2x)' },
                      { value: '-1', label: 'Pequeña (-1x)' },
                      { value: '0', label: 'Normal' },
                      { value: '1', label: 'Grande (+1x)' },
                      { value: '2', label: 'Muy Grande (+2x)' },
                      { value: '3', label: 'Extra Grande (+3x)' }
                    ]}
                    value={settings.font_size_scale || '0'}
                    onChange={(v) => update('font_size_scale', v || '0')}
                    allowDeselect={false}
                  />
                </Group>
                
                <Tooltip label="Reproducir sonidos al cobrar o realizar acciones" position="top-start" withArrow>
                  <Switch
                    label="Sonido"
                    size="md"
                    color="sap"
                    checked={settings.sounds_enabled !== 'false'}
                    onChange={(e) => update('sounds_enabled', e.currentTarget.checked ? 'true' : 'false')}
                    thumbIcon={<IconVolume size={12} color={settings.sounds_enabled !== 'false' ? 'white' : 'gray'} />}
                  />
                </Tooltip>
              </Stack>
            </Paper>

            <Group justify="flex-end">
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                color="sap"
                loading={loading}
                onClick={handleSave}
                size="md"
              >
                Guardar configuración
              </Button>
            </Group>

            <Divider />

            <Paper withBorder p="md">
              <Text fw={600} mb="sm">Respaldo de datos</Text>
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

            <Paper withBorder p="md">
              <Text fw={600} mb="sm">Exportar datos (CSV)</Text>
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
            <Paper withBorder p="md">
              <Text fw={600} mb="sm">
                Configuración del Asistente SOF-IA
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Para que el asistente inteligente funcione, necesitas proveer una clave API válida de Google Gemini o OpenAI. Al guardar, el agente recargará su comportamiento.
              </Text>
              <Stack>
                <TextInput
                  label="Clave API (API Key)"
                  placeholder="AIzaSy..."
                  value={settings.aiApiKey || ''}
                  onChange={(e) => update('aiApiKey', e.currentTarget.value)}
                  type="password"
                />
                <Button color="blue" mt="md" onClick={handleSave} loading={loading}>
                  Guardar configuración
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
