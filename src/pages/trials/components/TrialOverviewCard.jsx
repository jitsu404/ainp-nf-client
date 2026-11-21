import { Card } from "../../../components/ui";
import { formatDate } from "../../../hooks";

export function TrialOverviewCard({ trial: t }) {
  const e = t.experiment;
  const withdrawn = t.assignmentStatus === "Withdrawn";

  return (
    <Card>
      <div className="stack" style={{ gap: 10 }}>
        <b>{e.title}</b>
        <div className="kv">
          <div>
            <span>Centre</span>
            <b>
              {t.centreId.name} ({t.centreId.code}), {t.centreId.state}
            </b>
          </div>
          <div>
            <span>Design</span>
            <b>
              {e.design}
              {e.replications ? ` · ${e.replications} replications` : ""}
            </b>
          </div>
          <div>
            <span>Experiment status</span>
            <b>{e.status}</b>
          </div>
        </div>
        {t.layoutNotes && (
          <div>
            <span className="muted small">Layout notes</span>
            <div style={{ whiteSpace: "pre-wrap" }}>{t.layoutNotes}</div>
          </div>
        )}
        {withdrawn && (
          <div className="note warn">
            This centre was withdrawn from the experiment
            {t.withdrawnAt ? ` on ${formatDate(t.withdrawnAt)}` : ""}
            {t.withdrawReason ? ` (${t.withdrawReason})` : ""}. Its trial and
            data are kept, read-only.
          </div>
        )}
        {!withdrawn && e.status !== "Active" && (
          <div className="note">
            The experiment is {e.status}. Sheets can be opened once the PCU
            makes it Active.
          </div>
        )}
      </div>
    </Card>
  );
}
