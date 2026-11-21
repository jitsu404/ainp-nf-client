import { useState } from "react";
import { AlertCircle, Lock, SlidersHorizontal, Unlock } from "lucide-react";
import { Card, Table } from "../../../components/ui";
import { UpdateProtocolModal } from "../components";

/**
 * Lock/Unlock Toggle Button for Protocol sections.
 */
function SectionLockToggle({ lockedKey, locked = [], canLock, onToggle }) {
  const isLocked = locked.includes(lockedKey);

  return (
    <button
      type="button"
      className="btn sm"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: isLocked
          ? "var(--amber-bg, #fdf1dc)"
          : "var(--green-bg, #e7f5ec)",
        color: isLocked ? "var(--amber, #a86200)" : "var(--green, #1b7f4b)",
        borderColor: isLocked
          ? "rgba(168, 98, 0, 0.3)"
          : "rgba(27, 127, 75, 0.3)",
        cursor: canLock ? "pointer" : "default",
        fontWeight: 600,
        fontSize: "0.8rem",
        padding: "4px 10px",
        height: 28,
        borderRadius: 6,
      }}
      disabled={!canLock}
      onClick={() => canLock && onToggle(lockedKey, !isLocked)}
      title={
        canLock
          ? isLocked
            ? `Section is locked. Click to unlock.`
            : `Section is unlocked. Click to lock.`
          : isLocked
            ? `Locked`
            : `Unlocked`
      }
    >
      {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
      <span>{isLocked ? "Locked" : "Unlocked"}</span>
    </button>
  );
}

