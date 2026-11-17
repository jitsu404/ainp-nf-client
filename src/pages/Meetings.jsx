import { useState } from "react";
import { CalendarPlus, Plus } from "lucide-react";
import { useStore } from "../store";
import {
  Badge,
  Card,
  FileLink,
  FormModal,
  KV,
  Modal,
  Page,
  Progress,
  Select,
  Table,
  Tabs,
  fmtDate,
} from "../components/ui";
import { pct } from "../data/calc";

const STATUSES = ["Open", "In Progress", "Completed", "Overdue"];

export default function Meetings() {
  const { db, centre, centres, centreName, can, add, update } = useStore();
  const [tab, setTab] = useState("meetings");
  const [status, setStatus] = useState("");
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);
  const points = db.actionPoints.filter(
    (a) => !centre || a.centreId === centre.id || a.centreId === null,
  );
  const rows = points.filter((a) => !status || a.status === status);
  const open = db.meetings.find((m) => m.id === openId);
  const canUpdate = (a) =>
    can("meetings.manage") ||
    (can("meetings.update") && a.centreId === centre?.id);

  const pointCols = [
    {
      label: "Action point",
      render: (r) => <b style={{ fontWeight: 550 }}>{r.point}</b>,
    },
    {
      label: "Meeting",
      render: (r) => db.meetings.find((m) => m.id === r.meetingId)?.title,
    },
    {
      label: "Responsibility",
      render: (r) => (
        <>
          {r.responsible}
          <div className="muted small">{centreName(r.centreId)}</div>
        </>
      ),
    },
    { label: "Due date", render: (r) => fmtDate(r.due) },
    {
      label: "Status",
      render: (r) =>
        canUpdate(r) ? (
          <select
            className="select"
            value={r.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              update(
                "actionPoints",
                r.id,
                { status: e.target.value },
                `Action point marked ${e.target.value}`,
              )
            }
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        ) : (
          <Badge>{r.status}</Badge>
        ),
    },
    { label: "Remarks", render: (r) => r.remark || "—" },
  ];
  const progress = centres.map((c) => {
    const mine = db.actionPoints.filter((a) => a.centreId === c.id);
    const obs = db.observations.filter((o) => o.centreId === c.id);
    return {
      id: c.id,
      name: c.name,
      total: mine.length,
      done: mine.filter((a) => a.status === "Completed").length,
      overdue: mine.filter((a) => a.status === "Overdue").length,
      data: pct(obs.filter((o) => o.status === "Approved").length, obs.length),
      aucs: db.aucs.filter(
        (a) => a.centreId === c.id && a.status !== "Approved",
      ).length,
    };
  });

  return (
    <Page
      title="Meetings & Monitoring"
      actions={
        can("meetings.manage") && (
          <button className="btn" onClick={() => setForm("meeting")}>
            <CalendarPlus size={15} /> Schedule meeting
          </button>
        )
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["meetings", "Meetings", db.meetings.length],
          [
            "points",
            "Action points",
            points.filter((a) => a.status !== "Completed").length,
          ],
          ["progress", "Centre progress"],
        ]}
      />

      {tab === "meetings" && (
        <Card pad={false}>
          <Table
            onRow={(r) => setOpenId(r.id)}
            columns={[
              {
                label: "Meeting",
                render: (r) => <b style={{ fontWeight: 550 }}>{r.title}</b>,
              },
              { label: "Type", key: "type" },
              { label: "Date", render: (r) => fmtDate(r.date) },
              { label: "Mode", key: "mode" },
              { label: "Venue", key: "venue" },
              {
                label: "Action points",
                render: (r) =>
                  db.actionPoints.filter((a) => a.meetingId === r.id).length,
              },
              {
                label: "Proceedings",
                render: (r) => <FileLink name={r.proceedings} />,
              },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
            ]}
            rows={[...db.meetings].sort((a, b) => b.date.localeCompare(a.date))}
          />
        </Card>
      )}

      {tab === "points" && (
        <Card pad={false}>
          <div className="toolbar">
            <Select
              value={status}
              onChange={setStatus}
              options={STATUSES}
              all="All statuses"
            />
            <span className="grow" />
            {can("meetings.manage") && (
              <button className="btn sm" onClick={() => setForm("point")}>
                <Plus size={14} /> Add action point
              </button>
            )}
          </div>
          <Table columns={pointCols} rows={rows} />
        </Card>
      )}

      {tab === "progress" && (
        <Card pad={false} title="Centre progress and pending compliance">
          <Table
            pageSize={20}
            columns={[
              { label: "Centre", key: "name" },
              {
                label: "Action points closed",
                render: (r) => (r.total ? `${r.done} of ${r.total}` : "—"),
              },
              {
                label: "Overdue",
                render: (r) =>
                  r.overdue ? (
                    <Badge tone="red">{r.overdue}</Badge>
                  ) : (
                    <Badge tone="green">0</Badge>
                  ),
              },
              {
                label: "Research data approved",
                render: (r) => <Progress value={r.data} />,
              },
              {
                label: "AUC / SoE pending",
                render: (r) =>
                  r.aucs ? (
                    <Badge tone="amber">{r.aucs}</Badge>
                  ) : (
                    <Badge tone="green">0</Badge>
                  ),
              },
            ]}
            rows={progress}
          />
        </Card>
      )}

      {open && (
        <Modal
          wide
          title={open.title}
          subtitle={`${open.type} · ${fmtDate(open.date)}`}
          onClose={() => setOpenId(null)}
        >
          <KV
            items={[
              ["Mode", open.mode],
              ["Venue", open.venue],
              ["Status", <Badge>{open.status}</Badge>],
              ["Proceedings", <FileLink name={open.proceedings} />],
            ]}
          />
          <div>
            <b>Agenda</b>
            <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {open.agenda.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
          <Card pad={false} title="Action points arising">
            <Table
              pageSize={5}
              columns={pointCols.filter((c) => c.label !== "Meeting")}
              rows={db.actionPoints.filter((a) => a.meetingId === open.id)}
              empty="No action points recorded yet."
            />
          </Card>
          {can("meetings.manage") && !open.proceedings && (
            <div className="row">
              <button
                className="btn ghost"
                onClick={() =>
                  update(
                    "meetings",
                    open.id,
                    { proceedings: "Proceedings.pdf", status: "Held" },
                    "Proceedings uploaded and circulated",
                  )
                }
              >
                Upload proceedings
              </button>
            </div>
          )}
        </Modal>
      )}

      {form === "meeting" && (
        <FormModal
          title="Schedule meeting"
          onClose={() => setForm(null)}
          submitLabel="Schedule and notify centres"
          fields={[
            { name: "title", label: "Title", full: true },
            {
              name: "type",
              label: "Type",
              type: "select",
              options: [
                "Annual Group Meeting",
                "Review Meeting",
                "Monitoring Meeting",
              ],
            },
            { name: "date", label: "Date", type: "date" },
            {
              name: "mode",
              label: "Mode",
              type: "select",
              options: ["In person", "Online", "Hybrid"],
            },
            { name: "venue", label: "Venue / link" },
            {
              name: "agendaText",
              label: "Agenda (one item per line)",
              type: "textarea",
            },
          ]}
          onSubmit={(v) =>
            add(
              "meetings",
              {
                ...v,
                agenda: v.agendaText.split("\n").filter(Boolean),
                status: "Scheduled",
                proceedings: null,
              },
              "Meeting scheduled; notice sent to centres",
            )
          }
        />
      )}
      {form === "point" && (
        <FormModal
          title="Add action point"
          onClose={() => setForm(null)}
          fields={[
            {
              name: "meetingId",
              label: "Meeting",
              type: "select",
              options: db.meetings.map((m) => [m.id, m.title]),
              full: true,
            },
            { name: "point", label: "Action point", full: true },
            {
              name: "centreId",
              label: "Responsible centre",
              type: "select",
              options: db.centres.map((c) => [c.id, c.name]),
            },
            { name: "due", label: "Due date", type: "date" },
          ]}
          onSubmit={(v) =>
            add(
              "actionPoints",
              {
                ...v,
                responsible: db.users.find(
                  (u) => u.roleId === "pi" && u.centreId === v.centreId,
                )?.name,
                status: "Open",
                remark: "",
              },
              "Action point assigned",
            )
          }
        />
      )}
    </Page>
  );
}
