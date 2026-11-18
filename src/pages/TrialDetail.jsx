import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FilePlus2,
  Pencil,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import { useAuth } from "../auth";
import { AsyncFormModal, ErrorNote, SaveModal } from "../components/forms";
import { Badge, Card, Page, Table, Tabs } from "../components/ui";
import { ROUTES, TRIAL_STATUSES } from "../config/constants";
import { formatDate, formatDateTime } from "../hooks";
import { toast } from "../lib/toast";
import { useFinancialYears, useMasterOptions } from "../queries/masters";
import {
  useCreateSheet,
  useSheets,
  useTrial,
  useUpdateTrial,
} from "../queries/research";

// One experiment at one centre. The centre (research.enter) sets up its cropping systems and the
// practices behind each treatment, then opens observation sheets per year and season.

const PRACTICE_FIELDS = [
  ["seedDetails", "Seed & sowing"],
  ["nutrientDetails", "Nutrient management"],
  ["protectionDetails", "Plant protection"],
  ["otherDetails", "Other practices"],
];

export default function TrialDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("sheets");
  const [modal, setModal] = useState(null);
  const trial = useTrial(id);
  const sheets = useSheets({ trialId: id });
  const update = useUpdateTrial(id);
  const seasons = useMasterOptions("season");
  const crops = useMasterOptions("crop");
  const edit = can("research.enter") || can("research.config");
  const close = () => setModal(null);

  if (trial.error) {
    return (
      <Page title="Trial">
        <div className="stack">
          <ErrorNote error={trial.error} />
          <Link to={ROUTES.experiments} className="btn ghost">
            Back to experiments
          </Link>
        </div>
      </Page>
    );
  }
  const t = trial.data;
  if (!t)
    return (
      <Page title="Trial">
        <p className="muted">Loading…</p>
      </Page>
    );
  const e = t.experiment;
  const save = (body) => update.mutateAsync(body);
  const practiceOf = (code) =>
    t.practices.find((p) => p.treatmentCode === code) ?? {};

  return (
    <Page
      title={
        <span className="row" style={{ gap: 10 }}>
          {e.code} at {t.centreId.name}{" "}
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
        </span>
      }
      actions={
        <>
          <Link to={ROUTES.experiment(e.id)} className="btn ghost">
            <ArrowLeft size={15} /> Experiment
          </Link>
          {edit && (
            <button className="btn ghost" onClick={() => setModal("details")}>
              <Pencil size={15} /> Status & notes
            </button>
          )}
          {can("research.enter") && (
            // The server only accepts sheets for active experiments; say why instead of failing later.
            <button
              className="btn"
              onClick={() => setModal("sheet")}
              disabled={e.status !== "Active"}
              title={
                e.status !== "Active"
                  ? `The experiment is ${e.status}. Sheets can be opened once the PCU makes it Active.`
                  : undefined
              }
            >
              <FilePlus2 size={15} /> Open sheet
            </button>
          )}
        </>
      }
    >
      <div className="stack">
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
            {e.status !== "Active" && (
              <div className="note">
                The experiment is {e.status}. Sheets can be opened once the PCU
                makes it Active.
              </div>
            )}
          </div>
        </Card>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            ["sheets", "Observation sheets", sheets.data?.length],
            ["systems", "Cropping systems", t.croppingSystems.length],
            ["practices", "Treatment practices"],
          ]}
        />

        {tab === "sheets" && (
          <Card pad={false}>
            <ErrorNote error={sheets.error} />
            <Table
              rows={sheets.data ?? []}
              pageSize={20}
              onRow={(s) => navigate(ROUTES.sheet(s.id))}
              empty={
                sheets.isPending
                  ? "Loading…"
                  : "No sheets yet. Open one for a year and season to start recording data."
              }
              columns={[
                { label: "Year", render: (s) => <b>{s.fyCode}</b> },
                {
                  label: "Season",
                  render: (s) => seasons.nameOf(s.seasonCode),
                },
                {
                  label: "Cropping system",
                  render: (s) =>
                    t.croppingSystems.find(
                      (c) => c.code === s.croppingSystemCode,
                    )?.name ??
                    s.croppingSystemCode ??
                    "—",
                },
                {
                  label: "Crop",
                  render: (s) => (s.cropCode ? crops.nameOf(s.cropCode) : "—"),
                },
                {
                  label: "Last change",
                  render: (s) => formatDateTime(s.updatedAt),
                },
                { label: "Status", render: (s) => <Badge>{s.status}</Badge> },
              ]}
            />
          </Card>
        )}

        {tab === "systems" && (
          <Card
            pad={false}
            title="Cropping systems"
            actions={
              edit && (
                <button
                  className="btn ghost sm"
                  onClick={() => setModal("systems")}
                >
                  <Sprout size={14} /> Edit cropping systems
                </button>
              )
            }
          >
            {!t.croppingSystems.length && (
              <div className="empty">
                No cropping systems yet.
                {edit
                  ? " Add the crops and varieties grown in each season."
                  : ""}
              </div>
            )}
            {t.croppingSystems.map((cs) => (
              <div key={cs.code} style={{ padding: "6px 0 10px" }}>
                <div style={{ padding: "4px 16px" }}>
                  <b>{cs.code}</b> · {cs.name}
                </div>
                <Table
                  rows={cs.seasons.map((s) => ({ ...s, id: s.seasonCode }))}
                  pageSize={10}
                  empty="No seasons."
                  columns={[
                    {
                      label: "Season",
                      render: (s) => seasons.nameOf(s.seasonCode),
                    },
                    {
                      label: "Main crop",
                      render: (s) =>
                        `${crops.nameOf(s.mainCropCode)}${s.mainVariety ? ` (${s.mainVariety})` : ""}`,
                    },
                    {
                      label: "Intercrop",
                      render: (s) =>
                        s.intercropCode
                          ? `${crops.nameOf(s.intercropCode)}${s.intercropVariety ? ` (${s.intercropVariety})` : ""}${s.rowRatio ? ` · ${s.rowRatio}` : ""}`
                          : "—",
                    },
                    {
                      label: "Seed rate (kg/ha)",
                      num: true,
                      render: (s) => s.seedRate ?? "—",
                    },
                    {
                      label: "Sowing",
                      render: (s) => formatDate(s.sowingDate),
                    },
                    {
                      label: "Harvest",
                      render: (s) => formatDate(s.harvestDate),
                    },
                  ]}
                />
              </div>
            ))}
          </Card>
        )}

        {tab === "practices" && (
          <Card
            pad={false}
            title="What each treatment means at this centre"
            actions={
              edit && (
                <button
                  className="btn ghost sm"
                  onClick={() => setModal("practices")}
                >
                  <Pencil size={14} /> Edit practices
                </button>
              )
            }
          >
            <Table
              rows={e.treatments.map((tr) => ({ ...tr, id: tr.code }))}
              pageSize={30}
              empty="The experiment has no treatments yet."
              columns={[
                {
                  label: "Treatment",
                  render: (tr) => (
                    <>
                      <b>{tr.code}</b> {tr.name}
                    </>
                  ),
                },
                ...PRACTICE_FIELDS.map(([key, label]) => ({
                  label,
                  render: (tr) => (
                    <span className="small" style={{ whiteSpace: "pre-wrap" }}>
                      {practiceOf(tr.code)[key] || "—"}
                    </span>
                  ),
                })),
              ]}
            />
          </Card>
        )}
      </div>

      {modal === "details" && (
        <AsyncFormModal
          title="Trial status & notes"
          fields={[
            {
              name: "status",
              label: "Status",
              type: "select",
              options: TRIAL_STATUSES,
            },
            {
              name: "layoutNotes",
              label: "Layout notes",
              type: "textarea",
              required: false,
              clearable: true,
              hint: "Plot size, layout, field location …",
            },
          ]}
          initial={{ status: t.status, layoutNotes: t.layoutNotes ?? "" }}
          onSubmit={save}
          onDone={() => toast.success("Saved")}
          onClose={close}
        />
      )}
      {modal === "systems" && (
        <CroppingSystemsModal trial={t} save={save} onClose={close} />
      )}
      {modal === "practices" && (
        <PracticesModal trial={t} save={save} onClose={close} />
      )}
      {modal === "sheet" && (
        <OpenSheetModal
          trial={t}
          onClose={close}
          onOpened={(s) => navigate(ROUTES.sheet(s.id))}
        />
      )}
    </Page>
  );
}

