import { useEffect, useState } from 'react'
import { Title, Stack, Paper, TextInput, NumberInput, Button, Group, Divider, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy } from '@tabler/icons-react'
import type { AppSettings } from '../types'

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
      <Title order={3}>Configuración</Title>

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
    </Stack>
  )
}
