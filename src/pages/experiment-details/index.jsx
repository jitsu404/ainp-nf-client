import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Pencil } from "lucide-react";
import { useAuth } from "../../auth";
import { ErrorNote } from "../../components/forms";
import { Badge, Card, Page, Tabs } from "../../components/ui";
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

  // A trial stays (with its data) when its centre is unassigned; list only assigned centres.
  const trialRows = Array.isArray(e.centreIds)
    ? (trials.data ?? []).filter((t) => e.centreIds.includes(t.centreId?.id))
    : (trials.data ?? []);
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
        <ExperimentOverviewCard
          experiment={e}
          programmes={programmes}
          seasons={seasons}
          trialRows={trialRows}
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
          />
        )}

        {tab === "centres" && (
          <CentresTab
            trialRows={trialRows}
            config={config}
            isPending={trials.isPending}
            onAssignCentres={() => setModal("centres")}
          />
        )}

        {tab === "reporting" && <ReportingTab experimentId={e.id} />}

        {tab === "trend" && <TrendTab experiment={e} trialRows={trialRows} />}

        {tab === "summary" && (
          <ResultsSummaryTab experiment={e} canSeeUnapproved={config} />
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
