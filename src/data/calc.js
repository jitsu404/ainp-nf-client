export const sum = (rows, key = 'amount') => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0)
export const pct = (a, b) => (b ? (a / b) * 100 : 0)
export const countBy = (rows, key) => rows.reduce((m, r) => ({ ...m, [r[key]]: (m[r[key]] || 0) + 1 }), {})

// Centre-wise financial position for one financial year.
export function finRows(db, fy, centres = db.centres) {
  return centres.map((c) => {
    const f = (r) => r.centreId === c.id && r.fy === fy
    const allocated = sum(db.allocations.filter(f))
    const released = sum(db.releases.filter(f))
    const received = sum(db.releases.filter((r) => f(r) && r.status === 'Received'))
    const spent = sum(db.expenditures.filter(f))
    return { id: c.id, centre: c, name: c.name, allocated, released, received, spent, balance: released - spent, util: pct(spent, released) }
  })
}

export function headRows(db, fy, centreIds, heads) {
  return heads.map((head) => {
    const f = (r) => centreIds.includes(r.centreId) && r.fy === fy && r.head === head
    const allocated = sum(db.allocations.filter(f))
    const spent = sum(db.expenditures.filter(f))
    return { id: head, head, allocated, spent, balance: allocated - spent, util: pct(spent, allocated) }
  })
}

export const PENDING = ['Submitted', 'Resubmitted', 'Scrutinised']
export const isOverdue = (due, done) => !done && due && due < new Date().toISOString().slice(0, 10)
