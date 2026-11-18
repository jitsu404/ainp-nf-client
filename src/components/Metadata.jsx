import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { metadataApi } from "../api";
import { formatDateTime } from "../hooks";
import { toast } from "../lib/toast";
import {
  useExperimentMetadata,
  useMetadataTransition,
  useSaveCommonMetadata,
  useSaveTrialMetadata,
  useTrialMetadata,
} from "../queries/metadata";
import { ErrorNote, SaveModal } from "./forms";
import { Badge, Card, Modal, Table } from "./ui";

// ICAR research-data metadata (fields 1–38). The field list, values and what the caller may do
// all come from the API; this file only renders them.

const SOURCE = {
  common: ["Common", "blue", "Same for every centre; set by the PCU"],
  auto: [
    "Automatic",
    "grey",
    "Filled in from the protocol, trial, PI and sheets",
  ],
  centre: ["Centre", "green", "Entered by the centre"],
};

const SourceBadge = ({ source }) => (
  <span title={SOURCE[source][2]}>
    <Badge tone={SOURCE[source][1]}>{SOURCE[source][0]}</Badge>
  </span>
);

const Completeness = ({ c }) =>
  c.missing.length ? (
    <Badge tone="amber">
      {c.filled} of {c.total} required
    </Badge>
  ) : (
    <Badge tone="green">Complete</Badge>
  );