const dateInput = (d) => (d ? String(d).slice(0, 10) : "");
const blankSeason = (seasonCode = "") => ({
  seasonCode,
  mainCropCode: "",
  mainVariety: "",
  intercropCode: "",
  intercropVariety: "",
  rowRatio: "",
  seedRate: "",
  sowingDate: "",
  harvestDate: "",
});

function CroppingSystemsModal({ trial, save, onClose }) {
  const seasons = useMasterOptions("season");
  const crops = useMasterOptions("crop");
  const allowedSeasons = seasons.options.filter(
    ([c]) =>
      !trial.experiment.seasons.length || trial.experiment.seasons.includes(c),
  );
  const [systems, setSystems] = useState(() =>
    trial.croppingSystems.map((cs) => ({
      code: cs.code,
      name: cs.name,
      seasons: cs.seasons.map((s) => ({
        ...blankSeason(),
        ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? ""])),
        seedRate: s.seedRate ?? "",
        sowingDate: dateInput(s.sowingDate),
        harvestDate: dateInput(s.harvestDate),
      })),
    })),
  );
  const setSystem = (i, k, v) =>
    setSystems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const setSeason = (i, si, k, v) =>
    setSystems((xs) =>
      xs.map((x, j) =>
        j === i
          ? {
              ...x,
              seasons: x.seasons.map((s, sj) =>
                sj === si ? { ...s, [k]: v } : s,
              ),
            }
          : x,
      ),
    );
  const addSystem = () =>
    setSystems((xs) => [
      ...xs,
      {
        code: `CS${xs.length + 1}`,
        name: "",
        seasons: [blankSeason(allowedSeasons[0]?.[0] ?? "")],
      },
    ]);

  const body = () => ({
    croppingSystems: systems.map((cs) => ({
      code: cs.code.trim(),
      name: cs.name.trim(),
      seasons: cs.seasons.map((s) => ({
        seasonCode: s.seasonCode,
        mainCropCode: s.mainCropCode,
        mainVariety: s.mainVariety.trim() || null,
        intercropCode: s.intercropCode || null,
        intercropVariety: s.intercropVariety.trim() || null,
        rowRatio: s.rowRatio.trim() || null,
        seedRate: s.seedRate === "" ? null : Number(s.seedRate),
        sowingDate: s.sowingDate || null,
        harvestDate: s.harvestDate || null,
      })),
    })),
  });
  const valid = systems.every(
    (cs) =>
      cs.code.trim() &&
      cs.name.trim().length >= 2 &&
      cs.seasons.every((s) => s.seasonCode && s.mainCropCode),
  );

  const cropSelect = (value, onChange, label, optional) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{optional ? "None" : "Select…"}</option>
      {crops.options.map(([c, n]) => (
        <option key={c} value={c}>
          {n}
        </option>
      ))}
    </select>
  );

  return (
    <SaveModal
      title="Cropping systems"
      subtitle="The crops and varieties grown in each season at this centre."
      canSave={valid}
      onSave={async () => {
        await save(body());
        toast.success("Cropping systems saved");
      }}
      onClose={onClose}
    >
      {!valid && (
        <div className="note warn">
          Each system needs a code, a name (2+ characters), and a season and
          main crop on every row.
        </div>
      )}
      {systems.map((cs, i) => (
        <Card
          key={i}
          title={
            <span className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
              <input
                aria-label="System code"
                className="select"
                style={{ width: 80 }}
                value={cs.code}
                onChange={(e) => setSystem(i, "code", e.target.value)}
              />
              <input
                aria-label="System name"
                className="select"
                style={{ minWidth: 220 }}
                value={cs.name}
                placeholder="e.g. Rice – Wheat"
                onChange={(e) => setSystem(i, "name", e.target.value)}
              />
            </span>
          }
          actions={
            <button
              className="icon-btn"
              aria-label="Remove system"
              onClick={() => setSystems((xs) => xs.filter((_, j) => j !== i))}
            >
              <Trash2 size={15} />
            </button>
          }
          pad={false}
        >
          <div className="table-wrap">
            <table className="entry">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Main crop</th>
                  <th>Variety</th>
                  <th>Intercrop</th>
                  <th>Variety</th>
                  <th>Row ratio</th>
                  <th>
                    Seed rate<small>kg/ha</small>
                  </th>
                  <th>Sowing</th>
                  <th>Harvest</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cs.seasons.map((s, si) => (
                  <tr key={si}>
                    <td>
                      <select
                        aria-label="Season"
                        value={s.seasonCode}
                        onChange={(e) =>
                          setSeason(i, si, "seasonCode", e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {allowedSeasons.map(([c, n]) => (
                          <option key={c} value={c}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {cropSelect(
                        s.mainCropCode,
                        (v) => setSeason(i, si, "mainCropCode", v),
                        "Main crop",
                      )}
                    </td>
                    <td>
                      <input
                        aria-label="Main variety"
                        value={s.mainVariety}
                        onChange={(e) =>
                          setSeason(i, si, "mainVariety", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      {cropSelect(
                        s.intercropCode,
                        (v) => setSeason(i, si, "intercropCode", v),
                        "Intercrop",
                        true,
                      )}
                    </td>
                    <td>
                      <input
                        aria-label="Intercrop variety"
                        value={s.intercropVariety}
                        onChange={(e) =>
                          setSeason(i, si, "intercropVariety", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Row ratio"
                        value={s.rowRatio}
                        placeholder="2:1"
                        onChange={(e) =>
                          setSeason(i, si, "rowRatio", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Seed rate"
                        type="number"
                        min={0}
                        value={s.seedRate}
                        onChange={(e) =>
                          setSeason(i, si, "seedRate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Sowing date"
                        type="date"
                        value={s.sowingDate}
                        onChange={(e) =>
                          setSeason(i, si, "sowingDate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Harvest date"
                        type="date"
                        value={s.harvestDate}
                        onChange={(e) =>
                          setSeason(i, si, "harvestDate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        aria-label="Remove season"
                        onClick={() =>
                          setSystem(
                            i,
                            "seasons",
                            cs.seasons.filter((_, sj) => sj !== si),
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "8px 12px" }}>
            <button
              className="btn ghost sm"
              onClick={() =>
                setSystem(i, "seasons", [...cs.seasons, blankSeason()])
              }
            >
              <Plus size={14} /> Add season
            </button>
          </div>
        </Card>
      ))}
      <div>
        <button className="btn ghost sm" onClick={addSystem}>
          <Plus size={14} /> Add cropping system
        </button>
      </div>
    </SaveModal>
  );
}

function PracticesModal({ trial, save, onClose }) {
  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      trial.experiment.treatments.map((tr) => {
        const p =
          trial.practices.find((x) => x.treatmentCode === tr.code) ?? {};
        return [
          tr.code,
          Object.fromEntries(PRACTICE_FIELDS.map(([k]) => [k, p[k] ?? ""])),
        ];
      }),
    ),
  );
  const set = (code, k, v) =>
    setRows((r) => ({ ...r, [code]: { ...r[code], [k]: v } }));
  const body = () => ({
    practices: Object.entries(rows).map(([treatmentCode, p]) => ({
      treatmentCode,
      ...Object.fromEntries(
        Object.entries(p).map(([k, v]) => [k, v.trim() || null]),
      ),
    })),
  });
  return (
    <SaveModal
      title="Treatment practices"
      subtitle="Describe what each treatment involves at this centre."
      onSave={async () => {
        await save(body());
        toast.success("Practices saved");
      }}
      onClose={onClose}
    >
      {trial.experiment.treatments.map((tr) => (
        <Card
          key={tr.code}
          title={
            <>
              <b>{tr.code}</b> {tr.name}
            </>
          }
        >
          <div className="form">
            {PRACTICE_FIELDS.map(([k, label]) => (
              <div key={k} className="field">
                <label htmlFor={`p-${tr.code}-${k}`}>{label}</label>
                <textarea
                  id={`p-${tr.code}-${k}`}
                  rows={2}
                  value={rows[tr.code][k]}
                  onChange={(e) => set(tr.code, k, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </SaveModal>
  );
}

function OpenSheetModal({ trial, onClose, onOpened }) {
  const years = useFinancialYears();
  const seasons = useMasterOptions("season");
  const crops = useMasterOptions("crop");
  const create = useCreateSheet();
  // Open years from the experiment's start year on (year codes sort in time order); the server
  // refuses earlier years, which the reporting grid and trend would never show.
  const openYears = (years.data ?? []).filter(
    (y) => y.isOpen && y.code >= trial.experiment.startYear,
  );
  const allowedSeasons = seasons.options.filter(
    ([c]) =>
      !trial.experiment.seasons.length || trial.experiment.seasons.includes(c),
  );
  const current =
    openYears.find((y) => y.isCurrent)?.code ?? openYears[0]?.code ?? "";
  // The form copies `initial` once, so wait for the lists that fill it.
  if (years.isPending || seasons.isPending) return null;
  return (
    <AsyncFormModal
      title="Open observation sheet"
      submitLabel="Open sheet"
      intro={
        <p className="muted small" style={{ margin: 0 }}>
          One sheet per year and season (and cropping system or crop, if you
          record them separately).
        </p>
      }
      fields={[
        {
          name: "fyCode",
          label: "Financial year",
          type: "select",
          options: openYears.map((y) => y.code),
          hint: openYears.length
            ? `Open years from ${trial.experiment.startYear} (the experiment's start) are listed.`
            : `No open year from ${trial.experiment.startYear} on. Ask the PCU to open or add one.`,
        },
        {
          name: "seasonCode",
          label: "Season",
          type: "select",
          options: allowedSeasons,
        },
        {
          name: "croppingSystemCode",
          label: "Cropping system",
          type: "select",
          required: false,
          options: trial.croppingSystems.map((c) => [
            c.code,
            `${c.code} · ${c.name}`,
          ]),
        },
        {
          name: "cropCode",
          label: "Crop",
          type: "select",
          required: false,
          options: crops.options,
        },
      ]}
      initial={{
        fyCode: current,
        seasonCode: allowedSeasons.length === 1 ? allowedSeasons[0][0] : "",
      }}
      onSubmit={(body) => create.mutateAsync({ trialId: trial.id, ...body })}
      onDone={(s) => {
        toast.success("Sheet opened");
        onOpened(s);
      }}
      onClose={onClose}
    />
  );
}
