import { useEffect, useState } from 'react'
import { Alert, Stack, Group, Text, Button } from '@mantine/core'
import { IconAlertTriangle, IconTrendingDown, IconCash, IconPackage } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

interface PulseAlert {
  type: 'sales' | 'margin' | 'cash' | 'stock'
  severity: 'warning' | 'danger' | 'info'
  message: string
  actionLabel: string
  actionRoute: string
}

const iconMap = {
  sales: IconTrendingDown,
  margin: IconAlertTriangle,
  cash: IconCash,
  stock: IconPackage
}

const colorMap = {
  danger: 'red',
  warning: 'yellow',
  info: 'blue'
}

export default function PulseAlerts(): JSX.Element {
  const [alerts, setAlerts] = useState<PulseAlert[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    window.api.pulse.getAlerts().then((r: any) => {
      if (r.ok && r.data) setAlerts(r.data)
    })
  }, [])

  if (alerts.length === 0) return <></>

  return (
    <Stack gap="xs">
      <Text size="sm" fw={700} c="dimmed" tt="uppercase">
        Pulso de Negocio
      </Text>
      {alerts.map((alert, i) => {
        const Icon = iconMap[alert.type] || IconAlertTriangle
        return (
          <Alert
            key={i}
            variant="light"
            color={colorMap[alert.severity]}
            icon={<Icon size={18} />}
          >
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm">{alert.message}</Text>
              <Button
                size="xs"
                variant="subtle"
                color={colorMap[alert.severity]}
                onClick={() => navigate(alert.actionRoute)}
              >
                {alert.actionLabel}
              </Button>
            </Group>
          </Alert>
        )
      })}
    </Stack>
  )
}
