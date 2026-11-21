import { useMemo } from "react";
import {
  AlertCircle,
  FlaskConical,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";
import { Card, Table } from "../../../components/ui";
import { seasonMap } from "../../../lib/seasonCrops";

export function ProtocolTab({
  experiment: e,
  config,
  unit,
  onEditTreatments,
  onEditParameters,
  onEditMainPlot,
  onEditSubPlot,
  onEditSubSubPlot,
  onEditDetails,
  onSetParameters,
}) {
  const isSplitPlot = e.design === "Split plot";
  const isSplitSplitPlot = e.design === "Split-split plot";
  const hasPlots = isSplitPlot || isSplitSplitPlot;
  const isDerivedTreatments = isSplitPlot || isSplitSplitPlot;

  const mainCount = e.mainPlotCount ?? 0;
  const subCount = e.subPlotCount ?? 0;
  const subSubCount = e.subSubPlotCount ?? 0;
  const mainData = e.mainPlotData ?? [];
  const subData = e.subPlotData ?? [];
  const subSubData = e.subSubPlotData ?? [];

  const expectedTreatments = isDerivedTreatments
    ? isSplitSplitPlot
      ? mainCount * subCount * subSubCount
      : mainCount * subCount
    : null;

  const seasonCodes = useMemo(
    () => Object.keys(seasonMap(e.seasons)),
    [e.seasons],
  );
  const canSetParameters =
    (e.defaultParameters?.length ?? 0) > 0 &&
    (e.treatments?.length ?? 0) > 0 &&
    seasonCodes.length > 0;

  return (
    <div className="stack" style={{ gap: 16 }}>
      {hasPlots && (
        <div className={isSplitSplitPlot ? "grid g3" : "grid g2"}>
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

          {isSplitSplitPlot && (
            <Card
              title={
                subSubCount > 0
                  ? `Sub-sub Plot (${subSubData.length} of ${subSubCount})`
                  : "Sub-sub Plot"
              }
              pad={subSubCount <= 0}
              actions={
                config &&
                subSubCount > 0 && (
                  <button className="btn ghost sm" onClick={onEditSubSubPlot}>
                    <ListChecks size={14} /> Edit sub-sub plots
                  </button>
                )
              }
            >
              {subSubCount <= 0 ? (
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
                      Sub-sub Plot Count is currently 0. Please set the Sub-sub
                      Plot Count in experiment details before configuring
                      sub-sub plots.
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
                  rows={subSubData.map((t) => ({ ...t, id: t.code }))}
                  pageSize={30}
                  empty="No sub-sub plots configured yet. Click 'Edit sub-sub plots' to add."
                  columns={[
                    { label: "Code", render: (t) => <b>{t.code}</b> },
                    { label: "Sub-sub Plot", key: "name" },
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
          )}
        </div>
      )}

      <div
        className={isDerivedTreatments ? "stack" : "grid g2"}
        style={{ gap: 16 }}
      >
        <Card
          title={
            isDerivedTreatments && expectedTreatments > 0
              ? `Treatments (${e.treatments.length} of ${expectedTreatments})`
              : `Treatments (${e.treatments.length})`
          }
          pad={false}
          actions={
            config && (
              <div className="row" style={{ gap: 8 }}>
                {canSetParameters && (
                  <button className="btn ghost sm" onClick={onSetParameters}>
                    <SlidersHorizontal size={14} /> Set parameters
                  </button>
                )}
                <button className="btn ghost sm" onClick={onEditTreatments}>
                  <ListChecks size={14} /> Edit treatments
                </button>
              </div>
            )
          }
        >
          <Table
            rows={e.treatments.map((t) => ({ ...t, id: t.code }))}
            pageSize={30}
            empty="No treatments yet."
            columns={
              isDerivedTreatments
                ? [
                    { label: "Code", render: (t) => <b>{t.code}</b> },
                    {
                      label: "Main Plot",
                      render: (t) => {
                        const name = mainData.find(
                          (m) => m.code === t.mainPlotCode,
                        )?.name;
                        return t.mainPlotCode ? (
                          <span>
                            <b>{t.mainPlotCode}</b>
                            {name ? (
                              <span className="muted small"> ({name})</span>
                            ) : (
                              ""
                            )}
                          </span>
                        ) : (
                          "—"
                        );
                      },
                    },
                    {
                      label: "Sub Plot",
                      render: (t) => {
                        const name = subData.find(
                          (s) => s.code === t.subPlotCode,
                        )?.name;
                        return t.subPlotCode ? (
                          <span>
                            <b>{t.subPlotCode}</b>
                            {name ? (
                              <span className="muted small"> ({name})</span>
                            ) : (
                              ""
                            )}
                          </span>
                        ) : (
                          "—"
                        );
                      },
                    },
                    ...(isSplitSplitPlot
                      ? [
                          {
                            label: "Sub-sub Plot",
                            render: (t) => {
                              const name = subSubData.find(
                                (ss) => ss.code === t.subSubPlotCode,
                              )?.name;
                              return t.subSubPlotCode ? (
                                <span>
                                  <b>{t.subSubPlotCode}</b>
                                  {name ? (
                                    <span className="muted small">
                                      {" "}
                                      ({name})
                                    </span>
                                  ) : (
                                    ""
                                  )}
                                </span>
                              ) : (
                                "—"
                              );
                            },
                          },
                        ]
                      : []),
                    { label: "Treatment", key: "name" },
                    {
                      label: "Details",
                      render: (t) => (
                        <span className="muted small">
                          {t.description || "—"}
                        </span>
                      ),
                    },
                  ]
                : [
                    { label: "Code", render: (t) => <b>{t.code}</b> },
                    { label: "Treatment", key: "name" },
                    {
                      label: "Details",
                      render: (t) => (
                        <span className="muted small">
                          {t.description || "—"}
                        </span>
                      ),
                    },
                  ]
            }
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
