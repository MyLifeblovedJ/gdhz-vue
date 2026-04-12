import {
  GEOLOGY_FIELD_OPTIONS,
  getGeologyCategory,
  getGeologyCategoryGroup,
} from '../utils/geologySampling'

// NOAA MGG 标准业务字段（不含内部 pointId/datasetType/groupId）
export const GEOLOGY_FIELD_KEYS = [
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

// ────────────────────────────────────────────────
// 南海深海安全坐标范围参考（远离陆地与海岸线）
//   纬度: 6°N ~ 20°N（避开 >21°N 华南沿海）
//   经度: 109°E ~ 120°E（避开 <109°E 越南沿岸及 >120°E 菲律宾近海）
//   下面按区域将种子坐标分布到南海中部深海盆地、西沙海槽、
//   中沙群岛、南沙群岛北缘、马尼拉海沟西侧等远海区域
// ────────────────────────────────────────────────

const GEOLOGY_GROUP_SEEDS = [
  // ═══════════════════════════════════════════
  // LDEO（哥伦比亚大学拉蒙特地球观测所）— 8 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200101', ship: 'R/V Ewing',         cruise: 'EW2003', device: 'Piston Corer',   yearmoda: '20200312', title: 'SCS Western Slope Piston Cores',        institution: 'LDEO', samplePrefix: 'PC', fgdcPrefix: 'FGDC-EW', lat: 17.24, lng: 112.18 },
  { mggid: 'MGG-200102', ship: 'R/V Ewing',         cruise: 'EW2008', device: 'Gravity Corer',  yearmoda: '20200814', title: 'Xisha Trough Gravity Cores',            institution: 'LDEO', samplePrefix: 'GC', fgdcPrefix: 'FGDC-EW', lat: 16.56, lng: 111.42 },
  { mggid: 'MGG-210103', ship: 'R/V Robert Conrad',  cruise: 'RC2104', device: 'Dredge',        yearmoda: '20210422', title: 'Zhongsha Rise Dredge Survey',           institution: 'LDEO', samplePrefix: 'DR', fgdcPrefix: 'FGDC-RC', lat: 15.82, lng: 113.65 },
  { mggid: 'MGG-210104', ship: 'R/V Robert Conrad',  cruise: 'RC2109', device: 'Grab Sampler',  yearmoda: '20210915', title: 'Zhongsha Atoll Platform Grabs',          institution: 'LDEO', samplePrefix: 'GR', fgdcPrefix: 'FGDC-RC', lat: 15.38, lng: 114.22 },
  { mggid: 'MGG-220105', ship: 'R/V Langseth',      cruise: 'LG2207', device: 'Multi Corer',    yearmoda: '20220715', title: 'Central Basin Multi Corer Transect',     institution: 'LDEO', samplePrefix: 'MC', fgdcPrefix: 'FGDC-LG', lat: 14.90, lng: 114.30 },
  { mggid: 'MGG-220106', ship: 'R/V Langseth',      cruise: 'LG2211', device: 'Piston Corer',   yearmoda: '20221108', title: 'Central SCS Deep Piston Cores',          institution: 'LDEO', samplePrefix: 'PC', fgdcPrefix: 'FGDC-LG', lat: 13.64, lng: 115.12 },
  { mggid: 'MGG-230107', ship: 'R/V Ewing',         cruise: 'EW2302', device: 'Box Corer',      yearmoda: '20230218', title: 'Western Ridge Box Core Sampling',         institution: 'LDEO', samplePrefix: 'BC', fgdcPrefix: 'FGDC-EW', lat: 16.12, lng: 110.88 },
  { mggid: 'MGG-240108', ship: 'R/V Langseth',      cruise: 'LG2405', device: 'Rock Drill',     yearmoda: '20240520', title: 'SCS Oceanic Crust Rock Drill',           institution: 'LDEO', samplePrefix: 'RD', fgdcPrefix: 'FGDC-LG', lat: 15.28, lng: 116.44 },

  // ═══════════════════════════════════════════
  // WHOI（伍兹霍尔海洋研究所）— 8 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200201', ship: 'R/V Atlantis',  cruise: 'AT2002', device: 'Box Corer',      yearmoda: '20200215', title: 'NE SCS Continental Slope Box Samples',   institution: 'WHOI', samplePrefix: 'BC', fgdcPrefix: 'FGDC-AT', lat: 18.11, lng: 115.42 },
  { mggid: 'MGG-200202', ship: 'R/V Atlantis',  cruise: 'AT2007', device: 'Gravity Corer',  yearmoda: '20200720', title: 'Dongsha Plateau Deep Gravity Cores',      institution: 'WHOI', samplePrefix: 'GC', fgdcPrefix: 'FGDC-AT', lat: 19.45, lng: 116.78 },
  { mggid: 'MGG-210203', ship: 'R/V Knorr',     cruise: 'KN2103', device: 'Piston Corer',   yearmoda: '20210310', title: 'Northern SCS Piston Core Leg A',          institution: 'WHOI', samplePrefix: 'PC', fgdcPrefix: 'FGDC-KN', lat: 18.54, lng: 115.22 },
  { mggid: 'MGG-220204', ship: 'R/V Knorr',     cruise: 'KN2209', device: 'Heat Probe',     yearmoda: '20220905', title: 'Southwestern Basin Heat Flow',             institution: 'WHOI', samplePrefix: 'HP', fgdcPrefix: 'FGDC-KN', lat: 12.32, lng: 112.16 },
  { mggid: 'MGG-220205', ship: 'R/V Atlantis',  cruise: 'AT2204', device: 'Multi Corer',    yearmoda: '20220418', title: 'Luzon Strait Deep Multi Corer',            institution: 'WHOI', samplePrefix: 'MC', fgdcPrefix: 'FGDC-AT', lat: 19.88, lng: 118.64 },
  { mggid: 'MGG-230206', ship: 'R/V Knorr',     cruise: 'KN2306', device: 'Dredge',         yearmoda: '20230612', title: 'Reed Bank West Dredge',                    institution: 'WHOI', samplePrefix: 'DR', fgdcPrefix: 'FGDC-KN', lat: 11.42, lng: 116.82 },
  { mggid: 'MGG-230207', ship: 'R/V Atlantis',  cruise: 'AT2311', device: 'Vibracorer',     yearmoda: '20231115', title: 'SCS Abyssal Plain Vibracore',              institution: 'WHOI', samplePrefix: 'VC', fgdcPrefix: 'FGDC-AT', lat: 14.28, lng: 114.56 },
  { mggid: 'MGG-240208', ship: 'R/V Knorr',     cruise: 'KN2401', device: 'Grab Sampler',   yearmoda: '20240118', title: 'Western Basin Surface Grabs',              institution: 'WHOI', samplePrefix: 'GR', fgdcPrefix: 'FGDC-KN', lat: 13.76, lng: 111.94 },

  // ═══════════════════════════════════════════
  // SIO / Scripps（斯克里普斯海洋研究所）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200301', ship: 'R/V Revelle',   cruise: 'RV2005', device: 'Dredge',         yearmoda: '20200506', title: 'Western Margin Dredge Series',             institution: 'SIO (Scripps)', samplePrefix: 'DR', fgdcPrefix: 'FGDC-RV', lat: 17.76, lng: 111.68 },
  { mggid: 'MGG-210302', ship: 'R/V Revelle',   cruise: 'RV2110', device: 'Rock Drill',     yearmoda: '20211008', title: 'Continental Margin Rock Drill',            institution: 'SIO (Scripps)', samplePrefix: 'RD', fgdcPrefix: 'FGDC-RV', lat: 18.18, lng: 112.85 },
  { mggid: 'MGG-220303', ship: 'R/V Melville',  cruise: 'MV2201', device: 'Gravity Corer',  yearmoda: '20220118', title: 'SCS Central Basin Gravity Survey',         institution: 'SIO (Scripps)', samplePrefix: 'GC', fgdcPrefix: 'FGDC-MV', lat: 15.44, lng: 115.06 },
  { mggid: 'MGG-220304', ship: 'R/V Melville',  cruise: 'MV2206', device: 'Piston Corer',   yearmoda: '20220620', title: 'Deep Abyssal Piston Cores',                institution: 'SIO (Scripps)', samplePrefix: 'PC', fgdcPrefix: 'FGDC-MV', lat: 14.12, lng: 116.32 },
  { mggid: 'MGG-230305', ship: 'R/V Revelle',   cruise: 'RV2308', device: 'Box Corer',      yearmoda: '20230822', title: 'Northern Deep Basin Box Sampling',          institution: 'SIO (Scripps)', samplePrefix: 'BC', fgdcPrefix: 'FGDC-RV', lat: 16.88, lng: 113.48 },
  { mggid: 'MGG-240306', ship: 'R/V Melville',  cruise: 'MV2403', device: 'Multi Corer',    yearmoda: '20240315', title: 'South China Sea Slope Multi Cores',         institution: 'SIO (Scripps)', samplePrefix: 'MC', fgdcPrefix: 'FGDC-MV', lat: 17.42, lng: 114.36 },

  // ═══════════════════════════════════════════
  // NOAA MGG — 8 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200401', ship: 'R/V Melville',  cruise: 'MV2003', device: 'Gravity Corer',  yearmoda: '20200315', title: 'SCS Deep Slope Cores',                     institution: 'NOAA MGG', samplePrefix: 'GC', fgdcPrefix: 'FGDC-MV', lat: 16.42, lng: 113.36 },
  { mggid: 'MGG-200402', ship: 'R/V Melville',  cruise: 'MV2009', device: 'Piston Corer',   yearmoda: '20200928', title: 'Central SCS Piston Survey',                 institution: 'NOAA MGG', samplePrefix: 'PC', fgdcPrefix: 'FGDC-MV', lat: 15.18, lng: 114.82 },
  { mggid: 'MGG-210403', ship: 'R/V Oceanus',   cruise: 'OC2104', device: 'Box Corer',      yearmoda: '20210408', title: 'SCS Eastern Margin Box Survey',             institution: 'NOAA MGG', samplePrefix: 'BC', fgdcPrefix: 'FGDC-OC', lat: 17.98, lng: 116.02 },
  { mggid: 'MGG-210404', ship: 'R/V Oceanus',   cruise: 'OC2108', device: 'Vibracorer',     yearmoda: '20210810', title: 'Western Basin Vibracore Profiles',           institution: 'NOAA MGG', samplePrefix: 'VC', fgdcPrefix: 'FGDC-OC', lat: 14.45, lng: 110.72 },
  { mggid: 'MGG-220405', ship: 'R/V Melville',  cruise: 'MV2202', device: 'Grab Sampler',   yearmoda: '20220222', title: 'Delta Front Grab Sampling',                 institution: 'NOAA MGG', samplePrefix: 'GR', fgdcPrefix: 'FGDC-MV', lat: 16.89, lng: 112.44 },
  { mggid: 'MGG-230406', ship: 'R/V Oceanus',   cruise: 'OC2311', device: 'Dredge',         yearmoda: '20231110', title: 'Southern Slope Dredge Stations',             institution: 'NOAA MGG', samplePrefix: 'DR', fgdcPrefix: 'FGDC-OC', lat: 12.56, lng: 113.88 },
  { mggid: 'MGG-230407', ship: 'R/V Melville',  cruise: 'MV2307', device: 'Heat Probe',     yearmoda: '20230718', title: 'SCS Basin Heat Flow Measurements',           institution: 'NOAA MGG', samplePrefix: 'HP', fgdcPrefix: 'FGDC-MV', lat: 13.72, lng: 115.64 },
  { mggid: 'MGG-240408', ship: 'R/V Oceanus',   cruise: 'OC2406', device: 'Multi Corer',    yearmoda: '20240605', title: 'Western Margin Multi Corer Array',           institution: 'NOAA MGG', samplePrefix: 'MC', fgdcPrefix: 'FGDC-OC', lat: 15.52, lng: 111.24 },

  // ═══════════════════════════════════════════
  // University of Hawaii（夏威夷大学）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200501', ship: 'R/V Kilo Moana', cruise: 'KM2006', device: 'Multi Corer',   yearmoda: '20200612', title: 'Eastern Basin Multi Corer Transect',        institution: 'University of Hawaii', samplePrefix: 'MC', fgdcPrefix: 'FGDC-KM', lat: 18.08, lng: 117.21 },
  { mggid: 'MGG-210502', ship: 'R/V Kilo Moana', cruise: 'KM2102', device: 'Gravity Corer', yearmoda: '20210225', title: 'Luzon Strait Gravity Cores',                institution: 'University of Hawaii', samplePrefix: 'GC', fgdcPrefix: 'FGDC-KM', lat: 19.15, lng: 118.64 },
  { mggid: 'MGG-220503', ship: 'R/V Kilo Moana', cruise: 'KM2208', device: 'Piston Corer',  yearmoda: '20220820', title: 'Manila Trench Piston Core Leg B',            institution: 'University of Hawaii', samplePrefix: 'PC', fgdcPrefix: 'FGDC-KM', lat: 18.60, lng: 118.88 },
  { mggid: 'MGG-230504', ship: 'R/V Kilo Moana', cruise: 'KM2304', device: 'Dredge',        yearmoda: '20230415', title: 'Scarborough Shoal Vicinity Dredge',          institution: 'University of Hawaii', samplePrefix: 'DR', fgdcPrefix: 'FGDC-KM', lat: 15.22, lng: 117.68 },
  { mggid: 'MGG-230505', ship: 'R/V Kilo Moana', cruise: 'KM2310', device: 'Box Corer',     yearmoda: '20231012', title: 'NE Palawan Trough Box Cores',                institution: 'University of Hawaii', samplePrefix: 'BC', fgdcPrefix: 'FGDC-KM', lat: 11.88, lng: 118.24 },
  { mggid: 'MGG-240506', ship: 'R/V Kilo Moana', cruise: 'KM2401', device: 'Grab Sampler',  yearmoda: '20240108', title: 'SCS Eastern Deep Surface Grabs',             institution: 'University of Hawaii', samplePrefix: 'GR', fgdcPrefix: 'FGDC-KM', lat: 16.74, lng: 117.42 },

  // ═══════════════════════════════════════════
  // UW APL（华盛顿大学应用物理实验室）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200601', ship: 'R/V Thomas Thompson', cruise: 'TT2008', device: 'Piston Corer',  yearmoda: '20200817', title: 'Deep Basin Piston Core Set',              institution: 'UW APL', samplePrefix: 'PC', fgdcPrefix: 'FGDC-TT', lat: 14.96, lng: 112.84 },
  { mggid: 'MGG-210602', ship: 'R/V Thomas Thompson', cruise: 'TT2105', device: 'Gravity Corer', yearmoda: '20210512', title: 'Southern Basin Gravity Survey',            institution: 'UW APL', samplePrefix: 'GC', fgdcPrefix: 'FGDC-TT', lat: 11.74, lng: 113.52 },
  { mggid: 'MGG-220603', ship: 'R/V Thomas Thompson', cruise: 'TT2205', device: 'Heat Probe',    yearmoda: '20220512', title: 'SCS Abyssal Heat Flow Array',              institution: 'UW APL', samplePrefix: 'HP', fgdcPrefix: 'FGDC-TT', lat: 13.74, lng: 114.52 },
  { mggid: 'MGG-230604', ship: 'R/V Thomas Thompson', cruise: 'TT2309', device: 'Box Corer',     yearmoda: '20230918', title: 'Nansha Plateau Box Core Survey',            institution: 'UW APL', samplePrefix: 'BC', fgdcPrefix: 'FGDC-TT', lat: 10.36, lng: 114.88 },
  { mggid: 'MGG-240605', ship: 'R/V Thomas Thompson', cruise: 'TT2401', device: 'Multi Corer',   yearmoda: '20240115', title: 'Western Margin Multi Corer',               institution: 'UW APL', samplePrefix: 'MC', fgdcPrefix: 'FGDC-TT', lat: 15.36, lng: 111.88 },
  { mggid: 'MGG-240606', ship: 'R/V Thomas Thompson', cruise: 'TT2406', device: 'Dredge',        yearmoda: '20240628', title: 'SCS Seamount Flank Dredge',                institution: 'UW APL', samplePrefix: 'DR', fgdcPrefix: 'FGDC-TT', lat: 12.82, lng: 115.34 },

  // ═══════════════════════════════════════════
  // Oregon State（俄勒冈州立大学）— 4 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-210701', ship: 'R/V Oceanus',  cruise: 'OC2103', device: 'Vibracorer',     yearmoda: '20210318', title: 'Southern Shelf Vibracore Survey',           institution: 'Oregon State', samplePrefix: 'VC', fgdcPrefix: 'FGDC-OC', lat: 12.34, lng: 111.12 },
  { mggid: 'MGG-220702', ship: 'R/V Oceanus',  cruise: 'OC2206', device: 'Gravity Corer',  yearmoda: '20220614', title: 'Western Deep Gravity Cores',               institution: 'Oregon State', samplePrefix: 'GC', fgdcPrefix: 'FGDC-OC', lat: 13.56, lng: 110.36 },
  { mggid: 'MGG-230703', ship: 'R/V Revelle',  cruise: 'RV2306', device: 'Dredge',         yearmoda: '20230604', title: 'Southern Slope Dredge Stations',             institution: 'Oregon State', samplePrefix: 'DR', fgdcPrefix: 'FGDC-RV', lat: 10.48, lng: 115.40 },
  { mggid: 'MGG-240704', ship: 'R/V Revelle',  cruise: 'RV2402', device: 'Piston Corer',   yearmoda: '20240208', title: 'NW Borneo Trough Piston Cores',             institution: 'Oregon State', samplePrefix: 'PC', fgdcPrefix: 'FGDC-RV', lat: 9.72, lng: 114.88 },

  // ═══════════════════════════════════════════
  // URI（罗德岛大学）— 4 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-200801', ship: 'R/V Knorr',     cruise: 'KN2006', device: 'Box Corer',     yearmoda: '20200620', title: 'NE SCS Contourite Box Cores',               institution: 'URI', samplePrefix: 'BC', fgdcPrefix: 'FGDC-KN', lat: 17.88, lng: 116.54 },
  { mggid: 'MGG-210802', ship: 'R/V Knorr',     cruise: 'KN2112', device: 'Multi Corer',   yearmoda: '20211215', title: 'Deep Current Multi Corer Array',            institution: 'URI', samplePrefix: 'MC', fgdcPrefix: 'FGDC-KN', lat: 16.42, lng: 115.26 },
  { mggid: 'MGG-220803', ship: 'R/V Atlantis',  cruise: 'AT2211', device: 'Grab Sampler',  yearmoda: '20221108', title: 'Macclesfield Bank Grab Samples',            institution: 'URI', samplePrefix: 'GR', fgdcPrefix: 'FGDC-AT', lat: 15.68, lng: 114.72 },
  { mggid: 'MGG-230804', ship: 'R/V Atlantis',  cruise: 'AT2305', device: 'Piston Corer',  yearmoda: '20230522', title: 'Central Basin Deep Piston Cores',            institution: 'URI', samplePrefix: 'PC', fgdcPrefix: 'FGDC-AT', lat: 14.24, lng: 113.88 },

  // ═══════════════════════════════════════════
  // USGS（美国地质调查局）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-210901', ship: 'R/V Langseth',  cruise: 'LG2109', device: 'Rock Drill',     yearmoda: '20210920', title: 'Paracel Plateau Rock Drill Survey',        institution: 'USGS', samplePrefix: 'RD', fgdcPrefix: 'FGDC-LG', lat: 16.84, lng: 112.32 },
  { mggid: 'MGG-220902', ship: 'R/V Langseth',  cruise: 'LG2202', device: 'Piston Corer',   yearmoda: '20220218', title: 'SW Sub-basin Piston Cores',                institution: 'USGS', samplePrefix: 'PC', fgdcPrefix: 'FGDC-LG', lat: 11.16, lng: 110.46 },
  { mggid: 'MGG-220903', ship: 'R/V Langseth',  cruise: 'LG2208', device: 'Gravity Corer',  yearmoda: '20220825', title: 'Southern Basin Gravity Cores',              institution: 'USGS', samplePrefix: 'GC', fgdcPrefix: 'FGDC-LG', lat: 10.62, lng: 112.78 },
  { mggid: 'MGG-230904', ship: 'R/V Oceanus',   cruise: 'OC2303', device: 'Box Corer',      yearmoda: '20230312', title: 'Western Ridge Box Core Survey',             institution: 'USGS', samplePrefix: 'BC', fgdcPrefix: 'FGDC-OC', lat: 14.52, lng: 109.24 },
  { mggid: 'MGG-240905', ship: 'R/V Oceanus',   cruise: 'OC2406', device: 'Vibracorer',     yearmoda: '20240605', title: 'Deep Basin Vibracore Profiles',              institution: 'USGS', samplePrefix: 'VC', fgdcPrefix: 'FGDC-OC', lat: 13.28, lng: 111.64 },
  { mggid: 'MGG-240906', ship: 'R/V Langseth',  cruise: 'LG2410', device: 'Multi Corer',    yearmoda: '20241012', title: 'SCS Eastern Deep Multi Corer',              institution: 'USGS', samplePrefix: 'MC', fgdcPrefix: 'FGDC-LG', lat: 15.84, lng: 117.82 },

  // ═══════════════════════════════════════════
  // Texas A&M（德克萨斯农工大学 / IODP）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-201001', ship: 'JOIDES Resolution', cruise: 'JR2004', device: 'Piston Corer',   yearmoda: '20200408', title: 'IODP SCS Leg 1 Piston',                  institution: 'Texas A&M', samplePrefix: 'PC', fgdcPrefix: 'FGDC-JR', lat: 14.92, lng: 116.08 },
  { mggid: 'MGG-210002', ship: 'JOIDES Resolution', cruise: 'JR2108', device: 'Rock Drill',     yearmoda: '20210818', title: 'IODP SCS Leg 2 Rock Drill',              institution: 'Texas A&M', samplePrefix: 'RD', fgdcPrefix: 'FGDC-JR', lat: 15.36, lng: 115.72 },
  { mggid: 'MGG-221003', ship: 'JOIDES Resolution', cruise: 'JR2210', device: 'Gravity Corer',  yearmoda: '20221014', title: 'IODP SCS Leg 3 Gravity',                 institution: 'Texas A&M', samplePrefix: 'GC', fgdcPrefix: 'FGDC-JR', lat: 13.08, lng: 116.44 },
  { mggid: 'MGG-231004', ship: 'JOIDES Resolution', cruise: 'JR2303', device: 'Multi Corer',    yearmoda: '20230322', title: 'IODP SCS Leg 4 Multi Corer',             institution: 'Texas A&M', samplePrefix: 'MC', fgdcPrefix: 'FGDC-JR', lat: 12.64, lng: 117.18 },
  { mggid: 'MGG-231005', ship: 'JOIDES Resolution', cruise: 'JR2309', device: 'Box Corer',      yearmoda: '20230905', title: 'IODP SCS Leg 5 Box Survey',              institution: 'Texas A&M', samplePrefix: 'BC', fgdcPrefix: 'FGDC-JR', lat: 14.48, lng: 115.32 },
  { mggid: 'MGG-241006', ship: 'JOIDES Resolution', cruise: 'JR2407', device: 'Piston Corer',   yearmoda: '20240715', title: 'IODP SCS Leg 6 Deep Piston',             institution: 'Texas A&M', samplePrefix: 'PC', fgdcPrefix: 'FGDC-JR', lat: 11.72, lng: 114.56 },

  // ═══════════════════════════════════════════
  // IFREMER（法国海洋开发研究院）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-211101', ship: 'R/V Melville',  cruise: 'MV2111', device: 'Box Corer',      yearmoda: '20211112', title: 'SCS-Franco Joint Box Cores',                institution: 'IFREMER', samplePrefix: 'BC', fgdcPrefix: 'FGDC-MV', lat: 16.28, lng: 113.94 },
  { mggid: 'MGG-221102', ship: 'R/V Melville',  cruise: 'MV2204', device: 'Gravity Corer',  yearmoda: '20220415', title: 'SCS Franco Gravity Transect',               institution: 'IFREMER', samplePrefix: 'GC', fgdcPrefix: 'FGDC-MV', lat: 14.86, lng: 112.68 },
  { mggid: 'MGG-231103', ship: 'R/V Vema',      cruise: 'VM2305', device: 'Dredge',         yearmoda: '20230518', title: 'Seamount Chain Dredge Survey',               institution: 'IFREMER', samplePrefix: 'DR', fgdcPrefix: 'FGDC-VM', lat: 12.64, lng: 115.82 },
  { mggid: 'MGG-231104', ship: 'R/V Vema',      cruise: 'VM2309', device: 'Piston Corer',   yearmoda: '20230920', title: 'Deep Trench Piston Core Series',             institution: 'IFREMER', samplePrefix: 'PC', fgdcPrefix: 'FGDC-VM', lat: 11.38, lng: 116.44 },
  { mggid: 'MGG-241105', ship: 'R/V Vema',      cruise: 'VM2402', device: 'Multi Corer',    yearmoda: '20240210', title: 'Abyssal Plain Multi Corer',                  institution: 'IFREMER', samplePrefix: 'MC', fgdcPrefix: 'FGDC-VM', lat: 13.12, lng: 114.56 },
  { mggid: 'MGG-241106', ship: 'R/V Melville',  cruise: 'MV2408', device: 'Vibracorer',     yearmoda: '20240818', title: 'Eastern Margin Vibracore Survey',             institution: 'IFREMER', samplePrefix: 'VC', fgdcPrefix: 'FGDC-MV', lat: 15.64, lng: 117.22 },

  // ═══════════════════════════════════════════
  // SOA / 中国国家海洋局 — 8 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-201201', ship: 'R/V Kexue',    cruise: 'KX2003', device: 'Gravity Corer',  yearmoda: '20200305', title: '南海北部深海重力取样',                         institution: 'SOA (中国)', samplePrefix: 'GC', fgdcPrefix: 'FGDC-KX', lat: 17.64, lng: 112.18 },
  { mggid: 'MGG-201202', ship: 'R/V Kexue',    cruise: 'KX2009', device: 'Box Corer',      yearmoda: '20200918', title: '中央海盆箱式取样',                             institution: 'SOA (中国)', samplePrefix: 'BC', fgdcPrefix: 'FGDC-KX', lat: 15.22, lng: 114.86 },
  { mggid: 'MGG-211203', ship: 'R/V Kexue',    cruise: 'KX2107', device: 'Piston Corer',   yearmoda: '20210712', title: '西沙海域活塞取芯',                             institution: 'SOA (中国)', samplePrefix: 'PC', fgdcPrefix: 'FGDC-KX', lat: 16.22, lng: 111.86 },
  { mggid: 'MGG-221204', ship: 'R/V Kexue',    cruise: 'KX2204', device: 'Vibracorer',     yearmoda: '20220420', title: '南海深海振动取芯',                             institution: 'SOA (中国)', samplePrefix: 'VC', fgdcPrefix: 'FGDC-KX', lat: 14.48, lng: 113.76 },
  { mggid: 'MGG-221205', ship: 'R/V Kexue',    cruise: 'KX2212', device: 'Multi Corer',    yearmoda: '20221205', title: '南海中部多管取芯',                             institution: 'SOA (中国)', samplePrefix: 'MC', fgdcPrefix: 'FGDC-KX', lat: 13.48, lng: 115.16 },
  { mggid: 'MGG-230106', ship: 'R/V Kexue',    cruise: 'KX2306', device: 'Dredge',         yearmoda: '20230615', title: '海山链疏浚取样',                               institution: 'SOA (中国)', samplePrefix: 'DR', fgdcPrefix: 'FGDC-KX', lat: 12.16, lng: 116.94 },
  { mggid: 'MGG-240107', ship: 'R/V Kexue',    cruise: 'KX2401', device: 'Grab Sampler',   yearmoda: '20240120', title: '深海平原表层抓斗取样',                         institution: 'SOA (中国)', samplePrefix: 'GR', fgdcPrefix: 'FGDC-KX', lat: 11.16, lng: 112.94 },
  { mggid: 'MGG-240108', ship: 'R/V Kexue',    cruise: 'KX2409', device: 'Rock Drill',     yearmoda: '20240905', title: '南海东部岩石钻探',                             institution: 'SOA (中国)', samplePrefix: 'RD', fgdcPrefix: 'FGDC-KX', lat: 16.52, lng: 118.22 },

  // ═══════════════════════════════════════════
  // JAMSTEC（日本海洋研究开发机构）— 6 个航次
  // ═══════════════════════════════════════════
  { mggid: 'MGG-201301', ship: 'R/V Hakuho Maru', cruise: 'HM2006', device: 'Multi Corer',   yearmoda: '20200615', title: 'SCS-Japan Joint Multi Corer',               institution: 'JAMSTEC', samplePrefix: 'MC', fgdcPrefix: 'FGDC-HM', lat: 18.84, lng: 116.32 },
  { mggid: 'MGG-211302', ship: 'R/V Hakuho Maru', cruise: 'HM2104', device: 'Gravity Corer', yearmoda: '20210422', title: 'NE Basin Gravity Cores',                     institution: 'JAMSTEC', samplePrefix: 'GC', fgdcPrefix: 'FGDC-HM', lat: 17.52, lng: 117.14 },
  { mggid: 'MGG-221303', ship: 'R/V Hakuho Maru', cruise: 'HM2204', device: 'Piston Corer',  yearmoda: '20220416', title: 'Eastern Ridge Piston Cores',                 institution: 'JAMSTEC', samplePrefix: 'PC', fgdcPrefix: 'FGDC-HM', lat: 16.52, lng: 118.14 },
  { mggid: 'MGG-230104', ship: 'R/V Hakuho Maru', cruise: 'HM2309', device: 'Heat Probe',    yearmoda: '20230912', title: 'Deep Basin Heat Probe Array',                institution: 'JAMSTEC', samplePrefix: 'HP', fgdcPrefix: 'FGDC-HM', lat: 14.16, lng: 116.56 },
  { mggid: 'MGG-240105', ship: 'R/V Hakuho Maru', cruise: 'HM2403', device: 'Grab Sampler',  yearmoda: '20240308', title: 'SCS Eastern Surface Grabs',                  institution: 'JAMSTEC', samplePrefix: 'GR', fgdcPrefix: 'FGDC-HM', lat: 15.72, lng: 118.92 },
  { mggid: 'MGG-240106', ship: 'R/V Hakuho Maru', cruise: 'HM2408', device: 'Box Corer',     yearmoda: '20240822', title: 'Luzon Strait Deep Box Cores',                institution: 'JAMSTEC', samplePrefix: 'BC', fgdcPrefix: 'FGDC-HM', lat: 19.28, lng: 119.44 },
]

// ────────────────────────────────────────────────
// 基于种子的伪随机数生成器（保证可复现）
// ────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed
  return function next() {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// 在中心点附近生成散布坐标（保证在南海深海区域内）
function clampToSCS(lat, lng) {
  return {
    lat: Math.max(6.5, Math.min(19.8, lat)),
    lng: Math.max(109.2, Math.min(119.8, lng)),
  }
}

function createPointId(datasetType, index) {
  return `${datasetType.toUpperCase()}-${String(index).padStart(4, '0')}`
}

function createRecord(datasetType, seed, pointIndex, globalIndex, offsetLng, offsetLat) {
  const pointId = createPointId(datasetType, globalIndex)
  const objectid = `${datasetType === 'raw' ? 'OBJ' : 'POBJ'}-${String(globalIndex).padStart(5, '0')}`
  const pos = clampToSCS(seed.lat + offsetLat, seed.lng + offsetLng)
  const latitude = Number(pos.lat.toFixed(6))
  const longitude = Number(pos.lng.toFixed(6))

  const record = {
    pointId,
    groupId: seed.mggid,
    datasetType,
    latitude,
    longitude,
    lat: latitude,
    lng: longitude,
    ship: seed.ship,
    cruise: seed.cruise,
    sample: `${seed.samplePrefix}-${String(pointIndex + 1).padStart(3, '0')}`,
    device: seed.device,
    yearmoda: seed.yearmoda,
    title: seed.title,
    fgdcid: `${seed.fgdcPrefix}-${String(globalIndex).padStart(5, '0')}`,
    institution: seed.institution,
    objectid,
    mggid: seed.mggid,
  }

  // 注入语义大类（当前基于 device 自动推导，后续可由后端直接下发）
  const category = getGeologyCategory(record)
  const categoryGroup = getGeologyCategoryGroup(record)
  record.category = category.key
  record.categoryGroup = categoryGroup.key
  record.categorySource = 'derived'

  return record
}

// 每个种子生成 5~8 个原始采样点，坐标在中心点附近 ±0.3° 随机散布
function buildRawRecords() {
  let globalIndex = 1
  const rng = seededRandom(42)

  return GEOLOGY_GROUP_SEEDS.flatMap((seed) => {
    const pointCount = 5 + Math.floor(rng() * 4) // 5~8 个点
    const points = []

    for (let i = 0; i < pointCount; i++) {
      const offsetLng = (rng() - 0.5) * 0.6
      const offsetLat = (rng() - 0.5) * 0.6
      points.push(createRecord('raw', seed, i, globalIndex++, offsetLng, offsetLat))
    }

    return points
  })
}

// 每个种子生成 3~5 个处理后采样点
function buildProcessedRecords() {
  let globalIndex = 1
  const rng = seededRandom(1337)

  return GEOLOGY_GROUP_SEEDS.flatMap((seed, groupIndex) => {
    const pointCount = 3 + Math.floor(rng() * 3) // 3~5 个点
    const points = []

    for (let i = 0; i < pointCount; i++) {
      const offsetLng = (rng() - 0.5) * 0.5
      const offsetLat = (rng() - 0.5) * 0.5
      points.push({
        ...createRecord('processed', seed, i, globalIndex++, offsetLng, offsetLat),
        folderPath: `/data/geology/${seed.mggid}`,
        pdfCount: 1 + (groupIndex % 4),
        excelCount: 2 + ((groupIndex + i) % 3),
        parseStatus: i % 3 === 0 ? 'reviewed' : i % 3 === 1 ? 'draft' : 'pending',
      })
    }

    return points
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
