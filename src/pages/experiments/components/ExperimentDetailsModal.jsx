import { useEffect, useState } from "react";
import { useAuth } from "../../../auth";
import { ExperimentPiPicker } from "../../../components/ExperimentPis";
import { SaveModal } from "../../../components/forms";
import { Body, SmallBody } from "../../../components/ui";
import {
  DESIGN_HINTS,
  DESIGNS_NEEDING_REPLICATIONS,
  DESIGNS_WITH_PLOTS,
  MAX_PLOT_COUNT,
  EXPERIMENT_DESIGNS,
  EXPERIMENT_STATUSES,
  UNREPLICATED_DESIGNS,
} from "../../../config/constants";
import { toast } from "../../../lib/toast";
import {
  useFinancialYears,
  useMasterOptions,
  useMasters,
} from "../../../queries/masters";
import { useCreateExperiment } from "../../../queries/research";
import { ExperimentSeasonsField } from "./ExperimentSeasonsField";

const parseInitialSeasons = (seasonsData) => {
  if (!seasonsData) return {};
  if (seasonsData instanceof Map) {
    const obj = {};
    for (const [k, v] of seasonsData.entries()) {
      obj[k] = Array.isArray(v)
        ? v.map((item) =>
            typeof item === "object" ? item?._id || item?.id : String(item),
          )
        : [];
    }
    return obj;
  }
  if (Array.isArray(seasonsData)) {
    return Object.fromEntries(
      seasonsData.map((s) => [typeof s === "string" ? s : s?.code, []]),
    );
  }
  if (typeof seasonsData === "object") {
    const obj = {};
    for (const [k, v] of Object.entries(seasonsData)) {
      obj[k] = Array.isArray(v)
        ? v.map((item) =>
            typeof item === "object" ? item?._id || item?.id : String(item),
          )
        : [];
    }
    return obj;
  }
  return {};
};

