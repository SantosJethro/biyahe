import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { formatPhp } from '../../shared/toll'
import { useTollData } from '../data/TollDataProvider'
import PageState from '../components/PageState'

const ExpresswaysPage = () => {
  const { loading, error, dataset, reload } = useTollData()

  if (loading || error || !dataset) {
    return <PageState loading={loading} error={error} onRetry={reload} />
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Expressways &amp; Skyways
        </Typography>
        <Typography color="text.secondary">
          {dataset.expressways.length} tollways. Class-1 cumulative fares from each
          route&apos;s reference origin; other classes scale from these.
        </Typography>
      </Box>

      {dataset.expressways.map((x) => (
        <Accordion key={x.id} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
              <Typography sx={{ fontWeight: 700 }}>{x.shortName}</Typography>
              <Typography color="text.secondary" sx={{ flex: 1 }} noWrap>
                {x.name}
              </Typography>
              <Chip
                size="small"
                label={x.source === 'crawl' ? 'crawled' : 'seed'}
                color={x.source === 'crawl' ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Operator: {x.operator}
              </Typography>
              <Link
                href={x.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                Official source <OpenInNewIcon fontSize="inherit" />
              </Link>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Interchange</TableCell>
                      <TableCell align="right">KM</TableCell>
                      <TableCell align="right">Class 1 (cumulative)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {x.interchanges.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.name}</TableCell>
                        <TableCell align="right">{i.km}</TableCell>
                        <TableCell align="right">{formatPhp(i.class1Toll)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary">
                Updated {new Date(x.updatedAt).toLocaleString('en-PH')}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}

export default ExpresswaysPage
