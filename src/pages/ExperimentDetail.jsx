import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FlaskConical,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../auth";
import { ErrorNote, SaveModal } from "../components/forms";
import { ReportingGrid } from "../components/ReportingGrid";
import { Badge, Card, Page, Select, Table, Tabs } from "../components/ui";
import { PARAMETER_LEVELS, ROUTES } from "../config/constants";
import { useCentres } from "../queries/centres";
import {
  useFinancialYears,
  useMasterOptions,
  useParameters,
  useUnitLabel,
} from "../queries/masters";
import {
  useExperiment,
  useExperimentSummary,
  useTrials,
  useUpdateExperiment,
} from "../queries/research";
import { ExperimentDetailsModal } from "./Experiments";

export default function ExperimentDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("protocol");
  const [modal, setModal] = useState(null); // 'details' | 'treatments' | 'parameters' | 'centres'
  const experiment = useExperiment(id);
  const trials = useTrials({ experimentId: id });
  const update = useUpdateExperiment(id);
  const programmes = useMasterOptions("programme");
  const seasons = useMasterOptions("season");
  const unit = useUnitLabel();
  const config = can("research.config");
  const close = () => setModal(null);

  if (experiment.error) {
    return (
      <Page title="Experiment">
        <div className="stack">
          <ErrorNote error={experiment.error} />
          <Link to={ROUTES.experiments} className="btn ghost">
            Back to experiments
          </Link>
        </div>
      </Page>
    );
  }
  const e = experiment.data;
  if (!e)
    return (
      <Page title="Experiment">
        <p className="muted">Loading…</p>
      </Page>
    );
  // A trial stays (with its data) when its centre is unassigned; list only assigned centres.
  const trialRows = (trials.data ?? []).filter((t) =>
    e.centreIds.includes(t.centreId?.id),
  );
  // A Centre PI sees only their own centre's trial: offer a direct link.
  const myTrial = !config && trialRows.length === 1 ? trialRows[0] : null;
  const save = (body) => update.mutateAsync(body);

  return (
    <Page
      title={
        <span className="row" style={{ gap: 10 }}>
          {e.code} <Badge>{e.status}</Badge>
        </span>
      }
      actions={
        <>
          <Link to={ROUTES.experiments} className="btn ghost">
            <ArrowLeft size={15} /> Experiments
          </Link>
          {config && (
            <button className="btn ghost" onClick={() => setModal("details")}>
              <Pencil size={15} /> Edit details
            </button>
          )}
          {myTrial && (
            <Link to={ROUTES.trial(myTrial.id)} className="btn">
              <ArrowRight size={15} /> My centre's trial
            </Link>
          )}
        </>
      }
    >
      <div className="stack">
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
                <b>{e.startYear}</b>
              </div>
              <div>
                <span>Seasons</span>
                <b>
                  {e.seasons.length
                    ? e.seasons.map(seasons.nameOf).join(", ")
                    : "Any"}
                </b>
              </div>
              <div>
                <span>Treatments / parameters</span>
                <b>
                  {e.treatments.length} / {e.parameters.length}
                </b>
              </div>
              <div>
                <span>Centres</span>
                <b>{e.centreIds.length}</b>
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
                Centres have recorded data. The design, replications and
                existing treatments and parameters are frozen; new ones can
                still be added.
              </div>
            )}
            {e.status !== "Active" && (
              <div className="note">
                Centres can record data only once the experiment is{" "}
                <b>Active</b>.
              </div>
            )}
          </div>
        </Card>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            ["protocol", "Protocol"],
            ["centres", config ? "Centres" : "My centre", trialRows.length],
            ["reporting", "Reporting"],
            ["summary", "Results summary"],
          ]}
        />

        {tab === "protocol" && (
          <div className="grid g2">
            <Card
              title="Treatments"
              pad={false}
              actions={
                config && (
                  <button
                    className="btn ghost sm"
                    onClick={() => setModal("treatments")}
                  >
                    <ListChecks size={14} /> Edit treatments
                  </button>
                )
              }
            >
              <Table
                rows={e.treatments.map((t) => ({ ...t, id: t.code }))}
                pageSize={30}
                empty="No treatments yet."
                columns={[
                  { label: "Code", render: (t) => <b>{t.code}</b> },
                  { label: "Treatment", key: "name" },
                  {
                    label: "Details",
                    render: (t) => (
                      <span className="muted small">
                        {t.description || "—"}
                      </span>
                    ),
                  },
                ]}
              />
            </Card>
            <Card
              title="Parameters recorded"
              pad={false}
              actions={
                config && (
                  <button
                    className="btn ghost sm"
                    onClick={() => setModal("parameters")}
                  >
                    <FlaskConical size={14} /> Edit parameters
                  </button>
                )
              }
            >
              <Table
                rows={e.parameters.map((p) => ({ ...p, id: p.parameterId }))}
                pageSize={30}
                empty="No parameters yet."
                columns={[
                  { label: "Section", key: "section" },
                  {
                    label: "Parameter",
                    render: (p) => (
                      <>
                        {p.name}
                        {p.required && !p.formula && (
                          <span className="muted"> *</span>
                        )}
                        {p.formula && (
                          <div
                            className="muted small mono"
                            title="Calculated from other values"
                          >
                            = {p.formula}
                          </div>
                        )}
                      </>
                    ),
                  },
                  { label: "Unit", render: (p) => unit(p.unitCode) || "—" },
                  {
                    label: "Recorded",
                    render: (p) =>
                      (p.level === "plot" && e.replications
                        ? "Per plot"
                        : "Per treatment") + (p.formula ? " · calculated" : ""),
                  },
                ]}
              />
              <div className="muted small" style={{ padding: "8px 16px" }}>
                * required before a sheet can be submitted
              </div>
            </Card>
          </div>
        )}

        {tab === "centres" && (
          <Card
            pad={false}
            title={config ? "Centres running this experiment" : undefined}
            actions={
              config && (
                <button
                  className="btn ghost sm"
                  onClick={() => setModal("centres")}
                >
                  <Building2 size={14} /> Assign centres
                </button>
              )
            }
          >
            <Table
              rows={trialRows}
              pageSize={30}
              onRow={(t) => navigate(ROUTES.trial(t.id))}
              empty={trials.isPending ? "Loading…" : "No centres assigned yet."}
              columns={[
                {
                  label: "Centre",
                  render: (t) => (
                    <b style={{ fontWeight: 550 }}>{t.centreId?.name ?? "—"}</b>
                  ),
                },
                { label: "Code", render: (t) => t.centreId?.code },
                { label: "State", render: (t) => t.centreId?.state },
                {
                  label: "Cropping systems",
                  render: (t) =>
                    t.croppingSystems.length ? (
                      t.croppingSystems.map((c) => c.name).join("; ")
                    ) : (
                      <Badge tone="amber">Not set up</Badge>
                    ),
                },
                {
                  label: "Status",
                  render: (t) => (
                    <Badge
                      tone={
                        t.status === "Running"
                          ? "blue"
                          : t.status === "Completed"
                            ? "green"
                            : "grey"
                      }
                    >
                      {t.status}
                    </Badge>
                  ),
                },
              ]}
            />
          </Card>
        )}

        {tab === "reporting" && <ReportingGrid experimentId={e.id} />}

        {tab === "summary" && (
          <SummaryTab experiment={e} canSeeUnapproved={config} />
        )}
      </div>

      {modal === "details" && (
        <ExperimentDetailsModal experiment={e} save={save} onClose={close} />
      )}
      {modal === "treatments" && (
        <TreatmentsModal experiment={e} save={save} onClose={close} />
      )}
      {modal === "parameters" && (
        <ParametersModal experiment={e} save={save} onClose={close} />
      )}
      {modal === "centres" && (
        <CentresModal experiment={e} save={save} onClose={close} />
      )}
    </Page>
  );
}

