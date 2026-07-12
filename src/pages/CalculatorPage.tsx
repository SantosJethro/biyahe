import { useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TripOriginIcon from '@mui/icons-material/TripOrigin'
import PlaceIcon from '@mui/icons-material/Place'
import SouthIcon from '@mui/icons-material/South'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import ContactlessIcon from '@mui/icons-material/Contactless'
import {
  formatPhp,
  planRoute,
  type Expressway,
  type RfidSystem,
  type RouteResult,
  type SnappedPoint,
  type VehicleClassId,
} from '../../shared/toll'
import { PLACES, type Place } from '../data/places'
import { useTollData } from '../data/TollDataProvider'
import PageState from '../components/PageState'

const CLASS_OPTIONS: { id: VehicleClassId; short: string }[] = [
  { id: 1, short: 'Class 1' },
  { id: 2, short: 'Class 2' },
  { id: 3, short: 'Class 3' },
]

const sortedPlaces = [...PLACES].sort((a, b) => a.region.localeCompare(b.region))

const CalculatorPage = () => {
  const { loading, error, dataset, reload } = useTollData()
  const expressways = dataset?.expressways ?? []

  const [origin, setOrigin] = useState<Place | null>(null)
  const [destination, setDestination] = useState<Place | null>(null)
  const [classId, setClassId] = useState<VehicleClassId>(1)

  const classLabel = useMemo(() => {
    const src = expressways[0]?.vehicleClasses ?? []
    const map = new Map(src.map((c) => [c.classId, c.label]))
    return (id: VehicleClassId) => map.get(id) ?? `Class ${id}`
  }, [expressways])

  const route: RouteResult | null = useMemo(() => {
    if (!origin || !destination || expressways.length === 0) return null
    return planRoute(expressways, origin, destination, classId)
  }, [origin, destination, expressways, classId])

  if (loading || error || expressways.length === 0) {
    return (
      <PageState
        loading={loading}
        error={error}
        empty={!loading && !error && expressways.length === 0 ? 'No toll data available yet.' : null}
        onRetry={reload}
      />
    )
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Toll Cost Estimator
        </Typography>
        <Typography color="text.secondary">
          Enter where you&apos;re coming from and where you&apos;re going. We snap
          each to the nearest expressway entry and exit and total the toll — even
          across connected expressways.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <PlaceField
              label="From (origin)"
              value={origin}
              onChange={setOrigin}
              icon={<TripOriginIcon fontSize="small" color="primary" />}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', my: -1 }}>
              <Tooltip title="Swap origin and destination">
                <IconButton
                  size="small"
                  onClick={() => {
                    setOrigin(destination)
                    setDestination(origin)
                  }}
                  aria-label="Swap origin and destination"
                >
                  <SwapHorizIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <PlaceField
              label="To (destination)"
              value={destination}
              onChange={setDestination}
              icon={<PlaceIcon fontSize="small" color="error" />}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Vehicle class
          </Typography>
          <ToggleButtonGroup
            value={classId}
            exclusive
            onChange={(_, v) => v && setClassId(v)}
            size="small"
            color="primary"
            fullWidth
          >
            {CLASS_OPTIONS.map((c) => (
              <ToggleButton key={c.id} value={c.id}>
                {c.short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {classLabel(classId)}
          </Typography>
        </CardContent>
      </Card>

      <RoutePanel
        route={route}
        hasInputs={Boolean(origin && destination)}
        expressways={expressways}
      />
    </Stack>
  )
}

const PlaceField = ({
  label,
  value,
  onChange,
  icon,
}: {
  label: string
  value: Place | null
  onChange: (place: Place | null) => void
  icon: React.ReactNode
}) => {
  return (
    <Autocomplete
      options={sortedPlaces}
      groupBy={(o) => o.region}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      value={value}
      onChange={(_, v) => onChange(v)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Search a city or place…"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, pr: 0.5 }}>{icon}</Box>
            ),
          }}
        />
      )}
    />
  )
}

const RoutePanel = ({
  route,
  hasInputs,
  expressways,
}: {
  route: RouteResult | null
  hasInputs: boolean
  expressways: Expressway[]
}) => {
  if (!hasInputs || !route) {
    return (
      <Alert severity="info" icon={<PlaceIcon />}>
        Pick an origin and a destination to see the estimated toll.
      </Alert>
    )
  }

  if (!route.ok) {
    return <Alert severity="warning">{route.message}</Alert>
  }

  const rfidById = new Map(expressways.map((x) => [x.id, x.rfid]))

  return (
    <Stack spacing={2}>
      {route.entry && route.exit && (
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <SnapRow icon={<LoginIcon color="primary" />} label="Nearest entry" point={route.entry} />
              <Divider />
              <SnapRow icon={<LogoutIcon color="error" />} label="Nearest exit" point={route.exit} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {route.legs.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Toll breakdown
            </Typography>
            <Stack spacing={1.25} divider={<Divider flexItem />}>
              {route.legs.map((leg, i) => (
                <Stack key={`${leg.expresswayId}-${i}`} direction="row" alignItems="center" spacing={1}>
                  <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: 92 }}>
                    <Chip label={leg.expresswayName} size="small" color="primary" variant="outlined" />
                    {rfidById.get(leg.expresswayId) && <RfidChip system={rfidById.get(leg.expresswayId)!} />}
                  </Stack>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {leg.fromName} <SouthIcon sx={{ fontSize: 12, transform: 'rotate(-90deg)' }} />{' '}
                      {leg.toName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPhp(leg.cost)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="success">{route.message ?? 'No toll expressway needed for this trip.'}</Alert>
      )}

      <TotalCard total={route.total} legCount={route.legs.length} />

      {route.legs.length > 0 && <RfidSummary route={route} rfidById={rfidById} />}

      <SourcesCaption route={route} expressways={expressways} />
    </Stack>
  )
}

const RfidChip = ({ system }: { system: RfidSystem }) => {
  // Easytrip is the MPTC network; Autosweep is the SMC network.
  const color = system === 'Easytrip' ? 'warning' : 'info'
  return (
    <Chip
      label={system}
      size="small"
      color={color}
      variant="outlined"
      sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: 11, fontWeight: 600 } }}
    />
  )
}

const RfidSummary = ({
  route,
  rfidById,
}: {
  route: RouteResult
  rfidById: Map<string, RfidSystem>
}) => {
  // Subtotal the toll per RFID network — each is a separate prepaid account, so
  // this is what you'd load onto each sticker. First-seen order is preserved.
  const order: RfidSystem[] = []
  const subtotals = new Map<RfidSystem, number>()
  for (const leg of route.legs) {
    const r = rfidById.get(leg.expresswayId)
    if (!r) continue
    if (!subtotals.has(r)) order.push(r)
    subtotals.set(r, (subtotals.get(r) ?? 0) + leg.cost)
  }
  if (order.length === 0) return null

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ContactlessIcon fontSize="small" color="action" />
            <Typography variant="subtitle2">
              RFID {order.length > 1 ? 'tags' : 'tag'} needed
            </Typography>
          </Stack>
          <Stack spacing={0.75} divider={<Divider flexItem />}>
            {order.map((s) => (
              <Stack key={s} direction="row" alignItems="center" spacing={1}>
                <RfidChip system={s} />
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatPhp(subtotals.get(s) ?? 0)}
                </Typography>
              </Stack>
            ))}
          </Stack>
          {order.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              Load each account separately — this trip crosses both networks.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

const SourcesCaption = ({
  route,
  expressways,
}: {
  route: RouteResult
  expressways: Expressway[]
}) => {
  // Distinct expressways used by the route, in order of appearance.
  const used: Expressway[] = []
  const seen = new Set<string>()
  for (const leg of route.legs) {
    if (seen.has(leg.expresswayId)) continue
    seen.add(leg.expresswayId)
    const x = expressways.find((e) => e.id === leg.expresswayId)
    if (x) used.push(x)
  }
  if (used.length === 0) return null

  return (
    <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, display: 'block' }}>
      Toll rates from the TRB-approved matrices published on expressway.ph:{' '}
      {used.map((x, i) => (
        <span key={x.id}>
          {i > 0 && ' · '}
          <Link href={x.sourceUrl} target="_blank" rel="noopener noreferrer" color="inherit" underline="always">
            {x.shortName}
          </Link>
        </span>
      ))}
      . Figures are estimates — confirm at the toll plaza.
    </Typography>
  )
}

const SnapRow = ({
  icon,
  label,
  point,
}: {
  icon: React.ReactNode
  label: string
  point: SnappedPoint
}) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {icon}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
          {point.expresswayShortName} · {point.interchangeName}
        </Typography>
      </Box>
      <Chip size="small" variant="outlined" label={`${point.distanceKm.toFixed(1)} km away`} />
    </Stack>
  )
}

const TotalCard = ({ total, legCount }: { total: number; legCount: number }) => {
  return (
    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ReceiptLongIcon fontSize="large" />
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.85 }}>
              Estimated total toll
            </Typography>
            <Typography variant="h3" component="p" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {formatPhp(total)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={`${legCount} expressway${legCount === 1 ? '' : 's'}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalculatorPage
