import { GEOLOGY_FIELD_OPTIONS } from '../utils/geologySampling'

export const GEOLOGY_FIELD_KEYS = [
  'fid',
  'latitude',
  'longitude',
  'ship',
  'cruise',
  'sample',
  'device',
  'yearmoda',
  'title',
  'fgdcid',
  'institution',
  'objectid',
  'mggid',
]

const GEOLOGY_GROUP_SEEDS = [
  {
    mggid: 'MGG-240301',
    ship: 'R/V Melville',
    cruise: 'MV2403',
    device: 'Gravity Corer',
    yearmoda: '20240315',
    title: 'South China Sea Slope Cores',
    institution: 'NOAA MGG',
    samplePrefix: 'GC',
    fgdcPrefix: 'FGDC-MV',
    lat: 21.42,
    lng: 111.36,
  },
  {
    mggid: 'MGG-240302',
    ship: 'R/V Atlantis',
    cruise: 'AT2404',
    device: 'Box Corer',
    yearmoda: '20240418',
    title: 'Pearl River Mouth Box Samples',
    institution: 'WHOI',
    samplePrefix: 'BC',
    fgdcPrefix: 'FGDC-AT',
    lat: 22.11,
    lng: 113.42,
  },
  {
    mggid: 'MGG-240303',
    ship: 'R/V Revelle',
    cruise: 'RV2405',
    device: 'Dredge',
    yearmoda: '20240506',
    title: 'Northern Shelf Dredge Series',
    institution: 'Scripps',
    samplePrefix: 'DR',
    fgdcPrefix: 'FGDC-RV',
    lat: 22.76,
    lng: 114.68,
  },
  {
    mggid: 'MGG-240304',
    ship: 'R/V Kilo Moana',
    cruise: 'KM2406',
    device: 'Multi Corer',
    yearmoda: '20240612',
    title: 'Eastern Basin Multicorer Transect',
    institution: 'University of Hawaii',
    samplePrefix: 'MC',
    fgdcPrefix: 'FGDC-KM',
    lat: 23.08,
    lng: 116.21,
  },
  {
    mggid: 'MGG-240305',
    ship: 'R/V Melville',
    cruise: 'MV2407',
    device: 'Grab Sampler',
    yearmoda: '20240722',
    title: 'Delta Front Grab Sampling',
    institution: 'NOAA MGG',
    samplePrefix: 'GR',
    fgdcPrefix: 'FGDC-MV',
    lat: 21.89,
    lng: 112.44,
  },
  {
    mggid: 'MGG-240306',
    ship: 'R/V Thomas Thompson',
    cruise: 'TT2408',
    device: 'Piston Corer',
    yearmoda: '20240817',
    title: 'Deep Basin Piston Core Set',
    institution: 'UW APL',
    samplePrefix: 'PC',
    fgdcPrefix: 'FGDC-TT',
    lat: 20.96,
    lng: 110.84,
  },
]

function createPointId(datasetType, index) {
  return `${datasetType.toUpperCase()}-${String(index).padStart(4, '0')}`
}

function createRecord(datasetType, seed, pointIndex, globalIndex, offsetLng = 0, offsetLat = 0) {
  const pointId = createPointId(datasetType, globalIndex)
  const objectid = `${datasetType === 'raw' ? 'OBJ' : 'POBJ'}-${String(globalIndex).padStart(4, '0')}`
  const fid = `${datasetType === 'raw' ? 'FID' : 'PFID'}-${String(globalIndex).padStart(4, '0')}`
  const latitude = Number((seed.lat + offsetLat).toFixed(6))
  const longitude = Number((seed.lng + offsetLng).toFixed(6))

  return {
    pointId,
    groupId: seed.mggid,
    datasetType,
    fid,
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    ship: seed.ship,
    cruise: seed.cruise,
    sample: `${seed.samplePrefix}-${String(pointIndex + 1).padStart(2, '0')}`,
    device: seed.device,
    yearmoda: seed.yearmoda,
    title: seed.title,
    fgdcid: `${seed.fgdcPrefix}-${String(pointIndex + 1).padStart(2, '0')}`,
    institution: seed.institution,
    objectid,
    mggid: seed.mggid,
  }
}

function buildRawRecords() {
  let globalIndex = 1
  return GEOLOGY_GROUP_SEEDS.flatMap((seed, groupIndex) => {
    const offsets = [
      { lng: -0.08, lat: 0.03 },
      { lng: 0.0, lat: 0.0 },
      { lng: 0.06, lat: -0.04 },
    ]

    return offsets.map((offset, pointIndex) =>
      createRecord(
        'raw',
        seed,
        pointIndex,
        globalIndex++,
        offset.lng + groupIndex * 0.002,
        offset.lat - groupIndex * 0.0015,
      ),
    )
  })
}

function buildProcessedRecords() {
  let globalIndex = 1
  return GEOLOGY_GROUP_SEEDS.flatMap((seed, groupIndex) => {
    const offsets = [
      { lng: -0.024, lat: 0.014 },
      { lng: 0.028, lat: -0.02 },
    ]

    return offsets.map((offset, pointIndex) => ({
      ...createRecord(
        'processed',
        seed,
        pointIndex,
        globalIndex++,
        offset.lng + groupIndex * 0.0012,
        offset.lat - groupIndex * 0.0008,
      ),
      folderPath: `/mock/geology/${seed.mggid}`,
      pdfCount: 1 + (groupIndex % 3),
      excelCount: 2 + ((groupIndex + pointIndex) % 3),
      parseStatus: pointIndex % 2 === 0 ? 'reviewed' : 'draft',
    }))
  })
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function buildMockGeologySamplingPayload() {
  const raw = buildRawRecords()
  const processed = buildProcessedRecords()

  return {
    raw,
    processed,
    all: [...raw, ...processed],
    fieldOptions: GEOLOGY_FIELD_OPTIONS,
  }
}

export function getMockGeologySamplingPayload() {
  return deepClone(buildMockGeologySamplingPayload())
}