/** The merged record for one trial, with the actions the caller may take. */
export function TrialMetadata({ trialId }) {
  const meta = useTrialMetadata(trialId);
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);
  if (meta.error) return <ErrorNote error={meta.error} />;
  const m = meta.data;
  if (!m) return <p className="muted">Loading…</p>;
  const last = m.history.at(-1);

  return (
    <div className="stack">
      <Card>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <b>{m.centre?.name}</b>
          <Badge>{m.status}</Badge>
          <Completeness c={m.completeness} />
          <span className="grow" />
          {m.canEdit && (
            <button className="btn ghost sm" onClick={() => setModal("edit")}>
              <Pencil size={14} /> Edit centre fields
            </button>
          )}
          {m.canSubmit && (
            <button className="btn sm" onClick={() => setModal("submit")}>
              <Send size={14} /> Submit
            </button>
          )}
          {m.canReturn && (
            <button
              className="btn danger sm"
              onClick={() => setModal("return")}
            >
              <Undo2 size={14} /> Return
            </button>
          )}
          {m.canApprove && (
            <button className="btn sm" onClick={() => setModal("approve")}>
              <CheckCircle2 size={14} /> Approve
            </button>
          )}
        </div>
        {!m.isOwnCentre && (
          <div className="note" style={{ marginTop: 12 }}>
            This is {m.centre?.name}&apos;s metadata. You can read it; only that
            centre can change it.
          </div>
        )}
        {m.status === "Returned" && last?.remark && (
          <div className="note warn" style={{ marginTop: 12 }}>
            Returned by {last.byName}: {last.remark}
          </div>
        )}
        {m.status === "Submitted" && (
          <div className="note" style={{ marginTop: 12 }}>
            Submitted to the PCU. It can be changed again only if it is
            returned.
          </div>
        )}
        {m.canEdit && m.completeness.missing.length > 0 && (
          <div className="note warn" style={{ marginTop: 12 }}>
            Still needed before submitting: {m.completeness.missing.join(", ")}.
          </div>
        )}
      </Card>
      <MetadataFieldsTable fields={m.fields} />
      {m.history.length > 0 && (
        <Card pad={false} title="History">
          <div className="list">
            {[...m.history].reverse().map((h, i) => (
              <div key={i} className="item">
                <Badge>{h.status}</Badge>
                <div className="grow">
                  <b>{h.byName}</b>
                  {h.remark && <span>{h.remark}</span>}
                </div>
                <span className="muted small nowrap">
                  {formatDateTime(h.at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {modal === "edit" && (
        <TrialMetadataEditor record={m} trialId={trialId} onClose={close} />
      )}
      {["submit", "return", "approve"].includes(modal) && (
        <MetadataWorkflowModal
          trialId={trialId}
          action={modal}
          onClose={close}
        />
      )}
    </div>
  );
}

function MetadataFieldsTable({ fields }) {
  return (
    <Card pad={false}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>No.</th>
              <th style={{ width: "32%" }}>Field</th>
              <th>Value</th>
              <th style={{ width: 110 }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key}>
                <td className="muted">{f.no ?? ""}</td>
                <td>
                  {f.label}
                  {f.required && <span className="muted"> *</span>}
                  {f.hint && <div className="muted small">{f.hint}</div>}
                </td>
                <td style={{ whiteSpace: "pre-wrap" }}>
                  {f.display || (
                    <span className="muted">
                      {f.required ? "Required" : "—"}
                    </span>
                  )}
                </td>
                <td>
                  <SourceBadge source={f.source} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** One input for a field definition from the API. */
function FieldInput({ field: f, value, onChange, placeholder }) {
  const id = `meta-${f.key}`;
  const label = (
    <label htmlFor={id}>
      {f.no ? `${f.no}. ` : ""}
      {f.label}
      {f.required ? " *" : ""}
    </label>
  );
  const hint = f.hint && <span className="muted small">{f.hint}</span>;
  if (f.type === "multiselect") {
    const chosen = value ?? [];
    return (
      <div className="field full">
        {label}
        <div className="pill-grid">
          {f.options.map((o) => {
            const on = chosen.includes(o);
            return (
              <label key={o} className={`pill-option ${on ? "active" : ""}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    onChange(
                      on ? chosen.filter((x) => x !== o) : [...chosen, o],
                    )
                  }
                />
                {o}
              </label>
            );
          })}
        </div>
      </div>
    );
  }
  if (f.type === "people") {
    const people = value ?? [];
    const set = (i, key, v) =>
      onChange(people.map((p, j) => (j === i ? { ...p, [key]: v } : p)));
    return (
      <div className="field full">
        <label>{f.label}</label>
        {hint}
        {people.map((p, i) => (
          <div key={i} className="row" style={{ gap: 6, marginTop: 6 }}>
            <input
              aria-label="Name"
              placeholder="Name"
              value={p.name ?? ""}
              onChange={(e) => set(i, "name", e.target.value)}
            />
            <input
              aria-label="Designation"
              placeholder="Designation"
              value={p.designation ?? ""}
              onChange={(e) => set(i, "designation", e.target.value)}
            />
            <input
              aria-label="E-mail"
              placeholder="E-mail"
              type="email"
              value={p.email ?? ""}
              onChange={(e) => set(i, "email", e.target.value)}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label="Remove"
              onClick={() => onChange(people.filter((_, j) => j !== i))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="btn ghost sm"
            style={{ marginTop: 6 }}
            onClick={() =>
              onChange([...people, { name: "", designation: "", email: "" }])
            }
          >
            <Plus size={14} /> Add Co-PI
          </button>
        </div>
      </div>
    );
  }
  const common = {
    id,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    placeholder: placeholder || undefined,
  };
  return (
    <div
      className={`field ${f.type === "textarea" || f.no === 7 ? "full" : ""}`}
    >
      {label}
      {f.type === "textarea" ? (
        <textarea rows={3} {...common} />
      ) : f.type === "select" ? (
        <select {...common}>
          <option value="">
            {placeholder ? `Default: ${placeholder}` : "—"}
          </option>
          {f.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={
            f.type === "date" ? "date" : f.type === "number" ? "number" : "text"
          }
          min={f.type === "number" ? 0 : undefined}
          {...common}
        />
      )}
      {hint}
    </div>
  );
}

function TrialMetadataEditor({ record, trialId, onClose }) {
  const save = useSaveTrialMetadata(trialId);
  const fields = record.fields.filter((f) => f.source === "centre");
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value])),
  );
  const onSave = async () => {
    const body = { ...values };
    body.embargoYears =
      values.embargoYears === "" || values.embargoYears == null
        ? null
        : Number(values.embargoYears);
    body.coPis = (values.coPis ?? []).filter((p) => p.name?.trim());
    await save.mutateAsync(body);
    toast.success("Metadata saved");
  };
  return (
    <SaveModal
      title="Centre metadata"
      subtitle={`${record.experiment.code} at ${record.centre?.name}. Common and automatic fields are not edited here.`}
      onSave={onSave}
      onClose={onClose}
    >
      <div className="grid g2">
        {fields.map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            value={values[f.key]}
            placeholder={f.isDefault ? f.display : ""}
            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
          />
        ))}
      </div>
    </SaveModal>
  );
}

const WORKFLOW_TEXT = {
  submit: {
    title: "Submit metadata",
    label: "Submit",
    intro:
      "The metadata goes to the PCU and can no longer be changed unless it is returned.",
    remark: "Remark (optional)",
    done: "Metadata submitted",
  },
  return: {
    title: "Return metadata",
    label: "Return to centre",
    intro: "The centre can correct the metadata and submit it again.",
    remark: "What needs correcting",
    required: true,
    done: "Metadata returned to the centre",
  },
  approve: {
    title: "Approve metadata",
    label: "Approve",
    intro: "Approved metadata is locked. You can return it later if needed.",
    remark: "Remark (optional)",
    done: "Metadata approved",
  },
};

function MetadataWorkflowModal({ trialId, action, onClose }) {
  const transition = useMetadataTransition(trialId);
  const [remark, setRemark] = useState("");
  const text = WORKFLOW_TEXT[action];
  return (
    <SaveModal
      title={text.title}
      wide={false}
      submitLabel={text.label}
      onSave={async () => {
        await transition.mutateAsync({
          action,
          remark: remark.trim() || undefined,
        });
        toast.success(text.done);
      }}
      onClose={onClose}
      canSave={!text.required || remark.trim().length >= 3}
    >
      <p style={{ margin: 0 }}>{text.intro}</p>
      <div className="field">
        <label htmlFor="meta-remark">{text.remark}</label>
        <textarea
          id="meta-remark"
          rows={3}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>
    </SaveModal>
  );
}

/** The experiment's common fields and every assigned centre's metadata status. */
export function ExperimentMetadata({ experimentId }) {
  const meta = useExperimentMetadata(experimentId);
  const [modal, setModal] = useState(null);
  const [openTrial, setOpenTrial] = useState(null);
  if (meta.error) return <ErrorNote error={meta.error} />;
  const m = meta.data;
  if (!m) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <Card
        pad={false}
        title="Centres"
        actions={
          <button
            className="btn ghost sm"
            onClick={() =>
              metadataApi
                .exportExperiment(experimentId)
                .catch((err) => toast.error(err.message))
            }
          >
            <Download size={14} /> Export (ICAR format)
          </button>
        }
      >
        <Table
          rows={m.centres.map((c) => ({ ...c, id: c.trialId }))}
          pageSize={30}
          onRow={(c) => setOpenTrial(c)}
          empty="No centres assigned yet."
          columns={[
            {
              label: "Centre",
              render: (c) => (
                <>
                  <b style={{ fontWeight: 550 }}>{c.centre?.name ?? "—"}</b>
                  {c.isOwnCentre && m.centres.some((x) => !x.isOwnCentre) && (
                    <span className="muted small"> (yours)</span>
                  )}
                </>
              ),
            },
            { label: "State", render: (c) => c.centre?.state },
            { label: "Status", render: (c) => <Badge>{c.status}</Badge> },
            {
              label: "Required fields",
              render: (c) => <Completeness c={c.completeness} />,
            },
            {
              label: "Last saved",
              render: (c) =>
                c.updatedAt ? formatDateTime(c.updatedAt) : "Not started",
            },
          ]}
        />
      </Card>
      <Card
        pad={false}
        title="Common to every centre"
        actions={
          m.canEditCommon && (
            <button className="btn ghost sm" onClick={() => setModal("common")}>
              <Pencil size={14} /> Edit
            </button>
          )
        }
      >
        <div className="table-wrap">
          <table>
            <tbody>
              {m.common.map((f) => (
                <tr key={f.key}>
                  <td className="muted" style={{ width: 40 }}>
                    {f.no}
                  </td>
                  <td style={{ width: "36%" }}>{f.label}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>
                    {f.display || <span className="muted">—</span>}
                    {f.isDefault && f.display && (
                      <span className="muted small"> (default)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {modal === "common" && (
        <CommonMetadataEditor
          experimentId={experimentId}
          fields={m.common}
          onClose={() => setModal(null)}
        />
      )}
      {openTrial && (
        <Modal
          wide
          title={`Metadata · ${openTrial.centre?.name ?? ""}`}
          subtitle={m.experiment.title}
          onClose={() => setOpenTrial(null)}
        >
          <TrialMetadata trialId={openTrial.trialId} />
        </Modal>
      )}
    </div>
  );
}

function CommonMetadataEditor({ experimentId, fields, onClose }) {
  const save = useSaveCommonMetadata(experimentId);
  const [values, setValues] = useState(() =>
    // Only what the PCU set; defaults show as placeholders, so they stay defaults.
    Object.fromEntries(
      fields.map((f) => [f.key, f.isDefault ? "" : (f.value ?? "")]),
    ),
  );
  return (
    <SaveModal
      title="Common metadata"
      subtitle="The same for every centre running this experiment. Clear a field to go back to its default."
      onSave={async () => {
        await save.mutateAsync(values);
        toast.success("Common metadata saved");
      }}
      onClose={onClose}
    >
      <div className="grid g2">
        {fields.map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            value={values[f.key]}
            placeholder={f.isDefault ? f.display : ""}
            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
          />
        ))}
      </div>
    </SaveModal>
  );
}
