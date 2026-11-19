import { FlaskConical, ListChecks } from "lucide-react";
import { Card, Table } from "../../../components/ui";

export function ProtocolTab({
  experiment: e,
  config,
  unit,
  onEditTreatments,
  onEditParameters,
}) {
  return (
    <div className="grid g2">
      <Card
        title="Treatments"
        pad={false}
        actions={
          config && (
            <button className="btn ghost sm" onClick={onEditTreatments}>
              <ListChecks size={14} /> Edit treatments
            </button>
          )
        }
      >
        <Table
          rows={e.treatments.map((t) => ({ ...t, id: t.code }))}
          pageSize={30}
          empty="No treatments yet."
          columns={[
            { label: "Code", render: (t) => <b>{t.code}</b> },
            { label: "Treatment", key: "name" },
            {
              label: "Details",
              render: (t) => (
                <span className="muted small">{t.description || "—"}</span>
              ),
            },
          ]}
        />
      </Card>
      <Card
        title="Parameters recorded"
        pad={false}
        actions={
          config && (
            <button className="btn ghost sm" onClick={onEditParameters}>
              <FlaskConical size={14} /> Edit parameters
            </button>
          )
        }
      >
        <Table
          rows={(e.defaultParameters ?? e.parameters ?? []).map((p) => ({
            ...p,
            id: p.parameterId,
          }))}
          pageSize={30}
          empty="No parameters yet."
          columns={[
            { label: "Section", key: "section" },
            {
              label: "Parameter",
              render: (p) => (
                <>
                  {p.name}
                  {p.required && !p.formula && (
                    <span className="muted"> *</span>
                  )}
                  {p.formula && (
                    <div
                      className="muted small mono"
                      title="Calculated from other values"
                    >
                      = {p.formula}
                    </div>
                  )}
                </>
              ),
            },
            { label: "Unit", render: (p) => unit(p.unitCode) || "—" },
            {
              label: "Recorded",
              render: (p) =>
                (p.level === "plot" && e.replications
                  ? "Per plot"
                  : "Per treatment") + (p.formula ? " · calculated" : ""),
            },
          ]}
        />
        <div className="muted small" style={{ padding: "8px 16px" }}>
          * required before a sheet can be submitted
        </div>
      </Card>
    </div>
  );
}
