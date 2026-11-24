import { UserSquare2 } from "lucide-react";
import { PiCard } from "../../../components/ExperimentPis";
import { Body, Card, LargeHeading, SmallBody } from "../../../components/ui";
import { experimentFactors } from "../../../config/constants";

/** "Kharif, Rabi". Formats protocol season codes into names. */
export function formatSeasons(seasonsData, seasonsMaster) {
  if (Array.isArray(seasonsData) && seasonsData.length > 0) {
    return seasonsData.map(seasonsMaster.nameOf).join(", ");
  }
  return "All seasons";
}

export function ExperimentOverviewCard({
  experiment: e,
  programmes,
  seasons,
  trialRows = [],
  assign = false,
  onAssignPi,
}) {
  return (
    <Card>
      <div className="stack" style={{ gap: 12 }}>
        <LargeHeading as="h2" style={{ fontSize: "1.21em", margin: 0 }}>
          {e.title}
        </LargeHeading>
        <div className="kv">
          <div>
            <SmallBody muted as="span">
              Programme
            </SmallBody>
            <Body as="b">{programmes.nameOf(e.programmeCode)}</Body>
          </div>
          <div>
            <SmallBody muted as="span">
              Design
            </SmallBody>
            <Body as="b">
              {e.design}
              {e.replications ? ` · ${e.replications} replications` : ""}
            </Body>
          </div>
          <div>
            <SmallBody muted as="span">
              Since
            </SmallBody>
            <Body as="b">
              {e.startYear}
              {e.endYear ? ` – ${e.endYear}` : ""}
            </Body>
          </div>
          <div>
            <SmallBody muted as="span">
              Seasons
            </SmallBody>
            <Body as="b">{formatSeasons(e.seasons, seasons)}</Body>
          </div>
          <div>
            <SmallBody muted as="span">
              Replication count
            </SmallBody>
            <Body as="b">{e.replications || 0}</Body>
          </div>

          {experimentFactors(e).length > 0 && (
            <div>
              <SmallBody muted as="span">
                {e.design === "Factorial" ? "Factors" : "Plot layout"}
              </SmallBody>
              <Body as="b">
                {experimentFactors(e)
                  .map(
                    (f) =>
                      `${f.levels.length} ${f.key && e.design === "Factorial" ? f.label : f.label.toLowerCase()}`,
                  )
                  .join(" × ")}{" "}
                ={" "}
                {experimentFactors(e).reduce((n, f) => n * f.levels.length, 1)}{" "}
                treatment combinations
                {e.treatments.length > 0 &&
                  ` · ${e.treatments.length * (e.replications || 1)} rows per parameter`}
              </Body>
            </div>
          )}
          <div>
            <SmallBody muted as="span">
              Treatments / parameters
            </SmallBody>
            <Body as="b">
              {e.treatments.length} /{" "}
              {(e.defaultParameters ?? e.parameters ?? []).length}
            </Body>
          </div>
          <div>
            <SmallBody muted as="span">
              Centres
            </SmallBody>
            <Body as="b">{(e.centreIds ?? trialRows).length}</Body>
          </div>
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="grow">
            <SmallBody muted as="span" style={{ display: "block" }}>
              Experiment PI
            </SmallBody>
            {e.pi ? (
              <PiCard pi={e.pi} compact={!assign} />
            ) : (
              <Body muted>
                Not assigned yet
                {assign && ". The PI edits this experiment's definition."}
              </Body>
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
