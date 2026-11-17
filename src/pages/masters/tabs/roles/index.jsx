import { ErrorNote } from "../../../../components/forms";
import { Badge, Card } from "../../../../components/ui";
import { useRoleSummary } from "../../../../queries/users";

/** Read-only overview of the roles, built by the server from the same definitions it enforces. */
export default function RolesTab() {
  const roles = useRoleSummary();

  if (roles.error) return <ErrorNote error={roles.error} />;
  if (!roles.data) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <div className="note">
        What each role can do, exactly as the server enforces it. Roles are part
        of the application, so changing one is a development change. Some
        capabilities belong to modules that are not built yet (finance, AUC /
        SoE, staff, meetings …).
      </div>
      <div className="grid g3" style={{ alignItems: "start" }}>
        {roles.data.map((r) => {
          const modules = [...new Set(r.capabilities.map((c) => c.module))];
          return (
            <Card
              key={r.id}
              title={
                <span className="row" style={{ gap: 8 }}>
                  {r.label}
                  <Badge tone={r.scope === "centre" ? "blue" : "green"}>
                    {r.scope === "centre" ? "Own centre" : "All centres"}
                  </Badge>
                </span>
              }
            >
              <div className="stack" style={{ gap: 10 }}>
                <div className="kv two">
                  <div>
                    <span>Active accounts</span>
                    <b>{r.activeUsers}</b>
                  </div>
                  <div>
                    <span>Manages accounts of</span>
                    <b>{r.manages.length ? r.manages.join(", ") : "—"}</b>
                  </div>
                </div>
                {modules.map((module) => (
                  <div key={module}>
                    <div className="muted small" style={{ fontWeight: 600 }}>
                      {module}
                    </div>
                    <ul
                      className="small"
                      style={{ margin: "2px 0 0", paddingLeft: 18 }}
                    >
                      {r.capabilities
                        .filter((c) => c.module === module)
                        .map((c) => (
                          <li key={c.id}>{c.label}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
