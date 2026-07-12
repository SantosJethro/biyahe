import type { Expressway, TollDataset, VehicleClassRate } from '../../../shared/toll'

/**
 * Curated toll data used as the always-available baseline and refreshed by the
 * admin crawler (see `api/_lib/crawler`). Every Class-1 cumulative fare here was
 * read from the live TRB-approved matrices republished on expressway.ph on the
 * `SEED_UPDATED_AT` date, so the shipped numbers are real, not placeholders.
 *
 * IMPORTANT — the crawler matches parsed rows onto these interchanges *by name*,
 * so each interchange `name` is spelled exactly as it appears on its expressway.ph
 * matrix page (e.g. "Bacoor/Zapote", "Sta. Rosa/Tagaytay"). Renaming one silently
 * stops the crawler from updating it. The `sourceUrl` is the page the crawler
 * fetches; the origin plaza whose column is read lives in the adapter registry
 * (`api/_lib/crawler/adapters.ts`).
 *
 * Provenance notes on the two partial sources:
 *  - SCTEX shares NLEX's matrix on expressway.ph, so its `sourceUrl` is the NLEX
 *    page and the crawler reads the "Tipo/Subic" column.
 *  - expressway.ph's CALAX matrix only covers the Laguna-side plazas, and its
 *    Skyway (Stage 3) matrix is a flat two-tier grid — both are modelled with the
 *    plazas the source actually publishes.
 *
 * Cumulative fares are monotonic along each route so a segment cost is always the
 * difference between two interchanges. Coordinates are approximate — used only to
 * snap a searched place to its nearest entry/exit. Class multipliers follow the
 * common PH convention (Class 2 ≈ 2×, Class 3 ≈ 3× the Class-1 fare); the UI
 * always labels figures as estimates.
 */

const SEED_UPDATED_AT = '2026-07-12T00:00:00.000Z'

const classes = (m2 = 2, m3 = 3): VehicleClassRate[] => {
  return [
    { classId: 1, label: 'Class 1 — Car / Motorcycle / Jeepney / Van / Pickup', multiplier: 1 },
    { classId: 2, label: 'Class 2 — Bus / Light truck', multiplier: m2 },
    { classId: 3, label: 'Class 3 — Large truck / Trailer', multiplier: m3 },
  ]
}

