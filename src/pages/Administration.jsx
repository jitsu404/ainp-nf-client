import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore, today } from "../store";
import {
  Badge,
  Card,
  FileLink,
  FormModal,
  KV,
  Page,
  Progress,
  Select,
  Table,
  Tabs,
  useSearch,
  lakh,
  fmtDate,
} from "../components/ui";
import { finRows, sum, pct, isOverdue } from "../data/calc";

export default function Administration() {
  const {
    db,
    fy,
    centre,
    centres,
    centreName,
    can,
    add,
    update,
    scope,
    programme,
    user,
  } = useStore();
  const [tab, setTab] = useState("profile");
  const [pick, setPick] = useState(centre?.id || db.centres[0].id);
  const [form, setForm] = useState(null);
  const c = db.centres.find((x) => x.id === pick);
  const fin = finRows(db, fy, [c])[0];
  const progs = scope(db.programmes).filter((p) => p.fy === fy);
  const [progRows, progSearch] = useSearch(
    progs,
    "Search technical programme…",
  );
  const approvals = scope(db.approvals);
  const pi = db.users.find((u) => u.roleId === "pi" && u.centreId === c.id);

  const compliance = centres.map((x) => {
    const comm = db.comms.filter(
      (m) => (m.to === "all" || m.to.includes(x.id)) && !m.acks[x.id]?.ackOn,
    ).length;
    const auc = db.aucs.filter(
      (a) => a.centreId === x.id && a.status !== "Approved",
    ).length;
    const pts = db.actionPoints.filter(
      (a) => a.centreId === x.id && a.status !== "Completed",
    ).length;
    const data = db.observations.filter(
      (o) => o.centreId === x.id && ["Draft", "Returned"].includes(o.status),
    ).length;
    const total = comm + auc + pts + data;
    return {
      id: x.id,
      name: x.name,
      comm,
      auc,
      pts,
      data,
      total,
      score: Math.max(0, 100 - total * 12),
    };
  });
  const deadlines = [
    ...db.comms
      .filter(
        (m) => m.due && (!centre || m.to === "all" || m.to.includes(centre.id)),
      )
      .map((m) => ({
        id: m.id,
        item: m.subject,
        kind: m.type,
        due: m.due,
        who: centre
          ? centre.name
          : m.to === "all"
            ? "All centres"
            : `${m.to.length} centres`,
      })),
    ...scope(db.actionPoints)
      .filter((a) => a.status !== "Completed")
      .map((a) => ({
        id: a.id,
        item: a.point,
        kind: "Action point",
        due: a.due,
        who: centreName(a.centreId),
      })),
  ].sort((a, b) => a.due.localeCompare(b.due));

  const cell = (n) =>
    n ? <Badge tone="amber">{n}</Badge> : <Badge tone="green">0</Badge>;

  return (
    <Page title="Administrative Management">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["profile", "Centre profile"],
          ["programme", "Technical programme", progs.length],
          ["approvals", "Approvals & sanctions", approvals.length],
          ["orders", "Proceedings & office orders", db.orders.length],
          ["tracker", "Action taken / status"],
          ["compliance", "Deadline & compliance dashboard"],
        ]}
      />

      {tab === "profile" && (
        <div className="stack">
          {!centre && (
            <div>
              <Select
                value={pick}
                onChange={setPick}
                options={db.centres.map((x) => [x.id, x.name])}
              />
            </div>
          )}
          <Card
            title={`${c.name} centre`}
            actions={<Badge tone="blue">{c.type}</Badge>}
          >
            <KV
              items={[
                ["Host institution", c.host],
                ["State", c.state],
                ["Centre code", c.code],
                ["Nodal Officer / PI", pi?.name],
                ["E-mail", pi?.email],
                ["Scheme", programme.short],
                [`Allocation ${fy}`, lakh(fin.allocated)],
                ["Funds released", lakh(fin.released)],
                ["Expenditure", `${lakh(fin.spent)} (${fin.util.toFixed(0)}%)`],
                [
                  "Staff in position",
                  `${db.staff.filter((s) => s.centreId === c.id && s.status === "In Position").length} of ${sum(
                    db.positions.filter((p) => p.centreId === c.id),
                    "sanctioned",
                  )} sanctioned`,
                ],
                [
                  "Approved programmes",
                  db.programmes.filter(
                    (p) => p.centreId === c.id && p.fy === fy,
                  ).length,
                ],
                [
                  "Research units",
                  db.models.filter((m) => m.centreId === c.id).length +
                    db.experiments.filter((e) => e.centreId === c.id).length,
                ],
              ]}
            />
          </Card>
          <Card title="Approved technical programme and activities" pad={false}>
            <Table
              columns={[
                { label: "Code", key: "code" },
                { label: "Programme", key: "title" },
                {
                  label: "Activities completed",
                  render: (r) => (
                    <Progress value={pct(r.completed, r.activities)} />
                  ),
                },
                { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
              ]}
              rows={db.programmes.filter(
                (p) => p.centreId === c.id && p.fy === fy,
              )}
            />
          </Card>
        </div>
      )}

      {tab === "programme" && (
        <Card pad={false}>
          <div className="toolbar">
            {progSearch}
            <span className="grow" />
            {can("admin.manage") && (
              <button className="btn sm" onClick={() => setForm("programme")}>
                <Plus size={14} /> Add programme
              </button>
            )}
          </div>
          <Table
            columns={[
              { label: "Code", key: "code" },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Approved programme", key: "title" },
              {
                label: "Activities",
                render: (r) => `${r.completed} of ${r.activities}`,
              },
              {
                label: "Progress",
                render: (r) => (
                  <Progress value={pct(r.completed, r.activities)} />
                ),
              },
              { label: "Approved on", render: (r) => fmtDate(r.approvedOn) },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
            ]}
            rows={progRows}
          />
        </Card>
      )}

      {tab === "approvals" && (
        <Card
          pad={false}
          title="Administrative approvals and financial sanctions"
          actions={
            (can("admin.request") || can("admin.manage")) && (
              <button className="btn sm" onClick={() => setForm("approval")}>
                <Plus size={14} />{" "}
                {centre ? "Request approval" : "Record approval"}
              </button>
            )
          }
        >
          <Table
            columns={[
              { label: "Reference", key: "refNo" },
              { label: "Type", key: "type" },
              { label: "Subject", key: "subject" },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Date", render: (r) => fmtDate(r.date) },
              { label: "Amount", num: true, render: (r) => lakh(r.amount) },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
              {
                label: "",
                render: (r) =>
                  can("admin.approve") &&
                  r.status === "Pending" && (
                    <span
                      className="row"
                      style={{ flexWrap: "nowrap", gap: 6 }}
                    >
                      <button
                        className="btn sm"
                        onClick={() =>
                          update(
                            "approvals",
                            r.id,
                            {
                              status: "Approved",
                              actionTaken: "Sanction issued",
                            },
                            "Approval accorded",
                          )
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="btn sm danger"
                        onClick={() =>
                          update(
                            "approvals",
                            r.id,
                            {
                              status: "Returned",
                              actionTaken: "Returned for clarification",
                            },
                            "Returned to centre",
                          )
                        }
                      >
                        Return
                      </button>
                    </span>
                  ),
              },
            ]}
            rows={approvals}
          />
        </Card>
      )}

      {tab === "orders" && (
        <Card
          pad={false}
          title="Proceedings, office orders and project documents"
          actions={
            can("admin.manage") && (
              <button className="btn sm" onClick={() => setForm("order")}>
                <Plus size={14} /> Upload order
              </button>
            )
          }
        >
          <Table
            columns={[
              { label: "Number", key: "no" },
              {
                label: "Type",
                render: (r) => <Badge tone="blue">{r.type}</Badge>,
              },
              { label: "Subject", key: "subject" },
              { label: "Date", render: (r) => fmtDate(r.date) },
              { label: "Document", render: (r) => <FileLink name={r.file} /> },
            ]}
            rows={db.orders}
          />
        </Card>
      )}

      {tab === "tracker" && (
        <Card pad={false} title="Action taken and status tracking">
          <Table
            columns={[
              { label: "Reference", key: "refNo" },
              { label: "Subject", key: "subject" },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
              {
                label: "Action taken",
                render: (r) =>
                  r.actionTaken || (
                    <span className="muted">Awaiting action</span>
                  ),
              },
            ]}
            rows={approvals}
          />
        </Card>
      )}

      {tab === "compliance" && (
        <div className="grid g2">
          <Card pad={false} title="Pending items by centre">
            <Table
              pageSize={10}
              columns={[
                { label: "Centre", key: "name" },
                { label: "Letters", render: (r) => cell(r.comm) },
                { label: "AUC / SoE", render: (r) => cell(r.auc) },
                { label: "Action points", render: (r) => cell(r.pts) },
                { label: "Research data", render: (r) => cell(r.data) },
                {
                  label: "Compliance",
                  render: (r) => <Progress value={r.score} />,
                },
              ]}
              rows={[...compliance].sort((a, b) => a.score - b.score)}
            />
          </Card>
          <Card pad={false} title="Upcoming and overdue deadlines">
            <Table
              pageSize={10}
              columns={[
                { label: "Item", key: "item" },
                { label: "Type", key: "kind" },
                { label: "For", key: "who" },
                {
                  label: "Due",
                  render: (r) =>
                    isOverdue(r.due) ? (
                      <Badge tone="red">{fmtDate(r.due)}</Badge>
                    ) : (
                      fmtDate(r.due)
                    ),
                },
              ]}
              rows={deadlines}
            />
          </Card>
        </div>
      )}

      {form === "programme" && (
        <FormModal
          title="Add approved programme"
          onClose={() => setForm(null)}
          fields={[
            {
              name: "centreId",
              label: "Centre",
              type: "select",
              options: db.centres.map((x) => [x.id, x.name]),
            },
            { name: "code", label: "Programme code" },
            { name: "title", label: "Title", full: true },
            {
              name: "activities",
              label: "Number of activities",
              type: "number",
            },
            { name: "approvedOn", label: "Approved on", type: "date" },
          ]}
          onSubmit={(v) =>
            add(
              "programmes",
              { ...v, fy, completed: 0, status: "Ongoing" },
              "Programme added",
            )
          }
        />
      )}
      {form === "approval" && (
        <FormModal
          title={
            centre
              ? "Request approval / sanction"
              : "Record approval / sanction"
          }
          onClose={() => setForm(null)}
          submitLabel={centre ? "Submit request" : "Save"}
          fields={[
            {
              name: "type",
              label: "Type",
              type: "select",
              options: [
                "Administrative Approval",
                "Financial Sanction",
                "Tour Approval",
              ],
            },
            { name: "amount", label: "Amount (₹ lakh)", type: "number" },
            { name: "subject", label: "Subject", full: true },
            {
              name: "justification",
              label: "Justification",
              type: "textarea",
              required: false,
            },
            { name: "file", label: "Supporting document", type: "file" },
          ]}
          onSubmit={(v) =>
            add(
              "approvals",
              {
                ...v,
                centreId: centre?.id || null,
                fy,
                date: today(),
                status: centre ? "Pending" : "Approved",
                actionTaken: "",
                refNo: `${programme.fileNo}/Admn/${fy}/${String(db.approvals.length + 11).padStart(3, "0")}`,
              },
              centre
                ? "Request sent to the Coordinating Unit"
                : "Approval recorded",
            )
          }
        />
      )}
      {form === "order" && (
        <FormModal
          title="Upload proceedings / office order"
          onClose={() => setForm(null)}
          initial={{ date: today() }}
          fields={[
            {
              name: "type",
              label: "Type",
              type: "select",
              options: ["Office Order", "Proceedings", "Sanction Order"],
            },
            { name: "no", label: "Number" },
            { name: "subject", label: "Subject", full: true },
            { name: "date", label: "Date", type: "date" },
            { name: "file", label: "Document", type: "file" },
          ]}
          onSubmit={(v) =>
            add(
              "orders",
              { ...v, file: v.file || "Order.pdf", by: user.name },
              "Order uploaded to the repository",
            )
          }
        />
      )}
    </Page>
  );
}
