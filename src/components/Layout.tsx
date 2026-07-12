import { type ReactNode } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../auth/AuthContext'

// Note: `/admin` is intentionally NOT listed — it is reached only by typing the
// URL and is password-protected inside the page.
const NAV = [
  { to: '/', label: 'Calculator', icon: <CalculateOutlinedIcon /> },
  { to: '/expressways', label: 'Expressways', icon: <RouteOutlinedIcon /> },
]

const Layout = ({ children }: { children: ReactNode }) => {
  const { session, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Container maxWidth="md" disableGutters>
          <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 2 } }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'inherit',
                textDecoration: 'none',
                mr: 'auto',
              }}
            >
              <Box component="img" src="/favicon.svg" alt="" sx={{ width: 28, height: 28 }} />
              <Typography variant="h6" component="span" sx={{ letterSpacing: 0.3 }}>
                Biyahe
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5}>
              {NAV.map((item) => {
                const active =
                  item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    startIcon={item.icon}
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      bgcolor: active ? 'rgba(255,255,255,0.16)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
              {/* Compact icon-only nav on phones */}
              {NAV.map((item) => (
                <Tooltip title={item.label} key={`m-${item.to}`}>
                  <Button
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    sx={{ display: { xs: 'inline-flex', sm: 'none' }, minWidth: 44 }}
                    aria-label={item.label}
                  >
                    {item.icon}
                  </Button>
                </Tooltip>
              ))}
            </Stack>

            {session.admin && (
              <Tooltip title="Sign out of admin">
                <Button
                  color="inherit"
                  onClick={() => void logout()}
                  startIcon={<LogoutIcon />}
                  sx={{ ml: 0.5 }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Sign out
                  </Box>
                </Button>
              </Tooltip>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, py: { xs: 2, sm: 3 } }}>
        {children}
      </Container>

      <Box component="footer" sx={{ py: 2, px: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Toll figures are estimates for planning only — confirm at the toll plaza.
          Sources are official operator matrices.
        </Typography>
      </Box>
    </Box>
  )
}

export default Layout