function TreatmentsModal({ experiment, save, onClose }) {
  const original = new Set(experiment.treatments.map((t) => t.code));
  const [rows, setRows] = useState(() =>
    experiment.treatments.length
      ? experiment.treatments.map((t) => ({
          code: t.code,
          name: t.name,
          description: t.description ?? "",
        }))
      : [{ code: "T1", name: "", description: "" }],
  );
  const set = (i, k, value) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: value } : row)));
  const add = () =>
    setRows((r) => [
      ...r,
      { code: `T${r.length + 1}`, name: "", description: "" },
    ]);
  const remove = (i) => setRows((r) => r.filter((_, j) => j !== i));
  // Treatments with recorded data can't be removed or renamed by code (the API also refuses).
  const frozen = (row) => experiment.dataLocked && original.has(row.code);
  const codes = rows.map((r) => r.code.trim().toUpperCase());
  const valid =
    rows.every((r) => r.code.trim() && r.name.trim()) &&
    new Set(codes).size === codes.length;

  return (
    <SaveModal
      title="Treatments"
      subtitle="The common treatments every centre applies (T1, T2 …)."
      canSave={valid}
      onSave={() =>
        save({
          treatments: rows.map((r) => ({
            code: r.code.trim(),
            name: r.name.trim(),
            ...(r.description.trim()
              ? { description: r.description.trim() }
              : {}),
          })),
        })
      }
      onClose={onClose}
    >
      {!valid && rows.length > 0 && (
        <div className="note warn">
          Every treatment needs a unique code and a name.
        </div>
      )}
      <div className="stack" style={{ gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} className="editor-row">
            <input
              aria-label="Code"
              value={r.code}
              disabled={frozen(r)}
              onChange={(e) => set(i, "code", e.target.value)}
              className="select"
            />
            <input
              aria-label="Treatment name"
              value={r.name}
              onChange={(e) => set(i, "name", e.target.value)}
              placeholder="Treatment, e.g. Complete NF"
              className="select"
            />
            <input
              aria-label="Details"
              value={r.description}
              onChange={(e) => set(i, "description", e.target.value)}
              placeholder="Details (optional)"
              className="select"
            />
            <button
              className="icon-btn"
              aria-label={`Remove ${r.code}`}
              title={frozen(r) ? "Has recorded data" : "Remove"}
              disabled={frozen(r)}
              onClick={() => remove(i)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <div>
          <button className="btn ghost sm" onClick={add}>
            <Plus size={14} /> Add treatment
          </button>
        </div>
      </div>
    </SaveModal>
  );
}

function ParametersModal({ experiment, save, onClose }) {
  const library = useParameters({ isActive: true });
  const unit = useUnitLabel();
  const [selected, setSelected] = useState(
    () =>
      new Map(
        experiment.parameters.map((p) => [
          p.parameterId,
          { section: p.section, level: p.level, required: p.required },
        ]),
      ),
  );
  const [filter, setFilter] = useState("");
  const original = new Set(experiment.parameters.map((p) => p.parameterId));
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
    experiment.parameters.find((p) => p.parameterId === pid)?.name ??
    pid;

  return (
    <SaveModal
      title="Parameters to record"
      subtitle="Pick from the parameter library, then set how each is recorded."
      onSave={() =>
        save({
          parameters: [...selected].map(([parameterId, p]) => ({
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
          style={{ maxHeight: 260, overflow: "auto" }}
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

function CentresModal({ experiment, save, onClose }) {
  const centres = useCentres({ isActive: "true" });
  const [ids, setIds] = useState(() => new Set(experiment.centreIds));
  const toggle = (id, on) =>
    setIds((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const rows = centres.data?.data ?? [];
  return (
    <SaveModal
      title="Assign centres"
      subtitle="Each assigned centre gets its own trial to set up and record data in."
      canSave={!centres.isPending}
      onSave={() => save({ centreIds: [...ids] })}
      onClose={onClose}
    >
      <ErrorNote error={centres.error} />
      <div className="row">
        <button
          className="btn ghost sm"
          onClick={() => setIds(new Set(rows.map((c) => c.id)))}
        >
          Select all
        </button>
        <button className="btn ghost sm" onClick={() => setIds(new Set())}>
          Clear
        </button>
        <span className="muted small">{ids.size} selected</span>
      </div>
      <div className="check-list" style={{ maxHeight: 360 }}>
        {rows.map((c) => (
          <label key={c.id}>
            <input
              type="checkbox"
              checked={ids.has(c.id)}
              onChange={(e) => toggle(c.id, e.target.checked)}
            />
            {c.name} <span className="muted">({c.code})</span>
          </label>
        ))}
      </div>
      <div className="note">
        A centre you remove no longer sees this experiment. Its trial and
        recorded data are kept and come back if it is assigned again.
      </div>
    </SaveModal>
  );
}

const fmt = (x) =>
  x === null || x === undefined
    ? "—"
    : Number(x).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function SummaryTab({ experiment, canSeeUnapproved }) {
  const unit = useUnitLabel();
  const years = useFinancialYears();
  const seasons = useMasterOptions("season");
  const [fy, setFy] = useState("");
  const [season, setSeason] = useState("");
  const [all, setAll] = useState(false);
  const fyCode = fy || years.data?.find((y) => y.isCurrent)?.code || "";
  const summary = useExperimentSummary({
    experimentId: experiment.id,
    fyCode,
    seasonCode: season || undefined,
    includeUnapproved: all || undefined,
  });
  const s = summary.data;

  return (
    <div className="stack">
      <Card pad={false}>
        <div className="toolbar">
          <Select
            value={fyCode}
            onChange={setFy}
            options={(years.data ?? []).map((y) => y.code)}
          />
          <Select
            value={season}
            onChange={setSeason}
            options={seasons.options.filter(
              ([c]) =>
                !experiment.seasons.length || experiment.seasons.includes(c),
            )}
            all="All seasons"
          />
          {canSeeUnapproved && (
            <label className="row small" style={{ gap: 6 }}>
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => setAll(e.target.checked)}
              />{" "}
              Include sheets not yet approved
            </label>
          )}
          <span className="grow" />
          <span className="muted small">
            Treatment means per centre{all ? "" : ", from approved sheets"}
          </span>
        </div>
      </Card>
      <ErrorNote error={summary.error} />
      {summary.isPending && <p className="muted">Loading…</p>}
      {s && !s.centres.length && (
        <div className="empty card">
          No {all ? "" : "approved "}sheets for {fyCode} yet.
        </div>
      )}
      {s &&
        s.centres.length > 0 &&
        s.parameters.map((p) => {
          const centreMean = (t) => {
            const xs = s.centres
              .map((c) => c.means[p.parameterId]?.[t])
              .filter((x) => x !== null && x !== undefined);
            return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
          };
          return (
            <Card
              key={p.parameterId}
              pad={false}
              title={`${p.name}${p.unitCode ? ` (${unit(p.unitCode)})` : ""}`}
            >
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Centre</th>
                      <th>Season</th>
                      {s.treatments.map((t) => (
                        <th key={t.code} className="num" title={t.name}>
                          {t.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.centres.map((c) => (
                      <tr key={c.sheetId}>
                        <td>
                          <Link to={ROUTES.sheet(c.sheetId)}>
                            {c.centre.name}
                          </Link>
                          {c.status !== "Approved" && (
                            <>
                              {" "}
                              <Badge>{c.status}</Badge>
                            </>
                          )}
                        </td>
                        <td>{seasons.nameOf(c.seasonCode)}</td>
                        {s.treatments.map((t) => (
                          <td key={t.code} className="num">
                            {fmt(c.means[p.parameterId]?.[t.code])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {s.centres.length > 1 && (
                    <tfoot>
                      <tr>
                        <td colSpan={2}>
                          <b>Mean of centres</b>
                        </td>
                        {s.treatments.map((t) => (
                          <td key={t.code} className="num">
                            <b>{fmt(centreMean(t.code))}</b>
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
