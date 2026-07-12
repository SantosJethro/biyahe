import { useState, type FormEvent, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { ApiError } from '../api/client'

interface PasswordGateProps {
  title: string
  description: ReactNode
  submitLabel: string
  onSubmit: (password: string) => Promise<void>
  hint?: ReactNode
  icon?: ReactNode
}

/**
 * Reusable password prompt. Handles the submit lifecycle (pending state, error
 * surfacing) so the site and admin gates stay declarative.
 */
const PasswordGate = ({
  title,
  description,
  submitLabel,
  onSubmit,
  hint,
  icon,
}: PasswordGateProps) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password || pending) return
    setPending(true)
    setError(null)
    try {
      await onSubmit(password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      setPassword('')
    } finally {
      setPending(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(circle at 30% 10%, rgba(63,191,130,0.18), transparent 45%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }} elevation={0}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                {icon ?? <LockOutlinedIcon />}
              </Box>
              <Typography variant="h5" component="h1">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              fullWidth
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={pending || !password}
            >
              {pending ? 'Checking…' : submitLabel}
            </Button>

            {hint && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                {hint}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PasswordGate