export function ExperimentDetailsModal({
  experiment,
  save,
  onClose,
  onCreated,
}) {
  const create = useCreateExperiment();
  const programmes = useMasterOptions("programme");
  const seasons = useMasterOptions("season");
  // Every crop: the seasons field offers inactive ones only where already chosen.
  const crops = useMasters("crop");
  const years = useFinancialYears();
  // Only the PCU links the Experiment PI (research.assign), and here only when creating; later
  // it is Assign / Change PI on the experiment page.
  const { can } = useAuth();
  const pickPi = !experiment && can("research.assign");

  const currentYearCode = years.data?.find((y) => y.isCurrent)?.code ?? "";
  const defaultYear = currentYearCode
    ? Number(currentYearCode.slice(0, 4))
    : new Date().getFullYear();

  const [v, setV] = useState(() => ({
    title: experiment?.title ?? "",
    programmeCode: experiment?.programmeCode ?? "",
    design: experiment?.design ?? "RBD",
    replications: experiment ? (experiment.replications ?? "") : 3,
    mainPlotCount: experiment?.mainPlotCount ?? 0,
    subPlotCount: experiment?.subPlotCount ?? 0,
    subSubPlotCount: experiment?.subSubPlotCount ?? 0,
    startYear: experiment?.startYear ?? defaultYear,
    endYear: experiment?.endYear ?? defaultYear + 3,
    piUserId: null,
    seasons: parseInitialSeasons(experiment?.seasons),
    objectives: (experiment?.objectives ?? []).join("\n"),
    status: experiment?.status ?? "Draft",
    referenceTreatmentCode: experiment?.referenceTreatmentCode ?? "",
  }));

  useEffect(() => {
    if (experiment) {
      setV({
        title: experiment.title ?? "",
        programmeCode: experiment.programmeCode ?? "",
        design: experiment.design ?? "RBD",
        replications: experiment.replications ?? "",
        mainPlotCount: experiment.mainPlotCount ?? 0,
        subPlotCount: experiment.subPlotCount ?? 0,
        subSubPlotCount: experiment.subSubPlotCount ?? 0,
        startYear: experiment.startYear ?? defaultYear,
        endYear: experiment.endYear ?? defaultYear + 3,
        piUserId: null,
        seasons: parseInitialSeasons(experiment.seasons),
        objectives: (experiment.objectives ?? []).join("\n"),
        status: experiment.status ?? "Draft",
        referenceTreatmentCode: experiment.referenceTreatmentCode ?? "",
      });
    }
  }, [experiment, defaultYear]);

  const set = (k, value) => setV((s) => ({ ...s, [k]: value }));
  const replicated = !UNREPLICATED_DESIGNS.includes(v.design);
  const needsReps = DESIGNS_NEEDING_REPLICATIONS.includes(v.design);
  const reps = String(v.replications ?? "").trim();

  // Strip plot may be un-replicated (empty); otherwise replicated designs need 2 or more.
  const repsOk = !replicated
    ? true
    : reps === ""
      ? !needsReps
      : Number.isInteger(Number(reps)) &&
        Number(reps) >= 2 &&
        Number(reps) <= 20;

  // Split / strip / split-split plot: 1–10 main plots, sub plots (and sub-sub plots). Factorial:
  // 2–10 levels of factors A and B, and optionally of a factor C. Treatments are the combinations.
  const isFactorial = v.design === "Factorial";
  const plotted = DESIGNS_WITH_PLOTS.includes(v.design) || isFactorial;
  const isSplitSplit = v.design === "Split-split plot";
  const countOk = (x, min = 1) =>
    Number.isInteger(Number(x)) &&
    Number(x) >= min &&
    Number(x) <= MAX_PLOT_COUNT;
  const plotsOk =
    !plotted ||
    (isFactorial
      ? countOk(v.mainPlotCount, 2) &&
        countOk(v.subPlotCount, 2) &&
        (!Number(v.subSubPlotCount) || countOk(v.subSubPlotCount, 2))
      : countOk(v.mainPlotCount) &&
        countOk(v.subPlotCount) &&
        (!isSplitSplit || countOk(v.subSubPlotCount)));
  const plotCount = plotted
    ? Number(v.mainPlotCount) *
      Number(v.subPlotCount) *
      (isSplitSplit || (isFactorial && Number(v.subSubPlotCount))
        ? Number(v.subSubPlotCount)
        : 1)
    : 1;

  const startYearNum = Number(v.startYear);
  const endYearNum = Number(v.endYear);
  const yearsOk =
    Number.isInteger(startYearNum) &&
    startYearNum >= 1900 &&
    startYearNum <= 2100 &&
    Number.isInteger(endYearNum) &&
    endYearNum >= 1900 &&
    endYearNum <= 2100 &&
    endYearNum >= startYearNum;

  const locked = experiment?.dataLocked;

  const body = () => {
    const b = {
      title: v.title.trim(),
      programmeCode: v.programmeCode,
      startYear: startYearNum,
      endYear: endYearNum,
      seasons: v.seasons,
      objectives: v.objectives
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    // Once data exists the design, replications and plots are frozen; don't send them unchanged.
    if (!locked) {
      b.design = v.design;
      b.replications = replicated && reps !== "" ? Number(reps) : null;
      b.mainPlotCount = plotted ? Number(v.mainPlotCount) : 0;
      b.subPlotCount = plotted ? Number(v.subPlotCount) : 0;
      b.subSubPlotCount =
        isSplitSplit || isFactorial ? Number(v.subSubPlotCount) || 0 : 0;
    }
    if (experiment) {
      b.status = v.status;
      b.referenceTreatmentCode = v.referenceTreatmentCode || null;
    } else if (pickPi && v.piUserId) {
      b.piUserId = v.piUserId;
    }
    return b;
  };

  const onSave = async () => {
    if (experiment) {
      await save(body());
      toast.success("Experiment saved");
    } else {
      const created = await create.mutateAsync(body());
      toast.success(`${created.code} created`);
      onCreated?.(created);
    }
  };

  const ready =
    v.title.trim().length >= 5 &&
    v.programmeCode &&
    yearsOk &&
    repsOk &&
    plotsOk;

  return (
    <SaveModal
      title={experiment ? `Edit ${experiment.code}` : "New experiment"}
      subtitle={
        experiment
          ? undefined
          : "Treatments, parameters and centres are added after creation. The PI is optional and can be assigned later."
      }
      onSave={onSave}
      onClose={onClose}
      canSave={Boolean(ready)}
      submitLabel={experiment ? "Save" : "Create experiment"}
      bodyStyle={{
        maxHeight: "85svh",
        overflowY: "auto",
        paddingRight: "6px",
      }}
    >
      {locked && (
        <Body as="div" className="note warn">
          Centres have recorded data, so the design, replications and plots can
          no longer change.
        </Body>
      )}
      <div className="form">
        <div className="field">
          <label>Experiment Code</label>
          {experiment ? (
            <input value={experiment.code} disabled className="mono" />
          ) : (
            <Body
              as="div"
              className="note info"
              style={{ margin: 0, padding: "8px 12px" }}
            >
              Autogenerated upon creation (e.g. <code>AINP-NF-EXPT-001</code>)
            </Body>
          )}
        </div>

        <div className="field">
          <label htmlFor="x-prog">Programme</label>
          <select
            id="x-prog"
            value={v.programmeCode}
            onChange={(e) => set("programmeCode", e.target.value)}
          >
            <option value="">Select…</option>
            {programmes.options.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field full">
          <label htmlFor="x-title">Title</label>
          <input
            id="x-title"
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Full title of the experiment protocol"
          />
        </div>

        <div className="field">
          <label htmlFor="x-design">Design</label>
          <select
            id="x-design"
            value={v.design}
            disabled={locked}
            onChange={(e) => set("design", e.target.value)}
          >
            {EXPERIMENT_DESIGNS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <SmallBody muted>{DESIGN_HINTS[v.design]}</SmallBody>
        </div>

        <div className="field">
          <label htmlFor="x-reps">Replications</label>
          <input
            id="x-reps"
            type="number"
            min={2}
            max={20}
            value={replicated ? (v.replications ?? "") : ""}
            disabled={!replicated || locked}
            onChange={(e) => set("replications", e.target.value)}
            placeholder={
              !replicated
                ? "Not replicated"
                : needsReps
                  ? ""
                  : "None (un-replicated)"
            }
          />
          {replicated && !repsOk && (
            <SmallBody className="field-error">
              {needsReps
                ? `${v.design} needs 2–20 replications.`
                : "Leave empty, or enter 2–20."}
            </SmallBody>
          )}
        </div>

        {plotted && (
          <>
            <div className="field">
              <label htmlFor="x-main-plots">
                {v.design === "Strip plot"
                  ? "Horizontal strips"
                  : isFactorial
                    ? "Factor 1 levels"
                    : "Main plots"}
              </label>
              <input
                id="x-main-plots"
                type="number"
                min={1}
                max={MAX_PLOT_COUNT}
                value={v.mainPlotCount || ""}
                disabled={locked}
                onChange={(e) => set("mainPlotCount", e.target.value)}
                placeholder={`1–${MAX_PLOT_COUNT}`}
              />
            </div>

            <div className="field">
              <label htmlFor="x-sub-plots">
                {v.design === "Strip plot"
                  ? "Vertical strips"
                  : isFactorial
                    ? "Factor 2 levels"
                    : "Sub plots per main plot"}
              </label>
              <input
                id="x-sub-plots"
                type="number"
                min={1}
                max={MAX_PLOT_COUNT}
                value={v.subPlotCount || ""}
                disabled={locked}
                onChange={(e) => set("subPlotCount", e.target.value)}
                placeholder={`1–${MAX_PLOT_COUNT}`}
              />
            </div>

            {(isSplitSplit || isFactorial) && (
              <div className="field">
                <label htmlFor="x-sub-sub-plots">
                  {isFactorial
                    ? "Factor 3 levels (optional)"
                    : "Sub-sub plots per sub plot"}
                </label>
                <input
                  id="x-sub-sub-plots"
                  type="number"
                  min={1}
                  max={MAX_PLOT_COUNT}
                  value={v.subSubPlotCount || ""}
                  disabled={locked}
                  onChange={(e) => set("subSubPlotCount", e.target.value)}
                  placeholder={`1–${MAX_PLOT_COUNT}`}
                />
              </div>
            )}

            <div className="field full">
              {plotsOk ? (
                <SmallBody muted>
                  {plotCount}{" "}
                  {isFactorial
                    ? `treatment combination${plotCount === 1 ? "" : "s"}`
                    : `plot${plotCount === 1 ? "" : "s"}`}
                  {/* records every treatment
                  {replicated && reps !== "" ? ` × ${reps} replications` : ""}. */}
                </SmallBody>
              ) : (
                <SmallBody className="field-error">
                  {isFactorial
                    ? `Enter 2–${MAX_PLOT_COUNT} levels of factors 1 and 2 (and of 3, if used).`
                    : isSplitSplit
                      ? `Enter 1–${MAX_PLOT_COUNT} main plots, sub plots, and sub-sub plots.`
                      : `Enter 1–${MAX_PLOT_COUNT} main plots and sub plots.`}
                </SmallBody>
              )}
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="x-start-year">Start Year</label>
          <input
            id="x-start-year"
            type="number"
            min={1900}
            max={2100}
            value={v.startYear}
            onChange={(e) => set("startYear", e.target.value)}
            placeholder="e.g. 2024"
          />
        </div>

        <div className="field">
          <label htmlFor="x-end-year">End Year</label>
          <input
            id="x-end-year"
            type="number"
            min={1900}
            max={2100}
            value={v.endYear}
            onChange={(e) => set("endYear", e.target.value)}
            placeholder="e.g. 2027"
          />
          {startYearNum > endYearNum && (
            <SmallBody className="field-error">
              End year must be greater than or equal to start year.
            </SmallBody>
          )}
        </div>

        {pickPi && (
          <ExperimentPiPicker
            value={v.piUserId}
            onChange={(id) => set("piUserId", id)}
          />
        )}

        {experiment && (
          <div className="field">
            <label htmlFor="x-status">Status</label>
            <select
              id="x-status"
              value={v.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {EXPERIMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <SmallBody muted>
              Centres can record data only while the experiment is Active.
            </SmallBody>
          </div>
        )}

        {experiment && experiment.treatments.length > 0 && (
          <div className="field">
            <label htmlFor="x-ref">Reference treatment</label>
            <select
              id="x-ref"
              value={v.referenceTreatmentCode}
              onChange={(e) => set("referenceTreatmentCode", e.target.value)}
            >
              <option value="">None</option>
              {experiment.treatments.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code} · {t.name}
                </option>
              ))}
            </select>
            <SmallBody muted>
              Results show each treatment as % above or below this one.
            </SmallBody>
          </div>
        )}

        <ExperimentSeasonsField
          value={v.seasons}
          onChange={(newSeasons) => set("seasons", newSeasons)}
          seasonOptions={seasons.options}
          cropOptions={crops.data ?? []}
        />

        <div className="field full">
          <label htmlFor="x-obj">
            Objectives <SmallBody muted>(optional, one per line)</SmallBody>
          </label>
          <textarea
            id="x-obj"
            rows={3}
            value={v.objectives}
            onChange={(e) => set("objectives", e.target.value)}
          />
        </div>
      </div>
    </SaveModal>
  );
}
