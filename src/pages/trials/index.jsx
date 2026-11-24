import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FilePlus2, Pencil } from "lucide-react";
import { useAuth } from "../../auth";
import { ErrorNote } from "../../components/forms";
import { TrialMetadata } from "../../components/Metadata";
import { Badge, Body, Page, Tabs } from "../../components/ui";
import { ROUTES } from "../../config/constants";
import { subPlotsBySystem, trialSystems } from "../../lib/croppingSystems";
import { toast } from "../../lib/toast";
import { useMasterOptions, useUnitLabel } from "../../queries/masters";
import {
  useSheets,
  useToggleTrialLock,
  useTrial,
  useUpdateTrial,
} from "../../queries/research";
import {
  CroppingSystemsModal,
  OpenSheetModal,
  PracticesModal,
  TrialOverviewCard,
  TrialStatusNotesModal,
} from "./components";
import {
  CroppingSystemsTab,
  SheetsTab,
  TreatmentPracticesTab,
  TrialProtocolTab,
} from "./tabs";
import { getTrialTabs } from "./trial-tabs";

export {
  TrialOverviewCard,
  CroppingSystemsModal,
  PracticesModal,
  OpenSheetModal,
  TrialStatusNotesModal,
};

export default function TrialDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("protocol");
  const [modal, setModal] = useState(null); // 'details' | 'systems' | 'practices' | 'sheet'
  const trial = useTrial(id);
  const sheets = useSheets({ trialId: id });
  const update = useUpdateTrial(id);
  const toggleLock = useToggleTrialLock(id);
  const seasons = useMasterOptions("season");
  const crops = useMasterOptions("crop");
  const unit = useUnitLabel();
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
  if (!t) {
    return (
      <Page title="Trial">
        <Body muted>Loading…</Body>
      </Page>
    );
  }

  const e = t.experiment;
  // A withdrawn centre keeps its trial and data, read-only (the API refuses changes).
  const withdrawn = t.assignmentStatus === "Withdrawn";
  const edit = (can("research.enter") || can("research.assign")) && !withdrawn;
  const canLock = can("research.assign") || can("research.config");
  const save = (body) => update.mutateAsync(body);
  const handleToggleLock = async (lockedKey, isLocked) => {
    try {
      await toggleLock.mutateAsync({ lockedKey, isLocked });
      toast.success(`Section ${isLocked ? "locked" : "unlocked"}`);
    } catch (err) {
      toast.error(err?.message || "Failed to toggle section lock");
      throw err;
    }
  };

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
          {can("research.enter") && !withdrawn && (
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
        <TrialOverviewCard trial={t} />

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={getTrialTabs({
            sheetCount: sheets.data?.length,
            systemCount: new Set([
              ...trialSystems(t).map((cs) => String(cs.croppingSystemId)),
              ...subPlotsBySystem(t).keys(),
            ]).size,
          })}
        />

        {tab === "protocol" && (
          <TrialProtocolTab
            trial={t}
            unit={unit}
            edit={edit}
            canLock={canLock}
            save={save}
            onToggleLock={handleToggleLock}
          />
        )}

        {tab === "metadata" && <TrialMetadata trialId={id} />}

        {tab === "sheets" && (
          <SheetsTab
            sheets={sheets}
            trial={t}
            withdrawn={withdrawn}
            seasons={seasons}
            crops={crops}
          />
        )}

        {tab === "systems" && (
          <CroppingSystemsTab
            trial={t}
            edit={edit}
            save={save}
            onEditSystems={() => setModal("systems")}
            seasons={seasons}
            crops={crops}
          />
        )}

        {tab === "practices" && (
          <TreatmentPracticesTab
            trial={t}
            edit={edit}
            onEditPractices={() => setModal("practices")}
          />
        )}
      </div>

      {modal === "details" && (
        <TrialStatusNotesModal trial={t} save={save} onClose={close} />
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
