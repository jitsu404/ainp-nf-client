// SAMPLE research data for AINP-Natural Farming. Treatments, parameters and indicators are placeholders
// until the Project Coordination Unit supplies the approved technical programme and indicator list.

export const SYSTEMS = ['Rice–Wheat', 'Maize–Wheat', 'Soybean–Wheat', 'Cotton + Greengram', 'Rice–Chickpea', 'Maize + Cowpea–Mustard', 'Finger millet–Pulses', 'Sugarcane + Intercrops']
export const SEASONS = ['Kharif', 'Rabi', 'Summer']

export const TREATMENTS = [
  { id: 'T1', name: 'Complete natural farming', detail: 'Beejamrit + Jeevamrit + Ghanjeevamrit + mulching + intercropping' },
  { id: 'T2', name: 'Natural farming without mulching', detail: 'Beejamrit + Jeevamrit + Ghanjeevamrit + intercropping' },
  { id: 'T3', name: 'Organic farming package', detail: 'Recommended organic package of practices' },
  { id: 'T4', name: 'Integrated crop management', detail: 'Recommended integrated nutrient and pest management' },
  { id: 'T5', name: 'Farmers’ practice (control)', detail: 'Prevailing practice of the area' },
]
export const T_NAMES = TREATMENTS.map((t) => `${t.id} ${t.name}`)

export const BIO_INPUTS = [
  ['Beejamrit', 'L/ha'], ['Jeevamrit', 'L/ha'], ['Ghanjeevamrit', 'kg/ha'], ['Mulch (crop residue)', 't/ha'],
  ['Neemastra / Agniastra', 'L/ha'], ['Desi cow dung', 'kg/ha'], ['Desi cow urine', 'L/ha'], ['Human labour', 'man-days/ha'],
]

export const INDICATORS = [
  { id: 'yieldIdx', label: 'Yield relative to control', unit: '%', formula: 'Yield under complete natural farming ÷ yield under farmers’ practice × 100' },
  { id: 'sysProd', label: 'System productivity', unit: 'q/ha', formula: 'Crop-equivalent yield under complete natural farming' },
  { id: 'soc', label: 'Change in soil organic carbon', unit: '% points', formula: 'SOC under natural farming − SOC under farmers’ practice' },
  { id: 'mbc', label: 'Microbial biomass carbon', unit: 'µg/g soil', formula: 'Measured under complete natural farming' },
  { id: 'earthworms', label: 'Earthworm population', unit: 'no./m²', formula: 'Measured under complete natural farming' },
  { id: 'costCut', label: 'Reduction in cost of cultivation', unit: '%', formula: '(Control cost − natural farming cost) ÷ control cost × 100' },
  { id: 'net', label: 'Net return', unit: '₹ ’000/ha', formula: 'Gross return − cost of cultivation under natural farming' },
  { id: 'bc', label: 'Benefit : cost ratio', unit: 'ratio', formula: 'Gross return ÷ cost of cultivation under natural farming' },
]

const r1 = (n) => Math.round(n * 10) / 10
const r2 = (n) => Math.round(n * 100) / 100
const row = (rows, code) => rows.find((r) => String(r.treatment).startsWith(code)) || {}

export function indicators(obs) {
  const y1 = row(obs.productivity, 'T1'), y5 = row(obs.productivity, 'T5')
  const s1 = row(obs.soil, 'T1'), s5 = row(obs.soil, 'T5')
  const e1 = row(obs.economics, 'T1'), e5 = row(obs.economics, 'T5')
  return {
    yieldIdx: y5.equivalent ? (y1.equivalent / y5.equivalent) * 100 : 0,
    sysProd: y1.equivalent || 0,
    soc: (s1.soc || 0) - (s5.soc || 0),
    mbc: s1.mbc || 0,
    earthworms: s1.earthworms || 0,
    costCut: e5.cost ? ((e5.cost - e1.cost) / e5.cost) * 100 : 0,
    net: (e1.gross || 0) - (e1.cost || 0),
    bc: e1.cost ? e1.gross / e1.cost : 0,
  }
}

