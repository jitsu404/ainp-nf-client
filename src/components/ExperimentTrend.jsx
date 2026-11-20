import { useState } from "react";
import { fmt, fmtPct, pctVs } from "../lib/results";
import { useMasterOptions, useUnitLabel } from "../queries/masters";
import { useTrend } from "../queries/research";
import { LineChart } from "./Charts";
import { ErrorNote } from "./forms";
import { inProtocolSeasons } from "../lib/seasonCrops";
import { Card, Select } from "./ui";

// Treatment means year by year since the experiment started (approved sheets, mean of centres),
// for the whole network or one centre. Shows whether a treatment's advantage holds over time.

export function ExperimentTrend({ experiment, centres }) {
  const seasons = useMasterOptions("season");
  const unit = useUnitLabel();
  const [season, setSeason] = useState("");
  const [centreId, setCentreId] = useState("");
  const trend = useTrend({
    experimentId: experiment.id,
    seasonCode: season || undefined,
    centreId: centreId || undefined,
  });
  const t = trend.data;
  const ref = experiment.referenceTreatmentCode;

  return (
    <div className="stack">
      <Card pad={false}>
        <div className="toolbar" style={{ flexWrap: "wrap" }}>
          <Select
            value={season}
            onChange={setSeason}
            options={seasons.options.filter(([c]) =>
              inProtocolSeasons(experiment.seasons, c),
            )}
            all="All seasons"
          />
          {centres.length > 1 && (
            <Select
              value={centreId}
              onChange={setCentreId}
              options={centres.map((c) => [c.id, c.name])}
              all="Mean of all centres"
            />
          )}
          <span className="grow" />
          <span className="muted small">Approved sheets only</span>
        </div>
      </Card>
      <ErrorNote error={trend.error} />
      {trend.isPending && <p className="muted">Loading…</p>}
      {t &&
        t.parameters.map((p) => {
          const xLabels = t.years.map((y) => String(y.year));
          const series = t.treatments.map((tr) => ({
            name: `${tr.code} ${tr.name}`,
            highlight: tr.code === ref,
            values: t.years.map(
              (y) => y.means[p.parameterId]?.[tr.code] ?? null,
            ),
          }));
          const hasData = series.some((s) => s.values.some((v) => v !== null));
          return (
            <Card
              key={p.parameterId}
              title={`${p.name}${p.unitCode ? ` (${unit(p.unitCode)})` : ""}`}
            >
              {!hasData ? (
                <p className="muted small" style={{ margin: 0 }}>
                  No approved data yet.
                </p>
              ) : (
                <div className="stack">
                  <LineChart xLabels={xLabels} series={series} title={p.name} />
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Treatment</th>
                          {t.years.map((y) => (
                            <th key={y.year} className="num">
                              {y.year}
                              <small>
                                {y.sheets} sheet{y.sheets === 1 ? "" : "s"}
                              </small>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.treatments.map((tr) => (
                          <tr key={tr.code}>
                            <td>
                              <b>{tr.code}</b>{" "}
                              <span className="muted small">{tr.name}</span>
                            </td>
                            {t.years.map((y) => {
                              const v =
                                y.means[p.parameterId]?.[tr.code] ?? null;
                              const refV = ref
                                ? y.means[p.parameterId]?.[ref]
                                : null;
                              return (
                                <td key={y.year} className="num">
                                  {fmt(v)}
                                  {ref && tr.code !== ref && v !== null && (
                                    <div className="muted small">
                                      {fmtPct(pctVs(v, refV))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
    </div>
  );
}
