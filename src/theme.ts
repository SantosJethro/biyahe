import { createTheme } from '@mui/material/styles'

/**
 * App theme. Deep expressway-green + signage-yellow, with a light and dark
 * palette so the PWA respects the device colour scheme.
 */
export const buildTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#3fbf82' : '#0b5d3b' },
      secondary: { main: '#ffb300' },
      background: {
        default: isDark ? '#0d1512' : '#f4f7f5',
        paper: isDark ? '#14201b' : '#ffffff',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        '"Segoe UI", Roboto, system-ui, -apple-system, Helvetica, Arial, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiTextField: { defaultProps: { size: 'small' } },
    },
  })
}
