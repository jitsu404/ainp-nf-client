import { UserSquare2 } from "lucide-react";
import { PiCard } from "../../../components/ExperimentPis";
import { useMemo } from "react";
import { Card } from "../../../components/ui";
import { useMasters } from "../../../queries/masters";

/** "Kharif (Rice, Maize); Rabi (Wheat)". The API returns crop ids; `cropName` turns one into a name. */
export function formatSeasons(seasonsData, seasonsMaster, cropName = (c) => c) {
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
          .map((c) => (typeof c === "object" ? c.name : cropName(c)))
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
  assign = false,
  onAssignPi,
}) {
  const crops = useMasters("crop");
  const cropName = useMemo(() => {
    const names = new Map(
      (crops.data ?? []).map((c) => [String(c.id ?? c._id), c.name]),
    );
    return (id) => names.get(String(id)) ?? "…";
  }, [crops.data]);
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
          {/* <div>
            <span>Reference treatment</span>
            <b>
              {e.referenceTreatmentCode
                ? `${e.referenceTreatmentCode} · ${e.treatments.find((t) => t.code === e.referenceTreatmentCode)?.name ?? ""}`
                : "—"}
            </b>
          </div> */}
          <div>
            <span>Seasons</span>
            <b>{formatSeasons(e.seasons, seasons, cropName)}</b>
          </div>
          <div>
            <span>Replication count</span>
            <b>{e.replications || 0}</b>
          </div>

          {e.mainPlotCount > 0 && e.subPlotCount > 0 && (
            <div>
              <span>Plots</span>
              <b>
                {e.mainPlotCount} main × {e.subPlotCount} sub ={" "}
                {e.mainPlotCount * e.subPlotCount} plots
                {e.treatments.length > 0 &&
                  ` · ${e.mainPlotCount * e.subPlotCount * e.treatments.length * (e.replications || 1)} rows per parameter`}
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
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="grow">
            <span className="muted small">Experiment PI</span>
            {e.pi ? (
              <PiCard pi={e.pi} compact={!assign} />
            ) : (
              <div className="muted">
                Not assigned yet
                {assign && ". The PI edits this experiment's definition."}
              </div>
            )}
          </div>
          {assign && (
            <button className="btn ghost sm" onClick={onAssignPi}>
              <UserSquare2 size={14} /> {e.pi ? "Change PI" : "Assign PI"}
            </button>
          )}
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
