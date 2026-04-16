import { createTheme, rem } from '@mantine/core'

export const sapTheme = createTheme({
  primaryColor: 'sap',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  black: '#1A1B1E',
  white: '#FFFFFF',
  colors: {
    dark: [
      '#C1C2C5', // 0 - Text
      '#A6A7AB', // 1 - Muted Text
      '#909296', // 2
      '#5C5F66', // 3
      '#2C3642', // 4 - Borders / Hover
      '#212936', // 5 - Inputs
      '#171F2B', // 6 - Paper / Card BG
      '#0D131F', // 7 - Main Body BG
      '#080C14', // 8 - Sidebar
      '#030509'  // 9
    ],
    sap: [
      '#E3F2FD', // 0
      '#BBDEFB', // 1
      '#90CAF9', // 2
      '#64B5F6', // 3 
      '#42A5F5', // 4
      '#2196F3', // 5 - Primary brand (vibrant blue)
      '#1E88E5', // 6
      '#1976D2', // 7 
      '#1565C0', // 8 
      '#0D47A1'  // 9
    ],
    red: [
      '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', 
      '#F44336', // 5 
      '#E53935', '#D32F2F', '#C62828', '#B71C1C'
    ],
    green: [
      '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', 
      '#4CAF50', // 5
      '#43A047', '#388E3C', '#2E7D32', '#1B5E20'
    ],
    yellow: [
      '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', 
      '#FFEB3B', // 5
      '#FDD835', '#FBC02D', '#F9A825', '#F57F17'
    ],
    violet: [
      '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC',
      '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'
    ]
  },
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(34) },
      h2: { fontSize: rem(26) },
      h3: { fontSize: rem(22) },
      h4: { fontSize: rem(18) },
    }
  },
  shadows: {
    xs: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
    sm: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
    md: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)',
  },
  components: {
    Button: {
      defaultProps: { radius: 'md', fw: 600 }
    },
    Paper: {
      defaultProps: { radius: 'md', shadow: 'sm', withBorder: true },
      styles: {
        root: { borderColor: '#E9ECEF' }
      }
    },
    Modal: {
      defaultProps: { radius: 'lg', shadow: 'xl' }
    },
    TextInput: {
      defaultProps: { radius: 'md' }
    },
    Select: {
      defaultProps: { radius: 'md' }
    },
    NumberInput: {
      defaultProps: { radius: 'md' }
    },
    PasswordInput: {
      defaultProps: { radius: 'md' }
    },
    Badge: {
      defaultProps: { radius: 'sm', fw: 700 }
    },
    Card: {
      defaultProps: { radius: 'md', shadow: 'sm', withBorder: true },
      styles: {
        root: { borderColor: '#E9ECEF' }
      }
    },
    Table: {
      defaultProps: { striped: 'odd', highlightOnHover: true },
      styles: {
        th: { textTransform: 'uppercase', fontSize: rem(11), color: '#868E96', letterSpacing: '0.5px' }
      }
    },
    ActionIcon: {
      defaultProps: { radius: 'md' }
    }
  }
})
