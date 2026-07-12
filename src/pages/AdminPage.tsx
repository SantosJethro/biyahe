import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CloudSyncIcon from '@mui/icons-material/CloudSync'
import RefreshIcon from '@mui/icons-material/Refresh'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { api, ApiError } from '../api/client'
import type { AdminStatus, CrawlReport } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useTollData } from '../data/TollDataProvider'
import PasswordGate from '../components/PasswordGate'
import PageState from '../components/PageState'

const AdminPage = () => {
  const { session, enterAdmin } = useAuth()

  if (!session.admin) {
    return (
      <PasswordGate
        title="Admin access"
        description="Enter the admin password to manage price crawling."
        submitLabel="Unlock admin"
        onSubmit={enterAdmin}
        icon={<AdminPanelSettingsIcon />}
        hint="This area is not linked from the app — reach it by visiting /admin."
      />
    )
  }

  return <AdminConsole />
}

const AdminConsole = () => {
  const { reload: reloadTolls } = useTollData()
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | 'all' | null>(null)
  const [report, setReport] = useState<CrawlReport | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStatus(await api.adminStatus())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const runCrawl = useCallback(
    async (onlyId?: string) => {
      setBusyId(onlyId ?? 'all')
      setError(null)
      try {
        const result = await api.crawl(onlyId)
        setReport(result)
        await Promise.all([loadStatus(), reloadTolls()])
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Crawl failed.')
      } finally {
        setBusyId(null)
      }
    },
    [loadStatus, reloadTolls],
  )

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin — Price Crawler
        </Typography>
        <Typography color="text.secondary">
          Trigger a refresh of toll prices from official operator sources. Failed
          sources keep their existing data.
        </Typography>
      </Box>

      <Alert severity="info">
        <AlertTitle>How this works</AlertTitle>
        Each source&apos;s published fare matrix (on expressway.ph) is fetched and
        parsed. A source is trusted only when at least two of its known
        interchange fares are matched, guarding against mis-parsed or
        rate-limited pages. A source that matches its fares but finds no change
        reports <em>&ldquo;already current&rdquo;</em> — that is a success. Pages
        that are blocked or mis-parsed simply keep their last known values.
      </Alert>

      <Button
        variant="contained"
        size="large"
        startIcon={busyId === 'all' ? <CircularProgress size={18} color="inherit" /> : <CloudSyncIcon />}
        onClick={() => void runCrawl()}
        disabled={busyId !== null}
      >
        {busyId === 'all' ? 'Crawling all sources…' : 'Crawl all sources now'}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}

      {report && <CrawlReportCard report={report} />}

      {loading || (!status && error) ? (
        <PageState loading={loading} error={status ? null : error} onRetry={loadStatus} />
      ) : (
        status && <SourceTable status={status} busyId={busyId} onRefresh={runCrawl} />
      )}
    </Stack>
  )
}

const CrawlReportCard = ({ report }: { report: CrawlReport }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Last crawl result
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {report.updatedCount} source(s) updated in {report.durationMs} ms —{' '}
          {new Date(report.finishedAt).toLocaleString('en-PH')}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={1}>
          {report.results.map((r) => (
            <Stack key={r.id} direction="row" spacing={1} alignItems="flex-start">
              <Chip
                size="small"
                label={r.ok ? 'updated' : 'kept'}
                color={r.ok ? 'success' : 'default'}
                variant={r.ok ? 'filled' : 'outlined'}
                sx={{ minWidth: 76 }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {r.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.message}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

const SourceTable = ({
  status,
  busyId,
  onRefresh,
}: {
  status: AdminStatus
  busyId: string | 'all' | null
  onRefresh: (onlyId: string) => void
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sources
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Expressway</TableCell>
                <TableCell>RFID</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {status.sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {s.shortName}
                    </Typography>
                    <Link
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                    >
                      {s.operator}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={s.rfid}
                      color={s.rfid === 'Easytrip' ? 'warning' : 'info'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={s.source}
                      color={s.source === 'crawl' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(s.updatedAt).toLocaleDateString('en-PH')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={
                        busyId === s.id ? (
                          <CircularProgress size={14} />
                        ) : (
                          <RefreshIcon fontSize="small" />
                        )
                      }
                      onClick={() => onRefresh(s.id)}
                      disabled={busyId !== null || !s.hasAdapter}
                    >
                      Refresh
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AdminPage
