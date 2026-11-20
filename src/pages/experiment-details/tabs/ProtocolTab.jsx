import { AlertCircle, FlaskConical, ListChecks } from "lucide-react";
import { Card, Table } from "../../../components/ui";

export function ProtocolTab({
  experiment: e,
  config,
  unit,
  onEditTreatments,
  onEditParameters,
  onEditMainPlot,
  onEditSubPlot,
  onEditDetails,
}) {
  const isSplitPlot = e.design === "Split plot";

  const mainCount = e.mainPlotCount ?? 0;
  const subCount = e.subPlotCount ?? 0;
  const mainData = e.mainPlotData ?? [];
  const subData = e.subPlotData ?? [];

  return (
    <div className="stack" style={{ gap: 16 }}>
      {isSplitPlot && (
        <div className="grid g2">
          <Card
            title={
              mainCount > 0
                ? `Main Plot (${mainData.length} of ${mainCount})`
                : "Main Plot"
            }
            pad={mainCount <= 0}
            actions={
              config &&
              mainCount > 0 && (
                <button className="btn ghost sm" onClick={onEditMainPlot}>
                  <ListChecks size={14} /> Edit main plots
                </button>
              )
            }
          >
            {mainCount <= 0 ? (
              <div
                className="note warn"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    Main Plot Count is currently 0. Please set the Main Plot
                    Count in experiment details before configuring main plots.
                  </span>
                </div>
                {config && onEditDetails && (
                  <button
                    className="btn sm"
                    onClick={onEditDetails}
                    style={{ flexShrink: 0 }}
                  >
                    Set plot counts
                  </button>
                )}
              </div>
            ) : (
              <Table
                rows={mainData.map((t) => ({ ...t, id: t.code }))}
                pageSize={30}
                empty="No main plots configured yet. Click 'Edit main plots' to add."
                columns={[
                  { label: "Code", render: (t) => <b>{t.code}</b> },
                  { label: "Main Plot", key: "name" },
                  {
                    label: "Details",
                    render: (t) => (
                      <span className="muted small">
                        {t.description || "—"}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          <Card
            title={
              subCount > 0
                ? `Sub Plot (${subData.length} of ${subCount})`
                : "Sub Plot"
            }
            pad={subCount <= 0}
            actions={
              config &&
              subCount > 0 && (
                <button className="btn ghost sm" onClick={onEditSubPlot}>
                  <ListChecks size={14} /> Edit sub plots
                </button>
              )
            }
          >
            {subCount <= 0 ? (
              <div
                className="note warn"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    Sub Plot Count is currently 0. Please set the Sub Plot Count
                    in experiment details before configuring sub plots.
                  </span>
                </div>
                {config && onEditDetails && (
                  <button
                    className="btn sm"
                    onClick={onEditDetails}
                    style={{ flexShrink: 0 }}
                  >
                    Set plot counts
                  </button>
                )}
              </div>
            ) : (
              <Table
                rows={subData.map((t) => ({ ...t, id: t.code }))}
                pageSize={30}
                empty="No sub plots configured yet. Click 'Edit sub plots' to add."
                columns={[
                  { label: "Code", render: (t) => <b>{t.code}</b> },
                  { label: "Sub Plot", key: "name" },
                  {
                    label: "Details",
                    render: (t) => (
                      <span className="muted small">
                        {t.description || "—"}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </div>
      )}

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
    </div>
  );
}
