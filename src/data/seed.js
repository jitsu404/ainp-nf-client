import { programme } from '../programme/config'
import { researchSeed } from '../programme/seed'

// SAMPLE DATA for the first-draft demonstration. Every figure, name and reference number here is illustrative.

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hist = (...steps) => steps.map(([status, at, by, remark]) => ({ status, at, by, remark }))
const r2 = (n) => Math.round(n * 100) / 100
const SURNAMES = ['Sharma', 'Singh', 'Patel', 'Reddy', 'Das', 'Nair', 'Kumar', 'Yadav', 'Mishra', 'Gogoi', 'Pawar', 'Sahu', 'Iyer', 'Choudhary', 'Rao', 'Bora', 'Mahapatra', 'Gill', 'Meena', 'Joshi']
const INITIALS = ['A. K.', 'R. P.', 'S.', 'N. K.', 'P.', 'M. L.', 'V.', 'K. S.', 'D.', 'B. N.', 'G.', 'H. S.', 'J.', 'T. R.', 'U.']

export function buildSeed() {
  const rnd = rng(29)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const person = (prefix = '') => `${prefix}${pick(INITIALS)} ${pick(SURNAMES)}`
  const centres = programme.centres
  const [fyA, fyB, fyC] = programme.fys
  const PCU = programme.unit
  let n = 0
  const id = (p) => `${p}-${++n}`

  // ---- Users
  const users = [
    { id: id('u'), name: 'Dr. S. K. Rathore', email: 'pc@demo.example', roleId: 'pc', centreId: null, status: 'Active', lastLogin: '2026-11-12 17:40' },
    { id: id('u'), name: 'Anita Bhatia', email: 'finance@demo.example', roleId: 'finance', centreId: null, status: 'Active', lastLogin: '2026-11-12 11:05' },
    { id: id('u'), name: 'Manoj Tiwari', email: 'admin.officer@demo.example', roleId: 'adminOfficer', centreId: null, status: 'Active', lastLogin: '2026-11-11 16:22' },
    { id: id('u'), name: 'Dr. Meera Krishnan', email: 'reviewer1@demo.example', roleId: 'reviewer', centreId: null, status: 'Active', lastLogin: '2026-11-10 10:48' },
    { id: id('u'), name: 'Rohit Verma', email: 'sysadmin@demo.example', roleId: 'admin', centreId: null, status: 'Active', lastLogin: '2026-11-13 09:02' },
  ]
  centres.forEach((c, i) => {
    users.push({ id: id('u'), name: person('Dr. '), email: `pi.${c.code.toLowerCase()}@demo.example`, roleId: 'pi', centreId: c.id, status: 'Active', lastLogin: `2026-11-${String(1 + (i % 12)).padStart(2, '0')} 1${i % 8}:1${i % 6}` })
    users.push({ id: id('u'), name: person(), email: `deo.${c.code.toLowerCase()}@demo.example`, roleId: 'dataEntry', centreId: c.id, status: i % 9 === 8 ? 'Inactive' : 'Active', lastLogin: `2026-11-${String(2 + (i % 10)).padStart(2, '0')} 0${9 - (i % 3)}:3${i % 6}` })
  })
  const piOf = (cid) => users.find((u) => u.roleId === 'pi' && u.centreId === cid).name

  // ---- Finance
  const base = [38, 1.5, 9, 3, 2, 1.5]
  const allocations = [], releases = [], expenditures = []
  centres.forEach((c, ci) => {
    const f = (0.78 + rnd() * 0.45) * programme.budgetScale * (c.type === 'Network Centre' ? 1 : 0.6)
    programme.fys.forEach((fy, yi) => {
      let total = 0
      programme.budgetHeads.forEach((head, hi) => {
        const allocated = r2(base[hi] * f * (1 + yi * 0.06))
        total += allocated
        allocations.push({ id: id('al'), centreId: c.id, fy, head, amount: allocated })
        const past = yi < 2
        const share = past ? 0.9 + rnd() * 0.1 : 0.34 + rnd() * 0.14
        const quarters = past ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['Q1', 'Q2']
        quarters.forEach((q) => expenditures.push({
          id: id('ex'), centreId: c.id, fy, head, quarter: q, amount: r2((allocated * share) / quarters.length),
          voucher: `SOE/${c.code}/${fy}/${q}`, enteredBy: 'Data Entry Staff',
          date: `${Number(fy.slice(0, 4)) + (q === 'Q4' ? 1 : 0)}-${{ Q1: '06', Q2: '09', Q3: '12', Q4: '03' }[q]}-28`,
        }))
      })
      const y0 = 2000 + Number(fy.slice(2, 4))
      const mk = (inst, part, date, status) => releases.push({
        id: id('rl'), centreId: c.id, fy, instalment: inst, amount: r2(total * part),
        orderNo: `F.No. ${programme.fileNo}/Release/${fy}/${String(ci * 2 + inst).padStart(3, '0')}`,
        date, status, receivedOn: status === 'Received' ? date.replace(/-(\d\d)$/, (_, d) => `-${String(Math.min(28, +d + 6)).padStart(2, '0')}`) : null,
      })
      if (yi < 2) {
        mk(1, 0.5, `${y0}-05-14`, 'Received')
        mk(2, 0.5, `${y0}-10-09`, 'Received')
      } else {
        mk(1, 0.5, `${y0}-05-20`, 'Received')
        if (ci % 4 !== 3) mk(2, 0.25, `${y0}-10-27`, ci % 3 === 0 ? 'Released' : 'Received')
      }
    })
  })

  const reapprops = [
    { centreId: centres[1].id, type: 'Re-appropriation', fromHead: programme.budgetHeads[1], toHead: programme.budgetHeads[2], amount: 0.6, reason: 'Higher cost of soil and plant analysis during kharif.', status: 'Submitted', date: '2026-10-30' },
    { centreId: centres[4].id, type: 'Additional requirement', fromHead: '—', toHead: programme.budgetHeads[0], amount: 2.4, reason: 'Arrears of pay revision for one technical post.', status: 'Approved', date: '2026-09-12' },
    { centreId: centres[7].id, type: 'Re-appropriation', fromHead: programme.budgetHeads[3], toHead: programme.budgetHeads[2], amount: 0.9, reason: 'Equipment purchase deferred to next year.', status: 'Returned', date: '2026-10-05' },
    { centreId: centres[10].id, type: 'Additional requirement', fromHead: '—', toHead: programme.budgetHeads[2], amount: 1.1, reason: 'Additional on-farm trials approved in the group meeting.', status: 'Submitted', date: '2026-11-04' },
  ].map((r) => ({ id: id('ra'), fy: fyC, ...r }))

  // ---- AUC / SoE
  const aucStatuses = ['Approved', 'Approved', 'Scrutinised', 'Submitted', 'Returned', 'Resubmitted', 'Approved', null]
  const soeStatuses = ['Submitted', 'Approved', 'Draft', 'Scrutinised', null, 'Submitted', 'Returned', 'Approved']
  const flow = (status, c, y) => {
    const pi = piOf(c.id)
    const h = [['Draft', `${y}-04-18 11:20`, 'Data Entry Staff', 'Uploaded']]
    if (status === 'Draft') return hist(...h)
    h.push(['Submitted', `${y}-04-29 15:05`, pi, 'Submitted with countersignature of Comptroller'])
    if (status === 'Submitted') return hist(...h)
    if (['Returned', 'Resubmitted'].includes(status)) {
      h.push(['Returned', `${y}-05-12 12:30`, 'Anita Bhatia', 'Unspent balance does not tally with the release order; interest earned not reported.'])
      if (status === 'Resubmitted') h.push(['Resubmitted', `${y}-05-21 10:10`, pi, 'Corrected figures and interest statement attached'])
      return hist(...h)
    }
    h.push(['Scrutinised', `${y}-05-10 16:45`, 'Anita Bhatia', 'Figures tally with releases'])
    if (status === 'Approved') h.push(['Approved', `${y}-05-19 13:00`, 'Dr. S. K. Rathore', 'Accepted and locked'])
    return hist(...h)
  }
  const aucs = []
  const totalRel = (cid, fy) => r2(releases.filter((r) => r.centreId === cid && r.fy === fy).reduce((a, r) => a + r.amount, 0))
  centres.forEach((c, i) => {
    aucs.push({ id: id('auc'), ref: `AUC/${c.code}/${fyA}`, type: 'AUC', centreId: c.id, fy: fyA, period: 'Annual', amount: totalRel(c.id, fyA), file: `AUC_${c.code}_${fyA}.pdf`, status: 'Approved', history: flow('Approved', c, 2025) })
    const s = aucStatuses[i % aucStatuses.length]
    if (s) aucs.push({ id: id('auc'), ref: `AUC/${c.code}/${fyB}`, type: 'AUC', centreId: c.id, fy: fyB, period: 'Annual', amount: totalRel(c.id, fyB), file: `AUC_${c.code}_${fyB}.pdf`, status: s, history: flow(s, c, 2026) })
    const t = soeStatuses[i % soeStatuses.length]
    if (t) aucs.push({ id: id('auc'), ref: `SoE/${c.code}/${fyC}/H1`, type: 'SoE', centreId: c.id, fy: fyC, period: 'April–September', amount: r2(expenditures.filter((e) => e.centreId === c.id && e.fy === fyC).reduce((a, e) => a + e.amount, 0)), file: `SoE_${c.code}_${fyC}_H1.xlsx`, status: t, history: flow(t, c, 2026).map((h) => ({ ...h, at: h.at.replace('-04-', '-10-').replace('-05-', '-11-') })) })
  })

  // ---- Staff
  const posts = [
    ['Principal Investigator', 'Scientific', 1], ['Co-Principal Investigator', 'Scientific', 1], ['Technical Assistant', 'Technical', 2],
    ['Field Assistant', 'Supporting', 2], ['Senior Research Fellow', 'Contractual', 1], ['Young Professional-II', 'Contractual', 1],
  ]
  const positions = [], staff = []
  centres.forEach((c, ci) => posts.forEach(([post, category, sanctioned]) => {
    const count = c.type === 'Network Centre' ? sanctioned : Math.max(1, sanctioned - 1)
    positions.push({ id: id('pos'), centreId: c.id, post, category, sanctioned: count })
    for (let k = 0; k < count; k++) {
      if (rnd() < 0.2) continue
      const contractual = category === 'Contractual'
      staff.push({
        id: id('st'), centreId: c.id, name: person(category === 'Scientific' ? 'Dr. ' : ''), post, category,
        joined: `${2015 + Math.floor(rnd() * 10)}-0${1 + Math.floor(rnd() * 9)}-1${Math.floor(rnd() * 9)}`,
        tenureEnd: contractual ? `2027-0${1 + Math.floor(rnd() * 8)}-30` : null,
        funding: ci % 5 === 0 ? 'ICAR 100%' : 'ICAR 75 : State 25', status: 'In Position',
        orderRef: `Estt/${c.code}/${2015 + Math.floor(rnd() * 10)}/${10 + Math.floor(rnd() * 80)}`,
      })
    }
  }))
  staff.push({ id: id('st'), centreId: centres[2].id, name: person(), post: 'Senior Research Fellow', category: 'Contractual', joined: '2023-08-01', tenureEnd: '2026-07-31', funding: 'ICAR 100%', status: 'Relieved', relievedOn: '2026-07-31', orderRef: `Estt/${centres[2].code}/2026/44` })
  staff.push({ id: id('st'), centreId: centres[5].id, name: person(), post: 'Technical Assistant', category: 'Technical', joined: '2012-03-12', tenureEnd: null, funding: 'ICAR 75 : State 25', status: 'Relieved', relievedOn: '2026-06-30', orderRef: `Estt/${centres[5].code}/2026/19` })

  // ---- Communication
  const ackFor = (rate, replies) => Object.fromEntries(centres.map((c, i) => {
    const x = (i * 7 + rate * 13) % 10
    if (x >= rate * 10) return [c.id, x % 2 ? { readOn: '2026-11-08' } : null]
    return [c.id, { readOn: '2026-11-03', ackOn: '2026-11-04', reply: replies && i % 3 === 0 ? 'Noted. Required information is attached.' : null, attachment: replies && i % 3 === 0 ? `Reply_${c.code}.pdf` : null }]
  }).filter(([, v]) => v))
  const comms = [
    { type: 'Circular', subject: `Submission of Statement of Expenditure for the first half of ${fyC}`, date: '2026-10-05', due: '2026-11-15', body: 'All centres are requested to upload the SoE for April–September duly signed by the Comptroller / Finance Officer of the host institution.', attachment: 'Circular_SoE_H1.pdf', acks: ackFor(0.6, true) },
    { type: 'Meeting Notice', subject: 'Annual Group Meeting 2026 – schedule and presentation format', date: '2026-10-20', due: '2026-11-25', body: 'The Annual Group Meeting will be held on 9–11 December 2026. Centres shall upload presentations in the enclosed format.', attachment: 'AGM_2026_Notice.pdf', acks: ackFor(0.8, false) },
    { type: 'Reminder', subject: `Pending Annual Utilization Certificates for ${fyB}`, date: '2026-11-02', due: '2026-11-12', body: 'Centres whose AUC is pending or returned are requested to submit the corrected certificate at the earliest so that the next instalment can be released.', attachment: null, acks: ackFor(0.4, true), to: centres.filter((_, i) => [3, 4, 5, 7].includes(i % 8)).map((c) => c.id) },
    { type: 'Guideline', subject: 'Revised data-entry formats and validation rules for research observations', date: '2026-09-16', due: null, body: 'Revised formats approved by the Coordinating Unit are enclosed. Data for the current year shall be entered in the revised formats only.', attachment: 'Revised_formats_v2.pdf', acks: ackFor(0.9, false) },
    { type: 'Letter', subject: 'Engagement of contractual staff – continuation beyond 31 March 2027', date: '2026-10-28', due: '2026-11-20', body: 'Proposals for continuation of contractual project staff may be submitted with justification and performance report.', attachment: 'Letter_staff_continuation.pdf', acks: ackFor(0.5, true) },
    { type: 'Circular', subject: `Release of second instalment of grants for ${fyC}`, date: '2026-10-27', due: null, body: 'Second instalment has been released to centres whose AUC for the previous year has been accepted. Receipt may be confirmed on the portal.', attachment: 'Release_order_2nd_instalment.pdf', acks: ackFor(0.7, false) },
  ].map((m, i) => ({ id: id('cm'), refNo: `${programme.fileNo}/Comm/${fyC}/${String(i + 1).padStart(3, '0')}`, issuedBy: i % 2 ? 'Manoj Tiwari' : 'Dr. S. K. Rathore', to: 'all', emailAlert: true, ...m }))

  // ---- Meetings & action points
  const meetings = [
    { title: 'Annual Group Meeting 2026', type: 'Annual Group Meeting', date: '2026-12-09', mode: 'In person', venue: 'ICAR-IIFSR, Modipuram', status: 'Scheduled', agenda: ['Review of technical programme', 'Centre-wise presentation of results', 'Finalisation of next year programme', 'Financial and AUC position'], proceedings: null },
    { title: 'Mid-term financial review', type: 'Review Meeting', date: '2026-10-14', mode: 'Online', venue: 'Video conference', status: 'Held', agenda: ['Expenditure position up to September', 'Pending AUC / SoE', 'Second instalment release'], proceedings: 'Proceedings_Financial_Review_Oct2026.pdf' },
    { title: 'Zonal monitoring meeting – Eastern zone', type: 'Monitoring Meeting', date: '2026-08-22', mode: 'Hybrid', venue: 'Bhubaneswar', status: 'Held', agenda: ['Field visit observations', 'Data submission status', 'Staff position'], proceedings: 'Proceedings_Eastern_Zone_Aug2026.pdf' },
    { title: 'Annual Group Meeting 2025', type: 'Annual Group Meeting', date: '2025-12-11', mode: 'In person', venue: 'ICAR-IIFSR, Modipuram', status: 'Held', agenda: ['Review of results', 'Technical programme 2026-27'], proceedings: 'Proceedings_AGM_2025.pdf' },
  ].map((m) => ({ id: id('mt'), ...m }))
  const ap = (m, point, ci, due, status, remark = '') => ({ id: id('ap'), meetingId: meetings[m].id, point, centreId: ci == null ? null : centres[ci].id, responsible: ci == null ? PCU : piOf(centres[ci].id), due, status, remark })
  const actionPoints = [
    ap(1, `Submit corrected AUC for ${fyB} with interest statement`, 4, '2026-11-10', 'Overdue'),
    ap(1, 'Reconcile unspent balance with host institution accounts', 7, '2026-11-20', 'In Progress', 'Reconciliation statement under preparation'),
    ap(1, 'Release second instalment after acceptance of AUC', null, '2026-11-05', 'Completed', 'Released on 27 Oct 2026'),
    ap(1, 'Upload SoE for first half year', 2, '2026-11-15', 'Open'),
    ap(2, 'Complete entry of kharif soil and biological parameters', 6, '2026-11-30', 'In Progress', '70% entered'),
    ap(2, 'Fill vacant Technical Assistant post', 5, '2026-12-31', 'Open'),
    ap(2, 'Share field-visit report with all eastern zone centres', null, '2026-09-15', 'Completed'),
    ap(3, 'Adopt revised observation formats from kharif 2026', 0, '2026-06-30', 'Completed'),
    ap(3, 'Submit proposal for replacement of soil testing equipment', 9, '2026-10-31', 'Overdue'),
    ap(3, 'Document bio-input preparation protocol followed at the model farm', 12, '2026-11-28', 'Open'),
  ]

  // ---- Administration
  const programmes = centres.flatMap((c, i) => [
    { id: id('tp'), centreId: c.id, fy: fyC, code: `TP/${c.code}/01`, title: 'Evaluation of natural farming practices in the predominant cropping system', activities: 6, completed: 2 + (i % 4), status: 'Ongoing', approvedOn: '2026-01-22' },
    { id: id('tp'), centreId: c.id, fy: fyC, code: `TP/${c.code}/02`, title: 'Natural farming model farm – long-term monitoring of soil health', activities: 5, completed: 1 + (i % 3), status: i % 6 === 5 ? 'Proposed' : 'Ongoing', approvedOn: i % 6 === 5 ? null : '2026-01-22' },
  ])
  const approvals = [
    ['Administrative Approval', 'Purchase of plant-canopy analyser', 0, 4.2, 'Approved', 'Sanction issued; purchase through GeM in progress'],
    ['Financial Sanction', 'Engagement of one Young Professional-II for 11 months', 3, 4.6, 'Pending', ''],
    ['Tour Approval', 'Participation of PI in Annual Group Meeting', 6, 0.35, 'Approved', 'Tour completed'],
    ['Administrative Approval', 'Repair of farm pond and fencing', 8, 1.8, 'Returned', 'Estimate from host institution engineer to be attached'],
    ['Financial Sanction', 'Soil and plant sample analysis at referral laboratory', 10, 0.9, 'Pending', ''],
    ['Administrative Approval', 'Organising farmers–scientists interface meeting', 12, 0.5, 'Approved', 'Programme conducted on 18 Oct 2026'],
    ['Tour Approval', 'Monitoring visit of Coordinating Unit team', null, 0.8, 'Approved', 'Visit scheduled in December'],
  ].map(([type, subject, ci, amount, status, action], i) => ({ id: id('ap'), refNo: `${programme.fileNo}/Admn/${fyC}/${String(i + 11).padStart(3, '0')}`, type, subject, centreId: ci == null ? null : centres[ci].id, amount, status, actionTaken: action, date: `2026-${String(6 + (i % 5)).padStart(2, '0')}-${String(4 + i * 3).padStart(2, '0')}`, fy: fyC }))
  const orders = [
    ['Office Order', 'Constitution of committee for scrutiny of AUC / SoE', '2026-04-08'],
    ['Proceedings', 'Proceedings of the Annual Group Meeting 2025', '2026-01-10'],
    ['Office Order', 'Nomination of zonal reviewers for research data validation', '2026-05-02'],
    ['Sanction Order', `Administrative and financial sanction of the technical programme ${fyC}`, '2026-01-22'],
    ['Proceedings', 'Proceedings of mid-term financial review', '2026-10-21'],
    ['Office Order', 'Timeline for submission of annual progress report', '2026-09-30'],
  ].map(([type, subject, date], i) => ({ id: id('oo'), no: `${programme.fileNo}/OO/${date.slice(0, 4)}/${String(i + 3).padStart(2, '0')}`, type, subject, date, file: `${type.replace(' ', '_')}_${i + 1}.pdf` }))

  // ---- Documents
  const doc = (title, category, fy, centreId, file, by, date, access = 'All centres') => ({ id: id('dc'), title, category, fy, centreId, file, size: `${(0.2 + rnd() * 2.6).toFixed(1)} MB`, uploadedBy: by, date, access })
  const documents = [
    doc(`Approved technical programme ${fyC}`, 'Technical Programme', fyC, null, 'Technical_Programme.pdf', 'Dr. S. K. Rathore', '2026-01-22'),
    doc('Operational guidelines of the scheme', 'Guidelines', fyB, null, 'Operational_Guidelines.pdf', 'Manoj Tiwari', '2025-06-14'),
    doc('Format for AUC (GFR 12-A)', 'Guidelines', fyB, null, 'GFR_12A_Format.docx', 'Anita Bhatia', '2025-04-02'),
    doc(`Annual report ${fyB}`, 'Reports', fyB, null, `Annual_Report_${fyB}.pdf`, 'Dr. S. K. Rathore', '2026-07-30'),
    ...orders.map((o) => doc(o.subject, o.type === 'Proceedings' ? 'Proceedings' : 'Sanctions & Orders', fyC, null, o.file, 'Manoj Tiwari', o.date, o.type === 'Office Order' ? 'Coordinating Unit only' : 'All centres')),
    ...releases.filter((r) => r.fy === fyC).slice(0, 10).map((r) => doc(`Fund release order – instalment ${r.instalment}`, 'Fund Release Letters', fyC, r.centreId, `Release_${r.centreId}_${r.instalment}.pdf`, 'Anita Bhatia', r.date, 'Centre + Coordinating Unit')),
    ...aucs.filter((a) => a.status !== 'Draft').slice(0, 14).map((a) => doc(`${a.type} ${a.fy} ${a.period}`, 'AUC / SoE', a.fy, a.centreId, a.file, piOf(a.centreId), a.history[1]?.at.slice(0, 10) || '2026-04-29', 'Centre + Coordinating Unit')),
    ...staff.filter((s) => s.status === 'Relieved').map((s) => doc(`Relieving order – ${s.post}`, 'Staff Orders', fyC, s.centreId, `Relieving_${s.centreId}.pdf`, 'Manoj Tiwari', s.relievedOn, 'Centre + Coordinating Unit')),
  ]

  // ---- Audit trail
  const audit = [
    ['2026-11-13 09:02', 'Rohit Verma', 'Administrator', 'Signed in', 'auth'],
    ['2026-11-12 17:44', 'Dr. S. K. Rathore', 'Project Coordinator', `Approved: AUC/${centres[0].code}/${fyB}`, 'aucs'],
    ['2026-11-12 11:20', 'Anita Bhatia', 'Finance Officer', `Returned: AUC/${centres[4].code}/${fyB}`, 'aucs'],
    ['2026-11-12 10:02', piOf(centres[3].id), 'Nodal Officer / PI', `Submitted: AUC/${centres[3].code}/${fyB}`, 'aucs'],
    ['2026-11-11 16:30', 'Manoj Tiwari', 'Administrative Officer', 'Issued reminder to 8 centres', 'comms'],
    ['2026-11-11 12:15', 'Data Entry Staff', 'Data Entry Staff', 'Entered expenditure for Q2', 'expenditures'],
    ['2026-11-10 10:50', 'Dr. Meera Krishnan', 'Reviewer', 'Forwarded research observation for approval', 'observations'],
    ['2026-11-09 23:00', 'System', 'System', 'Scheduled database backup completed', 'system'],
    ['2026-11-08 14:12', 'Rohit Verma', 'Administrator', 'Reset password for a centre user', 'users'],
    ['2026-11-07 09:40', 'Anita Bhatia', 'Finance Officer', 'Recorded release order – 2nd instalment', 'releases'],
  ].map(([at, user, role, action, module], i) => ({ id: id('au'), at, user, role, action, module, ip: `10.24.6.${21 + i}` }))

  return {
    centres, users, allocations, releases, expenditures, reapprops, aucs, positions, staff, comms, meetings,
    actionPoints, programmes, approvals, orders, documents, audit,
    ...researchSeed({ centres, rnd, pick, piOf, id, hist, fys: programme.fys }),
  }
}
