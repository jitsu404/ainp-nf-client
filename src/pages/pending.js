import { useStore } from '../store'
import { isOverdue } from '../data/calc'

// "My pending actions" for the signed-in role, used by the dashboard, the bell and the sidebar counts.
export function usePending() {
  const { db, can, scope, centre, centreName } = useStore()
  const out = []
  const push = (module, path, title, detail, tone = 'amber') => out.push({ id: `${module}-${out.length}`, module, path, title, detail, tone })
  const where = (r) => centreName(r.centreId)

  scope(db.observations).forEach((o) => {
    if (can('research.submit') && o.status === 'Draft') push('research', '/research', `Submit research data ${o.ref}`, 'Draft awaiting submission', 'grey')
    if ((can('research.submit') || can('research.enter')) && o.status === 'Returned') push('research', '/research', `Correct and re-submit ${o.ref}`, 'Returned with observations', 'red')
    if (can('research.review') && ['Submitted', 'Resubmitted'].includes(o.status)) push('research', '/research', `Validate ${o.ref}`, `${where(o)} · ${o.status}`, 'blue')
    if (can('research.approve') && o.status === 'Scrutinised') push('research', '/research', `Approve ${o.ref}`, `${where(o)} · validated by reviewer`)
  })
  scope(db.aucs).forEach((a) => {
    if (can('aucsoe.submit') && a.status === 'Draft') push('aucsoe', '/auc-soe', `Submit ${a.ref}`, 'Uploaded, not yet submitted', 'grey')
    if ((can('aucsoe.submit') || can('aucsoe.enter')) && a.status === 'Returned') push('aucsoe', '/auc-soe', `Correct and re-submit ${a.ref}`, 'Returned with deficiencies', 'red')
    if (can('aucsoe.review') && ['Submitted', 'Resubmitted'].includes(a.status)) push('aucsoe', '/auc-soe', `Scrutinise ${a.ref}`, `${where(a)} · ${a.status}`, 'blue')
    if (can('aucsoe.approve') && a.status === 'Scrutinised') push('aucsoe', '/auc-soe', `Approve ${a.ref}`, `${where(a)} · scrutiny complete`)
  })
  if (can('comm.ack') && centre) {
    db.comms.filter((m) => (m.to === 'all' || m.to.includes(centre.id)) && !m.acks[centre.id]?.ackOn)
      .forEach((m) => push('communication', '/communication', `Acknowledge: ${m.subject}`, m.due ? `Reply due ${m.due}` : m.type, isOverdue(m.due) ? 'red' : 'amber'))
  }
  if (can('finance.receipt')) scope(db.releases).filter((r) => r.status === 'Released').forEach((r) => push('finance', '/finance', `Confirm receipt of instalment ${r.instalment}`, r.orderNo, 'blue'))
  if (can('finance.manage')) db.reapprops.filter((r) => r.status === 'Submitted').forEach((r) => push('finance', '/finance', `${r.type} request – ${where(r)}`, `₹${r.amount} L`))
  if (can('admin.approve')) db.approvals.filter((a) => a.status === 'Pending').forEach((a) => push('administration', '/administration', a.subject, `${a.type} · ${where(a)}`))
  if (can('meetings.update') || can('meetings.manage')) {
    scope(db.actionPoints).filter((a) => a.status !== 'Completed' && (centre ? a.centreId === centre.id : a.status === 'Overdue'))
      .forEach((a) => push('meetings', '/meetings', a.point, `${where(a)} · due ${a.due}`, a.status === 'Overdue' ? 'red' : 'amber'))
  }
  return out
}
