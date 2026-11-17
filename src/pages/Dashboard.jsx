import { Link } from "react-router-dom";
import {
  Building2,
  IndianRupee,
  Wallet,
  FileCheck2,
  FlaskConical,
  ListChecks,
  Users,
  Mail,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { useStore } from "../store";
import {
  Badge,
  Bars,
  Card,
  Donut,
  Page,
  Stat,
  Table,
  Progress,
  lakh,
  num,
  fmtDate,
} from "../components/ui";
import { finRows, sum, pct, PENDING, countBy, isOverdue } from "../data/calc";
import { usePending } from "./pending";
import { MODULES } from "../roles";

export default function Dashboard() {
  const { db, fy, role, centre, user, centres, scope, programme } = useStore();
  const pending = usePending();
  const fin = finRows(db, fy, centres);
  const tot = {
    allocated: sum(fin, "allocated"),
    released: sum(fin, "released"),
    spent: sum(fin, "spent"),
  };
  const aucs = scope(db.aucs);
  const obs = scope(db.observations);
  const points = scope(db.actionPoints).filter(
    (a) => !centre || a.centreId === centre.id,
  );
  const openPoints = points.filter((a) => a.status !== "Completed");
  const staffIn = scope(db.staff).filter(
    (s) => s.status === "In Position",
  ).length;
  const sanctioned = sum(scope(db.positions), "sanctioned");
  const comms = db.comms.filter(
    (m) => !centre || m.to === "all" || m.to.includes(centre.id),
  );
  const unack = centre
    ? comms.filter((m) => !m.acks[centre.id]?.ackOn).length
    : 0;

  const statusSegs = (rows) => {
    const c = countBy(rows, "status");
    return [
      { label: "Approved", value: c.Approved || 0, tone: "green" },
      {
        label: "Under scrutiny",
        value: (c.Submitted || 0) + (c.Resubmitted || 0) + (c.Scrutinised || 0),
        tone: "blue",
      },
      { label: "Returned", value: c.Returned || 0, tone: "red" },
      { label: "Draft", value: c.Draft || 0, tone: "grey" },
    ];
  };

  const deadlines = [
    ...comms
      .filter((m) => m.due)
      .map((m) => ({
        id: m.id,
        what: m.subject,
        due: m.due,
        kind: m.type,
        path: "/communication",
      })),
    ...openPoints.map((a) => ({
      id: a.id,
      what: a.point,
      due: a.due,
      kind: "Action point",
      path: "/meetings",
    })),
    ...db.meetings
      .filter((m) => m.status === "Scheduled")
      .map((m) => ({
        id: m.id,
        what: m.title,
        due: m.date,
        kind: "Meeting",
        path: "/meetings",
      })),
  ]
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 6);

  return (
    <Page
      title={`Welcome, ${user.name}`}
      subtitle={`${role.label} · ${centre ? `${centre.name} centre` : programme.unit} · Financial year ${fy}`}
    >
      <div className="stack">
        {centre ? (
          <div className="grid g4">
            <Stat
              icon={IndianRupee}
              label="Allocation"
              value={lakh(tot.allocated)}
              hint={`Released ${lakh(tot.released)}`}
            />
            <Stat
              icon={Wallet}
              label="Expenditure"
              value={lakh(tot.spent)}
              hint={`${num(pct(tot.spent, tot.released), 0)}% of funds released`}
            />
            <Stat
              icon={Mail}
              label="Communications to acknowledge"
              value={unack}
              hint={`${comms.length} received this year`}
            />
            <Stat
              icon={Users}
              label="Staff in position"
              value={`${staffIn} / ${sanctioned}`}
              hint={`${sanctioned - staffIn} vacant`}
            />
          </div>
        ) : (
          <div className="grid g6">
            <Stat
              icon={Building2}
              label="Centres"
              value={db.centres.length}
              hint={`${new Set(db.centres.map((c) => c.state)).size} states`}
            />
            <Stat
              icon={IndianRupee}
              label="Funds released"
              value={lakh(tot.released)}
              hint={`of ${lakh(tot.allocated)} allocated`}
            />
            <Stat
              icon={Wallet}
              label="Expenditure"
              value={`${num(pct(tot.spent, tot.released), 0)}%`}
              hint={`${lakh(tot.spent)} utilised`}
            />
            <Stat
              icon={FileCheck2}
              label="AUC / SoE in scrutiny"
              value={aucs.filter((a) => PENDING.includes(a.status)).length}
              hint={`${aucs.filter((a) => a.status === "Returned").length} returned to centres`}
            />
            <Stat
              icon={FlaskConical}
              label="Research data to validate"
              value={obs.filter((o) => PENDING.includes(o.status)).length}
              hint={`${obs.filter((o) => o.status === "Approved").length} approved & locked`}
            />
            <Stat
              icon={ListChecks}
              label="Open action points"
              value={openPoints.length}
              hint={`${openPoints.filter((a) => a.status === "Overdue").length} overdue`}
            />
          </div>
        )}

        <div className="grid g-main">
          <Card title={`My pending actions (${pending.length})`} pad={false}>
            <div className="list">
              {pending.slice(0, 7).map((p) => (
                <Link className="item" to={p.path} key={p.id}>
                  <AlertTriangle
                    size={16}
                    color={p.tone === "red" ? "var(--red)" : "var(--amber)"}
                    style={{ marginTop: 2 }}
                  />
                  <span className="grow">
                    <b>{p.title}</b>
                    <span className="muted small">{p.detail}</span>
                  </span>
                  <Badge tone={p.tone}>
                    {MODULES.find((m) => m.id === p.module).label}
                  </Badge>
                </Link>
              ))}
              {!pending.length && (
                <div className="empty">Nothing is waiting on you.</div>
              )}
              {pending.length > 7 && (
                <div className="item muted small">
                  and {pending.length - 7} more in the module pages
                </div>
              )}
            </div>
          </Card>
          <Card title="Deadlines and alerts" pad={false}>
            <div className="list">
              {deadlines.map((d) => (
                <Link className="item" to={d.path} key={d.id}>
                  <CalendarClock
                    size={16}
                    color="var(--muted)"
                    style={{ marginTop: 2 }}
                  />
                  <span className="grow">
                    <b>{d.what}</b>
                    <span className="muted small">
                      {d.kind} · {fmtDate(d.due)}
                    </span>
                  </span>
                  {isOverdue(d.due) && <Badge tone="red">Overdue</Badge>}
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid g3">
          <Card title="AUC / SoE status">
            <Donut segments={statusSegs(aucs)} />
          </Card>
          <Card title="Research data status">
            <Donut segments={statusSegs(obs)} />
          </Card>
          <Card title="Action points">
            <Donut
              segments={[
                {
                  label: "Completed",
                  value: points.filter((a) => a.status === "Completed").length,
                  tone: "green",
                },
                {
                  label: "In progress",
                  value: points.filter((a) => a.status === "In Progress")
                    .length,
                  tone: "blue",
                },
                {
                  label: "Open",
                  value: points.filter((a) => a.status === "Open").length,
                  tone: "amber",
                },
                {
                  label: "Overdue",
                  value: points.filter((a) => a.status === "Overdue").length,
                  tone: "red",
                },
              ]}
            />
          </Card>
        </div>

        {centre ? (
          <Card title={`Head-wise position, ${fy}`} pad={false}>
            <Table
              pageSize={10}
              columns={[
                { label: "Budget head", key: "head" },
                {
                  label: "Allocation",
                  num: true,
                  render: (r) => lakh(r.allocated),
                },
                {
                  label: "Expenditure",
                  num: true,
                  render: (r) => lakh(r.spent),
                },
                {
                  label: "Balance",
                  num: true,
                  render: (r) => lakh(r.allocated - r.spent),
                },
                {
                  label: "Utilisation",
                  render: (r) => <Progress value={pct(r.spent, r.allocated)} />,
                },
              ]}
              rows={programme.budgetHeads.map((head) => {
                const f = (r) =>
                  r.centreId === centre.id && r.fy === fy && r.head === head;
                return {
                  id: head,
                  head,
                  allocated: sum(db.allocations.filter(f)),
                  spent: sum(db.expenditures.filter(f)),
                };
              })}
            />
          </Card>
        ) : (
          <div className="grid g2">
            <Card title={`Centre-wise release and expenditure, ${fy} (₹ lakh)`}>
              <Bars
                legend={["Released", "Expenditure"]}
                data={fin.map((r) => ({
                  label: r.name,
                  value: r.released,
                  value2: r.spent,
                }))}
              />
            </Card>
            <Card title="Centre compliance" pad={false}>
              <Table
                pageSize={8}
                columns={[
                  { label: "Centre", key: "name" },
                  {
                    label: "Utilisation",
                    render: (r) => <Progress value={r.util} />,
                  },
                  {
                    label: "AUC / SoE",
                    render: (r) => {
                      const p = db.aucs.filter(
                        (a) => a.centreId === r.id && a.status !== "Approved",
                      ).length;
                      return p ? (
                        <Badge tone="amber">{p} pending</Badge>
                      ) : (
                        <Badge tone="green">Clear</Badge>
                      );
                    },
                  },
                  {
                    label: "Research data",
                    render: (r) => {
                      const p = db.observations.filter(
                        (o) => o.centreId === r.id && o.status !== "Approved",
                      ).length;
                      return p ? (
                        <Badge tone="blue">{p} open</Badge>
                      ) : (
                        <Badge tone="green">Clear</Badge>
                      );
                    },
                  },
                ]}
                rows={fin}
              />
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}
