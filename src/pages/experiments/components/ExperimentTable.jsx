import { Badge, Body, Table } from "../../../components/ui";
import { TABLE_PAGE_SIZE } from "../../../config/constants";

export function ExperimentTable({
  rows = [],
  pageSize = TABLE_PAGE_SIZE,
  onRowClick,
  isPending,
  config,
  assign,
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
          : assign
            ? "No experiments yet. Create one to get started."
            : config
              ? "No experiment is linked to your PI login yet."
              : "No experiments are assigned to your centre yet."
      }
      columns={[
        {
          label: "Code",
          render: (e) => <span className="mono">{e.code}</span>,
        },
        {
          label: "Title",
          render: (e) => (
            <Body as="b" style={{ fontWeight: 550 }}>
              {e.title}
            </Body>
          ),
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
        ...(assign
          ? [
              {
                label: "PI",
                render: (e) =>
                  e.pi ? e.pi.name : <Badge tone="amber">Not assigned</Badge>,
              },
              {
                label: "Centres",
                num: true,
                render: (e) => (e.centreIds ?? []).length,
              },
            ]
          : []),
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
