import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../auth";
import { ErrorNote } from "../components/forms";
import { Badge, Card, Page, Select, SmallBody, Table } from "../components/ui";
import {
  ROUTES,
  SHEET_STATUSES,
  TABLE_PAGE_SIZE,
  experimentYears,
} from "../config/constants";
import { formatDateTime } from "../hooks";
import { useMasterOptions } from "../queries/masters";
import { useExperiments, useSheets } from "../queries/research";

// All observation sheets the user can see: for the PCU a review queue across centres (submitted
// sheets first), for a Centre PI their own centre's sheets (the API scopes the list).

export default function Sheets() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const reviewer = can("research.approve") || can("research.review");
  const [status, setStatus] = useState(reviewer ? "Submitted" : "");
  const [fy, setFy] = useState("");
  // Years to filter by: every year of the experiments the user can see.
  const experiments = useExperiments();
  const yearOptions = [
    ...new Set((experiments.data ?? []).flatMap((e) => experimentYears(e))),
  ]
    .sort((a, b) => b - a)
    .map(String);
  const seasons = useMasterOptions("season");
  const sheets = useSheets({
    status: status || undefined,
    year: fy || undefined,
  });
  const rows = sheets.data ?? [];

  return (
    <Page title={reviewer ? "Observation sheets" : "My observation sheets"}>
      <div className="stack">
        <ErrorNote error={sheets.error} />
        <Card pad={false}>
          <div className="toolbar">
            <Select
              value={status}
              onChange={setStatus}
              options={SHEET_STATUSES.map((s) => [
                s,
                s === "Submitted" && reviewer ? "Waiting for review" : s,
              ])}
              all="All statuses"
            />
            <Select
              value={fy}
              onChange={setFy}
              options={yearOptions}
              all="All years"
            />
            <span className="grow" />
            <SmallBody muted className="row" style={{ gap: 6 }}>
              {sheets.isFetching && <Loader2 size={13} className="spin" />}
              {sheets.isPending
                ? "Loading…"
                : `${rows.length} sheet${rows.length === 1 ? "" : "s"}`}
            </SmallBody>
          </div>
          <Table
            rows={rows}
            pageSize={TABLE_PAGE_SIZE}
            onRow={(s) => navigate(ROUTES.sheet(s.id))}
            empty={
              sheets.isPending
                ? "Loading…"
                : status === "Submitted" && reviewer
                  ? "Nothing is waiting for review."
                  : "No sheets."
            }
            columns={[
              {
                label: "Experiment",
                render: (s) => (
                  <span title={s.experimentId?.title}>
                    <b>{s.experimentId?.code}</b>
                  </span>
                ),
              },
              ...(reviewer
                ? [{ label: "Centre", render: (s) => s.centreId?.name }]
                : []),
              { label: "Year", key: "year" },
              { label: "Season", render: (s) => seasons.nameOf(s.seasonCode) },
              {
                label: "System / crop",
                render: (s) =>
                  [s.croppingSystemCode, s.cropCode]
                    .filter(Boolean)
                    .join(" · ") || "—",
              },
              {
                label: "Last change",
                render: (s) => formatDateTime(s.updatedAt),
              },
              { label: "Status", render: (s) => <Badge>{s.status}</Badge> },
            ]}
          />
        </Card>
      </div>
    </Page>
  );
}
