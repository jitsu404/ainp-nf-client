import { useMemo, useState } from "react";
import {
  AlertCircle,
  FlaskConical,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Card, Table, Body, SmallBody } from "../../../components/ui";
import { seasonMap } from "../../../lib/seasonCrops";
import { toast } from "../../../lib/toast";

export function ProtocolTab({
  experiment: e,
  config,
  unit,
  save,
  onEditTreatments,
  onEditParameters,
  onEditMainPlot,
  onEditSubPlot,
  onEditSubSubPlot,
  onEditDetails,
  onSetParameters,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const isSplitPlot = e.design === "Split plot";
  const isSplitSplitPlot = e.design === "Split-split plot";
  // Factorial: the level lists are factors A, B and (optional) C; treatments are their combinations.
  const isFactorial = e.design === "Factorial";
  const hasPlots = isSplitPlot || isSplitSplitPlot || isFactorial;
  const isDerivedTreatments = hasPlots;
  const names = isFactorial
    ? { A: "Factor 1", B: "Factor 2", C: "Factor 3" }
    : { A: "Main Plot", B: "Sub Plot", C: "Sub-sub Plot" };
  // "Main Plot" → "main plot" in sentences; "Factor A" keeps its capitals.
  const lower = (label) => (isFactorial ? label : label.toLowerCase());

  const mainCount = e.mainPlotCount ?? 0;
  const subCount = e.subPlotCount ?? 0;
  const subSubCount = e.subSubPlotCount ?? 0;
  const mainData = e.mainPlotData ?? [];
  const subData = e.subPlotData ?? [];
  const subSubData = e.subSubPlotData ?? [];
  // A third level list in use (split-split plot, or a 3-factor factorial).
  const hasC = isSplitSplitPlot || (isFactorial && subSubCount > 0);

  const expectedTreatments = isDerivedTreatments
    ? hasC
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

  const validatePlotData = () => {
    if (mainCount > 0 && mainData.length < mainCount) {
      toast.error(
        `Please configure all ${mainCount} ${names.A} entries before creating treatments.`,
      );
      return false;
    }
    if (subCount > 0 && subData.length < subCount) {
      toast.error(
        `Please configure all ${subCount} ${names.B} entries before creating treatments.`,
      );
      return false;
    }
    if (hasC && subSubCount > 0 && subSubData.length < subSubCount) {
      toast.error(
        `Please configure all ${subSubCount} ${names.C} entries before creating treatments.`,
      );
      return false;
    }
    if (!mainData.length || !subData.length || (hasC && !subSubData.length)) {
      toast.error("Please configure plot data before creating treatments.");
      return false;
    }
    return true;
  };

  const handleCreateTreatments = async () => {
    if (!validatePlotData()) return;

    const ok = window.confirm(
      "Are you sure you want to create treatments? Note: This will override all existing treatments.",
    );
    if (!ok) return;

    setIsGenerating(true);
    try {
      const generated = [];
      let idx = 1;

      for (const m of mainData) {
        for (const s of subData) {
          if (hasC) {
            for (const ss of subSubData) {
              const name = [m.name, s.name, ss.name]
                .map((str) => (str || "").trim())
                .filter(Boolean)
                .join(" | ");

              const descParts = [m.description, s.description, ss.description]
                .map((str) => (str || "").trim().replace(/\.+$/, ""))
                .filter(Boolean);
              const description =
                descParts.length > 0 ? descParts.join(". ") + "." : "";

              generated.push({
                code: `T${idx}`,
                mainPlotCode: m.code,
                subPlotCode: s.code,
                subSubPlotCode: ss.code,
                name: name || `Treatment - ${idx}`,
                description,
              });
              idx++;
            }
          } else {
            const name = [m.name, s.name]
              .map((str) => (str || "").trim())
              .filter(Boolean)
              .join(" | ");

            const descParts = [m.description, s.description]
              .map((str) => (str || "").trim().replace(/\.+$/, ""))
              .filter(Boolean);
            const description =
              descParts.length > 0 ? descParts.join(". ") + "." : "";

            generated.push({
              code: `T${idx}`,
              mainPlotCode: m.code,
              subPlotCode: s.code,
              subSubPlotCode: null,
              name: name || `Treatment - ${idx}`,
              description,
            });
            idx++;
          }
        }
      }

      await save({ treatments: generated });
      toast.success(`Successfully created ${generated.length} treatments.`);
    } catch (err) {
      toast.error(err?.message || "Failed to create treatments.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      {hasPlots && (
        <div className={hasC ? "grid g3" : "grid g2"}>
          <Card
            title={
              mainCount > 0
                ? `${names.A} (${mainData.length} of ${mainCount})`
                : names.A
            }
            pad={mainCount <= 0}
            actions={
              config &&
              mainCount > 0 && (
                <button className="btn ghost sm" onClick={onEditMainPlot}>
                  <ListChecks size={14} /> Edit {lower(names.A)}
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
                    {names.A} count is currently 0. Please set it in experiment
                    details first.
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
                empty={`No ${lower(names.A)} levels yet.`}
                columns={[
                  {
                    label: "Code",
                    render: (t) => <Body as="b">{t.code}</Body>,
                  },
                  { label: names.A, key: "name" },
                  {
                    label: "Details",
                    render: (t) => (
                      <SmallBody muted>{t.description || "—"}</SmallBody>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          <Card
            title={
              subCount > 0
                ? `${names.B} (${subData.length} of ${subCount})`
                : names.B
            }
            pad={subCount <= 0}
            actions={
              config &&
              subCount > 0 && (
                <button className="btn ghost sm" onClick={onEditSubPlot}>
                  <ListChecks size={14} /> Edit {lower(names.B)}
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
                    {names.B} count is currently 0. Please set it in experiment
                    details first.
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
                empty={`No ${lower(names.B)} levels yet.`}
                columns={[
                  {
                    label: "Code",
                    render: (t) => <Body as="b">{t.code}</Body>,
                  },
                  { label: names.B, key: "name" },
                  {
                    label: "Details",
                    render: (t) => (
                      <SmallBody muted>{t.description || "—"}</SmallBody>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {hasC && (
            <Card
              title={
                subSubCount > 0
                  ? `${names.C} (${subSubData.length} of ${subSubCount})`
                  : names.C
              }
              pad={subSubCount <= 0}
              actions={
                config &&
                subSubCount > 0 && (
                  <button className="btn ghost sm" onClick={onEditSubSubPlot}>
                    <ListChecks size={14} /> Edit {lower(names.C)}
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
                      {names.C} count is currently 0. Please set it in
                      experiment details first.
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
                  empty={`No ${lower(names.C)} levels yet.`}
                  columns={[
                    {
                      label: "Code",
                      render: (t) => <Body as="b">{t.code}</Body>,
                    },
                    { label: names.C, key: "name" },
                    {
                      label: "Details",
                      render: (t) => (
                        <SmallBody muted>{t.description || "—"}</SmallBody>
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
                {hasPlots && (
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={handleCreateTreatments}
                    disabled={isGenerating}
                    title="Auto-create treatment combinations from plot/factor data"
                  >
                    <Sparkles size={14} />{" "}
                    {isGenerating ? "Creating…" : "Create treatments"}
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
                      label: names.A,
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
                      label: names.B,
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
                    ...(hasC
                      ? [
                          {
                            label: names.C,
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
                        <SmallBody muted>{t.description || "—"}</SmallBody>
                      ),
                    },
                  ]
                : [
                    {
                      label: "Code",
                      render: (t) => <Body as="b">{t.code}</Body>,
                    },
                    { label: "Treatment", key: "name" },
                    {
                      label: "Details",
                      render: (t) => (
                        <SmallBody muted>{t.description || "—"}</SmallBody>
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
          <SmallBody muted style={{ display: "block", padding: "8px 16px" }}>
            * required before a sheet can be submitted
          </SmallBody>
        </Card>
      </div>
    </div>
  );
}
