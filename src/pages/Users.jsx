import { useState } from "react";
import { UserPlus, Check, Minus, ArrowRight } from "lucide-react";
import { useStore } from "../store";
import {
  Badge,
  Card,
  ExportBar,
  FormModal,
  Page,
  Select,
  Table,
  Tabs,
  useSearch,
} from "../components/ui";
import { CAPABILITIES, ROLE_LIST, ROLES, canAssignRole } from "../roles";

const FLOW = [
  ["Centre", "Data Entry Staff", "Enters data and uploads documents as draft"],
  [
    "Centre",
    "Nodal Officer / PI",
    "Checks and submits to the Coordinating Unit",
  ],
  [
    "Coordinating Unit",
    "Reviewer / Finance Officer",
    "Scrutinises; returns with observations or forwards",
  ],
  ["Centre", "Nodal Officer / PI", "Corrects and re-submits when returned"],
  [
    "Coordinating Unit",
    "Project Coordinator",
    "Approves; the record is locked",
  ],
];

export default function Users() {
  const { db, can, add, update, centreName, role } = useStore();
  const assignable = ROLE_LIST.filter((r) => canAssignRole(role.id, r.id));
  const [tab, setTab] = useState("users");
  const [roleId, setRoleId] = useState("");
  const [form, setForm] = useState(false);
  const [rows, search] = useSearch(
    db.users.filter((u) => !roleId || u.roleId === roleId),
    "Search users…",
  );
  const [auditRows, auditSearch] = useSearch(
    db.audit,
    "Search the audit trail…",
  );
  const manage = can("users.manage");
  const auditCols = [
    { label: "Date & time", key: "at" },
    { label: "User", key: "user" },
    { label: "Role", key: "role" },
    { label: "Action", key: "action" },
    { label: "Module", key: "module" },
    { label: "IP address", key: "ip" },
  ];

  return (
    <Page
      title="Users & Workflow"
      actions={
        manage && (
          <button className="btn" onClick={() => setForm(true)}>
            <UserPlus size={15} /> Add user
          </button>
        )
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["users", "Users", db.users.length],
          ["matrix", "Roles & permissions"],
          ["workflow", "Workflow"],
          ["audit", "Audit trail", db.audit.length],
        ]}
      />

      {tab === "users" && (
        <Card pad={false}>
          <div className="toolbar">
            {search}
            <Select
              value={roleId}
              onChange={setRoleId}
              options={ROLE_LIST.map((r) => [r.id, r.label])}
              all="All roles"
            />
          </div>
          <Table
            pageSize={10}
            columns={[
              {
                label: "Name",
                render: (r) => <b style={{ fontWeight: 550 }}>{r.name}</b>,
              },
              { label: "E-mail", key: "email" },
              {
                label: "Role",
                render: (r) => (
                  <Badge tone="blue">{ROLES[r.roleId].label}</Badge>
                ),
              },
              { label: "Centre / unit", render: (r) => centreName(r.centreId) },
              { label: "Last sign-in", key: "lastLogin" },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
              {
                label: "",
                render: (r) =>
                  manage && (
                    <button
                      className="btn ghost sm"
                      onClick={() =>
                        update(
                          "users",
                          r.id,
                          {
                            status:
                              r.status === "Active" ? "Inactive" : "Active",
                          },
                          `${r.name} ${r.status === "Active" ? "deactivated" : "activated"}`,
                        )
                      }
                    >
                      {r.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  ),
              },
            ]}
            rows={rows}
          />
        </Card>
      )}

      {tab === "matrix" && (
        <Card pad={false} title="What each role can do">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  {ROLE_LIST.map((r) => (
                    <th key={r.id} style={{ textAlign: "center" }}>
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map(([cap, label]) => (
                  <tr key={cap}>
                    <td>{label}</td>
                    {ROLE_LIST.map((r) => (
                      <td key={r.id} style={{ textAlign: "center" }}>
                        {r.can.includes(cap) ? (
                          <Check size={16} color="var(--green)" />
                        ) : (
                          <Minus size={14} color="#c9d0cb" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "workflow" && (
        <div className="stack">
          <Card title="Submission → scrutiny → return → re-submission → approval → lock">
            <div className="row" style={{ alignItems: "stretch" }}>
              {FLOW.map(([level, who, what], i) => (
                <div
                  key={i}
                  className="row"
                  style={{
                    flex: "1 1 170px",
                    flexWrap: "nowrap",
                    alignItems: "stretch",
                  }}
                >
                  <div className="note grow">
                    <Badge tone={level === "Centre" ? "blue" : "green"}>
                      {level}
                    </Badge>
                    <div style={{ fontWeight: 600, marginTop: 6 }}>
                      {i + 1}. {who}
                    </div>
                    <div className="muted small">{what}</div>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight
                      size={16}
                      color="var(--text-muted)"
                      style={{ alignSelf: "center", flex: "none" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card title="Applies to" pad={false}>
            <Table
              columns={[
                { label: "Record", key: "a" },
                { label: "Submitted by", key: "b" },
                { label: "Scrutinised by", key: "c" },
                { label: "Approved by", key: "d" },
                { label: "After approval", key: "e" },
              ]}
              rows={[
                {
                  id: 1,
                  a: "Research observations",
                  b: "Nodal Officer / PI",
                  c: "Reviewer",
                  d: "Project Coordinator",
                  e: "Locked; used in reports and national synthesis",
                },
                {
                  id: 2,
                  a: "AUC / SoE",
                  b: "Nodal Officer / PI",
                  c: "Finance Officer or Reviewer",
                  d: "Project Coordinator",
                  e: "Locked; counted in compliance statements",
                },
                {
                  id: 3,
                  a: "Re-appropriation / additional requirement",
                  b: "Nodal Officer / PI",
                  c: "—",
                  d: "Finance Officer or Project Coordinator",
                  e: "Recorded against the budget head",
                },
                {
                  id: 4,
                  a: "Approvals & sanctions",
                  b: "Nodal Officer / PI",
                  c: "—",
                  d: "Project Coordinator",
                  e: "Sanction issued; action taken tracked",
                },
              ]}
            />
          </Card>
        </div>
      )}

      {tab === "audit" && (
        <Card pad={false}>
          <div className="toolbar">
            {auditSearch}
            <span className="grow" />
            <ExportBar
              name="audit-trail"
              columns={auditCols}
              rows={auditRows}
            />
          </div>
          <Table pageSize={12} columns={auditCols} rows={auditRows} />
        </Card>
      )}

      {form && (
        <FormModal
          title="Add user"
          onClose={() => setForm(false)}
          submitLabel="Create and send invitation"
          fields={[
            { name: "name", label: "Name" },
            { name: "email", label: "E-mail" },
            {
              name: "roleId",
              label: "Role",
              type: "select",
              options: assignable.map((r) => [r.id, r.label]),
            },
            {
              name: "centreId",
              label: "Centre (for centre roles)",
              type: "select",
              options: db.centres.map((c) => [c.id, c.name]),
              required: false,
            },
          ]}
          onSubmit={(v) =>
            add(
              "users",
              {
                ...v,
                centreId:
                  ROLES[v.roleId].scope === "centre"
                    ? v.centreId || db.centres[0].id
                    : null,
                status: "Active",
                lastLogin: "Never",
              },
              "User created; invitation e-mail queued",
            )
          }
        />
      )}
    </Page>
  );
}
