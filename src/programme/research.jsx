import { useState } from "react";
import {
  Plus,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
} from "lucide-react";
import { useStore } from "../store";
import {
  Badge,
  Bars,
  Card,
  EntryGrid,
  ExportBar,
  FormModal,
  Modal,
  Page,
  Select,
  Stat,
  Table,
  Tabs,
  Workflow,
  useSearch,
  num,
} from "../components/ui";
import { PENDING } from "../data/calc";
import {
  BIO_INPUTS,
  INDICATORS,
  SEASONS,
  SYSTEMS,
  TREATMENTS,
  T_NAMES,
  indicators,
} from "./seed";

const T = { key: "treatment", label: "Treatment", readOnly: true };
const PROD_COLS = [
  T,
  { key: "grain", label: "Grain / economic yield (q/ha)", num: true },
  { key: "straw", label: "Straw / stover (q/ha)", num: true },
  { key: "equivalent", label: "Crop-equivalent yield (q/ha)", num: true },
];
const SOIL_COLS = [
  T,
  { key: "soc", label: "SOC (%)", num: true },
  { key: "n", label: "Avail. N (kg/ha)", num: true },
  { key: "p", label: "Avail. P (kg/ha)", num: true },
  { key: "k", label: "Avail. K (kg/ha)", num: true },
  { key: "mbc", label: "MBC (µg/g)", num: true },
  { key: "dha", label: "Dehydrogenase (µg TPF/g/day)", num: true },
  { key: "earthworms", label: "Earthworms (no./m²)", num: true },
];
const INPUT_COLS = [
  { key: "input", label: "Input", readOnly: true },
  { key: "unit", label: "Unit", readOnly: true },
  { key: "qty", label: "Quantity used", num: true },
];
const ECON_COLS = [
  T,
  { key: "cost", label: "Cost of cultivation (₹ ’000/ha)", num: true },
  { key: "gross", label: "Gross return (₹ ’000/ha)", num: true },
];
const blank = (keys) =>
  T_NAMES.map((treatment) => ({
    treatment,
    ...Object.fromEntries(keys.map((k) => [k, 0])),
  }));

const checks = (o, k) => [
  [
    "Yield entered for all five treatments",
    o.productivity.length === 5 && o.productivity.every((r) => r.grain > 0),
  ],
  [
    "Soil organic carbon within expected range (0.2 – 1.5%)",
    o.soil.every((r) => r.soc >= 0.2 && r.soc <= 1.5),
  ],
  [
    "Soil and biological parameters entered for every treatment",
    o.soil.every((r) => r.mbc > 0 && r.n > 0),
  ],
  [
    "Bio-input quantities entered",
    o.inputs.filter((r) => r.qty > 0).length >= 5,
  ],
  [
    "Benefit : cost ratio within expected range (0.8 – 4.0)",
    k.bc >= 0.8 && k.bc <= 4,
  ],
  [
    "Cost and gross return entered for every treatment",
    o.economics.every((r) => r.cost > 0 && r.gross > 0),
  ],
];