export function researchSeed({ centres, rnd, piOf, id, hist, fys }) {
  const [fyA, fyB, fyC] = fys
  const experiments = centres.map((c, i) => ({
    id: id('xp'), code: `NF-${c.code}-E1`, centreId: c.id, system: SYSTEMS[i % SYSTEMS.length], type: 'On-station',
    title: `Evaluation of natural farming practices in ${SYSTEMS[i % SYSTEMS.length]} system`,
    design: 'Randomised block design', treatments: 5, replications: 3, startYear: 2021 + (i % 3), status: 'Ongoing',
  }))
  const models = centres.map((c, i) => {
    const area = [1.0, 0.4, 0.8, 1.0][i % 4]
    return {
      id: id('md'), code: `NF-${c.code}-MF`, centreId: c.id, area, system: SYSTEMS[(i + 3) % SYSTEMS.length],
      name: `Natural farming model farm (${area} ha)`, year: 2021 + (i % 4), status: 'Active',
      components: ['Crops', 'Desi cow unit', 'Bio-input preparation unit', ...(i % 2 ? ['Vermicompost'] : ['Border plantation']), ...(i % 3 === 0 ? ['Farm pond'] : [])],
    }
  })

  const build = (yearIdx) => {
    const base = 28 + rnd() * 22
    const factor = [0.84 + yearIdx * 0.05 + rnd() * 0.06, 0.8 + yearIdx * 0.04 + rnd() * 0.05, 0.92 + rnd() * 0.06, 1.04 + rnd() * 0.06, 1]
    const price = 2.2 + rnd() * 0.8
    const productivity = T_NAMES.map((treatment, k) => { const g = r1(base * factor[k]); return { treatment, grain: g, straw: r1(g * (1.3 + rnd() * 0.3)), equivalent: r1(g * (k < 2 ? 1.18 : 1)) } })
    const socBase = 0.42 + rnd() * 0.25
    const soil = T_NAMES.map((treatment, k) => {
      const lift = [0.11, 0.08, 0.09, 0.03, 0][k] + (k < 3 ? yearIdx * 0.02 : 0)
      return { treatment, soc: r2(socBase + lift), n: Math.round(190 + lift * 400 + rnd() * 20), p: r1(14 + lift * 40 + rnd() * 3), k: Math.round(210 + lift * 250 + rnd() * 20), mbc: Math.round(180 + lift * 1400 + rnd() * 30), dha: r1(32 + lift * 260 + rnd() * 6), earthworms: Math.round(4 + lift * 130 + rnd() * 3) }
    })
    const costBase = 46 + rnd() * 14
    const economics = productivity.map((p, k) => ({ treatment: p.treatment, cost: r1(costBase * [0.68, 0.64, 0.92, 1.02, 1][k]), gross: r1(p.equivalent * price * (k < 3 ? 1.1 : 1)) }))
    const q = [20, 1000 + rnd() * 400, 250 + rnd() * 150, 4 + rnd() * 3, 12 + rnd() * 8, 900 + rnd() * 500, 180 + rnd() * 80, 68 + rnd() * 25]
    const inputs = BIO_INPUTS.map(([input, unit], k) => ({ input, unit, qty: Math.round(q[k]) }))
    return { productivity, soil, economics, inputs }
  }

  const cycleB = ['Approved', 'Scrutinised', 'Approved', 'Submitted', 'Approved', 'Returned', 'Approved', 'Resubmitted']
  const cycleC = ['Draft', 'Submitted', null, 'Draft', null, 'Returned', null]
  const flow = (s, c, y, m1, m2) => {
    const pi = piOf(c.id)
    const h = [['Draft', `${y}-${m1}-12 10:30`, 'Data Entry Staff', 'Observations entered from field and laboratory registers']]
    if (s === 'Draft') return hist(...h)
    h.push(['Submitted', `${y}-${m1}-25 16:10`, pi, 'Verified against laboratory reports'])
    if (s === 'Submitted') return hist(...h)
    if (s === 'Returned' || s === 'Resubmitted') {
      h.push(['Returned', `${y}-${m2}-06 11:45`, 'Dr. Meera Krishnan', 'Soil organic carbon under T1 looks high for the third year; attach the laboratory report and re-check the Jeevamrit quantity.'])
      if (s === 'Resubmitted') h.push(['Resubmitted', `${y}-${m2}-14 15:20`, pi, 'Laboratory report attached; input quantity corrected'])
      return hist(...h)
    }
    h.push(['Scrutinised', `${y}-${m2}-08 12:00`, 'Dr. Meera Krishnan', 'Validation checks passed'])
    if (s === 'Approved') h.push(['Approved', `${y}-${m2}-20 17:30`, 'Dr. S. K. Rathore', 'Approved for annual report'])
    return hist(...h)
  }
  const observations = []
  experiments.forEach((x, i) => {
    const c = centres.find((k) => k.id === x.centreId)
    const [kharif, rabi] = x.system.split(/–| \+ /)
    const mk = (fy, season, crop, status, y, m1, m2, yi) => observations.push({
      id: id('ob'), ref: `NF/${c.code}/${fy}/${season[0]}`, title: `${crop} · ${x.code}`, experimentId: x.id, centreId: c.id, fy, season, crop,
      status, history: flow(status, c, y, m1, m2), ...build(yi),
    })
    mk(fyA, 'Kharif', kharif, 'Approved', 2025, '01', '02', 0)
    mk(fyB, 'Kharif', kharif, cycleB[i % cycleB.length], 2026, '01', '02', 1)
    mk(fyB, 'Rabi', rabi || 'Wheat', cycleB[(i + 3) % cycleB.length], 2026, '06', '07', 1)
    const s = cycleC[i % cycleC.length]
    if (s) mk(fyC, 'Kharif', kharif, s, 2026, '10', '11', 2)
  })

  return { models, experiments, observations }
}
