import { useState } from "react";
import {
  AlertCircle,
  Loader2,
  Lock,
  SlidersHorizontal,
  Unlock,
} from "lucide-react";
import { Body, Card, SmallBody, Table } from "../../../components/ui";
import { useCroppingSystems } from "../../../queries/croppingSystems";
import { UpdateProtocolModal } from "../components";

/**
 * Lock/Unlock Toggle Button for Protocol sections.
 */
function SectionLockToggle({ lockedKey, locked = [], canLock, onToggle }) {
  const [loading, setLoading] = useState(false);
  const isLocked = locked.includes(lockedKey);

  const handleClick = async () => {
    if (!canLock || loading) return;
    setLoading(true);
    try {
      await onToggle(lockedKey, !isLocked);
    } catch {
      // Error handled by onToggle/query
    } finally {
      setLoading(false);
    }
  };

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
        cursor: canLock && !loading ? "pointer" : "default",
        fontWeight: 600,
        fontSize: "0.8rem",
        padding: "4px 10px",
        height: 28,
        borderRadius: 6,
        opacity: loading ? 0.7 : 1,
      }}
      disabled={!canLock || loading}
      onClick={handleClick}
      title={
        loading
          ? "Updating lock status…"
          : canLock
            ? isLocked
              ? `Section is locked. Click to unlock.`
              : `Section is unlocked. Click to lock.`
            : isLocked
              ? `Locked`
              : `Unlocked`
      }
    >
      {loading ? (
        <Loader2 size={13} className="spin" />
      ) : isLocked ? (
        <Lock size={13} />
      ) : (
        <Unlock size={13} />
      )}
      <span>
        {loading
          ? isLocked
            ? "Unlocking…"
            : "Locking…"
          : isLocked
            ? "Locked"
            : "Unlocked"}
      </span>
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
  const croppingSystems = useCroppingSystems();

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

  // Use the trial's own level data and treatments
  const level1Data = isFactorial
    ? (t.factor1Data ?? [])
    : (t.mainPlotData ?? []);
  const level2Data = isFactorial
    ? (t.factor2Data ?? [])
    : (t.subPlotData ?? []);
  const level3Data = isFactorial
    ? (t.factor3Data ?? [])
    : (t.subSubPlotData ?? []);
  const treatments = t.treatments ?? [];
  const locked = t.locked ?? [];

  const expectedTreatments = isDerivedTreatments
    ? hasC
      ? mainCount * subCount * subSubCount
      : mainCount * subCount
    : null;

  const parameters = e.defaultParameters ?? e.parameters ?? [];

  const canEditProtocol = edit || canLock;
  const lockKeyA = isFactorial ? "factor1" : "mainPlot";
  const lockKeyB = isFactorial ? "factor2" : "subPlot";
  const lockKeyC = isFactorial ? "factor3" : "subSubPlot";

  const allSectionsLocked =
    (hasPlots
      ? (locked.includes("mainPlot") || locked.includes("factor1")) &&
        (locked.includes("subPlot") || locked.includes("factor2"))
      : true) &&
    (hasC
      ? locked.includes("subSubPlot") || locked.includes("factor3")
      : true) &&
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
        <SmallBody muted>
          Protocol setup for this trial based on <b>{e.design || "Standard"}</b>{" "}
          design.
        </SmallBody>
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

      {/* Plots / Factors Configuration */}
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
              <SectionLockToggle
                lockedKey={lockKeyA}
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
                rows={level1Data.map((m) => ({ ...m, id: m.code }))}
                pageSize={30}
                empty={`No ${names.A.toLowerCase()} configured.`}
                columns={[
                  { label: "Code", render: (m) => <b>{m.code}</b> },
                  { label: names.A, key: "name" },
                  {
                    label: "Details",
                    render: (m) => (
                      <SmallBody muted>{m.description || "—"}</SmallBody>
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
              <SectionLockToggle
                lockedKey={lockKeyB}
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
                rows={level2Data.map((s) => ({ ...s, id: s.code }))}
                pageSize={30}
                empty={`No ${names.B.toLowerCase()} configured.`}
                columns={[
                  { label: "Code", render: (s) => <b>{s.code}</b> },
                  {
                    label: isFactorial ? names.B : "Cropping System",
                    render: (s) =>
                      isFactorial ? (
                        s.name || "—"
                      ) : (
                        <span>
                          <b>
                            {croppingSystems.subPlotName(s) || "Not selected"}
                          </b>
                        </span>
                      ),
                  },
                  {
                    label: "Details",
                    render: (s) => (
                      <SmallBody muted>{s.description || "—"}</SmallBody>
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
                <SectionLockToggle
                  lockedKey={lockKeyC}
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
                  rows={level3Data.map((ss) => ({ ...ss, id: ss.code }))}
                  pageSize={30}
                  empty={`No ${names.C.toLowerCase()} configured.`}
                  columns={[
                    { label: "Code", render: (ss) => <b>{ss.code}</b> },
                    { label: names.C, key: "name" },
                    {
                      label: "Details",
                      render: (ss) => (
                        <SmallBody muted>{ss.description || "—"}</SmallBody>
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
                        const code = isFactorial
                          ? tr.factor1Code
                          : tr.mainPlotCode;
                        const item = level1Data.find((m) => m.code === code);
                        return code ? (
                          <span>
                            <b>{code}</b>
                            {item?.name ? (
                              <SmallBody muted> ({item.name})</SmallBody>
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
                        const code = isFactorial
                          ? tr.factor2Code
                          : tr.subPlotCode;
                        const item = level2Data.find((s) => s.code === code);
                        const label = isFactorial
                          ? item?.name
                          : croppingSystems.subPlotName(item);
                        return code ? (
                          <span>
                            <b>{code}</b>
                            {label ? (
                              <SmallBody muted> ({label})</SmallBody>
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
                              const code = isFactorial
                                ? tr.factor3Code
                                : tr.subSubPlotCode;
                              const item = level3Data.find(
                                (ss) => ss.code === code,
                              );
                              return code ? (
                                <span>
                                  <b>{code}</b>
                                  {item?.name ? (
                                    <SmallBody muted> ({item.name})</SmallBody>
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
                        <SmallBody muted>{tr.description || "—"}</SmallBody>
                      ),
                    },
                  ]
                : [
                    { label: "Code", render: (tr) => <b>{tr.code}</b> },
                    { label: "Treatment", key: "name" },
                    {
                      label: "Details",
                      render: (tr) => (
                        <SmallBody muted>{tr.description || "—"}</SmallBody>
                      ),
                    },
                  ]
            }
          />
        </Card>

        {/* Parameters Recorded Card */}
        <Card
          title="Parameters recorded"
          pad={false}
          actions={
            <SectionLockToggle
              lockedKey="parameters"
              locked={locked}
              canLock={canLock}
              onToggle={onToggleLock}
            />
          }
        >
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
          <SmallBody muted style={{ display: "block", padding: "8px 16px" }}>
            * required before a sheet can be submitted
          </SmallBody>
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
