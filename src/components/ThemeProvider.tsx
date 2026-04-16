import { useEffect, useMemo } from 'react'
import { MantineProvider, createTheme } from '@mantine/core'
import { sapTheme } from '../theme/sapTheme'
import { useSettingsStore } from '../stores/settingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, loading, loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (settings?.font_size_scale) {
      const scaleRef = parseInt(settings.font_size_scale, 10)
      const sizePercentage = 100 + (scaleRef * 10)
      document.documentElement.style.fontSize = `${sizePercentage}%`
    }
  }, [settings?.font_size_scale])

  const { themeObj, forceColorScheme } = useMemo(() => {
    const currentTheme = settings?.theme || 'sap'
    let primaryColor = 'sap'
    let customDark: string[] = []
    let forceColorScheme: 'light' | 'dark' = (settings?.color_scheme as 'light' | 'dark') || 'light'

    switch (currentTheme) {
      case 'teal':
        primaryColor = 'customGreen' // O teal nativo
        customDark = ['#C1C2C5', '#A6A7AB', '#909296', '#5C5F66', '#26332A', '#1C261F', '#141C16', '#0C130E', '#060A07', '#020503']
        break
      case 'orange':
        primaryColor = 'yellow' // Basado en nuestro customGold
        customDark = ['#C1C2C5', '#A6A7AB', '#909296', '#5C5F66', '#363026', '#29231A', '#1C170F', '#120D06', '#0A0602', '#050300']
        break
      case 'violet':
        primaryColor = 'violet'
        customDark = ['#C1C2C5', '#A6A7AB', '#909296', '#5C5F66', '#312A3D', '#241D30', '#191324', '#0E0917', '#07030D', '#040108']
        break
      default: // 'sap'
        primaryColor = 'sap'
        customDark = sapTheme.colors!.dark as unknown as string[]
        break
    }

    const fontFamilyValue = settings?.font_family || 'inter'
    const getGoogleFontName = (key: string) => {
      switch (key) {
        case 'roboto': return 'Roboto'
        case 'open-sans': return '"Open Sans"'
        case 'montserrat': return 'Montserrat'
        case 'outfit': return 'Outfit'
        default: return 'Inter'
      }
    }
    const fontFamilyString = `${getGoogleFontName(fontFamilyValue)}, system-ui, -apple-system, sans-serif`

    const scaleRef = parseInt(settings?.font_size_scale || '0', 10)
    const baseMultiplier = 1 + (scaleRef * 0.1)

    const themeObj = createTheme({
      ...sapTheme,
      primaryColor: primaryColor === 'customGreen' ? 'green' : primaryColor,
      fontFamily: fontFamilyString,
      headings: { 
        ...(sapTheme.headings || {}),
        fontFamily: fontFamilyString 
      },
      scale: baseMultiplier,
      colors: {
        ...(sapTheme.colors || {}),
        dark: (customDark && customDark.length === 10) ? (customDark as any) : ((sapTheme.colors as any)?.dark || [
          '#C1C2C5', '#A6A7AB', '#909296', '#5C5F66', '#2C3642', '#212936', '#171F2B', '#0D131F', '#080C14', '#030509'
        ])
      }
    })

    return {
      themeObj,
      forceColorScheme
    }
  }, [settings?.theme, settings?.color_scheme, settings?.font_family, settings?.font_size_scale])

  // Evitamos flashes de render hasta tener la db
  if (loading) return null

  return (
    <MantineProvider theme={themeObj} forceColorScheme={forceColorScheme}>
      {children}
    </MantineProvider>
  )
}
