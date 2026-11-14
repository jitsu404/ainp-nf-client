// Programme-specific configuration for AINP-Natural Farming.
// Centre list is SAMPLE data for the first draft; replace with the list supplied by the Project Coordination Unit.

const c = (code, name, host, state, type = 'Network Centre') => ({ id: code, code, name, host, state, type })

export const programme = {
  id: 'nf',
  short: 'AINP-NF',
  name: 'All India Network Programme on Natural Farming',
  system: 'Project Management System',
  unit: 'Project Coordination Unit',
  institute: 'ICAR-Indian Institute of Farming Systems Research',
  instituteHi: 'भाकृअनुप–भारतीय कृषि प्रणाली अनुसंधान संस्थान',
  place: 'Modipuram, Meerut (U.P.) 250110',
  fileNo: 'IIFSR/AINP-NF',
  fys: ['2024-25', '2025-26', '2026-27'],
  currentFy: '2026-27',
  budgetScale: 0.55,
  researchLabel: 'Research & Model Farms',
  researchUnit: 'Natural Farming model farm',
  budgetHeads: [
    'Grants-in-Aid Salaries',
    'Grants-in-Aid General – TA',
    'Grants-in-Aid General – Research & Operational',
    'Grants-in-Aid Capital – Equipment',
    'SCSP',
    'TSP',
  ],
  centreTypes: ['Network Centre', 'Voluntary Centre'],
  centres: [
    c('MDP', 'Modipuram', 'ICAR-Indian Institute of Farming Systems Research', 'Uttar Pradesh'),
    c('PNT', 'Pantnagar', 'GB Pant University of Agriculture & Technology', 'Uttarakhand'),
    c('LDH', 'Ludhiana', 'Punjab Agricultural University', 'Punjab'),
    c('PLP', 'Palampur', 'CSK Himachal Pradesh Krishi Vishvavidyalaya', 'Himachal Pradesh'),
    c('UDP', 'Udaipur', 'Maharana Pratap University of Agriculture & Technology', 'Rajasthan'),
    c('JND', 'Junagadh', 'Junagadh Agricultural University', 'Gujarat'),
    c('JBP', 'Jabalpur', 'Jawaharlal Nehru Krishi Vishwa Vidyalaya', 'Madhya Pradesh'),
    c('RPR', 'Raipur', 'Indira Gandhi Krishi Vishwavidyalaya', 'Chhattisgarh'),
    c('RNC', 'Ranchi', 'Birsa Agricultural University', 'Jharkhand'),
    c('DWD', 'Dharwad', 'University of Agricultural Sciences', 'Karnataka'),
    c('CBE', 'Coimbatore', 'Tamil Nadu Agricultural University', 'Tamil Nadu'),
    c('GTR', 'Guntur', 'Acharya NG Ranga Agricultural University', 'Andhra Pradesh', 'Voluntary Centre'),
    c('TSR', 'Thrissur', 'Kerala Agricultural University', 'Kerala', 'Voluntary Centre'),
    c('UMM', 'Umiam', 'ICAR Research Complex for NEH Region', 'Meghalaya'),
  ],
}
