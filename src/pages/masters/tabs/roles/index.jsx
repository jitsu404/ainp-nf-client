import { ErrorNote } from "../../../../components/forms";
import {
  Badge,
  Body,
  Card,
  SmallBody,
  SubHeading,
} from "../../../../components/ui";
import { useRoleSummary } from "../../../../queries/users";

/** Read-only overview of the roles, built by the server from the same definitions it enforces. */
export default function RolesTab() {
  const roles = useRoleSummary();

  if (roles.error) return <ErrorNote error={roles.error} />;
  if (!roles.data) return <Body muted>Loading…</Body>;

  return (
    <div className="stack">
      <div className="note">
        <Body>
          What each role can do, exactly as the server enforces it. Roles are
          part of the application, so changing one is a development change. Some
          capabilities belong to modules that are not built yet (finance, AUC /
          SoE, staff, meetings …).
        </Body>
      </div>
      <div className="grid g3" style={{ alignItems: "start" }}>
        {roles.data.map((r) => {
          const modules = [...new Set(r.capabilities.map((c) => c.module))];
          return (
            <Card
              key={r.id}
              title={
                <span className="row" style={{ gap: 8 }}>
                  <SubHeading as="span" level="card">
                    {r.label}
                  </SubHeading>
                  <Badge tone={r.scope === "centre" ? "blue" : "green"}>
                    {r.scope === "centre" ? "Own centre" : "All centres"}
                  </Badge>
                </span>
              }
            >
              <div className="stack" style={{ gap: 10 }}>
                <div className="kv two">
                  <div>
                    <SmallBody muted as="span">
                      Active accounts
                    </SmallBody>
                    <Body as="b">{r.activeUsers}</Body>
                  </div>
                  <div>
                    <SmallBody muted as="span">
                      Manages accounts of
                    </SmallBody>
                    <Body as="b">
                      {r.manages.length ? r.manages.join(", ") : "—"}
                    </Body>
                  </div>
                </div>
                {modules.map((module) => (
                  <div key={module}>
                    <SmallBody
                      color="text-muted"
                      as="div"
                      style={{ fontWeight: 600 }}
                    >
                      {module}
                    </SmallBody>
                    <ul
                      className="small"
                      style={{ margin: "2px 0 0", paddingLeft: 18 }}
                    >
                      {r.capabilities
                        .filter((c) => c.module === module)
                        .map((c) => (
                          <SmallBody as="li" key={c.id}>
                            {c.label}
                          </SmallBody>
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
