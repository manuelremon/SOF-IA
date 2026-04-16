import { useState, useRef, useEffect } from 'react'
import { Drawer, ActionIcon, Tooltip, Stack, TextInput, Text, Paper, ScrollArea, Group, Loader, Avatar, Box } from '@mantine/core'
import { IconMessageChatbot, IconSend, IconMicrophone, IconVolume, IconVolumeOff, IconBrandWhatsapp } from '@tabler/icons-react'

const BotAvatar = () => <Avatar color="blue" radius="xl"><IconMessageChatbot size={20} /></Avatar>
const UserAvatar = () => <Avatar color="gray" radius="xl">U</Avatar>

interface Message {
  id: string
  role: 'user' | 'model'
  content: string
}

export default function AIChatDrawer({ collapsed }: { collapsed?: boolean }): JSX.Element {
  const [opened, setOpened] = useState(false)
  const [waOpened, setWaOpened] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: '¡Hola! Soy SOF-IA, tu asistente personal. ¿En qué puedo ayudarte con el sistema o el local?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Lógica Text-to-Speech (TTS)
  const speakText = (text: string) => {
    if (!autoSpeak || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel() // Limpiar colas de audio
    
    // Limpiar Markdown y Emojis antes de hablar
    const cleanText = text
      .normalize('NFD') // Quitar acentos raros opcional, pero aquí mejor solo quitar emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Simbolos y pictogramas
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte y mapas
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Simbolos varios
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometricos
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Flechas
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Pictogramas suplementarios
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Ajedrez
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Pictogramas ext
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Simbolos extra
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/\*/g, '')                     // Asteriscos (negritas)
      .replace(/#/g, '')                      // Hashes (titulos)
      .replace(/_/g, '')                      // Guion bajo
      .replace(/`/g, '')                      // Backticks
      .replace(/"/g, '')                      // Comillas (para evitar 'comillas' literal)
      .replace(/\$/g, 'pesos')                // Simbolo de dolar a pesos
    
    // Utilizar Google Neural TTS via HTTP (Hacks para la voz natural Argentina)
    const sentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];
    let currentIdx = 0;

    const playNext = () => {
      if (!autoSpeak || currentIdx >= sentences.length) return;
      const sentence = sentences[currentIdx].trim();
      if (!sentence) {
        currentIdx++;
        playNext();
        return;
      }

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-AR&client=tw-ob&q=${encodeURIComponent(sentence)}`;
      const audio = new Audio(url);
      
      audio.onended = () => {
        currentIdx++;
        playNext();
      };
      
      audio.onerror = () => {
        // Fallback a SpeechSynthesis si falla internet o hay bloqueo HTTP
        const utterance = new SpeechSynthesisUtterance(sentence)
        utterance.lang = 'es-AR'
        window.speechSynthesis.speak(utterance)
        currentIdx++;
        playNext();
      };
      
      audio.play().catch(console.error);
    };

    playNext();
  }

  // Lógica Speech-to-Text (STT) 
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Tu navegador/entorno no soporta dictado por voz (STT).")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev + (prev.endsWith(' ') ? '' : ' ') + transcript)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  // Enviar Prompt a IPC
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userText = input.trim()
    const isAnalysis = userText.startsWith('?') || userText.toLowerCase().includes('analiz')
    
    setInput('')
    
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      let res;
      if (isAnalysis) {
        res = await window.api.ai.analyze(userText.replace(/^\?/, ''))
      } else {
        const history = messages
          .filter(m => m.id !== '1')
          .map(m => ({ role: m.role, content: m.content }))
        res = await window.api.ai.ask(userText, history)
      }
      
      if (res.ok && res.data?.success) {
        const text = res.data.text
        
        // Manejo de acciones estructurales (Voz a Acción)
        try {
          const actionMatch = text.match(/\{"action":.*\}/)
          if (actionMatch) {
            const actionObj = JSON.parse(actionMatch[0])
            handleVoiceAction(actionObj)
          }
        } catch (e) {}

        setMessages(prev => [...prev, { id: Date.now().toString() + 'm', role: 'model', content: text.replace(/\{"action":.*\}/, '').trim() }])
        speakText(text.replace(/\{"action":.*\}/, '').trim())
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'model', content: `Error: ${res.error || res.data?.error || 'No pude responder en este momento.'}` }])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'model', content: 'Hubo un error de conexión con la IA.' }])
    }

    setLoading(false)
  }

  const handleVoiceAction = (actionObj: any) => {
    if (actionObj.action === 'ADD_CART') {
      window.api.products.search(actionObj.query).then((res: any) => {
        if (res.ok && res.data?.length > 0) {
           const p = res.data[0]
           // Disparamos un evento global o usamos cartStore si estuviera disponible aquí.
           // Como cartStore es un hook, lo mejor es emitir un CustomEvent que CajaPage escuche.
           window.dispatchEvent(new CustomEvent('sofia-action', { 
             detail: { type: 'ADD_ITEM', product: p, quantity: actionObj.quantity || 1 } 
           }))
        }
      })
    }
  }

  // Parar el dictado si ocultamos el drawer
  useEffect(() => {
    if (!opened) window.speechSynthesis?.cancel()
  }, [opened])

  return (
    <>
      <Group 
        justify="center" 
        gap={collapsed ? 'xs' : 'md'} 
        w="100%" 
        style={{ flexDirection: collapsed ? 'column' : 'row' }}
      >
        <Tooltip label="Abrir WhatsApp" position="right">
          <ActionIcon
            size="lg"
            color="green.6"
            variant="filled"
            radius="xl"
            onClick={() => setWaOpened(true)}
          >
            <IconBrandWhatsapp size={20} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Asistente SOF-IA" position="right">
          <ActionIcon
            size="lg"
            color="blue"
            variant="filled"
            radius="xl"
            onClick={() => setOpened(true)}
          >
            <IconMessageChatbot size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group gap="sm">
            <IconMessageChatbot color="#228be6" stroke={2} />
            <Text fw={800} style={{ letterSpacing: '-0.5px' }}>Asistente SOF-IA</Text>
          </Group>
        }
        position="right"
        size="md"
        padding={0}
        styles={{ 
          content: { display: 'flex', flexDirection: 'column' }, 
          body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }, 
          header: { padding: '16px 20px', borderBottom: '1px solid #f1f3f5', marginBottom: 0 } 
        }}
      >
        <Group justify="flex-end" px="md" py="xs" bg="gray.0" style={{ borderBottom: '1px solid #f1f3f5' }}>
           <Tooltip label={autoSpeak ? "Voz Activada" : "Voz Desactivada"}>
              <ActionIcon variant="light" radius="xl" color={autoSpeak ? 'blue' : 'gray'} onClick={() => setAutoSpeak(!autoSpeak)}>
                 {autoSpeak ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
              </ActionIcon>
           </Tooltip>
        </Group>

        <ScrollArea flex={1} p="xl" viewportRef={scrollRef} bg="#F8F9FA">
          <Stack gap="lg">
            {messages.map((m) => (
              <Group key={m.id} align="flex-start" wrap="nowrap" justify={m.role === 'user' ? 'flex-end' : 'flex-start'} gap="xs">
                {m.role === 'model' && <BotAvatar />}
                <Paper
                  p="md"
                  shadow="sm"
                  bg={m.role === 'user' ? 'sap.6' : 'white'}
                  c={m.role === 'user' ? 'white' : 'dark'}
                  style={{ 
                    maxWidth: '85%',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    border: m.role === 'model' ? '1px solid #e9ecef' : 'none'
                  }}
                >
                  <Text size="sm" fw={500} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.content}</Text>
                </Paper>
                {m.role === 'user' && <UserAvatar />}
              </Group>
            ))}
            {loading && (
              <Group align="flex-start" wrap="nowrap" gap="xs">
                <BotAvatar />
                <Paper p="md" shadow="sm" bg="white" style={{ borderRadius: '16px 16px 16px 4px', border: '1px solid #e9ecef' }}>
                  <Loader size="xs" color="gray" type="dots" />
                </Paper>
              </Group>
            )}
          </Stack>
        </ScrollArea>

        <Box p="lg" style={{ borderTop: '1px solid #f1f3f5', backgroundColor: 'white' }}>
          <TextInput
            placeholder="¿En qué puedo ayudarte?"
            size="md"
            radius="md"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            rightSectionWidth={90}
            rightSection={
              <Group gap={6} justify="center" pr={8}>
                <ActionIcon 
                  onClick={toggleListening} 
                  color={isListening ? 'red' : 'gray'} 
                  variant={isListening ? 'filled' : 'light'} 
                  radius="xl"
                  size="md"
                >
                  <IconMicrophone size={18} />
                </ActionIcon>
                <ActionIcon 
                  onClick={handleSend} 
                  color="sap" 
                  variant="filled" 
                  radius="xl"
                  size="md"
                  loading={loading} 
                  disabled={!input.trim()}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
            }
          />
          {isListening && (
            <Group gap={4} justify="center" mt={8}>
              <Loader size={10} color="red" />
              <Text size="xs" c="red" fw={700} tt="uppercase" style={{ letterSpacing: '1px' }}>Escuchando...</Text>
            </Group>
          )}
        </Box>
      </Drawer>

      <Drawer
        opened={waOpened}
        onClose={() => setWaOpened(false)}
        title={
          <Group gap="sm">
            <IconBrandWhatsapp color="#40c057" />
            <Text fw={600}>WhatsApp Web</Text>
          </Group>
        }
        position="right"
        size="70%"
        padding={0}
        styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
      >
        {waOpened && (
           <webview 
             src="https://web.whatsapp.com" 
             style={{ width: '100%', height: 'calc(100vh - 60px)', border: 'none' }} 
             useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
           ></webview>
        )}
      </Drawer>
    </>
  )
}
