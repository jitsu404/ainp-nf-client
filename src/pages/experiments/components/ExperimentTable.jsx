import { Badge, Table } from "../../../components/ui";
import { TABLE_PAGE_SIZE } from "../../../config/constants";

export function ExperimentTable({
  rows = [],
  pageSize = TABLE_PAGE_SIZE,
  onRowClick,
  isPending,
  config,
  programmes,
}) {
  return (
    <Table
      rows={rows}
      pageSize={pageSize}
      onRow={onRowClick}
      empty={
        isPending
          ? "Loading…"
          : config
            ? "No experiments yet. Create one to get started."
            : "No experiments are assigned to your centre yet."
      }
      columns={[
        {
          label: "Code",
          render: (e) => <span className="mono">{e.code}</span>,
        },
        {
          label: "Title",
          render: (e) => <b style={{ fontWeight: 550 }}>{e.title}</b>,
        },
        {
          label: "Programme",
          render: (e) => programmes.nameOf(e.programmeCode),
        },
        {
          label: "Design",
          render: (e) =>
            `${e.design}${e.replications ? ` · ${e.replications} reps` : ""}`,
        },
        {
          label: "Treatments",
          num: true,
          render: (e) => (e.treatments ?? []).length,
        },
        {
          label: "Parameters",
          num: true,
          render: (e) => (e.defaultParameters ?? e.parameters ?? []).length,
        },
        {
          label: "Assigned To",
          render: (e) => e.assignedTo?.name || "—",
        },
        {
          label: "Years",
          render: (e) => `${e.startYear}${e.endYear ? ` – ${e.endYear}` : ""}`,
        },
        {
          label: "Status",
          render: (e) => <Badge>{e.status}</Badge>,
        },
      ]}
    />
  );
}
