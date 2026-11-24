import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Badge, Body, Card, SmallBody, Table } from "../../../components/ui";
import { ROUTES } from "../../../config/constants";
import { formatDate } from "../../../hooks";
import { effectiveSeasonCrops } from "../../../lib/seasonCrops";
import { trialSystems } from "../../../lib/croppingSystems";
import {
  useCroppingSystems,
  useMasterOptions,
  useMasters,
} from "../../../queries/masters";

// The centres running the experiment, one row per trial. Crops show the experiment's by default;
// a centre that chose its own for a season is marked. Withdrawn centres are listed apart: their
// trial and data stay, read-only.

const statusTone = (s) =>
  s === "Running" ? "blue" : s === "Completed" ? "green" : "grey";

export function CentresTab({
  experiment,
  trialRows = [],
  withdrawnRows = [],
  assign,
  isPending,
  onAssignCentres,
}) {
  const navigate = useNavigate();
  const seasons = useMasterOptions("season");
  const crops = useMasters("crop");
  const systems = useCroppingSystems();
  const cropName = useMemo(() => {
    const names = new Map(
      (crops.data ?? []).map((c) => [String(c.id ?? c._id), c.name]),
    );
    return (id) => names.get(id) ?? "?";
  }, [crops.data]);

  const cropsCell = (t) => {
    const list = effectiveSeasonCrops(experiment.seasons, t.seasonCrops);
    if (!list.length) return <span className="muted">—</span>;
    return (
      <div className="stack" style={{ gap: 2 }}>
        {list.map((s) => (
          <SmallBody as="div" key={s.seasonCode}>
            <span className="muted">{seasons.nameOf(s.seasonCode)}:</span>{" "}
            {s.crops.length ? s.crops.map(cropName).join(", ") : "—"}
          </SmallBody>
        ))}
      </div>
    );
  };

  const columns = [
    {
      label: "Centre",
      render: (t) => (
        <Body as="b" style={{ fontWeight: 550 }}>
          {t.centreId?.name ?? "—"}
        </Body>
      ),
    },
    { label: "Code", render: (t) => t.centreId?.code },
    { label: "State", render: (t) => t.centreId?.state },
    { label: "Crops", render: cropsCell },
    {
      label: "Cropping systems",
      render: (t) =>
        trialSystems(t).length ? (
          trialSystems(t)
            .map((c) => systems.byId(c.croppingSystemId)?.name ?? "?")
            .join("; ")
        ) : (
          <Badge tone="amber">Not set up</Badge>
        ),
    },
    {
      label: "Status",
      render: (t) => <Badge tone={statusTone(t.status)}>{t.status}</Badge>,
    },
  ];

  return (
    <div className="stack">
      <Card
        pad={false}
        title={assign ? "Centres running this experiment" : undefined}
        actions={
          assign && (
            <button className="btn ghost sm" onClick={onAssignCentres}>
              <Building2 size={14} /> Assign centres
            </button>
          )
        }
      >
        <Table
          rows={trialRows}
          pageSize={30}
          onRow={(t) => navigate(ROUTES.trial(t.id))}
          empty={isPending ? "Loading…" : "No centres assigned yet."}
          columns={columns}
        />
      </Card>

      {withdrawnRows.length > 0 && (
        <Card pad={false} title="Withdrawn centres">
          <Table
            rows={withdrawnRows}
            pageSize={30}
            onRow={(t) => navigate(ROUTES.trial(t.id))}
            columns={[
              ...columns.slice(0, 3),
              {
                label: "Withdrawn",
                render: (t) =>
                  t.withdrawnAt ? formatDate(t.withdrawnAt) : "—",
              },
              {
                label: "Reason",
                render: (t) =>
                  t.withdrawReason ?? <span className="muted">—</span>,
              },
            ]}
          />
          <div className="note" style={{ margin: 12 }}>
            A withdrawn centre keeps its trial and data, read-only. Assigning it
            again brings them back.
          </div>
        </Card>
      )}
    </div>
  );
}
