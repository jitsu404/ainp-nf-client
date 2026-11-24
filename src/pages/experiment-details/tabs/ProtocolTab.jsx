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
import { useCroppingSystems } from "../../../queries/croppingSystems";

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
  const croppingSystems = useCroppingSystems();

  const isSplitPlot = e.design === "Split plot";
  const isSplitSplitPlot = e.design === "Split-split plot";
  const isFactorial = e.design === "Factorial";
  const hasPlots = isSplitPlot || isSplitSplitPlot || isFactorial;
  const isDerivedTreatments = hasPlots;

  const names = isFactorial
    ? { A: "Factor 1", B: "Factor 2", C: "Factor 3" }
    : { A: "Main Plot", B: "Sub Plot", C: "Sub-sub Plot" };

  const lower = (label) => (isFactorial ? label : label.toLowerCase());

  const mainCount = e.mainPlotCount ?? 0;
  const subCount = e.subPlotCount ?? 0;
  const subSubCount = e.subSubPlotCount ?? 0;

  const level1Data = isFactorial
    ? (e.factor1Data ?? [])
    : (e.mainPlotData ?? []);
  const level2Data = isFactorial
    ? (e.factor2Data ?? [])
    : (e.subPlotData ?? []);
  const level3Data = isFactorial
    ? (e.factor3Data ?? [])
    : (e.subSubPlotData ?? []);

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
    if (mainCount > 0 && level1Data.length < mainCount) {
      toast.error(
        `Please configure all ${mainCount} ${names.A} entries before creating treatments.`,
      );
      return false;
    }
    if (subCount > 0 && level2Data.length < subCount) {
      toast.error(
        `Please configure all ${subCount} ${names.B} entries before creating treatments.`,
      );
      return false;
    }
    if (hasC && subSubCount > 0 && level3Data.length < subSubCount) {
      toast.error(
        `Please configure all ${subSubCount} ${names.C} entries before creating treatments.`,
      );
      return false;
    }
    if (
      !level1Data.length ||
      !level2Data.length ||
      (hasC && !level3Data.length)
    ) {
      toast.error("Please configure level data before creating treatments.");
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

      if (isFactorial) {
        for (const f1 of level1Data) {
          for (const f2 of level2Data) {
            if (hasC && level3Data.length > 0) {
              for (const f3 of level3Data) {
                const name = [f1.name, f2.name, f3.name]
                  .map((str) => (str || "").trim())
                  .filter(Boolean)
                  .join(" | ");

                const descParts = [
                  f1.description,
                  f2.description,
                  f3.description,
                ]
                  .map((str) => (str || "").trim().replace(/\.+$/, ""))
                  .filter(Boolean);
                const description =
                  descParts.length > 0 ? descParts.join(". ") + "." : "";

                generated.push({
                  code: `T${idx}`,
                  factor1Code: f1.code,
                  factor2Code: f2.code,
                  factor3Code: f3.code,
                  mainPlotCode: null,
                  subPlotCode: null,
                  subSubPlotCode: null,
                  name: name || `Treatment - ${idx}`,
                  description,
                });
                idx++;
              }
            } else {
              const name = [f1.name, f2.name]
                .map((str) => (str || "").trim())
                .filter(Boolean)
                .join(" | ");

              const descParts = [f1.description, f2.description]
                .map((str) => (str || "").trim().replace(/\.+$/, ""))
                .filter(Boolean);
              const description =
                descParts.length > 0 ? descParts.join(". ") + "." : "";

              generated.push({
                code: `T${idx}`,
                factor1Code: f1.code,
                factor2Code: f2.code,
                factor3Code: null,
                mainPlotCode: null,
                subPlotCode: null,
                subSubPlotCode: null,
                name: name || `Treatment - ${idx}`,
                description,
              });
              idx++;
            }
          }
        }
      } else {
        // Split plot / Split-split plot
        for (const m of level1Data) {
          for (const s of level2Data) {
            const csName = croppingSystems.subPlotName(s);
            const subLabel = csName || s.code;

            if (hasC && level3Data.length > 0) {
              for (const ss of level3Data) {
                const name = [m.name, subLabel, ss.name]
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
                  factor1Code: null,
                  factor2Code: null,
                  factor3Code: null,
                  name: name || `Treatment - ${idx}`,
                  description,
                });
                idx++;
              }
            } else {
              const name = [m.name, subLabel]
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
                factor1Code: null,
                factor2Code: null,
                factor3Code: null,
                name: name || `Treatment - ${idx}`,
                description,
              });
              idx++;
            }
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
          {/* Card 1: Main Plot / Factor 1 */}
          <Card
            title={
              mainCount > 0
                ? `${names.A} (${level1Data.length} of ${mainCount})`
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
                    Set counts
                  </button>
                )}
              </div>
            ) : (
              <Table
                rows={level1Data.map((t) => ({ ...t, id: t.code }))}
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

          {/* Card 2: Sub Plot (Cropping System) / Factor 2 */}
          <Card
            title={
              subCount > 0
                ? `${names.B} (${level2Data.length} of ${subCount})`
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
                    Set counts
                  </button>
                )}
              </div>
            ) : (
              <Table
                rows={level2Data.map((t) => ({ ...t, id: t.code }))}
                pageSize={30}
                empty={`No ${lower(names.B)} levels yet.`}
                columns={[
                  {
                    label: "Code",
                    render: (t) => <Body as="b">{t.code}</Body>,
                  },
                  {
                    label: isFactorial ? names.B : "Cropping System",
                    render: (t) =>
                      isFactorial ? (
                        t.name || "—"
                      ) : (
                        <span>
                          <b>
                            {croppingSystems.subPlotName(t) || "Not selected"}
                          </b>
                        </span>
                      ),
                  },
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

          {/* Card 3: Sub-sub Plot / Factor 3 */}
          {hasC && (
            <Card
              title={
                subSubCount > 0
                  ? `${names.C} (${level3Data.length} of ${subSubCount})`
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
                      Set counts
                    </button>
                  )}
                </div>
              ) : (
                <Table
                  rows={level3Data.map((t) => ({ ...t, id: t.code }))}
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

      {/* Treatments Section */}
      <div
        className={isDerivedTreatments ? "stack" : "grid g2"}
        style={{ gap: 16 }}
      >
        <Card
          title={
            isDerivedTreatments && expectedTreatments > 0
              ? `Treatments (${e.treatments?.length ?? 0} of ${expectedTreatments})`
              : `Treatments (${e.treatments?.length ?? 0})`
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
            rows={(e.treatments ?? []).map((t) => ({ ...t, id: t.code }))}
            pageSize={30}
            empty="No treatments yet."
            columns={
              isDerivedTreatments
                ? [
                    { label: "Code", render: (t) => <b>{t.code}</b> },
                    {
                      label: names.A,
                      render: (t) => {
                        const code = isFactorial
                          ? t.factor1Code
                          : t.mainPlotCode;
                        const item = level1Data.find((m) => m.code === code);
                        return code ? (
                          <span>
                            <b>{code}</b>
                            {item?.name ? (
                              <span className="muted small">
                                {" "}
                                ({item.name})
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
                    {
                      label: names.B,
                      render: (t) => {
                        const code = isFactorial
                          ? t.factor2Code
                          : t.subPlotCode;
                        const item = level2Data.find((s) => s.code === code);
                        const label = isFactorial
                          ? item?.name
                          : croppingSystems.subPlotName(item);
                        return code ? (
                          <span>
                            <b>{code}</b>
                            {label ? (
                              <span className="muted small"> ({label})</span>
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
                              const code = isFactorial
                                ? t.factor3Code
                                : t.subSubPlotCode;
                              const item = level3Data.find(
                                (ss) => ss.code === code,
                              );
                              return code ? (
                                <span>
                                  <b>{code}</b>
                                  {item?.name ? (
                                    <span className="muted small">
                                      {" "}
                                      ({item.name})
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
