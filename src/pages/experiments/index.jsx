import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../../auth";
import { ErrorNote } from "../../components/forms";
import { Card, Page } from "../../components/ui";
import { ROUTES } from "../../config/constants";
import { useDebounced } from "../../hooks";
import { useMasterOptions } from "../../queries/masters";
import { useExperiments } from "../../queries/research";
import {
  ExperimentDetailsModal,
  ExperimentTable,
  ExperimentToolbar,
} from "./components";

export { ExperimentDetailsModal };

export default function Experiments() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [programme, setProgramme] = useState("");
  const [adding, setAdding] = useState(false);
  const q = useDebounced(search);
  const programmes = useMasterOptions("programme");
  const experiments = useExperiments({
    search: q || undefined,
    status: status || undefined,
    programmeCode: programme || undefined,
  });
  const rows = experiments.data ?? [];
  const config = can("research.config");
  const assign = can("research.assign");

  // The PCU (research.assign) creates experiments, assigns centres and links an Experiment PI,
  // who then edits the definition (research.config). A Centre PI sees the experiments their
  // centre has a trial in; an Experiment PI only their own (the API scopes the list).
  return (
    <Page
      title={
        assign
          ? "Experiments"
          : config
            ? "My experiment"
            : "Experiments at my centre"
      }
      actions={
        assign && (
          <button className="btn" onClick={() => setAdding(true)}>
            <Plus size={15} /> New experiment
          </button>
        )
      }
    >
      <div className="stack">
        <ErrorNote error={experiments.error} />
        <Card pad={false}>
          <ExperimentToolbar
            search={search}
            onSearchChange={setSearch}
            programme={programme}
            onProgrammeChange={setProgramme}
            programmeOptions={programmes.options}
            status={status}
            onStatusChange={setStatus}
            isFetching={experiments.isFetching}
            isPending={experiments.isPending}
            totalCount={rows.length}
          />
          <ExperimentTable
            rows={rows}
            onRowClick={(e) => navigate(ROUTES.experiment(e.id || e._id))}
            isPending={experiments.isPending}
            config={config}
            assign={assign}
            programmes={programmes}
          />
        </Card>
      </div>
      {adding && (
        <ExperimentDetailsModal
          onClose={() => setAdding(false)}
          onCreated={(e) => navigate(ROUTES.experiment(e.id))}
        />
      )}
    </Page>
  );
}
