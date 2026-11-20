import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { sheetsApi } from "../api";
import {
  ROUTES,
  defaultExperimentYear,
  experimentYears,
} from "../config/constants";
import { inProtocolSeasons } from "../lib/seasonCrops";
import { toast } from "../lib/toast";
import { BarChart } from "./Charts";
import { fmt, fmtPct, pctVs } from "../lib/results";
import { useMasterOptions, useUnitLabel } from "../queries/masters";
import { useExperimentSummary } from "../queries/research";
import { ErrorNote } from "./forms";
import { Badge, Card, Select } from "./ui";

// Results across centres for one year (and season): treatment means per centre, % vs a reference
// treatment, optional grouping by cropping system, and the pooled analysis over locations.

const mean = (xs) => {
  const ys = xs.filter((x) => x !== null && x !== undefined);
  return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null;
};

export function ExperimentResults({ experiment, canSeeUnapproved }) {
  const seasons = useMasterOptions("season");
  const [fy, setFy] = useState("");
  const [season, setSeason] = useState("");
  const [all, setAll] = useState(false);
  const [chosenRef, setChosenRef] = useState(null);
  const [grouped, setGrouped] = useState(false);
  // The experiment's years, start to end; by default this year (or the nearest one).
  const yearList = experimentYears(experiment);
  const year = Number(fy) || defaultExperimentYear(experiment);
  const summary = useExperimentSummary({
    experimentId: experiment.id,
    year,
    seasonCode: season || undefined,
    includeUnapproved: all || undefined,
  });
  const s = summary.data;
  const ref = chosenRef ?? experiment.referenceTreatmentCode ?? "";

  return (
    <div className="stack">
      <Card pad={false}>
        <div className="toolbar" style={{ flexWrap: "wrap" }}>
          <Select
            value={String(year)}
            onChange={setFy}
            options={yearList.map((y) => String(y))}
          />
          <Select
            value={season}
            onChange={setSeason}
            options={seasons.options.filter(([c]) =>
              inProtocolSeasons(experiment.seasons, c),
            )}
            all="All seasons"
          />
          <label className="row small" style={{ gap: 6 }}>
            Compare with
            <select
              className="select"
              value={ref}
              onChange={(e) => setChosenRef(e.target.value)}
              aria-label="Reference treatment"
            >
              <option value="">No reference</option>
              {experiment.treatments.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code} · {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="row small" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={grouped}
              onChange={(e) => setGrouped(e.target.checked)}
            />
            Group by cropping system
          </label>
          {canSeeUnapproved && (
            <label className="row small" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => setAll(e.target.checked)}
              />
              Include sheets not yet approved
            </label>
          )}
        </div>
      </Card>
      {s && s.centres.length > 0 && (
        <div className="row">
          <span className="grow" />
          <button
            className="btn ghost sm"
            onClick={() =>
              sheetsApi
                .exportSummary({
                  experimentId: experiment.id,
                  year,
                  seasonCode: season || undefined,
                  includeUnapproved: all || undefined,
                })
                .catch((err) => toast.error(err.message))
            }
          >
            <Download size={14} /> Export to Excel
          </button>
        </div>
      )}
      <ErrorNote error={summary.error} />
      {summary.isPending && <p className="muted">Loading…</p>}
      {s && !s.centres.length && (
        <div className="empty card">
          No {all ? "" : "approved "}sheets for {year} yet.
        </div>
      )}
      {s &&
        s.centres.length > 0 &&
        s.parameters.map((p) => (
          <ParameterResults
            key={p.parameterId}
            summary={s}
            parameter={p}
            reference={ref}
            grouped={grouped}
            seasonName={seasons.nameOf}
          />
        ))}
    </div>
  );
}

