import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText } from "lucide-react";
import { Badge, Card, Table } from "../../../components/ui";
import { ROUTES } from "../../../config/constants";
import { useExperimentAssignments } from "../../../queries/assignments";
import { CentreMetadataModal } from "../components/CentreMetadataModal";

export function CentresTab({
  experiment,
  trialRows = [],
  config,
  isPending,
  onAssignCentres,
}) {
  const navigate = useNavigate();
  const [viewingAssignment, setViewingAssignment] = useState(null);

  const experimentId = experiment?.id || experiment?._id;
  const assignmentsQuery = useExperimentAssignments(
    { experiment: experimentId },
    { enabled: Boolean(experimentId) },
  );

  const assignmentMap = useMemo(() => {
    const map = new Map();
    const list = Array.isArray(assignmentsQuery.data)
      ? assignmentsQuery.data
      : (assignmentsQuery.data?.data ?? []);
    for (const a of list) {
      const cId = String(a.centre?._id || a.centre?.id || a.centre);
      map.set(cId, a);
    }
    return map;
  }, [assignmentsQuery.data]);

  return (
    <>
      <Card
        pad={false}
        title={config ? "Centres running this experiment" : undefined}
        actions={
          config && (
            <button className="btn ghost sm" onClick={onAssignCentres}>
              <Building2 size={14} /> Assign centres
            </button>
          )
        }
      >
        <Table
          rows={trialRows}
          pageSize={30}
          onRow={(t) => navigate(ROUTES.trial(t.id))}
          empty={isPending ? "Loading…" : "No centres assigned yet."}
          columns={[
            {
              label: "Centre",
              render: (t) => (
                <b style={{ fontWeight: 550 }}>{t.centreId?.name ?? "—"}</b>
              ),
            },
            { label: "Code", render: (t) => t.centreId?.code },
            { label: "State", render: (t) => t.centreId?.state },
            {
              label: "Cropping systems",
              render: (t) =>
                t.croppingSystems.length ? (
                  t.croppingSystems.map((c) => c.name).join("; ")
                ) : (
                  <Badge tone="amber">Not set up</Badge>
                ),
            },
            {
              label: "Status",
              render: (t) => (
                <Badge
                  tone={
                    t.status === "Running"
                      ? "blue"
                      : t.status === "Completed"
                        ? "green"
                        : "grey"
                  }
                >
                  {t.status}
                </Badge>
              ),
            },
            {
              label: "Metadata",
              render: (t) => {
                const cId = String(
                  t.centreId?.id || t.centreId?._id || t.centreId,
                );
                const a = assignmentMap.get(cId);
                const meta = a?.metaData;
                const hasMeta =
                  meta &&
                  Object.values(meta).some(
                    (v) =>
                      v !== null &&
                      v !== undefined &&
                      String(v).trim().length > 0,
                  );

                if (hasMeta) {
                  return (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ padding: "3px 8px", fontSize: "0.8rem", gap: 5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingAssignment({
                          assignment: a,
                          centre: t.centreId,
                        });
                      }}
                    >
                      <FileText size={13} /> View metadata
                    </button>
                  );
                }
                return <span className="muted small">Not provided</span>;
              },
            },
          ]}
        />
      </Card>

      {viewingAssignment && (
        <CentreMetadataModal
          assignment={viewingAssignment.assignment}
          centreName={viewingAssignment.centre?.name}
          experimentCode={experiment?.code}
          onClose={() => setViewingAssignment(null)}
        />
      )}
    </>
  );
}
