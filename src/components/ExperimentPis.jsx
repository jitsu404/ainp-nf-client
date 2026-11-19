import { useState } from "react";
import { UserPlus } from "lucide-react";
import { formatDate } from "../hooks";
import { toast } from "../lib/toast";
import { programme } from "../programme/config";
import {
  useCreateExperimentPi,
  useExperimentPis,
  useReplaceExperimentPi,
  useUpdateExperimentPi,
} from "../queries/experimentPis";
import {
  AsyncFormModal,
  CredentialsModal,
  ErrorNote,
  SaveModal,
} from "./forms";
import { personFields, personValues, seatPasswordField } from "./personFields";

// Experiment PI seats: the PCU creates permanent logins (pi1.npnf@icar.org.in, pi2 …) held by one
// person at a time, and links one to an experiment. Replacing the person keeps the login.

/** The seat's login and its current holder. */
export function PiCard({ pi, compact = false }) {
  if (!pi) return null;
  return (
    <div className="stack" style={{ gap: 2 }}>
      <b>{pi.name}</b>
      {pi.designation && <span className="muted small">{pi.designation}</span>}
      <span className="small">
        {pi.email}
        {pi.mobile && ` · ${pi.mobile}`}
      </span>
      {!compact && (
        <span className="small muted">
          Signs in as <span className="mono">{pi.loginEmail}</span>
          {pi.occupiedSince && ` · since ${formatDate(pi.occupiedSince)}`}
        </span>
      )}
    </div>
  );
}

/** Creates the next seat and hands it back with the password (for the credentials dialog). */
export function CreateExperimentPiModal({ onClose, onCreated }) {
  const create = useCreateExperimentPi();
  return (
    <AsyncFormModal
      title="New Experiment PI"
      intro={
        <p className="muted" style={{ margin: 0 }}>
          Creates the next PI login (pi1.npnf@icar.org.in, pi2 …) for this
          person. Link it to an experiment from the experiment, or while
          creating one.
        </p>
      }
      fields={[...personFields({ seat: true }), seatPasswordField()]}
      initial={{ title: "Dr", organization: programme.institute }}
      submitLabel="Create PI"
      onSubmit={create.mutateAsync}
      onDone={(seat, body) => onCreated(seat, body.password)}
      onClose={onClose}
    />
  );
}

/** A new person takes the seat: same login, new password; the previous holder goes to history. */
export function ReplaceExperimentPiModal({ seat, onClose, onReplaced }) {
  const replace = useReplaceExperimentPi();
  return (
    <AsyncFormModal
      title={`Replace the holder of ${seat.loginEmail}`}
      intro={
        <div className="note warn">
          <b>{seat.name}</b> is signed out and can no longer use this login. The
          login, its experiment and everything recorded under it stay.
        </div>
      }
      fields={[
        ...personFields({ seat: true }),
        seatPasswordField(),
        {
          name: "reason",
          label: "Reason",
          type: "textarea",
          hint: "e.g. Transferred, retired, new PI nominated",
        },
      ]}
      initial={{ title: "Dr", organization: seat.organization ?? "" }}
      submitLabel="Replace"
      onSubmit={(body) => replace.mutateAsync({ id: seat.id, ...body })}
      onDone={(updated, body) => onReplaced(updated, body.password)}
      onClose={onClose}
    />
  );
}

export function EditExperimentPiModal({ seat, onClose }) {
  const update = useUpdateExperimentPi();
  return (
    <AsyncFormModal
      title={`Edit ${seat.name}`}
      intro={
        <p className="muted" style={{ margin: 0 }}>
          Corrects the current holder&apos;s details. The login{" "}
          <span className="mono">{seat.loginEmail}</span> doesn&apos;t change.
        </p>
      }
      fields={personFields({ edit: true, seat: true })}
      initial={personValues(seat)}
      onSubmit={(body) => update.mutateAsync({ id: seat.id, ...body })}
      onDone={() => toast.success("PI details updated")}
      onClose={onClose}
    />
  );
}

/**
 * Choose the Experiment PI of an experiment: active seats not leading another experiment.
 * Offers "Create PI" so the PCU can make one without leaving the form.
 */
export function ExperimentPiPicker({ value, onChange, experimentId }) {
  const seats = useExperimentPis();
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const free = (seats.data ?? []).filter(
    (s) => s.isActive && (!s.experiment || s.experiment.id === experimentId),
  );
  return (
    <div className="field full">
      <label htmlFor="x-pi">Experiment PI (optional)</label>
      <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
        <select
          id="x-pi"
          className="grow"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">
            {seats.isPending ? "Loading…" : "No PI yet (assign later)"}
          </option>
          {free.map((s) => (
            <option key={s.id} value={s.id}>
              {s.loginEmail} · {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn ghost sm nowrap"
          onClick={() => setCreating(true)}
        >
          <UserPlus size={14} /> Create PI
        </button>
      </div>
      <span className="muted small">
        {seats.data && !free.length
          ? "No free Experiment PI. Create one, or assign it later on the experiment page."
          : "Only PIs not leading another experiment are listed."}
      </span>
      <ErrorNote error={seats.error} />
      {creating && (
        <CreateExperimentPiModal
          onClose={() => setCreating(false)}
          onCreated={(seat, password) => {
            onChange(seat.id);
            setCredentials({
              name: seat.name,
              email: seat.loginEmail,
              password,
              title: "Experiment PI created",
              mustChange: false,
            });
          }}
        />
      )}
      {credentials && (
        <CredentialsModal
          {...credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}

/** Link, change or remove the experiment's PI (PCU). */
export function LinkExperimentPiModal({ experiment, save, onClose }) {
  const [piUserId, setPiUserId] = useState(experiment.pi?.id ?? null);
  return (
    <SaveModal
      title={`Experiment PI of ${experiment.code}`}
      subtitle="The PI edits this experiment's definition. Centres still run the trials."
      wide={false}
      onSave={async () => {
        await save({ piUserId });
        toast.success(
          piUserId ? "Experiment PI linked" : "Experiment PI removed",
        );
      }}
      onClose={onClose}
      canSave={piUserId !== (experiment.pi?.id ?? null)}
    >
      <ExperimentPiPicker
        value={piUserId}
        onChange={setPiUserId}
        experimentId={experiment.id}
      />
    </SaveModal>
  );
}
