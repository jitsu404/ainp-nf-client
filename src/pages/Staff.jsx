import { useState } from "react";
import { UserPlus, Users, UserCheck, UserX, Hourglass } from "lucide-react";
import { useStore, today } from "../store";
import {
  Badge,
  Card,
  ExportBar,
  FormModal,
  Page,
  Select,
  Stat,
  Table,
  Tabs,
  useSearch,
  fmtDate,
} from "../components/ui";
import { sum } from "../data/calc";

const CATEGORIES = ["Scientific", "Technical", "Supporting", "Contractual"];

export default function Staff() {
  const { db, centre, centres, centreName, can, add, update, scope } =
    useStore();
  const [tab, setTab] = useState("position");
  const [cat, setCat] = useState("");
  const [form, setForm] = useState(null);
  const staff = scope(db.staff);
  const positions = scope(db.positions);
  const inPos = staff.filter((s) => s.status === "In Position");
  const sanctioned = sum(positions, "sanctioned");
  const ending = inPos.filter((s) => s.tenureEnd && s.tenureEnd < "2027-04-01");
  const [rows, search] = useSearch(
    staff.filter((s) => !cat || s.category === cat),
    "Search staff by name, post or order…",
  );
  const manage = can("staff.manage") || can("staff.propose");

  const summary = centres.map((c) => {
    const row = { id: c.id, name: c.name };
    CATEGORIES.forEach((k) => {
      row[`${k}S`] = sum(
        db.positions.filter((p) => p.centreId === c.id && p.category === k),
        "sanctioned",
      );
      row[`${k}F`] = db.staff.filter(
        (s) =>
          s.centreId === c.id && s.category === k && s.status === "In Position",
      ).length;
    });
    row.sanctioned = sum(
      CATEGORIES.map((k) => ({ v: row[`${k}S`] })),
      "v",
    );
    row.filled = sum(
      CATEGORIES.map((k) => ({ v: row[`${k}F`] })),
      "v",
    );
    row.vacant = row.sanctioned - row.filled;
    return row;
  });
  const sumCols = [
    { label: "Centre", key: "name" },
    ...CATEGORIES.map((k) => ({
      label: k,
      num: true,
      render: (r) => `${r[`${k}F`]} / ${r[`${k}S`]}`,
      text: (r) => `${r[`${k}F`]}/${r[`${k}S`]}`,
    })),
    { label: "Sanctioned", num: true, key: "sanctioned" },
    { label: "In position", num: true, key: "filled" },
    {
      label: "Vacant",
      num: true,
      render: (r) =>
        r.vacant ? (
          <Badge tone="red">{r.vacant}</Badge>
        ) : (
          <Badge tone="green">0</Badge>
        ),
      text: (r) => r.vacant,
    },
  ];
  const history = [...staff]
    .sort((a, b) =>
      (b.relievedOn || b.joined).localeCompare(a.relievedOn || a.joined),
    )
    .slice(0, 40)
    .map((s) => ({
      ...s,
      event: s.status === "Relieved" ? "Relieved" : "Joined",
      on: s.relievedOn || s.joined,
    }));

  return (
    <Page
      title="Staff Management"
      actions={
        manage && (
          <button className="btn" onClick={() => setForm("new")}>
            <UserPlus size={15} />{" "}
            {can("staff.manage") ? "Add staff" : "Report joining"}
          </button>
        )
      }
    >
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Stat
          icon={Users}
          label="Sanctioned posts"
          value={sanctioned}
          hint={`${centres.length} centre${centres.length > 1 ? "s" : ""}`}
        />
        <Stat
          icon={UserCheck}
          label="In position"
          value={inPos.length}
          hint={`${((inPos.length / sanctioned) * 100).toFixed(0)}% filled`}
        />
        <Stat
          icon={UserX}
          label="Vacant"
          value={sanctioned - inPos.length}
          hint="Against sanctioned strength"
        />
        <Stat
          icon={Hourglass}
          label="Tenure ending by 31 Mar 2027"
          value={ending.length}
          hint="Contractual staff"
        />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["position", "Staff position"],
          ["register", "Staff register", staff.length],
          ["history", "Change history & orders"],
        ]}
      />

      {tab === "position" && (
        <Card
          pad={false}
          title="Centre-wise position (in position / sanctioned)"
          actions={
            <ExportBar name="staff-position" columns={sumCols} rows={summary} />
          }
        >
          <Table
            pageSize={20}
            columns={sumCols}
            rows={summary}
            foot={[
              "Total",
              ...CATEGORIES.map(
                (k) => `${sum(summary, `${k}F`)} / ${sum(summary, `${k}S`)}`,
              ),
              sum(summary, "sanctioned"),
              sum(summary, "filled"),
              sum(summary, "vacant"),
            ]}
          />
        </Card>
      )}

      {tab === "register" && (
        <Card pad={false}>
          <div className="toolbar">
            {search}
            <Select
              value={cat}
              onChange={setCat}
              options={CATEGORIES}
              all="All categories"
            />
          </div>
          <Table
            columns={[
              {
                label: "Name",
                render: (r) => <b style={{ fontWeight: 550 }}>{r.name}</b>,
              },
              { label: "Designation", key: "post" },
              { label: "Category", key: "category" },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Joined", render: (r) => fmtDate(r.joined) },
              {
                label: "Tenure up to",
                render: (r) => (r.tenureEnd ? fmtDate(r.tenureEnd) : "Regular"),
              },
              { label: "Funding", key: "funding" },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
              {
                label: "",
                render: (r) =>
                  manage &&
                  r.status === "In Position" && (
                    <button
                      className="btn ghost sm"
                      onClick={() =>
                        update(
                          "staff",
                          r.id,
                          { status: "Relieved", relievedOn: today() },
                          `${r.name} marked as relieved`,
                        )
                      }
                    >
                      Relieve
                    </button>
                  ),
              },
            ]}
            rows={rows}
          />
        </Card>
      )}

      {tab === "history" && (
        <Card pad={false} title="Joining, relieving and supporting orders">
          <Table
            columns={[
              { label: "Date", render: (r) => fmtDate(r.on) },
              {
                label: "Event",
                render: (r) => (
                  <Badge tone={r.event === "Joined" ? "green" : "grey"}>
                    {r.event}
                  </Badge>
                ),
              },
              { label: "Name", key: "name" },
              { label: "Designation", key: "post" },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Order reference", key: "orderRef" },
            ]}
            rows={history}
          />
        </Card>
      )}

      {form && (
        <FormModal
          title={
            can("staff.manage")
              ? "Add project staff"
              : "Report joining of staff"
          }
          onClose={() => setForm(null)}
          initial={{
            joined: today(),
            centreId: centre?.id,
            funding: "ICAR 75 : State 25",
          }}
          fields={[
            { name: "name", label: "Name" },
            {
              name: "post",
              label: "Designation",
              type: "select",
              options: [...new Set(db.positions.map((p) => p.post))],
            },
            {
              name: "category",
              label: "Category",
              type: "select",
              options: CATEGORIES,
            },
            ...(centre
              ? []
              : [
                  {
                    name: "centreId",
                    label: "Centre",
                    type: "select",
                    options: db.centres.map((c) => [c.id, c.name]),
                  },
                ]),
            { name: "joined", label: "Date of joining", type: "date" },
            {
              name: "tenureEnd",
              label: "Tenure up to",
              type: "date",
              required: false,
            },
            {
              name: "funding",
              label: "Funding position",
              type: "select",
              options: ["ICAR 100%", "ICAR 75 : State 25"],
            },
            { name: "orderRef", label: "Order reference" },
            { name: "file", label: "Joining / engagement order", type: "file" },
          ]}
          onSubmit={(v) =>
            add(
              "staff",
              { ...v, tenureEnd: v.tenureEnd || null, status: "In Position" },
              "Staff record added",
            )
          }
        />
      )}
    </Page>
  );
}