export function TrialProtocolTab({
  trial: t,
  unit,
  canLock,
  edit,
  save,
  onToggleLock,
}) {
  const [openWizard, setOpenWizard] = useState(false);
  const e = t.experiment ?? {};
  const isSplitPlot = e.design === "Split plot";
  const isSplitSplitPlot = e.design === "Split-split plot";
  const isFactorial = e.design === "Factorial";
  const hasPlots = isSplitPlot || isSplitSplitPlot || isFactorial;
  const isDerivedTreatments = hasPlots;

  const mainCount = e.mainPlotCount ?? 0;
  const subCount = e.subPlotCount ?? 0;
  const subSubCount = e.subSubPlotCount ?? 0;
  const hasC = isSplitSplitPlot || (isFactorial && subSubCount > 0);
  const names = isFactorial
    ? { A: "Factor 1", B: "Factor 2", C: "Factor 3" }
    : { A: "Main Plot", B: "Sub Plot", C: "Sub-sub Plot" };

  // Use the trial's own plot data and treatments
  const mainData = t.mainPlotData ?? [];
  const subData = t.subPlotData ?? [];
  const subSubData = t.subSubPlotData ?? [];
  const treatments = t.treatments ?? [];
  const locked = t.locked ?? [];

  const expectedTreatments = isDerivedTreatments
    ? hasC
      ? mainCount * subCount * subSubCount
      : mainCount * subCount
    : null;

  const parameters = e.defaultParameters ?? e.parameters ?? [];

  const canEditProtocol = edit || canLock;
  const allSectionsLocked =
    (hasPlots
      ? locked.includes("mainPlot") && locked.includes("subPlot")
      : true) &&
    (hasC ? locked.includes("subSubPlot") : true) &&
    locked.includes("treatments") &&
    locked.includes("parameters");

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Protocol Toolbar / Action Row */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div className="muted small">
          Protocol setup for this trial based on <b>{e.design || "Standard"}</b>{" "}
          design.
        </div>
        {canEditProtocol && (
          <button
            type="button"
            className="btn sm"
            onClick={() => setOpenWizard(true)}
            disabled={allSectionsLocked}
            title={
              allSectionsLocked
                ? "All protocol sections are locked"
                : "Update trial protocol (plots, treatments, parameters)"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "6px 14px",
            }}
          >
            <SlidersHorizontal size={14} /> Update protocol
          </button>
        )}
      </div>

      {/* Split / Split-split Plots Configuration */}
      {hasPlots && (
        <div className={hasC ? "grid g3" : "grid g2"}>
          {/* Main Plot Card */}
          <Card
            title={
              mainCount > 0
                ? `${names.A} (${mainData.length} of ${mainCount})`
                : names.A
            }
            pad={mainCount <= 0}
            actions={
              <SectionLockToggle
                lockedKey="mainPlot"
                locked={locked}
                canLock={canLock}
                onToggle={onToggleLock}
              />
            }
          >
            {mainCount <= 0 ? (
              <div className="note warn">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>
                  {names.A} Count is currently 0 in experiment protocol.
                </span>
              </div>
            ) : (
              <Table
                rows={mainData.map((m) => ({ ...m, id: m.code }))}
                pageSize={30}
                empty={`No ${names.A.toLowerCase()} configured.`}
                columns={[
                  { label: "Code", render: (m) => <b>{m.code}</b> },
                  { label: names.A, key: "name" },
                  {
                    label: "Details",
                    render: (m) => (
                      <span className="muted small">
                        {m.description || "—"}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {/* Sub Plot Card */}
          <Card
            title={
              subCount > 0
                ? `${names.B} (${subData.length} of ${subCount})`
                : names.B
            }
            pad={subCount <= 0}
            actions={
              <SectionLockToggle
                lockedKey="subPlot"
                locked={locked}
                canLock={canLock}
                onToggle={onToggleLock}
              />
            }
          >
            {subCount <= 0 ? (
              <div className="note warn">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>
                  {names.B} Count is currently 0 in experiment protocol.
                </span>
              </div>
            ) : (
              <Table
                rows={subData.map((s) => ({ ...s, id: s.code }))}
                pageSize={30}
                empty={`No ${names.B.toLowerCase()} configured.`}
                columns={[
                  { label: "Code", render: (s) => <b>{s.code}</b> },
                  { label: names.B, key: "name" },
                  {
                    label: "Details",
                    render: (s) => (
                      <span className="muted small">
                        {s.description || "—"}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {/* Sub-sub Plot Card */}
          {hasC && (
            <Card
              title={
                subSubCount > 0
                  ? `${names.C} (${subSubData.length} of ${subSubCount})`
                  : names.C
              }
              pad={subSubCount <= 0}
              actions={
                <SectionLockToggle
                  lockedKey="subSubPlot"
                  locked={locked}
                  canLock={canLock}
                  onToggle={onToggleLock}
                />
              }
            >
              {subSubCount <= 0 ? (
                <div className="note warn">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    {names.C} Count is currently 0 in experiment protocol.
                  </span>
                </div>
              ) : (
                <Table
                  rows={subSubData.map((ss) => ({ ...ss, id: ss.code }))}
                  pageSize={30}
                  empty={`No ${names.C.toLowerCase()} configured.`}
                  columns={[
                    { label: "Code", render: (ss) => <b>{ss.code}</b> },
                    { label: names.C, key: "name" },
                    {
                      label: "Details",
                      render: (ss) => (
                        <span className="muted small">
                          {ss.description || "—"}
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

      {/* Treatments Section */}
      <div
        className={isDerivedTreatments ? "stack" : "grid g2"}
        style={{ gap: 16 }}
      >
        <Card
          title={
            isDerivedTreatments && expectedTreatments > 0
              ? `Treatments (${treatments.length} of ${expectedTreatments})`
              : `Treatments (${treatments.length})`
          }
          pad={false}
          actions={
            <SectionLockToggle
              lockedKey="treatments"
              locked={locked}
              canLock={canLock}
              onToggle={onToggleLock}
            />
          }
        >
          <Table
            rows={treatments.map((tr) => ({ ...tr, id: tr.code }))}
            pageSize={30}
            empty="No treatments configured yet."
            columns={
              isDerivedTreatments
                ? [
                    { label: "Code", render: (tr) => <b>{tr.code}</b> },
                    {
                      label: names.A,
                      render: (tr) => {
                        const name = mainData.find(
                          (m) => m.code === tr.mainPlotCode,
                        )?.name;
                        return tr.mainPlotCode ? (
                          <span>
                            <b>{tr.mainPlotCode}</b>
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
                      render: (tr) => {
                        const name = subData.find(
                          (s) => s.code === tr.subPlotCode,
                        )?.name;
                        return tr.subPlotCode ? (
                          <span>
                            <b>{tr.subPlotCode}</b>
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
                            render: (tr) => {
                              const name = subSubData.find(
                                (ss) => ss.code === tr.subSubPlotCode,
                              )?.name;
                              return tr.subSubPlotCode ? (
                                <span>
                                  <b>{tr.subSubPlotCode}</b>
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
                      render: (tr) => (
                        <span className="muted small">
                          {tr.description || "—"}
                        </span>
                      ),
                    },
                  ]
                : [
                    { label: "Code", render: (tr) => <b>{tr.code}</b> },
                    { label: "Treatment", key: "name" },
                    {
                      label: "Details",
                      render: (tr) => (
                        <span className="muted small">
                          {tr.description || "—"}
                        </span>
                      ),
                    },
                  ]
            }
          />
        </Card>

        {/* Parameters Recorded Card */}
        <Card title="Parameters recorded" pad={false}>
          <Table
            rows={parameters.map((p) => ({
              ...p,
              id: p.parameterId,
            }))}
            pageSize={30}
            empty="No parameters recorded."
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
                  </>
                ),
              },
              { label: "Unit", render: (p) => unit?.(p.unitCode) || "—" },
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

      {/* Multi-step Protocol Update Modal */}
      {openWizard && (
        <UpdateProtocolModal
          trial={t}
          save={save}
          onClose={() => setOpenWizard(false)}
        />
      )}
    </div>
  );
}
