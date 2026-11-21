import { useState } from "react";
import { FileSpreadsheet, Plus } from "lucide-react";
import { mastersApi } from "../../../api";
import { useAuth } from "../../../auth";
import { ExcelImportModal } from "../../../components/ExcelImport";
import { Card } from "../../../components/ui";
import { GENERATED_CODES } from "../../../config/constants";
import { useDebounced } from "../../../hooks";
import { toast } from "../../../lib/toast";
import {
  useCreateMaster,
  useImportMasters,
  useMasters,
  useUpdateMaster,
} from "../../../queries/masters";
import { useMasterUsage } from "../hooks/useMasterUsage";
import { MasterFormModal } from "./MasterFormModal";
import { MasterTable } from "./MasterTable";
import { MasterToolbar } from "./MasterToolbar";

const importSummary = (r) => `${r.created} new, ${r.updated} updated`;

export function GenericMasterTab({ config }) {
  const { can } = useAuth();
  const edit = can("masters.edit");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("true");
  const [linkedToFilter, setLinkedToFilter] = useState("");
  const [modal, setModal] = useState(null); // 'add' | 'import' | item object being edited
  const q = useDebounced(search);

  // If this master type links to another master (e.g. budgetHead -> fundCategory)
  const linkedItems = useMasters(config.linkedTo, { isActive: "true" });
  const linkedOptions = config.linkedTo
    ? (linkedItems.data ?? []).map((m) => [m.id, m.name])
    : null;

  const items = useMasters(config.id, {
    search: q || undefined,
    isActive: status || undefined,
    linkedTo: linkedToFilter || undefined,
  });

  const create = useCreateMaster(config.id);
  const update = useUpdateMaster(config.id);
  const importer = useImportMasters(config.id);
  const usage = useMasterUsage(config.id);
  const rows = items.data ?? [];

  const toggle = async (item) => {
    try {
      await update.mutateAsync({ id: item.id, isActive: !item.isActive });
      toast.success(
        `${item.name} ${item.isActive ? "deactivated" : "reactivated"}`,
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card
      pad={false}
      title={config.label}
      actions={
        edit && (
          <>
            <button className="btn ghost sm" onClick={() => setModal("import")}>
              <FileSpreadsheet size={14} /> Excel import
            </button>
            <button className="btn sm" onClick={() => setModal("add")}>
              <Plus size={14} /> Add
            </button>
          </>
        )
      }
    >
      <MasterToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        linkedTo={linkedToFilter}
        onLinkedToChange={setLinkedToFilter}
        linkedOptions={linkedOptions}
        linkedLabel={config.linkedLabel}
        description={config.description}
      />
      <MasterTable
        rows={rows}
        isLoading={items.isPending}
        config={config}
        usage={usage}
        edit={edit}
        onEdit={(item) => setModal(item)}
        onToggle={toggle}
      />

      {modal === "add" && (
        <MasterFormModal
          isEdit={false}
          config={config}
          linkedOptions={linkedOptions}
          defaultLinkedTo={linkedToFilter}
          onSubmit={create.mutateAsync}
          onDone={(m) => toast.success(`${m.name} added`)}
          onClose={() => setModal(null)}
        />
      )}

      {modal && typeof modal === "object" && (
        <MasterFormModal
          isEdit={true}
          item={modal}
          config={config}
          linkedOptions={linkedOptions}
          onSubmit={(body) => update.mutateAsync({ id: modal.id, ...body })}
          onDone={() => toast.success("Saved")}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "import" && (
        <ExcelImportModal
          title={`Import ${config.label.toLowerCase()}`}
          subtitle={
            GENERATED_CODES[config.id]
              ? "Leave Code empty to add an item (its code is generated); a row with an existing code updates it."
              : "Existing codes are updated; new codes are added."
          }
          onTemplate={() => mastersApi.template(config.id)}
          mutation={importer}
          describe={importSummary}
          onClose={() => setModal(null)}
        />
      )}
    </Card>
  );
}
