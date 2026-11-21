import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Pencil } from "lucide-react";
import { useAuth } from "../../auth";
import { LinkExperimentPiModal } from "../../components/ExperimentPis";
import { ErrorNote } from "../../components/forms";
import { ExperimentMetadata } from "../../components/Metadata";
import { Card, Page, Tabs } from "../../components/ui";
import { ROUTES } from "../../config/constants";
import { useMasterOptions, useUnitLabel } from "../../queries/masters";
import {
  useExperiment,
  useTrials,
  useUpdateExperiment,
} from "../../queries/research";
import { ExperimentDetailsModal } from "../experiments";
import {
  CentresModal,
  ExperimentOverviewCard,
  ExperimentStatusSwitch,
  ParametersModal,
  TreatmentsModal,
} from "./components";
import { getExperimentTabs } from "./experiment-tabs";
import {
  CentresTab,
  ProtocolTab,
  ReportingTab,
  ResultsSummaryTab,
  TrendTab,
} from "./tabs";

export default function ExperimentDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("protocol");
  const [modal, setModal] = useState(null); // 'details' | 'treatments' | 'parameters' | 'centres' | 'pi' | 'mainPlot' | 'subPlot'
  const experiment = useExperiment(id);
  const trials = useTrials({ experimentId: id });
  const update = useUpdateExperiment(id);
  const programmes = useMasterOptions("programme");
  const seasons = useMasterOptions("season");
  const unit = useUnitLabel();
  // research.config edits the definition (PCU, or the experiment's own PI); research.assign
  // (PCU only) assigns centres and the PI.
  const config = can("research.config");
  const assign = can("research.assign");
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
  if (experiment.isPending || experiment.isLoading || !e) {
    return (
      <Page
        title={
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <span>Experiment</span>
            <Loader2 size={18} className="spin text-muted" />
          </div>
        }
      >
        <Card pad={false}>
          <div
            style={{
              padding: "72px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <Loader2
              size={36}
              className="spin"
              style={{ color: "var(--green, #1b7f4b)" }}
            />
            <div
              className="muted"
              style={{ fontSize: "0.95rem", fontWeight: 500 }}
            >
              Loading experiment details…
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  // A withdrawn centre keeps its trial (and data, read-only); it is listed apart.
  const allTrials = trials.data ?? [];
  const trialRows = allTrials.filter((t) => t.assignmentStatus !== "Withdrawn");
  const withdrawnRows = allTrials.filter(
    (t) => t.assignmentStatus === "Withdrawn",
  );
  // A Centre PI sees only their own centre's trial (withdrawn too): offer a direct link.
  const myTrial = !config && allTrials.length === 1 ? allTrials[0] : null;
  const save = (body) => update.mutateAsync(body);

  return (
    <Page
      title={
        <span className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          {e.code}
          <ExperimentStatusSwitch
            experiment={e}
            canChange={config}
            save={save}
          />
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
        <ExperimentOverviewCard
          experiment={e}
          programmes={programmes}
          seasons={seasons}
          trialRows={trialRows}
          assign={assign}
          onAssignPi={() => setModal("pi")}
        />

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={getExperimentTabs({ config, trialCount: trialRows.length })}
        />

        {tab === "protocol" && (
          <ProtocolTab
            experiment={e}
            config={config}
            unit={unit}
            onEditTreatments={() => setModal("treatments")}
            onEditParameters={() => setModal("parameters")}
            onEditMainPlot={() => setModal("mainPlot")}
            onEditSubPlot={() => setModal("subPlot")}
            onEditDetails={() => setModal("details")}
          />
        )}

        {tab === "centres" && (
          <CentresTab
            experiment={e}
            trialRows={trialRows}
            withdrawnRows={withdrawnRows}
            assign={assign}
            isPending={trials.isPending}
            onAssignCentres={() => setModal("centres")}
          />
        )}

        {tab === "reporting" && <ReportingTab experimentId={e.id} />}

        {tab === "metadata" && <ExperimentMetadata experimentId={e.id} />}

        {tab === "trend" && <TrendTab experiment={e} trialRows={trialRows} />}

        {tab === "summary" && (
          <ResultsSummaryTab experiment={e} canSeeUnapproved={config} />
        )}
      </div>

      {modal === "details" && (
        <ExperimentDetailsModal experiment={e} save={save} onClose={close} />
      )}
      {modal === "treatments" && (
        <TreatmentsModal
          experiment={e}
          type="treatments"
          save={save}
          onClose={close}
        />
      )}
      {modal === "mainPlot" && (
        <TreatmentsModal
          experiment={e}
          type="mainPlot"
          save={save}
          onClose={close}
        />
      )}
      {modal === "subPlot" && (
        <TreatmentsModal
          experiment={e}
          type="subPlot"
          save={save}
          onClose={close}
        />
      )}
      {modal === "parameters" && (
        <ParametersModal experiment={e} save={save} onClose={close} />
      )}
      {modal === "pi" && (
        <LinkExperimentPiModal experiment={e} save={save} onClose={close} />
      )}
      {modal === "centres" && (
        <CentresModal experiment={e} trials={allTrials} onClose={close} />
      )}
    </Page>
  );
}
