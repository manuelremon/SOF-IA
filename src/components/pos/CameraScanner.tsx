import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Stack, Text, Button, Group, Select, Alert } from '@mantine/core'
import { IconCamera, IconCameraOff, IconAlertCircle } from '@tabler/icons-react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'

interface CameraScannerProps {
  opened: boolean
  onClose: () => void
  onScan: (code: string) => void
}

export default function CameraScanner({ opened, onClose, onScan }: CameraScannerProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanControlsRef = useRef<IScannerControls | null>(null)
  const lastCodeRef = useRef('')
  const lastCodeTimeRef = useRef(0)

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [lastDetected, setLastDetected] = useState('')

  // Listar cámaras disponibles (y inicializar zxing)
  useEffect(() => {
    if (!opened) return

    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader()
    }

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      setCameras(videoDevices)
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    }).catch(() => {
      setError('No se pudo acceder a los dispositivos de video')
    })
  }, [opened])

  const stopCamera = useCallback(() => {
    setIsScanning(false)
    if (scanControlsRef.current) {
      scanControlsRef.current.stop()
      scanControlsRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!selectedCamera || !codeReaderRef.current || !videoRef.current) return

    setError('')
    try {
      setIsScanning(true)
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText()
            const now = Date.now()

            // Evitar lecturas duplicadas en menos de 2 segundos
            if (code !== lastCodeRef.current || now - lastCodeTimeRef.current > 2000) {
              lastCodeRef.current = code
              lastCodeTimeRef.current = now
              setLastDetected(code)
              onScan(code)
            }
          }
        }
      )
      scanControlsRef.current = controls
    } catch (err: any) {
      setError(`Error al acceder a la cámara: ${err.message}`)
      setIsScanning(false)
    }
  }, [selectedCamera, onScan])

  // Iniciar cámara automáticamente cuando el modal abre y hay una cámara seleccionada
  useEffect(() => {
    if (opened && selectedCamera) {
      stopCamera()
      startCamera()
    }
  }, [opened, selectedCamera])

  // Limpiar al cerrar
  useEffect(() => {
    if (!opened) {
      stopCamera()
      setLastDetected('')
      setError('')
    }
  }, [opened, stopCamera])

  // Cleanup al desmontar
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const handleClose = (): void => {
    stopCamera()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Escáner de Cámara"
      size="lg"
      centered
    >
      <Stack gap="sm">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {cameras.length > 1 && (
          <Select
            label="Cámara"
            data={cameras.map((c) => ({ value: c.deviceId, label: c.label || `Cámara ${c.deviceId.slice(0, 8)}` }))}
            value={selectedCamera}
            onChange={setSelectedCamera}
            size="sm"
          />
        )}

        <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', display: isScanning ? 'block' : 'none' }}
            muted
            playsInline
          />
          {!isScanning && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <IconCameraOff size={48} color="#666" />
              <Text c="dimmed" mt="sm">Cámara inactiva</Text>
            </div>
          )}
          {/* Guía visual de escaneo */}
          {isScanning && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%',
              height: '30%',
              border: '2px solid rgba(10, 110, 209, 0.7)',
              borderRadius: 8,
              pointerEvents: 'none'
            }} />
          )}
        </div>

        {lastDetected && (
          <Alert color="green" variant="light">
            Código detectado: <strong>{lastDetected}</strong>
          </Alert>
        )}

        <Group justify="space-between">
          <Button
            variant="light"
            leftSection={isScanning ? <IconCameraOff size={16} /> : <IconCamera size={16} />}
            onClick={isScanning ? stopCamera : startCamera}
            disabled={!selectedCamera || !!error}
          >
            {isScanning ? 'Detener' : 'Iniciar cámara'}
          </Button>
          <Button variant="default" onClick={handleClose}>
            Cerrar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
