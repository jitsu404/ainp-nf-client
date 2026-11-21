import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Modal } from "./ui";

/** A readable random password that meets the API rule (10+ chars, a letter and a digit). */
export function generatePassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const pick = (set, n) =>
    Array.from(
      crypto.getRandomValues(new Uint32Array(n)),
      (x) => set[x % set.length],
    ).join("");
  return `${pick(letters, 8)}${pick(digits, 4)}`;
}

/** Shows an ApiError (or any error) in the standard note style. */
export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <div className="note bad" role="alert">
      {error.message}
      {error.requestId && (
        <div className="muted small">Reference: {error.requestId}</div>
      )}
    </div>
  );
}

/**
 * Modal form that submits to the API and stays open on errors, showing the server's
 * field-level messages under each field.
 *
 * fields: [{ name, label, type: text|email|tel|password|number|date|select|textarea, options, required, full,
 *            hint, generate, clearable, parse, render }]
 * `render({ id, value, onChange })` draws a custom input for the field (e.g. the formula editor).
 * onSubmit(values) → Promise; resolve to close (or return a value for onDone).
 */
export function AsyncFormModal({
  title,
  subtitle,
  fields,
  initial = {},
  onSubmit,
  onClose,
  onDone,
  submitLabel = "Save",
  intro,
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const missing = fields.some(
    (f) => f.required !== false && !String(values[f.name] ?? "").trim(),
  );
  const fieldErrors = error?.fieldErrors ?? {};

  const submit = async (e) => {
    e.preventDefault();
    if (missing || busy) return;
    setBusy(true);
    setError(null);
    try {
      // Send only filled-in values; the API treats missing optional fields as "not provided".
      // A `clearable` field (on edit forms) that was emptied is sent as null, which clears it.
      // `number` fields are sent as numbers; a field's own `parse` turns text into what the API
      // expects (e.g. "a | b" → ['a', 'b']). Values not shown as fields are sent unchanged.
      const byName = new Map(fields.map((f) => [f.name, f]));
      const convert = (f, v) =>
        f?.parse ? f.parse(v) : f?.type === "number" ? Number(v) : v;
      const body = Object.fromEntries(
        Object.entries(values)
          .map(([k, v]) => {
            const f = byName.get(k);
            if (String(v ?? "").trim() !== "") return [k, convert(f, v)];
            return [
              k,
              f?.clearable && String(initial[k] ?? "") !== ""
                ? null
                : undefined,
            ];
          })
          .filter(([, v]) => v !== undefined),
      );
      const result = await onSubmit(body);
      onDone?.(result, body);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="async-form"
            className="btn"
            disabled={missing || busy}
          >
            {busy && <Loader2 size={15} className="spin" />}
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="async-form" className="stack" onSubmit={submit} noValidate>
        {intro}
        <ErrorNote
          error={error && !Object.keys(fieldErrors).length ? error : null}
        />
        <div className="form">
          {fields.map((f) => (
            <div
              key={f.name}
              className={`field ${f.full || f.type === "textarea" ? "full" : ""}`}
            >
              <label htmlFor={`f-${f.name}`}>
                {f.label}
                {f.required === false && (
                  <span className="muted"> (optional)</span>
                )}
              </label>
              {f.render ? (
                f.render({
                  id: `f-${f.name}`,
                  value: values[f.name] ?? "",
                  onChange: (v) => set(f.name, v),
                })
              ) : f.type === "select" ? (
                <select
                  id={`f-${f.name}`}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {f.options.map((o) =>
                    Array.isArray(o) ? (
                      <option key={o[0]} value={o[0]}>
                        {o[1]}
                      </option>
                    ) : (
                      <option key={o}>{o}</option>
                    ),
                  )}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  id={`f-${f.name}`}
                  rows={3}
                  value={values[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
                  <input
                    id={`f-${f.name}`}
                    type={f.type || "text"}
                    value={values[f.name] ?? ""}
                    autoComplete={
                      f.type === "password" ? "new-password" : "off"
                    }
                    onChange={(e) => set(f.name, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {f.generate && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => set(f.name, generatePassword())}
                      title="Generate a password"
                    >
                      <KeyRound size={14} /> Generate
                    </button>
                  )}
                </div>
              )}
              {fieldErrors[f.name] && (
                <span className="field-error">
                  {fieldErrors[f.name].join(". ")}
                </span>
              )}
              {f.hint && !fieldErrors[f.name] && (
                <span className="muted small">{f.hint}</span>
              )}
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal for custom editors (lists, grids, checkboxes) that AsyncFormModal's flat fields can't
 * express. The editor keeps its own state; onSave() → Promise. Stays open and shows the error
 * (with the server's field messages) if saving fails.
 */
export function SaveModal({
  title,
  subtitle,
  onSave,
  onClose,
  children,
  canSave = true,
  submitLabel = "Save",
  wide = true,
  bodyStyle,
  style,
}) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSave();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const fieldErrors = Object.entries(error?.fieldErrors ?? {});
  return (
    <Modal
      title={title}
      subtitle={subtitle}
      wide={wide}
      style={style}
      bodyStyle={bodyStyle}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={save}
            disabled={!canSave || busy}
          >
            {busy && <Loader2 size={15} className="spin" />}
            {submitLabel}
          </button>
        </>
      }
    >
      <div className="stack">
        {error && (
          <div className="note bad" role="alert">
            {error.message}
            {fieldErrors.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {fieldErrors.map(([field, messages]) => (
                  <li key={field}>
                    {field}: {messages.join(". ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {children}
      </div>
    </Modal>
  );
}

/** Shown once after creating an account: the details the PCU must pass on to the person. */
export function CredentialsModal({
  title = "Account created",
  name,
  email,
  password,
  mustChange = true,
  onClose,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button className="btn" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="stack">
        <p>
          Share these sign-in details with <b>{name}</b> through a secure
          channel.{" "}
          {mustChange
            ? "They will be asked to choose their own password the first time they sign in."
            : "They can change the password later from My account."}
        </p>
        <div className="kv" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <span>Email (username)</span>
            <b>{email}</b>
          </div>
          <div>
            <span>{mustChange ? "Temporary password" : "Password"}</span>
            <b className="mono">{password}</b>
          </div>
        </div>
        <div className="note warn">
          This password is not shown again. If it is lost,{" "}
          {mustChange ? "use “Reset password”." : "set a new one."}
        </div>
      </div>
    </Modal>
  );
}
