import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarClock,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "../auth";
import { ErrorNote } from "../components/forms";
import {
  Badge,
  Body,
  Card,
  Page,
  SmallBody,
  Stat,
  Table,
} from "../components/ui";
import { ROUTES, TABLE_PAGE_SIZE } from "../config/constants";
import { formatDate, formatDateTime } from "../hooks";
import { useCentre, useCentres } from "../queries/centres";
import { useExperiments } from "../queries/research";
import { useUsers } from "../queries/users";

/**
 * The dashboard depends on what the signed-in user can do, never on their role name:
 * - can manage centres (Super Admin, PCU) → programme-wide centre coverage
 * - centre-scoped user (Centre PI) → their own centre
 * - experiment-scoped user (Experiment PI) → the experiment linked to their login
 * - anyone else → a plain welcome until their modules exist
 */
export default function Home() {
  const auth = useAuth();
  if (auth.can("centres.manage")) return <CoverageDashboard />;
  if (auth.role.scope === "centre") return <CentreDashboard />;
  if (auth.role.scope === "experiment") return <ExperimentPiDashboard />;
  return (
    <Page title={`Welcome, ${auth.user.name}`}>
      <Body muted>Your modules will appear here as they are enabled.</Body>
    </Page>
  );
}

/** Super Admin / PCU: which centres are active and which still need a Centre PI. */
function CoverageDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const managesPcu = auth.assignable.some((r) => r.id === "pc");

  // All centres (active and inactive) in one request; the counts are derived from it.
  const centres = useCentres();
  const pcu = useUsers(
    { roleId: "pc", isActive: true, limit: 1 },
    { enabled: managesPcu },
  );

  const rows = centres.data?.data ?? [];
  const active = rows.filter((c) => c.isActive);
  const withoutPi = active.filter((c) => !c.currentPi);
  const loading = centres.isPending;

  return (
    <Page title={`Welcome, ${auth.user.name}`}>
      <div className="stack">
        <ErrorNote error={centres.error} />
        <div className="grid g4">
          <Stat
            icon={Building2}
            label="Active centres"
            value={loading ? "…" : active.length}
            hint={`${rows.length - active.length} inactive`}
          />
          <Stat
            icon={UserCheck}
            label="Centres with a PI"
            value={loading ? "…" : active.length - withoutPi.length}
          />
          <Stat
            icon={UserX}
            label="Centres without a PI"
            value={loading ? "…" : withoutPi.length}
            hint={
              withoutPi.length
                ? "Assign one from the centre page"
                : "All centres covered"
            }
          />
          {managesPcu && (
            <Stat
              icon={ShieldCheck}
              label="Active PCU accounts"
              value={pcu.isPending ? "…" : (pcu.data?.meta?.total ?? 0)}
            />
          )}
        </div>

        <Card
          title="Centres without a Centre PI"
          pad={false}
          actions={
            <Link className="btn ghost sm" to={ROUTES.centres}>
              All centres
            </Link>
          }
        >
          <Table
            rows={withoutPi}
            pageSize={TABLE_PAGE_SIZE}
            onRow={(c) => navigate(ROUTES.centre(c.id))}
            empty={
              loading ? "Loading…" : "Every active centre has a Centre PI."
            }
            columns={[
              { label: "Code", key: "code" },
              {
                label: "Centre",
                render: (c) => <b style={{ fontWeight: 550 }}>{c.name}</b>,
              },
              {
                label: "Host institution",
                render: (c) => c.hostShort || c.host,
              },
              { label: "State", key: "state" },
              {
                label: "Centre PI",
                render: () => <Badge tone="amber">Not assigned</Badge>,
              },
            ]}
          />
        </Card>
      </div>
    </Page>
  );
}