const expressways: Expressway[] = [
  {
    id: 'nlex',
    name: 'North Luzon Expressway',
    shortName: 'NLEX',
    operator: 'NLEX Corporation (Metro Pacific Tollways)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Easytrip',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/nlex',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'balintawak', name: 'Balintawak', km: 0, class1Toll: 0, lat: 14.657, lng: 120.991 },
      { id: 'valenzuela', name: 'Valenzuela', km: 6, class1Toll: 85, lat: 14.703, lng: 120.96 },
      { id: 'meycauayan', name: 'Meycauayan', km: 15, class1Toll: 85, lat: 14.737, lng: 120.955 },
      { id: 'marilao', name: 'Marilao', km: 20, class1Toll: 85, lat: 14.758, lng: 120.948 },
      { id: 'bocaue', name: 'Bocaue', km: 25, class1Toll: 105, lat: 14.799, lng: 120.926 },
      { id: 'balagtas', name: 'Balagtas', km: 32, class1Toll: 136, lat: 14.818, lng: 120.906 },
      { id: 'tabang', name: 'Tabang', km: 39, class1Toll: 157, lat: 14.859, lng: 120.883 },
      { id: 'sta-rita', name: 'Sta. Rita', km: 52, class1Toll: 164, lat: 14.945, lng: 120.812 },
      { id: 'pulilan', name: 'Pulilan', km: 58, class1Toll: 202, lat: 14.901, lng: 120.848 },
      { id: 'san-fernando', name: 'San Fernando', km: 70, class1Toll: 314, lat: 15.03, lng: 120.69 },
      { id: 'sta-ines', name: 'Sta. Ines', km: 84, class1Toll: 440, lat: 15.203, lng: 120.582 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'slex',
    name: 'South Luzon Expressway',
    shortName: 'SLEX',
    operator: 'San Miguel Corporation (SLEX / MATES)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Autosweep',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/slex',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'magallanes', name: 'Magallanes', km: 0, class1Toll: 0, lat: 14.539, lng: 121.017 },
      { id: 'bicutan', name: 'Bicutan', km: 8, class1Toll: 49, lat: 14.492, lng: 121.05 },
      { id: 'sucat', name: 'Sucat', km: 12, class1Toll: 84, lat: 14.469, lng: 121.052 },
      { id: 'alabang', name: 'Alabang', km: 17, class1Toll: 118, lat: 14.419, lng: 121.041 },
      { id: 'susana-heights', name: 'Susana Heights', km: 24, class1Toll: 139, lat: 14.386, lng: 121.048 },
      { id: 'carmona', name: 'Carmona', km: 39, class1Toll: 170, lat: 14.312, lng: 121.057 },
      { id: 'sta-rosa', name: 'Sta. Rosa', km: 47, class1Toll: 193, lat: 14.272, lng: 121.089 },
      { id: 'cabuyao', name: 'Cabuyao', km: 58, class1Toll: 217, lat: 14.249, lng: 121.123 },
      { id: 'calamba', name: 'Calamba', km: 68, class1Toll: 244, lat: 14.212, lng: 121.165 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'skyway',
    name: 'Metro Manila Skyway (Stage 3)',
    shortName: 'Skyway',
    operator: 'San Miguel Corporation (Skyway O&M Corp.)',
    region: 'Metro Manila',
    system: 'skyway',
    rfid: 'Autosweep',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/skyway-stage-3',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'balintawak', name: 'Balintawak', km: 0, class1Toll: 0, lat: 14.657, lng: 120.991 },
      { id: 'quezon-ave', name: 'Quezon Ave.', km: 5, class1Toll: 129, lat: 14.632, lng: 121.028 },
      { id: 'e-rodriguez', name: 'E. Rodriguez', km: 8, class1Toll: 129, lat: 14.613, lng: 121.02 },
      { id: 'nagtahan', name: 'Nagtahan', km: 11, class1Toll: 264, lat: 14.596, lng: 121.005 },
      { id: 'quirino', name: 'Quirino', km: 14, class1Toll: 264, lat: 14.578, lng: 121.006 },
      { id: 'buendia', name: 'Buendia', km: 18, class1Toll: 264, lat: 14.563, lng: 121.011 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'cavitex',
    name: 'Manila–Cavite Expressway',
    shortName: 'CAVITEX',
    operator: 'CAVITEX Infrastructure Corp. (Metro Pacific Tollways)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Easytrip',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/cavitex',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'paranaque', name: 'Parañaque', km: 0, class1Toll: 0, lat: 14.51, lng: 120.99 },
      { id: 'bacoor-zapote', name: 'Bacoor/Zapote', km: 8, class1Toll: 39, lat: 14.458, lng: 120.945 },
      { id: 'kawit', name: 'Kawit', km: 11, class1Toll: 127, lat: 14.44, lng: 120.905 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'calax',
    name: 'Cavite–Laguna Expressway (Laguna segment)',
    shortName: 'CALAX',
    operator: 'MPCALA Holdings (Metro Pacific Tollways)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Easytrip',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/calax',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'greenfield', name: 'Greenfield', km: 0, class1Toll: 0, lat: 14.27, lng: 121.07 },
      { id: 'laguna-blvd', name: 'Laguna Blvd.', km: 6, class1Toll: 30, lat: 14.252, lng: 121.05 },
      { id: 'sta-rosa-tagaytay', name: 'Sta. Rosa/Tagaytay', km: 12, class1Toll: 44, lat: 14.24, lng: 121.02 },
      { id: 'silang-east', name: 'Silang East', km: 18, class1Toll: 64, lat: 14.23, lng: 121.0 },
      { id: 'silang-interchange', name: 'Silang Interchange', km: 24, class1Toll: 81, lat: 14.22, lng: 120.985 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'tplex',
    name: 'Tarlac–Pangasinan–La Union Expressway',
    shortName: 'TPLEX',
    operator: 'Private Infra Dev. Corp. (San Miguel)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Easytrip',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/tplex',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'la-paz', name: 'La Paz', km: 0, class1Toll: 0, lat: 15.44, lng: 120.63 },
      { id: 'victoria', name: 'Victoria', km: 12, class1Toll: 30, lat: 15.577, lng: 120.681 },
      { id: 'gerona', name: 'Gerona', km: 20, class1Toll: 58, lat: 15.604, lng: 120.599 },
      { id: 'paniqui', name: 'Paniqui', km: 30, class1Toll: 79, lat: 15.668, lng: 120.581 },
      { id: 'moncada', name: 'Moncada', km: 38, class1Toll: 99, lat: 15.738, lng: 120.573 },
      { id: 'carmen', name: 'Carmen', km: 47, class1Toll: 164, lat: 15.861, lng: 120.598 },
      { id: 'urdaneta', name: 'Urdaneta', km: 58, class1Toll: 216, lat: 15.976, lng: 120.571 },
      { id: 'binalonan', name: 'Binalonan', km: 66, class1Toll: 235, lat: 16.052, lng: 120.596 },
      { id: 'pozorrubio', name: 'Pozorrubio', km: 74, class1Toll: 270, lat: 16.111, lng: 120.545 },
      { id: 'sison', name: 'Sison', km: 82, class1Toll: 290, lat: 16.18, lng: 120.5 },
      { id: 'rosario', name: 'Rosario', km: 89, class1Toll: 311, lat: 16.229, lng: 120.483 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'sctex',
    name: 'Subic–Clark–Tarlac Expressway',
    shortName: 'SCTEX',
    operator: 'NLEX Corporation (Metro Pacific Tollways)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Easytrip',
    // SCTEX shares NLEX's matrix on expressway.ph; the crawler reads the
    // "Tipo/Subic" column of the NLEX page (see adapters.ts).
    sourceUrl: 'https://www.expressway.ph/toll-matrix/nlex',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'tipo', name: 'Tipo/Subic', km: 0, class1Toll: 0, lat: 14.752, lng: 120.301 },
      { id: 'dinalupihan', name: 'Dinalupihan', km: 9, class1Toll: 126, lat: 14.871, lng: 120.462 },
      { id: 'floridablanca', name: 'Floridablanca', km: 24, class1Toll: 249, lat: 14.97, lng: 120.523 },
      { id: 'porac', name: 'Porac', km: 34, class1Toll: 339, lat: 15.07, lng: 120.541 },
      { id: 'clark-south', name: 'Clark South', km: 42, class1Toll: 406, lat: 15.163, lng: 120.552 },
      { id: 'clark-north', name: 'Clark North', km: 47, class1Toll: 444, lat: 15.203, lng: 120.561 },
      { id: 'concepcion', name: 'Concepcion', km: 71, class1Toll: 523, lat: 15.323, lng: 120.63 },
      { id: 'tarlac', name: 'Tarlac', km: 89, class1Toll: 647, lat: 15.44, lng: 120.599 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
  {
    id: 'star',
    name: 'Southern Tagalog Arterial Road (STAR Tollway)',
    shortName: 'STAR',
    operator: 'San Miguel Corporation (STAR Infrastructure)',
    region: 'Luzon',
    system: 'expressway',
    rfid: 'Autosweep',
    sourceUrl: 'https://www.expressway.ph/toll-matrix/star-tollway',
    vehicleClasses: classes(),
    interchanges: [
      { id: 'calamba', name: 'Calamba', km: 0, class1Toll: 0, lat: 14.19, lng: 121.13 },
      { id: 'sto-tomas', name: 'Sto. Tomas', km: 7, class1Toll: 34, lat: 14.109, lng: 121.141 },
      { id: 'tanauan', name: 'Tanauan', km: 14, class1Toll: 43, lat: 14.083, lng: 121.15 },
      { id: 'malvar', name: 'Malvar', km: 18, class1Toll: 58, lat: 14.043, lng: 121.155 },
      { id: 'sto-toribio', name: 'Sto. Toribio', km: 24, class1Toll: 76, lat: 13.99, lng: 121.16 },
      { id: 'lipa', name: 'Lipa', km: 30, class1Toll: 86, lat: 13.941, lng: 121.164 },
      { id: 'ibaan', name: 'Ibaan', km: 38, class1Toll: 114, lat: 13.86, lng: 121.13 },
      { id: 'batangas', name: 'Batangas', km: 42, class1Toll: 135, lat: 13.759, lng: 121.058 },
    ],
    updatedAt: SEED_UPDATED_AT,
    source: 'seed',
  },
]

export const seedDataset: TollDataset = {
  generatedAt: SEED_UPDATED_AT,
  expressways,
}
