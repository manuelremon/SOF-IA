import { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Stack, Text, Button, Group, Select, Alert, Loader } from '@mantine/core'
import { IconCamera, IconCameraOff, IconAlertCircle, IconSparkles } from '@tabler/icons-react'
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'

interface CameraScannerProps {
  opened: boolean
  onClose: () => void
  onScan: (code: string) => void
  onIdentify?: (data: any) => void
}

export default function CameraScanner({ opened, onClose, onScan, onIdentify }: CameraScannerProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanControlsRef = useRef<IScannerControls | null>(null)
  const lastCodeRef = useRef('')
  const lastCodeTimeRef = useRef(0)

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [identifying, setIdentifying] = useState(false)
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

  const captureAndIdentify = async (): Promise<void> => {
    if (!videoRef.current || !onIdentify) return

    setIdentifying(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
        
        const res = await (window as any).api.products.identifyByImage(base64Image)
        if (res.ok && res.data) {
          onIdentify(res.data)
        }
      }
    } catch (err) {
      console.error('Identification error', err)
    } finally {
      setIdentifying(false)
    }
  }

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
      setIdentifying(false)
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
      title="Escáner de Cámara Inteligente"
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
              height: '50%',
              border: '2px solid rgba(10, 110, 209, 0.7)',
              borderRadius: 8,
              pointerEvents: 'none'
            }} />
          )}
          
          {identifying && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white'
            }}>
              <Loader color="white" size="lg" mb="sm" />
              <Text fw={600}>SOF-IA Analizando Producto...</Text>
            </div>
          )}
        </div>

        {lastDetected && !identifying && (
          <Alert color="green" variant="light" py="xs">
            Código detectado: <strong>{lastDetected}</strong>
          </Alert>
        )}

        <Group justify="space-between">
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={isScanning ? <IconCameraOff size={16} /> : <IconCamera size={16} />}
              onClick={isScanning ? stopCamera : startCamera}
              disabled={!selectedCamera || !!error || identifying}
            >
              {isScanning ? 'Detener' : 'Iniciar cámara'}
            </Button>
            
            {onIdentify && isScanning && (
              <Button
                color="blue"
                leftSection={identifying ? <Loader size="xs" color="white" /> : <IconSparkles size={16} />}
                onClick={captureAndIdentify}
                loading={identifying}
              >
                Identificar Producto (IA)
              </Button>
            )}
          </Group>
          
          <Button variant="default" onClick={handleClose}>
            Cerrar
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
