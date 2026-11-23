import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleDashed, Lock } from "lucide-react";
import { SaveModal } from "../../../components/forms";
import { Body } from "../../../components/ui";
import { EXPERIMENT_STATUSES } from "../../../config/constants";
import { toast } from "../../../lib/toast";

// The experiment's status in the page title: Draft → Active → Closed. Whoever edits the definition
// (research.config) can switch it here; everyone else sees where it stands. Switching asks first,
// because the status decides whether centres can open observation sheets.

const LOOK = {
  Draft: { color: "var(--grey)", bg: "var(--grey-bg)", Icon: CircleDashed },
  Active: { color: "var(--green)", bg: "var(--green-bg)", Icon: CheckCircle2 },
  Closed: { color: "var(--blue)", bg: "var(--blue-bg)", Icon: Lock },
};

const MEANING = {
  Draft: "Being set up. Centres can't open sheets yet.",
  Active: "Running. Centres can open sheets and record data.",
  Closed: "Finished. No new sheets; existing data stays readable.",
};

/** What changes when moving to `to` (shown before confirming). */
const consequences = (from, to, e) => {
  const notes = [];
  if (to === "Active") {
    notes.push("Assigned centres can open observation sheets and enter data.");
    const missing = [
      !e.treatments?.length && "treatments",
      !(e.defaultParameters ?? e.parameters ?? []).length && "parameters",
      !e.centreIds?.length && "assigned centres",
    ].filter(Boolean);
    if (missing.length)
      notes.push(
        `Still missing: ${missing.join(", ")}. Centres won't be able to record useful data until these are set.`,
      );
  }
  if (to === "Closed")
    notes.push(
      "Centres can no longer open new sheets. Sheets already opened keep their workflow; all data stays readable.",
    );
  if (to === "Draft" && from !== "Draft")
    notes.push(
      "Centres can no longer open new sheets until it is made Active again. Data already recorded is kept.",
    );
  return notes;
};

export function ExperimentStatusSwitch({ experiment, canChange, save }) {
  const [target, setTarget] = useState(null);
  const current = experiment.status;

  return (
    <>
      <span
        role="group"
        aria-label="Experiment status"
        className="row"
        style={{
          gap: 2,
          padding: 3,
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "var(--surface)",
          fontSize: 12.5,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {EXPERIMENT_STATUSES.map((s, i) => {
          const on = s === current;
          const { color, bg, Icon } = LOOK[s];
          const past = EXPERIMENT_STATUSES.indexOf(current) > i;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              disabled={!canChange || on}
              title={
                on
                  ? `${s}: ${MEANING[s]}`
                  : canChange
                    ? `Change to ${s}: ${MEANING[s]}`
                    : MEANING[s]
              }
              onClick={() => setTarget(s)}
              className="row"
              style={{
                gap: 5,
                padding: "5px 11px",
                borderRadius: 999,
                border: 0,
                cursor: canChange && !on ? "pointer" : "default",
                color: on ? color : past ? "var(--text-muted)" : "var(--grey)",
                background: on ? bg : "transparent",
                boxShadow: on ? `inset 0 0 0 1px ${color}` : "none",
                opacity: on || canChange ? 1 : 0.55,
                font: "inherit",
              }}
            >
              <Icon size={13} />
              {s}
            </button>
          );
        })}
      </span>

      {/* Rendered at the page root: the switch sits inside the page title (<h1>). */}
      {target &&
        createPortal(
          <SaveModal
            title={`Make this experiment ${target}?`}
            subtitle={`${experiment.code} · now ${current}`}
            submitLabel={`Make ${target}`}
            wide={false}
            onSave={async () => {
              await save({ status: target });
              toast.success(`${experiment.code} is now ${target}`);
            }}
            onClose={() => setTarget(null)}
          >
            <div className="stack" style={{ gap: 8 }}>
              <Body style={{ margin: 0 }}>
                <b>{target}:</b> {MEANING[target]}
              </Body>
              {consequences(current, target, experiment).map((n) => (
                <Body
                  as="div"
                  key={n}
                  className={`note ${n.startsWith("Still missing") ? "warn" : ""}`}
                  style={{ margin: 0 }}
                >
                  {n}
                </Body>
              ))}
            </div>
          </SaveModal>,
          document.body,
        )}
    </>
  );
}
