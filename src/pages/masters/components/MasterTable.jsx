import { Pencil, Power } from "lucide-react";
import { Badge, Body, SmallBody, Table } from "../../../components/ui";
import { TABLE_PAGE_SIZE } from "../../../config/constants";

export function MasterTable({
  rows,
  isLoading,
  config,
  usage,
  edit,
  onEdit,
  onToggle,
  pageSize = TABLE_PAGE_SIZE,
}) {
  const columns = [
    {
      label: "Code",
      render: (m) => <span className="mono">{m.code}</span>,
    },
    {
      label: "Name",
      render: (m) => (
        <Body as="b" style={{ fontWeight: 550 }}>
          {m.name}
        </Body>
      ),
    },
    ...(config.groups
      ? [
          {
            label: config.groupLabel ?? "Group",
            render: (m) => m.group || "—",
          },
        ]
      : []),
    ...(config.linkedTo
      ? [
          {
            label: config.linkedLabel ?? "Linked",
            render: (m) => m.linkedTo?.name ?? "—",
          },
        ]
      : []),
    {
      label: "Description",
      render: (m) => <SmallBody muted>{m.description || "—"}</SmallBody>,
    },
    ...(usage
      ? [
          {
            label: usage.label,
            num: true,
            render: (m) =>
              usage.counts ? (usage.counts.get(m[usage.by]) ?? 0) : "…",
          },
        ]
      : []),
    {
      label: "Status",
      render: (m) => <Badge>{m.isActive ? "Active" : "Inactive"}</Badge>,
    },
    ...(edit
      ? [
          {
            label: " ",
            render: (m) => (
              <span className="row nowrap" style={{ gap: 4 }}>
                <button
                  className="icon-btn"
                  title="Edit"
                  aria-label={`Edit ${m.name}`}
                  onClick={() => onEdit(m)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-btn"
                  title={m.isActive ? "Deactivate" : "Reactivate"}
                  aria-label={
                    m.isActive ? `Deactivate ${m.name}` : `Reactivate ${m.name}`
                  }
                  onClick={() => onToggle(m)}
                >
                  <Power size={15} />
                </button>
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      rows={rows}
      pageSize={pageSize}
      empty={isLoading ? "Loading…" : "No items."}
      columns={columns}
    />
  );
}
