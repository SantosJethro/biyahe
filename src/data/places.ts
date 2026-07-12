import type { LatLng } from '../../shared/toll'

/**
 * Offline gazetteer of common Philippine origin/destination places. The route
 * planner only needs coordinates, so the app resolves a picked place to its
 * lat/lng here — no external geocoding service required (keeps the PWA usable
 * offline). Extend freely.
 */
export interface Place extends LatLng {
  id: string
  name: string
  region: string
}

export const PLACES: Place[] = [
  { id: 'baguio', name: 'Baguio City', region: 'Benguet', lat: 16.412, lng: 120.593 },
  { id: 'clark', name: 'Clark / Angeles', region: 'Pampanga', lat: 15.185, lng: 120.56 },
  { id: 'san-fernando-pampanga', name: 'San Fernando', region: 'Pampanga', lat: 15.035, lng: 120.688 },
  { id: 'manila', name: 'Manila', region: 'Metro Manila', lat: 14.599, lng: 120.984 },
  { id: 'makati', name: 'Makati', region: 'Metro Manila', lat: 14.554, lng: 121.024 },
  { id: 'quezon-city', name: 'Quezon City', region: 'Metro Manila', lat: 14.676, lng: 121.043 },
  { id: 'alabang', name: 'Alabang (Muntinlupa)', region: 'Metro Manila', lat: 14.419, lng: 121.041 },
  { id: 'bocaue', name: 'Bocaue', region: 'Bulacan', lat: 14.799, lng: 120.926 },
  { id: 'tarlac', name: 'Tarlac City', region: 'Tarlac', lat: 15.48, lng: 120.598 },
  { id: 'urdaneta', name: 'Urdaneta', region: 'Pangasinan', lat: 15.976, lng: 120.571 },
  { id: 'dagupan', name: 'Dagupan', region: 'Pangasinan', lat: 16.043, lng: 120.334 },
  { id: 'rosario-launion', name: 'Rosario', region: 'La Union', lat: 16.23, lng: 120.483 },
  { id: 'subic', name: 'Subic / Olongapo', region: 'Zambales', lat: 14.829, lng: 120.282 },
  { id: 'sta-rosa', name: 'Sta. Rosa', region: 'Laguna', lat: 14.312, lng: 121.111 },
  { id: 'calamba', name: 'Calamba', region: 'Laguna', lat: 14.212, lng: 121.165 },
  { id: 'cavite-city', name: 'Cavite City', region: 'Cavite', lat: 14.483, lng: 120.898 },
  { id: 'tagaytay', name: 'Tagaytay', region: 'Cavite', lat: 14.1, lng: 120.933 },
  { id: 'batangas-city', name: 'Batangas City', region: 'Batangas', lat: 13.756, lng: 121.058 },
  { id: 'lipa', name: 'Lipa', region: 'Batangas', lat: 13.941, lng: 121.164 },
]
