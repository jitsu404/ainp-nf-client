import { useState } from "react";
import { FileBarChart, ChevronRight } from "lucide-react";
import { useStore } from "../store";
import { Card, ExportBar, Modal, Page, Table, num } from "../components/ui";
import { finRows, headRows, sum } from "../data/calc";
import { researchReports } from "../programme/research";

export default function Reports() {
  const ctx = useStore();
  const { db, fy, centres, centreName, scope, programme, centre } = ctx;
  const [openId, setOpenId] = useState(null);
  const fin = finRows(db, fy, centres);
  const ids = centres.map((c) => c.id);
  const n = (key) => ({
    num: true,
    render: (r) => num(r[key]),
    text: (r) => Number(r[key]).toFixed(2),
  });

  const reports = [
    ...researchReports(ctx),
    {
      group: "Administrative",
      title: "Centre-wise administrative statement",
      desc: "Programmes, approvals and pending action for each centre",
      columns: [
        { label: "Centre", key: "name" },
        { label: "State", key: "state" },
        { label: "Type", key: "type" },
        { label: "Programmes", key: "programmes", num: true },
        { label: "Approvals pending", key: "pending", num: true },
        { label: "Letters not acknowledged", key: "unack", num: true },
      ],
      rows: centres.map((c) => ({
        ...c,
        programmes: db.programmes.filter(
          (p) => p.centreId === c.id && p.fy === fy,
        ).length,
        pending: db.approvals.filter(
          (a) => a.centreId === c.id && a.status === "Pending",
        ).length,
        unack: db.comms.filter(
          (m) =>
            (m.to === "all" || m.to.includes(c.id)) && !m.acks[c.id]?.ackOn,
        ).length,
      })),
    },
    {
      group: "Financial",
      title: "Sanction, release, expenditure and balance",
      desc: `Centre-wise financial statement for ${fy} (₹ lakh)`,
      columns: [
        { label: "Centre", key: "name" },
        { label: "Allocation", ...n("allocated") },
        { label: "Released", ...n("released") },
        { label: "Expenditure", ...n("spent") },
        { label: "Balance", ...n("balance") },
        { label: "Utilisation %", ...n("util") },
      ],
      rows: fin,
    },
    {
      group: "Financial",
      title: "Head-wise expenditure statement",
      desc: `Budget head-wise allocation, expenditure and balance for ${fy} (₹ lakh)`,
      columns: [
        { label: "Budget head", key: "head" },
        { label: "Allocation", ...n("allocated") },
        { label: "Expenditure", ...n("spent") },
        { label: "Balance", ...n("balance") },
        { label: "Utilisation %", ...n("util") },
      ],
      rows: headRows(db, fy, ids, programme.budgetHeads),
    },
    {
      group: "Financial",
      title: "Fund release register",
      desc: "Sanction and release orders with receipt status",
      columns: [
        { label: "Order number", key: "orderNo" },
        { label: "Centre", text: (r) => centreName(r.centreId) },
        { label: "Date", key: "date" },
        { label: "Amount", ...n("amount") },
        { label: "Receipt", key: "status" },
      ],
      rows: scope(db.releases).filter((r) => r.fy === fy),
    },
    {
      group: "AUC / SoE",
      title: "AUC / SoE status report",
      desc: "Submission, scrutiny and approval status of every certificate and statement",
      columns: [
        { label: "Reference", key: "ref" },
        { label: "Centre", text: (r) => centreName(r.centreId) },
        { label: "Year", key: "fy" },
        { label: "Amount", ...n("amount") },
        { label: "Status", key: "status" },
        { label: "Last action", text: (r) => r.history.at(-1)?.at },
      ],
      rows: scope(db.aucs),
    },
    {
      group: "Staff",
      title: "Staff position statement",
      desc: "Sanctioned, in-position and vacant posts by centre and designation",
      columns: [
        { label: "Centre", text: (r) => centreName(r.centreId) },
        { label: "Designation", key: "post" },
        { label: "Category", key: "category" },
        { label: "Sanctioned", key: "sanctioned", num: true },
        { label: "In position", key: "filled", num: true },
        { label: "Vacant", key: "vacant", num: true },
      ],
      rows: scope(db.positions).map((p) => {
        const filled = db.staff.filter(
          (s) =>
            s.centreId === p.centreId &&
            s.post === p.post &&
            s.status === "In Position",
        ).length;
        return { ...p, filled, vacant: p.sanctioned - filled };
      }),
    },
    {
      group: "Compliance",
      title: "Pending-compliance report",
      desc: "Open and overdue action points with responsibility and due date",
      columns: [
        { label: "Action point", key: "point" },
        { label: "Centre", text: (r) => centreName(r.centreId) },
        { label: "Responsible", key: "responsible" },
        { label: "Due", key: "due" },
        { label: "Status", key: "status" },
      ],
      rows: scope(db.actionPoints).filter(
        (a) =>
          a.status !== "Completed" && (!centre || a.centreId === centre.id),
      ),
    },
    {
      group: "Compliance",
      title: "Communication acknowledgement report",
      desc: "Circulars and letters with number of centres acknowledged",
      columns: [
        { label: "Reference", key: "refNo" },
        { label: "Subject", key: "subject" },
        { label: "Issued", key: "date" },
        {
          label: "Acknowledged",
          text: (r) =>
            `${Object.values(r.acks).filter((a) => a.ackOn).length} of ${r.to === "all" ? db.centres.length : r.to.length}`,
        },
      ],
      rows: db.comms,
    },
  ].map((r, i) => ({ ...r, id: `rep-${i}` }));
  const groups = [...new Set(reports.map((r) => r.group))];
  const open = reports.find((r) => r.id === openId);

  return (
    <Page title="Reports">
      <div className="stack">
        {groups.map((g) => (
          <Card key={g} title={`${g} reports`} pad={false}>
            <div className="list">
              {reports
                .filter((r) => r.group === g)
                .map((r) => (
                  <a
                    className="item"
                    key={r.id}
                    onClick={() => setOpenId(r.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <FileBarChart
                      size={18}
                      color="var(--brand)"
                      style={{ marginTop: 2 }}
                    />
                    <span className="grow">
                      <b>{r.title}</b>
                      <span className="muted small">{r.desc}</span>
                    </span>
                    <span className="muted small">{r.rows.length} rows</span>
                    <ChevronRight size={16} color="var(--muted)" />
                  </a>
                ))}
            </div>
          </Card>
        ))}
      </div>
      {open && (
        <Modal
          wide
          title={open.title}
          subtitle={`${programme.short} · ${centre ? centre.name : "All centres"} · ${fy} · ${open.desc}`}
          onClose={() => setOpenId(null)}
          footer={
            <ExportBar
              name={open.title.toLowerCase().replace(/[^a-z]+/g, "-")}
              columns={open.columns}
              rows={open.rows}
            />
          }
        >
          <div className="card">
            <Table
              pageSize={12}
              columns={open.columns}
              rows={open.rows.map((r, i) => ({ id: i, ...r }))}
            />
          </div>
        </Modal>
      )}
    </Page>
  );
}
