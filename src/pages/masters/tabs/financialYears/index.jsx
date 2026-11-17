import { useState } from "react";
import { Lock, LockOpen, Plus, Star } from "lucide-react";
import { useAuth } from "../../../../auth";
import { AsyncFormModal } from "../../../../components/forms";
import { Badge, Card, Table } from "../../../../components/ui";
import { TABLE_PAGE_SIZE } from "../../../../config/constants";
import { formatDate } from "../../../../hooks";
import { toast } from "../../../../lib/toast";
import {
  useCreateFinancialYear,
  useFinancialYears,
  useUpdateFinancialYear,
} from "../../../../queries/masters";

export default function FinancialYearsTab() {
  const { can } = useAuth();
  const edit = can("masters.edit");
  const years = useFinancialYears();
  const create = useCreateFinancialYear();
  const update = useUpdateFinancialYear();
  const [adding, setAdding] = useState(false);

  const change = async (fy, body, message) => {
    try {
      await update.mutateAsync({ id: fy.id, ...body });
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card
      pad={false}
      title="Financial years"
      actions={
        edit && (
          <button className="btn sm" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add year
          </button>
        )
      }
    >
      <div className="toolbar">
        <span className="muted small">
          A closed year is locked: no observation data or other entries can be
          added or changed in it. The current year is the default everywhere.
        </span>
      </div>
      <Table
        rows={years.data ?? []}
        pageSize={TABLE_PAGE_SIZE}
        empty={years.isPending ? "Loading…" : "No financial years."}
        columns={[
          {
            label: "Year",
            render: (y) => <b style={{ fontWeight: 550 }}>{y.code}</b>,
          },
          {
            label: "Period",
            render: (y) =>
              `${formatDate(y.startDate)} – ${formatDate(y.endDate)}`,
          },
          {
            label: "Data entry",
            render: (y) => (
              <Badge tone={y.isOpen ? "green" : "grey"}>
                {y.isOpen ? "Open" : "Closed"}
              </Badge>
            ),
          },
          {
            label: "Current",
            render: (y) =>
              y.isCurrent ? <Badge tone="blue">Current year</Badge> : "—",
          },
          ...(edit
            ? [
                {
                  label: " ",
                  render: (y) => (
                    <span className="row nowrap" style={{ gap: 6 }}>
                      {!y.isCurrent && (
                        <button
                          className="btn ghost sm"
                          onClick={() =>
                            change(
                              y,
                              { isCurrent: true },
                              `${y.code} is now the current year`,
                            )
                          }
                        >
                          <Star size={13} /> Make current
                        </button>
                      )}
                      <button
                        className="btn ghost sm"
                        onClick={() =>
                          change(
                            y,
                            { isOpen: !y.isOpen },
                            `${y.code} ${y.isOpen ? "closed" : "reopened"}`,
                          )
                        }
                      >
                        {y.isOpen ? (
                          <>
                            <Lock size={13} /> Close
                          </>
                        ) : (
                          <>
                            <LockOpen size={13} /> Reopen
                          </>
                        )}
                      </button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
      {adding && (
        <AsyncFormModal
          title="Add financial year"
          submitLabel="Add year"
          fields={[
            {
              name: "code",
              label: "Year",
              hint: "Like 2026-27. Runs 1 April – 31 March.",
            },
          ]}
          onSubmit={create.mutateAsync}
          onDone={(y) => toast.success(`${y.code} added`)}
          onClose={() => setAdding(false)}
        />
      )}
    </Card>
  );
}