function ObservationModal({ obs, onClose }) {
  const { can, update, centreName } = useStore();
  const editable =
    can("research.enter") && ["Draft", "Returned"].includes(obs.status);
  const [tab, setTab] = useState("productivity");
  const [draft, setDraft] = useState({
    productivity: obs.productivity,
    soil: obs.soil,
    inputs: obs.inputs,
    economics: obs.economics,
  });
  const set = (k) => (rows) => setDraft((d) => ({ ...d, [k]: rows }));
  const k = indicators({ ...obs, ...draft });
  const econ = draft.economics.map((r) => ({
    ...r,
    net: r.gross - r.cost,
    bc: r.cost ? r.gross / r.cost : 0,
  }));
  return (
    <Modal
      wide
      title={obs.ref}
      subtitle={`${obs.title} · ${centreName(obs.centreId)} · ${obs.fy} · ${obs.season}`}
      onClose={onClose}
      footer={
        editable && (
          <button
            className="btn"
            onClick={() => update("observations", obs.id, draft, "Draft saved")}
          >
            <Save size={15} /> Save draft
          </button>
        )
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["productivity", "Crop / system productivity"],
          ["soil", "Soil & biological parameters"],
          ["inputs", "Input use"],
          ["economics", "Economics"],
          ["kpi", "Approved indicators"],
          ["workflow", "Validation & workflow"],
        ]}
      />
      {tab === "productivity" && (
        <EntryGrid
          columns={PROD_COLS}
          rows={draft.productivity}
          editable={editable}
          onChange={set("productivity")}
          addLabel="Add treatment"
        />
      )}
      {tab === "soil" && (
        <EntryGrid
          columns={SOIL_COLS}
          rows={draft.soil}
          editable={editable}
          onChange={set("soil")}
          addLabel="Add treatment"
        />
      )}
      {tab === "inputs" && (
        <>
          <EntryGrid
            columns={INPUT_COLS}
            rows={draft.inputs}
            editable={editable}
            onChange={set("inputs")}
            addLabel="Add input"
          />
        </>
      )}
      {tab === "economics" &&
        (editable ? (
          <EntryGrid
            columns={ECON_COLS}
            rows={draft.economics}
            editable
            onChange={set("economics")}
            addLabel="Add treatment"
          />
        ) : (
          <EntryGrid
            columns={[
              ...ECON_COLS,
              { key: "net", label: "Net return (₹ ’000/ha)", num: true },
              { key: "bc", label: "B:C ratio", num: true },
            ]}
            rows={econ}
          />
        ))}
      {tab === "kpi" && (
        <>
          <div className="grid g4">
            {INDICATORS.map((d) => (
              <div key={d.id} className="note">
                <span className="muted small">{d.label}</span>
                <div style={{ fontSize: 19, fontWeight: 650 }}>
                  {num(k[d.id], ["mbc", "earthworms"].includes(d.id) ? 0 : 2)}
                </div>
                <span className="muted small">{d.unit}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === "workflow" && (
        <>
          <Card title="Automatic validation checks">
            <div className="stack" style={{ gap: 7 }}>
              {checks({ ...obs, ...draft }, k).map(([label, ok]) => (
                <div key={label} className="row" style={{ flexWrap: "nowrap" }}>
                  {ok ? (
                    <CheckCircle2 size={16} color="var(--green)" />
                  ) : (
                    <AlertTriangle size={16} color="var(--amber)" />
                  )}
                  {label}
                  {!ok && <Badge tone="amber">Check</Badge>}
                </div>
              ))}
            </div>
          </Card>
          <Workflow col="observations" rec={obs} prefix="research" />
        </>
      )}
    </Modal>
  );
}

export default function Research() {
  const {
    db,
    fy,
    centre,
    centres,
    centreName,
    can,
    add,
    scope,
    notify,
    programme,
  } = useStore();
  const [tab, setTab] = useState("experiments");
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("");
  const [kpi, setKpi] = useState("yieldIdx");
  const models = scope(db.models);
  const exps = scope(db.experiments);
  const obs = scope(db.observations);
  const [obsRows, obsSearch] = useSearch(
    obs.filter((o) => !status || o.status === status),
    "Search observations…",
  );
  const queue = obs.filter((o) =>
    can("research.approve")
      ? o.status === "Scrutinised"
      : can("research.review")
        ? ["Submitted", "Resubmitted"].includes(o.status)
        : ["Draft", "Returned"].includes(o.status),
  );
  const open = db.observations.find((o) => o.id === openId);
  const yearObs = obs.filter((o) => o.fy === fy);
  const kd = INDICATORS.find((d) => d.id === kpi);
  const mean = (id) =>
    yearObs.length
      ? yearObs.reduce((a, o) => a + indicators(o)[id], 0) / yearObs.length
      : 0;
  const byCentre = centres
    .map((c) => {
      const rows = yearObs.filter((o) => o.centreId === c.id);
      return {
        label: c.name,
        n: rows.length,
        value: rows.length
          ? rows.reduce((a, o) => a + indicators(o)[kpi], 0) / rows.length
          : 0,
      };
    })
    .filter((r) => r.n);

  const obsCols = [
    { label: "Reference", key: "ref" },
    { label: "Crop · experiment", key: "title" },
    {
      label: "Centre",
      render: (r) => centreName(r.centreId),
      text: (r) => centreName(r.centreId),
    },
    { label: "Year", key: "fy" },
    { label: "Season", key: "season" },
    {
      label: "Yield vs control (%)",
      num: true,
      render: (r) => num(indicators(r).yieldIdx, 0),
      text: (r) => indicators(r).yieldIdx.toFixed(0),
    },
    {
      label: "SOC change",
      num: true,
      render: (r) => `+${num(indicators(r).soc)}`,
      text: (r) => indicators(r).soc.toFixed(2),
    },
    {
      label: "B:C",
      num: true,
      render: (r) => num(indicators(r).bc),
      text: (r) => indicators(r).bc.toFixed(2),
    },
    {
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
      text: (r) => r.status,
    },
  ];
  const synthCols = [
    { label: "Centre", key: "centre" },
    { label: "State", key: "state" },
    { label: "Crop", key: "crop" },
    { label: "Season", key: "season" },
    ...INDICATORS.map((d) => ({
      label: `${d.label} (${d.unit})`,
      num: true,
      render: (r) => num(r[d.id]),
      text: (r) => r[d.id].toFixed(2),
    })),
    {
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
      text: (r) => r.status,
    },
  ];
  const synthRows = yearObs.map((o) => {
    const c = db.centres.find((x) => x.id === o.centreId);
    return {
      id: o.id,
      centre: c.name,
      state: c.state,
      crop: o.crop,
      season: o.season,
      status: o.status,
      ...indicators(o),
    };
  });

  return (
    <Page
      title={programme.researchLabel}
      actions={
        can("research.enter") && (
          <>
            <button
              className="btn ghost"
              onClick={() =>
                notify(
                  "Template downloaded: NF_observation_template.xlsx (full build)",
                )
              }
            >
              <Download size={15} /> Excel template
            </button>
            <button
              className="btn ghost"
              onClick={() =>
                notify(
                  "Excel / CSV import validates each row before saving (full build)",
                )
              }
            >
              <Upload size={15} /> Import Excel / CSV
            </button>
            <button className="btn" onClick={() => setForm("obs")}>
              <Plus size={15} /> New observation
            </button>
          </>
        )
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["experiments", "Experiments", exps.length],
          ["models", "Model farms", models.length],
          ["observations", "Observations", obs.length],
          [
            "queue",
            can("research.enter") ? "Action required" : "Validation queue",
            queue.length,
          ],
          ["kpi", "Treatments & indicators"],
          ["analysis", "Analysis & synthesis"],
        ]}
      />

      {tab === "experiments" && (
        <Card
          pad={false}
          title="Experiment registry"
          actions={
            can("research.enter") && (
              <button className="btn sm" onClick={() => setForm("exp")}>
                <Plus size={14} /> Register experiment
              </button>
            )
          }
        >
          <Table
            columns={[
              { label: "Code", key: "code" },
              {
                label: "Title",
                render: (r) => <b style={{ fontWeight: 550 }}>{r.title}</b>,
              },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Cropping system", key: "system" },
              { label: "Design", key: "design" },
              {
                label: "Treatments × reps",
                render: (r) => `${r.treatments} × ${r.replications}`,
              },
              { label: "Started", key: "startYear" },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
            ]}
            rows={exps}
          />
        </Card>
      )}

      {tab === "models" && (
        <Card
          pad={false}
          title="Natural Farming model-farm registry"
          actions={
            can("research.enter") && (
              <button className="btn sm" onClick={() => setForm("model")}>
                <Plus size={14} /> Register model farm
              </button>
            )
          }
        >
          <Table
            columns={[
              { label: "Code", key: "code" },
              {
                label: "Model farm",
                render: (r) => <b style={{ fontWeight: 550 }}>{r.name}</b>,
              },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Area (ha)", key: "area", num: true },
              { label: "Cropping system", key: "system" },
              {
                label: "Components",
                render: (r) =>
                  r.components.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  )),
              },
              { label: "Since", key: "year" },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
            ]}
            rows={models}
          />
        </Card>
      )}

      {(tab === "observations" || tab === "queue") && (
        <Card pad={false}>
          {tab === "observations" && (
            <div className="toolbar">
              {obsSearch}
              <Select
                value={status}
                onChange={setStatus}
                options={[
                  "Draft",
                  "Submitted",
                  "Returned",
                  "Resubmitted",
                  "Scrutinised",
                  "Approved",
                ]}
                all="All statuses"
              />
              <span className="grow" />
              <ExportBar
                name="nf-observations"
                columns={obsCols}
                rows={obsRows}
              />
            </div>
          )}
          <Table
            columns={obsCols}
            rows={tab === "queue" ? queue : obsRows}
            onRow={(r) => setOpenId(r.id)}
            empty="Nothing is waiting in this queue."
          />
        </Card>
      )}

      {tab === "kpi" && (
        <div className="stack">
          <div className="grid g2">
            <Card pad={false} title="Treatments">
              <Table
                pageSize={10}
                columns={[
                  { label: "Code", key: "id" },
                  {
                    label: "Treatment",
                    render: (r) => <b style={{ fontWeight: 550 }}>{r.name}</b>,
                  },
                  { label: "Details", key: "detail" },
                ]}
                rows={TREATMENTS}
              />
            </Card>
            <Card
              pad={false}
              title="Approved indicators"
              actions={
                can("research.config") && (
                  <Badge tone="green">Configured by Project Coordinator</Badge>
                )
              }
            >
              <Table
                pageSize={10}
                columns={[
                  {
                    label: "Indicator",
                    render: (r) => <b style={{ fontWeight: 550 }}>{r.label}</b>,
                  },
                  { label: "Unit", key: "unit" },
                  { label: "How it is calculated", key: "formula" },
                ]}
                rows={INDICATORS}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === "analysis" && (
        <div className="stack">
          <div className="grid g4">
            <Stat
              label="Mean yield vs control"
              value={`${num(mean("yieldIdx"), 0)}%`}
              hint={`${yearObs.length} datasets · ${fy}`}
            />
            <Stat
              label="Mean SOC change"
              value={`+${num(mean("soc"))}`}
              hint="% points over farmers’ practice"
            />
            <Stat
              label="Mean cost reduction"
              value={`${num(mean("costCut"), 0)}%`}
              hint="in cost of cultivation"
            />
            <Stat
              label="Data approved"
              value={`${yearObs.filter((o) => o.status === "Approved").length} / ${yearObs.length}`}
              hint={`${yearObs.filter((o) => PENDING.includes(o.status)).length} in validation`}
            />
          </div>
          <Card
            title={`${kd.label} by centre (${kd.unit}), ${fy}`}
            actions={
              <Select
                value={kpi}
                onChange={setKpi}
                options={INDICATORS.map((d) => [d.id, d.label])}
              />
            }
          >
            {byCentre.length ? (
              <Bars fmt={(v) => num(v)} data={byCentre} />
            ) : (
              <div className="empty">No observations for {fy} yet.</div>
            )}
          </Card>
          <Card
            pad={false}
            title={`National synthesis, ${fy}`}
            actions={
              <>
                <ExportBar
                  name={`nf-national-synthesis-${fy}`}
                  columns={synthCols}
                  rows={synthRows}
                />
                <button
                  className="btn sm"
                  onClick={() =>
                    notify(
                      "Annual / technical report is compiled from approved data in Word and PDF (full build)",
                    )
                  }
                >
                  <FileText size={14} /> Generate annual report
                </button>
              </>
            }
          >
            <Table pageSize={10} columns={synthCols} rows={synthRows} />
          </Card>
        </div>
      )}

      {open && (
        <ObservationModal
          key={open.id}
          obs={open}
          onClose={() => setOpenId(null)}
        />
      )}

      {form === "obs" && (
        <FormModal
          title="New observation"
          onClose={() => setForm(null)}
          submitLabel="Create draft"
          initial={{ fy, season: "Kharif" }}
          fields={[
            {
              name: "experimentId",
              label: "Experiment",
              type: "select",
              options: exps.map((x) => [x.id, `${x.code} – ${x.system}`]),
              full: true,
            },
            { name: "crop", label: "Crop" },
            {
              name: "fy",
              label: "Year",
              type: "select",
              options: programme.fys,
            },
            {
              name: "season",
              label: "Season",
              type: "select",
              options: SEASONS,
            },
          ]}
          onSubmit={(v) => {
            const x = db.experiments.find((e) => e.id === v.experimentId);
            const c = db.centres.find((k) => k.id === x.centreId);
            const rec = add(
              "observations",
              {
                ...v,
                centreId: x.centreId,
                title: `${v.crop} · ${x.code}`,
                ref: `NF/${c.code}/${v.fy}/${v.season[0]}${Date.now() % 100}`,
                status: "Draft",
                productivity: blank(["grain", "straw", "equivalent"]),
                soil: blank(["soc", "n", "p", "k", "mbc", "dha", "earthworms"]),
                economics: blank(["cost", "gross"]),
                inputs: BIO_INPUTS.map(([input, unit]) => ({
                  input,
                  unit,
                  qty: 0,
                })),
                history: [
                  {
                    status: "Draft",
                    at: new Date().toISOString().slice(0, 16).replace("T", " "),
                    by: "You",
                    remark: "Created",
                  },
                ],
              },
              "Draft created. Enter the data and save.",
            );
            setTab("observations");
            setOpenId(rec.id);
          }}
        />
      )}
      {form === "exp" && (
        <FormModal
          title="Register experiment"
          onClose={() => setForm(null)}
          initial={{
            design: "Randomised block design",
            treatments: 5,
            replications: 3,
          }}
          fields={[
            { name: "code", label: "Experiment code" },
            {
              name: "system",
              label: "Cropping system",
              type: "select",
              options: SYSTEMS,
            },
            { name: "title", label: "Title", full: true },
            { name: "design", label: "Design" },
            { name: "startYear", label: "Start year", type: "number" },
            { name: "treatments", label: "Treatments", type: "number" },
            { name: "replications", label: "Replications", type: "number" },
          ]}
          onSubmit={(v) =>
            add(
              "experiments",
              {
                ...v,
                type: "On-station",
                centreId: centre?.id || centres[0].id,
                status: "Ongoing",
              },
              "Experiment registered",
            )
          }
        />
      )}
      {form === "model" && (
        <FormModal
          title="Register Natural Farming model farm"
          onClose={() => setForm(null)}
          fields={[
            { name: "code", label: "Model farm code" },
            { name: "area", label: "Area (ha)", type: "number" },
            { name: "name", label: "Name", full: true },
            {
              name: "system",
              label: "Cropping system",
              type: "select",
              options: SYSTEMS,
            },
            { name: "year", label: "Established in", type: "number" },
          ]}
          onSubmit={(v) =>
            add(
              "models",
              {
                ...v,
                centreId: centre?.id || centres[0].id,
                components: [
                  "Crops",
                  "Desi cow unit",
                  "Bio-input preparation unit",
                ],
                status: "Active",
              },
              "Model farm registered",
            )
          }
        />
      )}
    </Page>
  );
}

// Research reports listed on the Reports page.
export function researchReports({ db, fy, scope, centreName }) {
  const obs = scope(db.observations);
  const f = (key, d = 2) => ({
    num: true,
    render: (r) => num(r[key], d),
    text: (r) => Number(r[key]).toFixed(d),
  });
  return [
    {
      group: "Research",
      title: "Natural farming indicator report",
      desc: `Approved indicators by centre, crop and season for ${fy}`,
      columns: [
        { label: "Centre", key: "centre" },
        { label: "Crop", key: "crop" },
        { label: "Season", key: "season" },
        { label: "Yield vs control (%)", ...f("yieldIdx", 0) },
        { label: "SOC change (% points)", ...f("soc") },
        { label: "MBC (µg/g)", ...f("mbc", 0) },
        { label: "Cost reduction (%)", ...f("costCut", 0) },
        { label: "Net return (₹ ’000/ha)", ...f("net", 1) },
        { label: "B:C", ...f("bc") },
      ],
      rows: obs
        .filter((o) => o.fy === fy)
        .map((o) => ({
          centre: centreName(o.centreId),
          crop: o.crop,
          season: o.season,
          ...indicators(o),
        })),
    },
    {
      group: "Research",
      title: "Treatment-wise productivity and economics",
      desc: `Yield, cost and return of every treatment for ${fy}`,
      columns: [
        { label: "Centre", key: "centre" },
        { label: "Crop", key: "crop" },
        { label: "Treatment", key: "treatment" },
        { label: "Yield (q/ha)", ...f("grain", 1) },
        { label: "Cost (₹ ’000/ha)", ...f("cost", 1) },
        { label: "Gross (₹ ’000/ha)", ...f("gross", 1) },
      ],
      rows: obs
        .filter((o) => o.fy === fy)
        .flatMap((o) =>
          o.productivity.map((p, i) => ({
            centre: centreName(o.centreId),
            crop: o.crop,
            treatment: p.treatment,
            grain: p.grain,
            cost: o.economics[i]?.cost || 0,
            gross: o.economics[i]?.gross || 0,
          })),
        ),
    },
    {
      group: "Research",
      title: "Research data submission status",
      desc: "Year and season-wise status of observations from each centre",
      columns: [
        { label: "Reference", key: "ref" },
        { label: "Centre", text: (r) => centreName(r.centreId) },
        { label: "Year", key: "fy" },
        { label: "Season", key: "season" },
        { label: "Status", key: "status" },
        { label: "Last action", text: (r) => r.history.at(-1)?.at },
      ],
      rows: obs,
    },
    {
      group: "Research",
      title: "Experiment and model-farm registry",
      desc: "All registered experiments and Natural Farming model farms",
      columns: [
        { label: "Code", key: "code" },
        { label: "Title", text: (r) => r.title || r.name },
        { label: "Centre", text: (r) => centreName(r.centreId) },
        { label: "Cropping system", key: "system" },
        { label: "Status", key: "status" },
      ],
      rows: [...scope(db.experiments), ...scope(db.models)],
    },
  ];
}

// Research masters listed on the Masters page.
export function researchMasters(db) {
  return [
    {
      id: "treatments",
      label: "Treatments",
      columns: [
        { label: "Code", key: "id" },
        { label: "Treatment", key: "name" },
        { label: "Details", key: "detail" },
      ],
      rows: TREATMENTS,
    },
    {
      id: "inputs",
      label: "Bio-inputs",
      columns: [
        { label: "#", key: "n" },
        { label: "Input", key: "name" },
        { label: "Unit", key: "unit" },
      ],
      rows: BIO_INPUTS.map(([name, unit], i) => ({
        id: name,
        n: i + 1,
        name,
        unit,
      })),
    },
    {
      id: "systems",
      label: "Cropping systems",
      columns: [
        { label: "#", key: "n" },
        { label: "Cropping system", key: "name" },
        { label: "Experiments", key: "used" },
      ],
      rows: SYSTEMS.map((name, i) => ({
        id: name,
        n: i + 1,
        name,
        used: db.experiments.filter((x) => x.system === name).length,
      })),
    },
  ];
}