function ParameterResults({
  summary,
  parameter: p,
  reference,
  grouped,
  seasonName,
}) {
  const unit = useUnitLabel();
  const treatments = summary.treatments;
  const valueOf = (c, t) => c.means[p.parameterId]?.[t] ?? null;
  const groups = grouped
    ? Object.entries(
        summary.centres.reduce((acc, c) => {
          const key = c.croppingSystemName ?? "Cropping system not set";
          (acc[key] ??= []).push(c);
          return acc;
        }, {}),
      ).sort(([a], [b]) => a.localeCompare(b))
    : [[null, summary.centres]];
  const pooled = summary.pooled?.[p.parameterId];

  const cell = (value, refValue, isRef, bold) => (
    <td className="num">
      {bold ? <b>{fmt(value)}</b> : fmt(value)}
      {reference && !isRef && value !== null && (
        <div className="muted small">{fmtPct(pctVs(value, refValue))}</div>
      )}
    </td>
  );
  const meanRow = (label, centres, key) => (
    <tr key={key} className="muted-row">
      <td colSpan={2}>
        <b>{label}</b>
      </td>
      {treatments.map((t) => (
        <Fragment key={t.code}>
          {cell(
            mean(centres.map((c) => valueOf(c, t.code))),
            mean(centres.map((c) => valueOf(c, reference))),
            t.code === reference,
            true,
          )}
        </Fragment>
      ))}
    </tr>
  );

  return (
    <Card
      pad={false}
      title={`${p.name}${p.unitCode ? ` (${unit(p.unitCode)})` : ""}`}
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Centre</th>
              <th>Season</th>
              {treatments.map((t) => (
                <th key={t.code} className="num" title={t.name}>
                  {t.code}
                  {t.code === reference && <small>reference</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([name, centres]) => (
              <Fragment key={name ?? "all"}>
                {name !== null && (
                  <tr>
                    <td colSpan={2 + treatments.length} className="rowhead">
                      {name}
                    </td>
                  </tr>
                )}
                {centres.map((c) => (
                  <tr key={c.sheetId}>
                    <td>
                      <Link to={ROUTES.sheet(c.sheetId)}>{c.centre.name}</Link>
                      {c.status !== "Approved" && (
                        <>
                          {" "}
                          <Badge>{c.status}</Badge>
                        </>
                      )}
                    </td>
                    <td>{seasonName(c.seasonCode)}</td>
                    {treatments.map((t) => (
                      <Fragment key={t.code}>
                        {cell(
                          valueOf(c, t.code),
                          valueOf(c, reference),
                          t.code === reference,
                        )}
                      </Fragment>
                    ))}
                  </tr>
                ))}
                {name !== null &&
                  centres.length > 1 &&
                  meanRow(`Mean · ${name}`, centres, `${name}-mean`)}
              </Fragment>
            ))}
          </tbody>
          {summary.centres.length > 1 && (
            <tfoot>{meanRow("Mean of centres", summary.centres, "all")}</tfoot>
          )}
        </table>
      </div>
      <div style={{ padding: "8px 16px" }}>
        <BarChart
          title={`${p.name}: ${pooled && !pooled.reason ? "pooled means" : "mean of centres"}`}
          bars={treatments.map((t) => {
            const pooledMean =
              pooled && !pooled.reason
                ? pooled.means.find((m) => m.treatmentCode === t.code)?.mean
                : undefined;
            return {
              label: t.code,
              value:
                pooledMean ??
                mean(summary.centres.map((c) => valueOf(c, t.code))),
              letters:
                pooled && !pooled.reason ? pooled.groups?.[t.code] : undefined,
              highlight: t.code === reference,
            };
          })}
        />
      </div>
      {pooled && <PooledResults pooled={pooled} reference={reference} />}
    </Card>
  );
}

function PooledResults({ pooled, reference }) {
  if (pooled.reason) {
    return (
      <p className="muted small" style={{ padding: "8px 16px", margin: 0 }}>
        Pooled analysis: {pooled.reason}.
      </p>
    );
  }
  const refMean = pooled.means.find((m) => m.treatmentCode === reference)?.mean;
  return (
    <div className="stack" style={{ padding: "12px 16px", gap: 10 }}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <b>Pooled analysis over {pooled.locations.length} locations</b>
        <Badge tone={pooled.significant ? "green" : "grey"}>
          {pooled.significant
            ? "Treatments differ at 5 %"
            : "No significant difference"}
        </Badge>
        {pooled.interactionSignificant && (
          <Badge tone="amber">Treatments × locations significant</Badge>
        )}
        {!pooled.bartlett.homogeneous && (
          <Badge tone="red">Error variances differ</Badge>
        )}
      </div>
      <div className="grid g2" style={{ alignItems: "start" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Treatment</th>
                <th className="num">Mean</th>
                {pooled.groups && <th>DMRT</th>}
                {reference && <th className="num">vs {reference}</th>}
              </tr>
            </thead>
            <tbody>
              {pooled.means.map((m) => (
                <tr key={m.treatmentCode}>
                  <td>
                    <b>{m.treatmentCode}</b>
                  </td>
                  <td className="num">{fmt(m.mean)}</td>
                  {pooled.groups && (
                    <td className="mono">{pooled.groups[m.treatmentCode]}</td>
                  )}
                  {reference && (
                    <td className="num">
                      {m.treatmentCode === reference ? (
                        <span className="muted">reference</span>
                      ) : (
                        <>
                          {fmtPct(pctVs(m.mean, refMean))}
                          {pooled.cd5 != null &&
                            Math.abs(m.mean - refMean) > pooled.cd5 &&
                            " *"}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th className="num">df</th>
                  <th className="num">SS</th>
                  <th className="num">MS</th>
                  <th className="num">F</th>
                  <th className="num">p</th>
                </tr>
              </thead>
              <tbody>
                {pooled.table.map((r) => (
                  <tr key={r.source}>
                    <td>{r.source}</td>
                    <td className="num">{r.df}</td>
                    <td className="num">{fmt(r.ss, 3)}</td>
                    <td className="num">{fmt(r.ms, 3)}</td>
                    <td className="num">{fmt(r.f, 3)}</td>
                    <td className="num">
                      {r.p === null
                        ? "—"
                        : r.p < 0.001
                          ? "<0.001"
                          : fmt(r.p, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="kv">
            <div>
              <span>CV (%)</span>
              <b>{fmt(pooled.cv)}</b>
            </div>
            <div>
              <span>SEm ±</span>
              <b>{fmt(pooled.sem, 3)}</b>
            </div>
            <div>
              <span>CD (5 %)</span>
              <b>{pooled.cd5 === null ? "NS" : fmt(pooled.cd5, 3)}</b>
            </div>
          </div>
        </div>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        Locations: {pooled.locations.join(", ")}.{" "}
        {pooled.treatmentsTestedAgainst === "interaction"
          ? "Treatments are tested against the treatments × locations interaction, so the result holds across these sites, not only at one."
          : "There is no treatments × locations interaction (treatments moved together between sites), so treatments are tested against the pooled error."}{" "}
        {pooled.interactionSignificant &&
          "The interaction is significant: treatments ranked differently at different centres, so look at centre-wise results too. "}
        {!pooled.bartlett.homogeneous &&
          `Bartlett's test (χ² ${fmt(pooled.bartlett.chiSquare, 2)}, p ${fmt(pooled.bartlett.p, 3)}) shows the centres' error variances differ, so read the pooled result with care.`}
        {reference && " * difference from the reference is larger than the CD."}
      </p>
    </div>
  );
}
