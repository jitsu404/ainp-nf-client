import { useNavigate } from "react-router-dom";
import { ErrorNote } from "../../../components/forms";
import { Badge, Card, Table } from "../../../components/ui";
import { ROUTES } from "../../../config/constants";
import { formatDateTime } from "../../../hooks";

export function SheetsTab({ sheets, trial, withdrawn, seasons, crops }) {
  const navigate = useNavigate();
  const t = trial;

  return (
    <Card pad={false}>
      <ErrorNote error={sheets.error} />
      <Table
        rows={sheets.data ?? []}
        pageSize={20}
        onRow={(s) => navigate(ROUTES.sheet(s.id))}
        empty={
          sheets.isPending
            ? "Loading…"
            : withdrawn
              ? "No sheets were recorded before the centre was withdrawn."
              : "No sheets yet. Open one for a year and season to start recording data."
        }
        columns={[
          { label: "Year", render: (s) => <b>{s.year}</b> },
          {
            label: "Season",
            render: (s) => seasons.nameOf(s.seasonCode),
          },
          {
            label: "Cropping system",
            render: (s) =>
              t.croppingSystems.find((c) => c.code === s.croppingSystemCode)
                ?.name ??
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
  );
}
