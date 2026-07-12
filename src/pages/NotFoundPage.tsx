import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

const NotFoundPage = () => {
  return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        404
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        This road doesn&apos;t exist on our map.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
        Back to calculator
      </Button>
    </Box>
  )
}

export default NotFoundPage
