import { useEffect, useState } from 'react'
import { Title, Stack, Paper, TextInput, NumberInput, Button, Group, Divider, Text, Tabs } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy, IconDatabaseExport, IconDatabaseImport, IconFileSpreadsheet, IconSettings, IconUsers } from '@tabler/icons-react'
import type { AppSettings } from '../types'
import UsuariosPage from './UsuariosPage'

export default function ConfiguracionPage(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_tax_id: '',
    tax_rate: '21',
    currency: 'ARS',
    receipt_footer: ''
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
      const res = await window.api.settings.setBatch(settings)
      if (res.ok) {
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
                Recibos
              </Text>
              <TextInput
                label="Pie de recibo"
                value={settings.receipt_footer}
                onChange={(e) => update('receipt_footer', e.currentTarget.value)}
              />
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
      </Tabs>
    </Stack>
  )
}
