import { createTheme } from '@mantine/core'

export const sapTheme = createTheme({
  primaryColor: 'sap',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'sm',
  black: '#000000',
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
      '#e5f0fa', // 0
      '#b3d6f2', // 1
      '#80bce9', // 2
      '#47AED6', // 3 - celeste
      '#2488e0', // 4
      '#0056D6', // 5 - azul oscuro
      '#0040a1', // 6
      '#002a6b', // 7 
      '#000862', // 8 - azul ultra oscuro
      '#000431'  // 9
    ],
    red: [
      '#fcf0f0', '#fad6d4', '#f5b1ac', '#ef8b84', '#ea655c', 
      '#BD2319', // 5 - Original
      '#9d1a12', '#7d140e', '#5e0f0a', '#3e0a07'
    ],
    green: [
      '#f2fdf1', '#dcf7da', '#c1f1be', '#a7eba1', '#8ce685', 
      '#54D64E', // 5 - Original
      '#42b13c', '#308d2b', '#1e6819', '#0d4408'
    ],
    yellow: [
      '#fcfbf5', '#f8f4e6', '#f1eec8', '#eae3a4', '#e3d980', 
      '#746220', // 5 - Original
      '#605118', '#4c4012', '#382f0c', '#241d06'
    ],
    violet: [
      '#f6f0fc', '#ebdcf7', '#d6b8ee', '#c193e4', '#ab6dd9',
      '#9849D0', '#7a3aa6', '#5b2c7d', '#3d1d53', '#1e0f2a'
    ]
  },
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '600'
  },
  components: {
    Button: {
      defaultProps: { radius: 'sm' }
    },
    Paper: {
      defaultProps: { radius: 'sm', shadow: 'xs' }
    },
    Modal: {
      defaultProps: { radius: 'sm' }
    },
    TextInput: {
      defaultProps: { radius: 'sm' }
    },
    Select: {
      defaultProps: { radius: 'sm' }
    },
    NumberInput: {
      defaultProps: { radius: 'sm' }
    },
    PasswordInput: {
      defaultProps: { radius: 'sm' }
    },
    Badge: {
      defaultProps: { radius: 'sm' }
    },
    Card: {
      defaultProps: { radius: 'sm', shadow: 'xs' }
    },
    Table: {
      defaultProps: { striped: 'odd', highlightOnHover: true }
    }
  }
})