/** Experiment PI: the experiment(s) their login leads. The API returns only those. */
function ExperimentPiDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const experiments = useExperiments();
  const rows = experiments.data ?? [];
  return (
    <Page title={`Welcome, ${user.name}`}>
      <div className="stack">
        <ErrorNote error={experiments.error} />
        <Card title="Your experiment" pad={false}>
          <Table
            rows={rows}
            onRow={(e) => navigate(ROUTES.experiment(e.id))}
            empty={
              experiments.isPending
                ? "Loading…"
                : "No experiment is linked to your PI login yet. The PCU links it."
            }
            columns={[
              {
                label: "Code",
                render: (e) => <span className="mono">{e.code}</span>,
              },
              {
                label: "Title",
                render: (e) => <b style={{ fontWeight: 550 }}>{e.title}</b>,
              },
              {
                label: "Centres",
                num: true,
                render: (e) => e.centreIds.length,
              },
              { label: "Status", render: (e) => <Badge>{e.status}</Badge> },
            ]}
          />
        </Card>
        <SmallBody muted style={{ margin: 0 }} as="p">
          You edit the experiment&apos;s definition: treatments, parameters,
          seasons and metadata. The PCU assigns centres and approves their data;
          each centre runs its trial.
        </SmallBody>
      </div>
    </Page>
  );
}

/** Centre PI: their own centre and their role. The API only ever returns their centre. */
function CentreDashboard() {
  const { user, role } = useAuth();
  const centre = useCentre(user.centreId);
  const c = centre.data;

  return (
    <Page title={`Welcome, ${user.name}`}>
      <div className="stack">
        <ErrorNote error={centre.error} />
        {!user.centreId && (
          <div className="note warn">
            <Body>
              Your account isn’t linked to a centre. Please contact the PCU.
            </Body>
          </div>
        )}
        <div className="grid g2">
          <Card title="Your centre">
            {!c ? (
              <Body muted>
                {centre.isPending && user.centreId ? "Loading…" : "—"}
              </Body>
            ) : (
              <div className="stack" style={{ gap: 12 }}>
                <div className="row" style={{ gap: 10 }}>
                  <b style={{ fontSize: 17 }}>{c.name}</b>
                  <Badge tone="blue">{c.code}</Badge>
                  <Badge>{c.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="kv two">
                  <div>
                    <SmallBody muted as="span">
                      Host institution
                    </SmallBody>
                    <Body as="b">{c.host}</Body>
                  </div>
                  <div>
                    <SmallBody muted as="span">
                      Host type
                    </SmallBody>
                    <Body as="b">{c.hostType || "—"}</Body>
                  </div>
                  <div>
                    <SmallBody muted as="span">
                      City / State
                    </SmallBody>
                    <Body as="b">
                      {[c.city, c.state].filter(Boolean).join(", ")}
                    </Body>
                  </div>
                  <div>
                    <SmallBody muted as="span">
                      Agro-climatic zone
                    </SmallBody>
                    <Body as="b">{c.zone || "—"}</Body>
                  </div>
                  <div>
                    <SmallBody muted as="span">
                      Centre type
                    </SmallBody>
                    <Body as="b">{c.type}</Body>
                  </div>
                  <div>
                    <SmallBody muted as="span">
                      Pincode
                    </SmallBody>
                    <Body as="b">{c.pincode || "—"}</Body>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Your role">
            <div className="kv" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <SmallBody muted as="span">
                  Role
                </SmallBody>
                <Body as="b">
                  {role.label}
                  {user.designation ? ` · ${user.designation}` : ""}
                </Body>
              </div>
              <div>
                <SmallBody muted as="span">
                  Organization
                </SmallBody>
                <Body as="b">{user.organization || "—"}</Body>
              </div>
              <div>
                <SmallBody muted as="span">
                  Email · Mobile
                </SmallBody>
                <Body as="b">
                  {user.email}
                  {user.mobile ? ` · ${user.mobile}` : ""}
                </Body>
              </div>
              <div>
                <SmallBody muted as="span">
                  PI of this centre since
                </SmallBody>
                <Body as="b">{formatDate(user.createdAt)}</Body>
              </div>
              <div>
                <SmallBody muted as="span">
                  Last sign-in
                </SmallBody>
                <Body as="b">{formatDateTime(user.lastLoginAt)}</Body>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Coming next">
          <div
            className="row"
            style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}
          >
            <CalendarClock
              size={18}
              color="var(--text-muted)"
              style={{ flex: "none", marginTop: 2 }}
            />
            <Body muted>
              Research data entry, experiments, expenditure and AUC/SoE
              submission for your centre will appear here as each module is
              enabled by the PCU.
            </Body>
          </div>
        </Card>
      </div>
    </Page>
  );
}
