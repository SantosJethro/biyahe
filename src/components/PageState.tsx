import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'

interface PageStateProps {
  loading?: boolean
  error?: string | null
  empty?: string | null
  onRetry?: () => void
}

/** Uniform loading / error / empty placeholder used across pages. */
const PageState = ({ loading, error, empty, onRetry }: PageStateProps) => {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) {
    return (
      <Stack spacing={2} sx={{ py: 6, alignItems: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 480 }}>
          {error}
        </Alert>
        {onRetry && (
          <Button variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Stack>
    )
  }
  if (empty) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">{empty}</Typography>
      </Box>
    )
  }
  return null
}

export default PageState
