import { Card, Text, Group, Button, Stack, ThemeIcon, Title, Badge, Container } from '@mantine/core'
import { IconDeviceDesktopAnalytics, IconBookDownload, IconCpu, IconDatabase, IconCode, IconHelpCircle } from '@tabler/icons-react'

export default function AyudaPage(): JSX.Element {
  const handleDownload = () => {
    // Simulamos la descarga generando un archivo de texto como manual instructivo
    const content = `===========================================
  MANUAL DE USUARIO - SOF-IA (v1.0.0)
===========================================

1. APERTURA Y CIERRE DE CAJA
-------------------------------------------
- Antes de comenzar a realizar ventas (POS), el sistema requiere que abras la "Caja".
- Ingresa el monto de dinero físico inicial en la pantalla de "Caja".
- Al terminar la jornada laboral, debes ir nuevamente a "Caja" -> "Pestaña: Cierre" y contabilizar el efectivo para cuadrar los movimientos del día.

2. TRANSACCIONES Y TICKET
-------------------------------------------
- Puedes usar el lector de códigos de barras en cualquier parte de la aplicación; el sistema leerá el producto y lo cargará.
- Si el cliente tiene cuenta corriente, puedes procesar ventas seleccionando "Múltiples métodos de pago" y aplicando "Fiado".

3. CONTROL DE INVENTARIO (STOCK)
-------------------------------------------
- Cuando traes mercadería nueva y necesites sumarla, utiliza "Órdenes de Compra" y luego "Recepciones". Esto aumentará tu nivel de Stock automáticamente.
- El módulo Pulse/Alertas te avisará apenas un producto se quede por debajo de su límite de reabastecimiento.

-------------------------------------------
Equipo de Desarrollo SOF-IA
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Manual_Usuario_SOFIA.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Container size="xl" px={0} p="md">
      <Group mb="xl">
        <ThemeIcon size="xl" radius="md" variant="light" color="sap">
          <IconHelpCircle size={28} />
        </ThemeIcon>
        <Title order={2}>Ayuda y Soporte</Title>
      </Group>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Tarjeta de Información del Sistema */}
        <Card withBorder radius="md" p="xl" style={{ display: 'flex', flexDirection: 'column' }}>
          <Group mb="md">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconDeviceDesktopAnalytics size={20} />
            </ThemeIcon>
            <Title order={3}>Información del Sistema</Title>
          </Group>
          
          <Stack gap="md" style={{ flex: 1, marginTop: '1rem' }}>
            <Group justify="space-between">
              <Text c="dimmed" size="sm" style={{ display: 'flex', alignItems: 'center' }}><IconCode size={18} style={{ marginRight: 8 }} /> Versión SOF-IA</Text>
              <Badge variant="outline" color="sap" size="lg">v1.0.0-Pro</Badge>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed" size="sm" style={{ display: 'flex', alignItems: 'center' }}><IconCpu size={18} style={{ marginRight: 8 }} /> Frontend Engine</Text>
              <Text size="sm" fw={600}>React 18 + Mantine UI</Text>
            </Group>
             <Group justify="space-between">
              <Text c="dimmed" size="sm" style={{ display: 'flex', alignItems: 'center' }}><IconCpu size={18} style={{ marginRight: 8 }} /> Backend Engine</Text>
              <Text size="sm" fw={600}>Electron (Main Process)</Text>
            </Group>
            <Group justify="space-between">
              <Text c="dimmed" size="sm" style={{ display: 'flex', alignItems: 'center' }}><IconDatabase size={18} style={{ marginRight: 8 }} /> Motor de Datos</Text>
              <Text size="sm" fw={600}>SQLite3 Drizzle ORM</Text>
            </Group>
          </Stack>
        </Card>

        {/* Tarjeta de Manual */}
        <Card withBorder radius="md" p="xl" style={{ display: 'flex', flexDirection: 'column' }}>
           <Group mb="md">
            <ThemeIcon size="lg" radius="md" variant="light" color="sap">
              <IconBookDownload size={20} />
            </ThemeIcon>
            <Title order={3}>Instructivo del Usuario</Title>
          </Group>
          <Text c="dimmed" size="sm" mb="xl" style={{ flex: 1, lineHeight: 1.6 }}>
            Accede al manual interactivo diseñado para capacitarte a ti y a tus empleados. 
            Contiene indicaciones detalladas y pasos críticos sobre apertura y cierre de caja, 
            manejo de inventario en tiempo real y el sistema de fiados.
          </Text>

          <Button 
            fullWidth 
            size="md" 
            leftSection={<IconBookDownload size={20} />}
            onClick={handleDownload}
            color="sap"
          >
            Descargar Instructivo
          </Button>
        </Card>

      </div>
    </Container>
  )
}
