import { createTheme } from '@mantine/core'

export const sapTheme = createTheme({
  primaryColor: 'sap',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'sm',
  colors: {
    sap: [
      '#e6f2ff',
      '#cce5ff',
      '#99caff',
      '#66b0ff',
      '#3395ff',
      '#0A6ED1',
      '#085bab',
      '#064985',
      '#04365f',
      '#022439'
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
