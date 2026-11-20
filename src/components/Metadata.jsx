import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
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
          <span className="grow" />
          {m.canEdit && (
            <button className="btn ghost sm" onClick={() => setModal("edit")}>
              <Pencil size={14} /> Edit metadata
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
              <th style={{ width: "36%" }}>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key}>
                <td className="muted">{f.no ?? ""}</td>
                <td>
                  {f.label}
                  {f.hint && <div className="muted small">{f.hint}</div>}
                </td>
                <td style={{ whiteSpace: "pre-wrap" }}>
                  {f.display || <span className="muted">—</span>}
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
function FieldInput({
  field: f,
  value,
  onChange,
  placeholder,
  onReset,
  isOverridden,
}) {
  const id = `meta-${f.key}`;
  const label = (
    <div
      className="row spread"
      style={{ alignItems: "center", width: "100%", marginBottom: 4 }}
    >
      <label htmlFor={id} style={{ margin: 0, fontWeight: 550 }}>
        {f.no ? `${f.no}. ` : ""}
        {f.label}
      </label>
      {onReset && (
        <button
          type="button"
          className="btn ghost xs"
          title={`Reset to default (${f.defaultDisplay || "Protocol default"})`}
          onClick={onReset}
          style={{ padding: "1px 6px", fontSize: "0.75rem", gap: 3 }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      )}
    </div>
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
        {label}
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
      className={`field ${f.type === "textarea" || f.no === 7 || f.no === 8 || f.no === 24 || f.no === 25 || f.no === 36 ? "full" : ""}`}
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

const METADATA_SECTIONS = [
  {
    id: "all",
    label: "All fields",
  },
  {
    id: "info",
    label: "1. Institutional & Project",
    keys: [
      "smdName",
      "instituteName",
      "unitType",
      "unitName",
      "projectTitle",
      "projectCode",
    ],
  },
  {
    id: "dataset",
    label: "2. Dataset & Personnel",
    keys: [
      "datasetTitle",
      "description",
      "piNames",
      "piDesignations",
      "piEmails",
      "coPis",
      "custodian",
    ],
  },
  {
    id: "domain",
    label: "3. Domain & Design",
    keys: [
      "fundingType",
      "fundingSource",
      "subject",
      "keywords",
      "commodity",
      "design",
      "methodology",
    ],
  },
  {
    id: "specs",
    label: "4. Specs & Instruments",
    keys: [
      "dataCategory",
      "dataType",
      "dataScale",
      "dataFormat",
      "plotSize",
      "instruments",
      "attributes",
      "language",
    ],
  },
  {
    id: "coverage",
    label: "5. Coverage & Access",
    keys: [
      "temporalExtent",
      "seasons",
      "spatialExtent",
      "availabilityLocation",
      "completionDate",
      "embargoYears",
      "resource",
      "source",
      "relation",
      "citation",
    ],
  },
];

function TrialMetadataEditor({ record, trialId, onClose }) {
  const save = useSaveTrialMetadata(trialId);
  const allFields = record.fields;
  const [section, setSection] = useState("all");
  const [search, setSearch] = useState("");

  const [values, setValues] = useState(() => {
    const initial = {};
    for (const f of allFields) {
      if (f.type === "multiselect") {
        initial[f.key] = Array.isArray(f.value)
          ? f.value
          : Array.isArray(f.defaultValue)
            ? f.defaultValue
            : [];
      } else if (f.type === "people") {
        initial[f.key] = Array.isArray(f.value)
          ? f.value
          : Array.isArray(f.defaultValue)
            ? f.defaultValue
            : [];
      } else if (f.type === "number") {
        initial[f.key] = f.value != null ? f.value : (f.defaultValue ?? "");
      } else {
        initial[f.key] = f.value ?? f.defaultValue ?? f.display ?? "";
      }
    }
    return initial;
  });

  const handleResetField = (key) => {
    const f = allFields.find((item) => item.key === key);
    if (!f) return;
    const def =
      f.defaultValue != null ? f.defaultValue : (f.defaultDisplay ?? "");
    setValues((s) => ({
      ...s,
      [key]: def,
    }));
  };

  const handleResetAll = () => {
    const resetValues = {};
    for (const f of allFields) {
      if (f.type === "multiselect" || f.type === "people") {
        resetValues[f.key] = Array.isArray(f.defaultValue)
          ? f.defaultValue
          : [];
      } else if (f.type === "number") {
        resetValues[f.key] = f.defaultValue != null ? f.defaultValue : "";
      } else {
        resetValues[f.key] = f.defaultValue ?? f.defaultDisplay ?? "";
      }
    }
    setValues(resetValues);
    toast.info("All fields reset to computed defaults");
  };

  const activeSectionDef = METADATA_SECTIONS.find((s) => s.id === section);
  const visibleFields = allFields.filter((f) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        (f.hint && f.hint.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (section === "all") return true;
    return activeSectionDef?.keys?.includes(f.key);
  });

  const onSave = async () => {
    const body = { ...values };
    body.embargoYears =
      values.embargoYears === "" || values.embargoYears == null
        ? null
        : Number(values.embargoYears);
    body.coPis = (values.coPis ?? []).filter((p) => p.name?.trim());

    // Clean empty strings to null
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string" && v.trim() === "") {
        body[k] = null;
      }
    }

    await save.mutateAsync(body);
    toast.success("Trial metadata saved");
  };

  return (
    <SaveModal
      title="Trial metadata"
      subtitle={`${record.experiment.code} at ${record.centre?.name}. All 38 ICAR fields are editable and prefilled with defaults.`}
      wide={true}
      style={{ maxWidth: 940 }}
      onSave={onSave}
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 14 }}>
        {/* Toolbar: Sections, Search & Reset All */}
        <div
          className="row spread"
          style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}
        >
          <div
            className="row"
            style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}
          >
            {METADATA_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`btn sm ${section === s.id ? "" : "ghost"}`}
                style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <div
              className="row"
              style={{
                alignItems: "center",
                background: "var(--surface, #ffffff)",
                border: "1px solid var(--line, #e3e8e4)",
                borderRadius: "6px",
                padding: "2px 8px",
                minWidth: 170,
              }}
            >
              <Search size={13} className="muted" style={{ marginRight: 4 }} />
              <input
                type="text"
                placeholder="Filter fields…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.82rem",
                  width: "100%",
                }}
              />
            </div>

            <button
              type="button"
              className="btn ghost sm"
              style={{ padding: "4px 8px", fontSize: "0.8rem", gap: 4 }}
              onClick={handleResetAll}
              title="Reset all fields to protocol & system defaults"
            >
              <RotateCcw size={12} /> Reset all
            </button>
          </div>
        </div>

        {/* Fields Grid */}
        <div
          style={{
            maxHeight: "58vh",
            overflowY: "auto",
            paddingRight: 6,
          }}
        >
          {visibleFields.length === 0 ? (
            <div
              className="muted center"
              style={{ padding: "32px 0", fontSize: "0.9rem" }}
            >
              No fields match your search.
            </div>
          ) : (
            <div className="grid g2" style={{ gap: "14px 16px" }}>
              {visibleFields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={values[f.key]}
                  placeholder={f.defaultDisplay || f.display || ""}
                  onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                  onReset={() => handleResetField(f.key)}
                />
              ))}
            </div>
          )}
        </div>
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
  const [section, setSection] = useState("all");
  const [search, setSearch] = useState("");

  const [values, setValues] = useState(() => {
    const initial = {};
    for (const f of fields) {
      if (f.type === "multiselect" || f.type === "people") {
        initial[f.key] = Array.isArray(f.value)
          ? f.value
          : Array.isArray(f.defaultValue)
            ? f.defaultValue
            : [];
      } else if (f.type === "number") {
        initial[f.key] = f.value != null ? f.value : (f.defaultValue ?? "");
      } else {
        initial[f.key] = f.value ?? f.defaultValue ?? f.display ?? "";
      }
    }
    return initial;
  });

  const handleResetField = (key) => {
    const f = fields.find((item) => item.key === key);
    if (!f) return;
    const def =
      f.defaultValue != null ? f.defaultValue : (f.defaultDisplay ?? "");
    setValues((s) => ({
      ...s,
      [key]: def,
    }));
  };

  const handleResetAll = () => {
    const resetValues = {};
    for (const f of fields) {
      if (f.type === "multiselect" || f.type === "people") {
        resetValues[f.key] = Array.isArray(f.defaultValue)
          ? f.defaultValue
          : [];
      } else if (f.type === "number") {
        resetValues[f.key] = f.defaultValue != null ? f.defaultValue : "";
      } else {
        resetValues[f.key] = f.defaultValue ?? f.defaultDisplay ?? "";
      }
    }
    setValues(resetValues);
    toast.info("All fields reset to computed defaults");
  };

  const activeSectionDef = METADATA_SECTIONS.find((s) => s.id === section);
  const visibleFields = fields.filter((f) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        (f.hint && f.hint.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (section === "all") return true;
    return activeSectionDef?.keys?.includes(f.key);
  });

  const onSave = async () => {
    const body = { ...values };
    body.embargoYears =
      values.embargoYears === "" || values.embargoYears == null
        ? null
        : Number(values.embargoYears);
    if (body.coPis) {
      body.coPis = (values.coPis ?? []).filter((p) => p.name?.trim());
    }

    // Clean empty strings to null
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string" && v.trim() === "") {
        body[k] = null;
      }
    }

    await save.mutateAsync(body);
    toast.success("Common metadata saved");
  };

  return (
    <SaveModal
      title="Common metadata"
      subtitle="Defaults for every centre running this experiment. All 38 ICAR fields can be configured here."
      wide={true}
      style={{ maxWidth: 940 }}
      onSave={onSave}
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 14 }}>
        {/* Toolbar: Sections, Search & Reset All */}
        <div
          className="row spread"
          style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}
        >
          <div
            className="row"
            style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}
          >
            {METADATA_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`btn sm ${section === s.id ? "" : "ghost"}`}
                style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <div
              className="row "
              style={{
                alignItems: "center",
                background: "var(--surface, #ffffff)",
                border: "1px solid var(--line, #e3e8e4)",
                borderRadius: "6px",
                padding: "2px 8px",
                minWidth: 170,
              }}
            >
              <Search size={13} className="muted" style={{ marginRight: 4 }} />
              <input
                type="text"
                placeholder="Filter fields…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.82rem",
                  width: "100%",
                }}
              />
            </div>

            <button
              type="button"
              className="btn ghost sm"
              style={{ padding: "4px 8px", fontSize: "0.8rem", gap: 4 }}
              onClick={handleResetAll}
              title="Reset all fields to protocol & system defaults"
            >
              <RotateCcw size={12} /> Reset all
            </button>
          </div>
        </div>

        {/* Fields Grid */}
        <div
        // style={{
        //   maxHeight: "58vh",
        //   overflowY: "auto",
        //   paddingRight: 6,
        // }}
        >
          {visibleFields.length === 0 ? (
            <div
              className="muted center"
              style={{ padding: "32px 0", fontSize: "0.9rem" }}
            >
              No fields match your search.
            </div>
          ) : (
            <div className="grid g2" style={{ gap: "14px 16px" }}>
              {visibleFields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={values[f.key]}
                  placeholder={f.defaultDisplay || f.display || ""}
                  onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                  onReset={() => handleResetField(f.key)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SaveModal>
  );
}
