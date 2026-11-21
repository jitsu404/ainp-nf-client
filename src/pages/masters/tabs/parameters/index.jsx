import { useState } from "react";
import { FileSpreadsheet, Pencil, Plus, Power, Search } from "lucide-react";
import { parametersApi } from "../../../../api";
import { useAuth } from "../../../../auth";
import { ExcelImportModal } from "../../../../components/ExcelImport";
import { FormulaField } from "../../../../components/FormulaField";
import { AsyncFormModal, ErrorNote } from "../../../../components/forms";
import { Badge, Card, Select, Table } from "../../../../components/ui";
import {
  PARAMETER_CATEGORIES,
  PARAMETER_DATA_TYPES,
} from "../../../../config/constants";
import { useDebounced } from "../../../../hooks";
import { toast } from "../../../../lib/toast";
import {
  useCreateParameter,
  useImportParameters,
  useMasterOptions,
  useParameters,
  useUpdateParameter,
} from "../../../../queries/masters";

const importSummary = (r) => `${r.created} new, ${r.updated} updated`;

const splitChoices = (v) =>
  String(v)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

export default function ParametersTab() {
  const { can } = useAuth();
  const edit = can("masters.edit");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState(null);
  const q = useDebounced(search);
  const params = useParameters({
    search: q || undefined,
    category: category || undefined,
  });
  const units = useMasterOptions("unit");
  // The whole library (not the filtered list), for the formula field's picker and names.
  const library = useParameters({});
  const create = useCreateParameter();
  const update = useUpdateParameter();
  const importer = useImportParameters();

  // The code is generated (PRM_001 …), so it isn't a field; `exceptCode` keeps a parameter's own
  // code out of its formula picker.
  const fields = (exceptCode) => [
    { name: "name", label: "Name" },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: PARAMETER_CATEGORIES,
    },
    {
      name: "unitCode",
      label: "Unit",
      type: "select",
      options: units.options,
      required: false,
      clearable: true,
    },
    {
      name: "dataType",
      label: "Data type",
      type: "select",
      options: PARAMETER_DATA_TYPES,
      required: false,
    },
    { name: "decimals", label: "Decimals", type: "number", required: false },
    {
      name: "min",
      label: "Minimum",
      type: "number",
      required: false,
      clearable: true,
    },
    {
      name: "max",
      label: "Maximum",
      type: "number",
      required: false,
      clearable: true,
    },
    {
      name: "choices",
      label: "Choices",
      required: false,
      full: true,
      parse: splitChoices,
      hint: 'For data type "choice": values separated by |, e.g. Low | Medium | High',
    },
    {
      name: "method",
      label: "Method",
      type: "textarea",
      required: false,
      clearable: true,
    },
    {
      name: "formula",
      label: "Formula (calculated parameters only)",
      required: false,
      clearable: true,
      full: true,
      hint: "Leave empty for values centres enter. Pick parameters from the list (their codes go in the formula), with numbers, + - * /, brackets and IFEMPTY(x, 0).",
      render: (props) => (
        <FormulaField
          {...props}
          parameters={library.data ?? []}
          exceptCode={exceptCode}
        />
      ),
    },
  ];

  const toggle = async (p) => {
    try {
      await update.mutateAsync({ id: p.id, isActive: !p.isActive });
      toast.success(`${p.name} ${p.isActive ? "deactivated" : "reactivated"}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card
      pad={false}
      title="Parameter library"
      actions={
        edit && (
          <>
            <button className="btn ghost sm" onClick={() => setModal("import")}>
              <FileSpreadsheet size={14} /> Excel import
            </button>
            <button className="btn sm" onClick={() => setModal("add")}>
              <Plus size={14} /> Add parameter
            </button>
          </>
        )
      }
    >
      <div className="toolbar">
        <label className="search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or name…"
          />
        </label>
        <Select
          value={category}
          onChange={setCategory}
          options={PARAMETER_CATEGORIES}
          all="All categories"
        />
        <span className="grow" />
        <span className="muted small">
          {params.data ? `${params.data.length} parameters` : ""}
        </span>
      </div>
      <ErrorNote error={params.error} />
      <Table
        rows={params.data ?? []}
        pageSize={15}
        empty={params.isPending ? "Loading…" : "No parameters."}
        columns={[
          {
            label: "Code",
            render: (p) => <span className="mono">{p.code}</span>,
          },
          {
            label: "Name",
            render: (p) => <b style={{ fontWeight: 550 }}>{p.name}</b>,
          },
          { label: "Category", key: "category" },
          {
            label: "Unit",
            render: (p) => (p.unitCode ? units.nameOf(p.unitCode) : "—"),
          },
          {
            label: "Type",
            render: (p) =>
              p.formula ? (
                <span title={p.formula}>
                  <Badge tone="blue">Calculated</Badge>
                </span>
              ) : p.dataType === "choice" ? (
                `choice (${p.choices.join(", ")})`
              ) : (
                p.dataType
              ),
          },
          {
            label: "Range",
            render: (p) =>
              p.min !== null || p.max !== null
                ? `${p.min ?? "…"} – ${p.max ?? "…"}`
                : "—",
          },
          {
            label: "Status",
            render: (p) => <Badge>{p.isActive ? "Active" : "Inactive"}</Badge>,
          },
          ...(edit
            ? [
                {
                  label: " ",
                  render: (p) => (
                    <span className="row nowrap" style={{ gap: 4 }}>
                      <button
                        className="icon-btn"
                        title="Edit"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => setModal(p)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn"
                        title={p.isActive ? "Deactivate" : "Reactivate"}
                        aria-label={
                          p.isActive
                            ? `Deactivate ${p.name}`
                            : `Reactivate ${p.name}`
                        }
                        onClick={() => toggle(p)}
                      >
                        <Power size={15} />
                      </button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />

      {modal === "add" && (
        <AsyncFormModal
          title="Add parameter"
          intro={
            <div className="note" style={{ margin: 0 }}>
              The code is generated when you save (PRM_001, then the next
              number).
            </div>
          }
          fields={fields(null)}
          initial={{ dataType: "number" }}
          onSubmit={create.mutateAsync}
          onDone={(p) => toast.success(`${p.name} added`)}
          onClose={() => setModal(null)}
        />
      )}
      {modal && typeof modal === "object" && (
        <AsyncFormModal
          title={`Edit ${modal.name} (${modal.code})`}
          fields={fields(modal.code)}
          initial={{
            name: modal.name,
            category: modal.category,
            unitCode: modal.unitCode ?? "",
            dataType: modal.dataType,
            decimals: modal.decimals ?? "",
            min: modal.min ?? "",
            max: modal.max ?? "",
            choices: (modal.choices ?? []).join(" | "),
            method: modal.method ?? "",
            formula: modal.formula ?? "",
          }}
          onSubmit={(body) => update.mutateAsync({ id: modal.id, ...body })}
          onDone={() => toast.success("Saved")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "import" && (
        <ExcelImportModal
          title="Import parameters"
          subtitle="Leave Code empty to add a parameter (its code is generated); a row with an existing code updates it. Units must exist in the Units list."
          onTemplate={() => parametersApi.template()}
          mutation={importer}
          describe={importSummary}
          onClose={() => setModal(null)}
        />
      )}
    </Card>
  );
}
