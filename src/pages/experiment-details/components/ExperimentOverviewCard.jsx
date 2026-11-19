import { Card } from "../../../components/ui";

export function formatSeasons(seasonsData, seasonsMaster) {
  const seasonsMap =
    seasonsData instanceof Map
      ? seasonsData
      : typeof seasonsData === "object" && !Array.isArray(seasonsData)
        ? new Map(Object.entries(seasonsData || {}))
        : new Map();

  if (seasonsMap.size === 0) {
    return Array.isArray(seasonsData) && seasonsData.length
      ? seasonsData.map(seasonsMaster.nameOf).join(", ")
      : "Any";
  }

  const parts = [];
  for (const [sCode, cropList] of seasonsMap.entries()) {
    const sName = seasonsMaster.nameOf(sCode);
    const cropNames = Array.isArray(cropList)
      ? cropList
          .map((c) => (typeof c === "object" ? c.name : c))
          .filter(Boolean)
      : [];
    parts.push(
      cropNames.length > 0 ? `${sName} (${cropNames.join(", ")})` : sName,
    );
  }
  return parts.join("; ");
}

export function ExperimentOverviewCard({
  experiment: e,
  programmes,
  seasons,
  trialRows = [],
}) {
  return (
    <Card>
      <div className="stack" style={{ gap: 12 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>{e.title}</h2>
        <div className="kv">
          <div>
            <span>Programme</span>
            <b>{programmes.nameOf(e.programmeCode)}</b>
          </div>
          <div>
            <span>Design</span>
            <b>
              {e.design}
              {e.replications ? ` · ${e.replications} replications` : ""}
            </b>
          </div>
          <div>
            <span>Since</span>
            <b>
              {e.startYear}
              {e.endYear ? ` – ${e.endYear}` : ""}
            </b>
          </div>
          <div>
            <span>Reference treatment</span>
            <b>
              {e.referenceTreatmentCode
                ? `${e.referenceTreatmentCode} · ${e.treatments.find((t) => t.code === e.referenceTreatmentCode)?.name ?? ""}`
                : "—"}
            </b>
          </div>
          <div>
            <span>Seasons</span>
            <b>{formatSeasons(e.seasons, seasons)}</b>
          </div>
          <div>
            <span>Assigned to</span>
            <b>
              {typeof e.assignedTo === "object" && e.assignedTo
                ? `${e.assignedTo.name}${e.assignedTo.designation ? ` · ${e.assignedTo.designation}` : ""}`
                : e.assignedTo || "—"}
            </b>
          </div>
          {(e.mainPlotCount > 0 || e.subPlotCount > 0) && (
            <div>
              <span>Plot counts</span>
              <b>
                {e.mainPlotCount > 0 ? `Main: ${e.mainPlotCount}` : ""}
                {e.mainPlotCount > 0 && e.subPlotCount > 0 ? " · " : ""}
                {e.subPlotCount > 0 ? `Sub: ${e.subPlotCount}` : ""}
              </b>
            </div>
          )}
          <div>
            <span>Treatments / parameters</span>
            <b>
              {e.treatments.length} /{" "}
              {(e.defaultParameters ?? e.parameters ?? []).length}
            </b>
          </div>
          <div>
            <span>Centres</span>
            <b>{(e.centreIds ?? trialRows).length}</b>
          </div>
        </div>
        {e.objectives.length > 0 && (
          <div>
            <span className="muted small">Objectives</span>
            <ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>
              {e.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ol>
          </div>
        )}
        {e.dataLocked && (
          <div className="note warn">
            Centres have recorded data. The design, replications and existing
            treatments and parameters are frozen; new ones can still be added.
          </div>
        )}
        {e.status !== "Active" && (
          <div className="note">
            Centres can record data only once the experiment is <b>Active</b>.
          </div>
        )}
      </div>
    </Card>
  );
}
