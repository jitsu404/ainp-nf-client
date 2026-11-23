import { useMemo, useState } from "react";
import { ErrorNote, SaveModal } from "../../../components/forms";
import { PARAMETER_LEVELS } from "../../../config/constants";
import { useParameters, useUnitLabel } from "../../../queries/masters";

export function ParametersModal({ experiment, save, onClose }) {
  const library = useParameters({ isActive: true });
  const unit = useUnitLabel();
  const expParams = experiment.defaultParameters ?? experiment.parameters ?? [];
  const [selected, setSelected] = useState(
    () =>
      new Map(
        expParams.map((p) => [
          p.parameterId,
          { section: p.section, level: p.level, required: p.required },
        ]),
      ),
  );
  const [filter, setFilter] = useState("");
  const original = new Set(expParams.map((p) => p.parameterId));
  const frozen = (pid) => experiment.dataLocked && original.has(pid);

  const toggle = (p, on) =>
    setSelected((m) => {
      const next = new Map(m);
      if (on)
        next.set(p.id, { section: p.category, level: "plot", required: false });
      else next.delete(p.id);
      return next;
    });
  const set = (pid, k, value) =>
    setSelected((m) => new Map(m).set(pid, { ...m.get(pid), [k]: value }));

  const byCategory = useMemo(() => {
    const groups = new Map();
    for (const p of library.data ?? []) {
      if (
        filter &&
        !`${p.name} ${p.code}`.toLowerCase().includes(filter.toLowerCase())
      )
        continue;
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category).push(p);
    }
    return [...groups];
  }, [library.data, filter]);
  const nameOf = (pid) =>
    library.data?.find((p) => p.id === pid)?.name ??
    expParams.find((p) => p.parameterId === pid)?.name ??
    pid;

  return (
    <SaveModal
      title="Parameters to record"
      subtitle="Pick from the parameter library, then set how each is recorded."
      onSave={() =>
        save({
          defaultParameters: [...selected].map(([parameterId, p]) => ({
            parameterId,
            section: p.section.trim() || "Observations",
            level: p.level,
            required: p.required,
          })),
        })
      }
      onClose={onClose}
    >
      <ErrorNote error={library.error} />
      <input
        className="select"
        placeholder="Filter the library…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div
        style={{
          maxHeight: 220,
          overflow: "auto",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: 8,
        }}
      >
        {library.isPending && <p className="muted">Loading…</p>}
        {byCategory.map(([category, params]) => (
          <div key={category} style={{ marginBottom: 8 }}>
            <div className="muted small" style={{ fontWeight: 600 }}>
              {category}
            </div>
            <div className="check-list" style={{ maxHeight: "none" }}>
              {params.map((p) => (
                <label key={p.id} title={p.code}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    disabled={frozen(p.id)}
                    onChange={(e) => toggle(p, e.target.checked)}
                  />
                  {p.name}
                  {p.unitCode ? (
                    <span className="muted"> ({unit(p.unitCode)})</span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <b>{selected.size} selected</b>
      {selected.size > 0 && (
        <div
          className="table-wrap"
          style={{ maxHeight: 240, overflow: "auto" }}
        >
          <table className="entry">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Section</th>
                <th>Recorded</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              {[...selected].map(([pid, p]) => (
                <tr key={pid}>
                  <td>{nameOf(pid)}</td>
                  <td>
                    <input
                      aria-label="Section"
                      value={p.section}
                      onChange={(e) => set(pid, "section", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      aria-label="Recorded"
                      value={p.level}
                      disabled={frozen(pid)}
                      onChange={(e) => set(pid, "level", e.target.value)}
                    >
                      {PARAMETER_LEVELS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      aria-label="Required"
                      checked={p.required}
                      onChange={(e) => set(pid, "required", e.target.checked)}
                      style={{ width: "auto", minWidth: 0 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SaveModal>
  );
}
