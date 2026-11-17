import { Link } from "react-router-dom";
import { ROUTES } from "../config/constants";
import { useMasterOptions } from "../queries/masters";
import { useReporting } from "../queries/research";
import { ErrorNote } from "./forms";
import { Badge, Card } from "./ui";

// Who has reported what: each assigned centre × financial year × season, with the status of the
// sheets opened there. "Not opened" is only shown where data is still expected (an active
// experiment and an open year); elsewhere an empty cell is just "—".

const ORDER = ["Returned", "Draft", "Submitted", "Approved"];
const TONE = {
  Approved: "green",
  Submitted: "blue",
  Returned: "red",
  Draft: "amber",
};

export function ReportingGrid({ experimentId }) {
  const reporting = useReporting(experimentId);
  const seasons = useMasterOptions("season");
  const r = reporting.data;
  if (reporting.error) return <ErrorNote error={reporting.error} />;
  if (!r) return <p className="muted">Loading…</p>;

  // Experiments without fixed seasons: show whichever seasons have sheets.
  const seasonCodes = r.seasons.length
    ? r.seasons
    : [...new Set(r.centres.flatMap((c) => c.sheets.map((s) => s.seasonCode)))];
  const columns = r.years.flatMap((fy) =>
    seasonCodes.map((season) => ({ fy, season })),
  );
  const expected = (fy) =>
    r.experiment.status === "Active" && r.openYears.includes(fy);

  // Totals for the header: one count per sheet, plus cells where a sheet is expected but missing.
  const totals = {
    Approved: 0,
    Submitted: 0,
    Returned: 0,
    Draft: 0,
    "Not opened": 0,
  };
  for (const c of r.centres) {
    for (const col of columns) {
      const here = c.sheets.filter(
        (s) => s.fyCode === col.fy && s.seasonCode === col.season,
      );
      if (here.length) here.forEach((s) => (totals[s.status] += 1));
      else if (expected(col.fy)) totals["Not opened"] += 1;
    }
  }

  if (!r.centres.length)
    return (
      <div className="empty card">
        No centres are assigned to this experiment.
      </div>
    );

  return (
    <div className="stack">
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {Object.entries(totals).map(([status, n]) => (
          <span key={status} className="row small" style={{ gap: 4 }}>
            <Badge tone={TONE[status] ?? "grey"}>{status}</Badge>
            <b>{n}</b>
          </span>
        ))}
      </div>
      <Card pad={false}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th rowSpan={2} className="sticky-col">
                  Centre
                </th>
                {r.years.map((fy) => (
                  <th
                    key={fy}
                    colSpan={seasonCodes.length}
                    style={{ textAlign: "center" }}
                  >
                    {fy}
                    {!r.openYears.includes(fy) && (
                      <span className="muted"> (closed)</span>
                    )}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((col) => (
                  <th key={`${col.fy}-${col.season}`}>
                    {seasons.nameOf(col.season)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.centres.map((c) => (
                <tr key={c.trialId}>
                  <td className="sticky-col">
                    <Link to={ROUTES.trial(c.trialId)}>
                      <b style={{ fontWeight: 550 }}>{c.centre.name}</b>
                    </Link>
                  </td>
                  {columns.map((col) => {
                    const here = c.sheets
                      .filter(
                        (s) =>
                          s.fyCode === col.fy && s.seasonCode === col.season,
                      )
                      .sort(
                        (a, b) =>
                          ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
                      );
                    return (
                      <td key={`${col.fy}-${col.season}`}>
                        {here.length ? (
                          <span
                            className="row"
                            style={{ gap: 4, flexWrap: "wrap" }}
                          >
                            {here.map((s) => (
                              <Link
                                key={s.id}
                                to={ROUTES.sheet(s.id)}
                                title={
                                  [s.croppingSystemCode, s.cropCode]
                                    .filter(Boolean)
                                    .join(" · ") || undefined
                                }
                              >
                                <Badge tone={TONE[s.status]}>{s.status}</Badge>
                              </Link>
                            ))}
                          </span>
                        ) : expected(col.fy) ? (
                          <Badge tone="red">Not opened</Badge>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="muted small" style={{ margin: 0 }}>
        Click a status to open the sheet, or a centre to open its trial. “Not
        opened” means the year is open, the experiment is active and the centre
        has no sheet for that season yet.
      </p>
    </div>
  );
}
