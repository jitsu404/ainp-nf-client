import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Filter,
  Info,
  Lock,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAuth } from "../auth";
import { AsyncFormModal, ErrorNote } from "../components/forms";
import {
  Badge,
  Body,
  Card,
  Modal,
  Page,
  Select,
  SmallBody,
  Stat,
  SubHeading,
  Table,
  Tabs,
} from "../components/ui";
import { useDebounced } from "../hooks";
import { toast } from "../lib/toast";
import {
  useBudgetAllocations,
  useCreateBudgetAllocation,
  useDeleteBudgetAllocation,
  useUpdateBudgetAllocation,
} from "../queries/budgetAllocations";
import { useCentres } from "../queries/centres";
import { useFinancialYears, useMasters } from "../queries/masters";

const fmtInr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/**
 * Format centre label as: hostShort, city (e.g. "ICAR-NRCSS, Ajmer")
 */
const centreOptionLabel = (c) => {
  if (!c) return "";
  const location = c.city || c.name || "";
  if (c.hostShort) {
    return location ? `${c.hostShort}, ${location}` : c.hostShort;
  }
  return location
    ? `${c.name || location}${c.code ? ` (${c.code})` : ""}`
    : c.code || "";
};

export default function BudgetAllocation() {
  const { user, role } = useAuth();
  const isNational =
    role?.scope === "national" || ["superadmin", "pc"].includes(role?.id);
  const piCentreId = user?.centreId;

  // Master data
  const yearsQuery = useFinancialYears();
  const years = yearsQuery.data ?? [];
  const [fy, setFy] = useState("");

  useEffect(() => {
    if (!fy && years.length > 0) {
      const current = years.find((y) => y.isCurrent) ?? years[0];
      setFy(current.id);
    }
  }, [years, fy]);

  const centresQuery = useCentres();
  const centresList = centresQuery.data?.data ?? [];

  const [centreFilter, setCentreFilter] = useState("");
  const [fundCategoryFilter, setFundCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview"); // 'overview' | 'heads'
  const [modal, setModal] = useState(null); // { type: 'total'|'head'|'delete', item?: any }

  const q = useDebounced(search);

  const budgetHeadsQuery = useMasters("budgetHead", { isActive: "true" });
  const budgetHeads = budgetHeadsQuery.data ?? [];

  const fundCategoriesQuery = useMasters("fundCategory", { isActive: "true" });
  const fundCategories = fundCategoriesQuery.data ?? [];

  // Effective centre filter for queries
  const effectiveCentre = isNational ? centreFilter : piCentreId;

  const allocationsQuery = useBudgetAllocations(
    {
      fy: fy || undefined,
      centre: effectiveCentre || undefined,
    },
    { enabled: Boolean(fy) },
  );

  const allocations = allocationsQuery.data ?? [];
  const totals = useMemo(
    () => allocations.filter((a) => a.isTotal),
    [allocations],
  );
  const heads = useMemo(
    () => allocations.filter((a) => !a.isTotal),
    [allocations],
  );

  const createMutation = useCreateBudgetAllocation();
  const updateMutation = useUpdateBudgetAllocation();
  const deleteMutation = useDeleteBudgetAllocation();

  // Selected FY details
  const selectedYear = years.find((y) => y.id === fy);

  // PI Centre display info
  const piCentreObj = useMemo(() => {
    return centresList.find((c) => c.id === piCentreId);
  }, [centresList, piCentreId]);

  const piCentreName = useMemo(() => {
    if (!piCentreId) return "";
    if (piCentreObj) return centreOptionLabel(piCentreObj);
    const fromAlloc = allocations.find(
      (a) => a.centre?.id === piCentreId || a.centre?._id === piCentreId,
    )?.centre;
    if (fromAlloc) return centreOptionLabel(fromAlloc);
    return "Your Centre";
  }, [piCentreId, piCentreObj, allocations]);

  // Centre-specific totals (for PI or single selected centre)
  const singleCentreId = isNational ? centreFilter : piCentreId;
  const singleCentreObj = useMemo(() => {
    return centresList.find((c) => c.id === singleCentreId);
  }, [centresList, singleCentreId]);

  const currentCentreTitle = singleCentreObj
    ? centreOptionLabel(singleCentreObj)
    : piCentreName || "Centre";

  const singleCentreTotalRecord = totals.find(
    (t) => (t.centre?.id ?? t.centre?._id ?? t.centre) === singleCentreId,
  );
  const singleCentreSanction = singleCentreTotalRecord?.amount ?? 0;
  const singleCentreHeadAllocated = heads
    .filter(
      (h) => (h.centre?.id ?? h.centre?._id ?? h.centre) === singleCentreId,
    )
    .reduce((sum, h) => sum + (h.amount || 0), 0);
  const singleCentreRemaining =
    singleCentreSanction - singleCentreHeadAllocated;

  // National-level summary (when "All centres" selected)
  const nationalTotalSanction = totals.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );
  const nationalTotalHeadAllocated = heads.reduce(
    (sum, h) => sum + (h.amount || 0),
    0,
  );
  const nationalRemaining = nationalTotalSanction - nationalTotalHeadAllocated;
  const nationalCentresAllocatedCount = new Set(
    allocations.map((a) => a.centre?.id ?? a.centre?._id ?? a.centre),
  ).size;

  // Overview rows for all centres
  const centreOverviewRows = useMemo(() => {
    if (!isNational) return [];
    return centresList
      .filter((c) => {
        if (!q) return true;
        const query = q.toLowerCase();
        const label = centreOptionLabel(c).toLowerCase();
        return (
          label.includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query)
        );
      })
      .map((c) => {
        const totalRec = totals.find(
          (t) => (t.centre?.id ?? t.centre?._id ?? t.centre) === c.id,
        );
        const sanction = totalRec?.amount ?? 0;
        const cHeads = heads.filter(
          (h) => (h.centre?.id ?? h.centre?._id ?? h.centre) === c.id,
        );
        const headSum = cHeads.reduce((acc, h) => acc + (h.amount || 0), 0);
        const balance = sanction - headSum;
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          state: c.state,
          hostShort: c.hostShort,
          city: c.city,
          sanction,
          headSum,
          balance,
          headCount: cHeads.length,
          totalRecord: totalRec,
        };
      });
  }, [isNational, centresList, totals, heads, q]);

  // Filtered detailed head allocations (with search + Fund Category filter)
  const filteredHeadRows = useMemo(() => {
    return heads.filter((h) => {
      if (fundCategoryFilter) {
        const catId =
          h.fundCategory?.id ?? h.fundCategory?._id ?? h.fundCategory;
        if (catId !== fundCategoryFilter) return false;
      }
      if (!q) return true;
      const query = q.toLowerCase();
      const centreName = h.centre?.name?.toLowerCase() ?? "";
      const centreHost = h.centre?.hostShort?.toLowerCase() ?? "";
      const centreCity = h.centre?.city?.toLowerCase() ?? "";
      const headName = h.budgetHead?.name?.toLowerCase() ?? "";
      const headCode = h.budgetHead?.code?.toLowerCase() ?? "";
      const catName = h.fundCategory?.name?.toLowerCase() ?? "";
      return (
        centreName.includes(query) ||
        centreHost.includes(query) ||
        centreCity.includes(query) ||
        headName.includes(query) ||
        headCode.includes(query) ||
        catName.includes(query)
      );
    });
  }, [heads, q, fundCategoryFilter]);

  // Form Fields generator
  // Fund Category comes first and is required; Budget Head comes second and is required.
  const headFormFields = [
    ...(isNational && !singleCentreId
      ? [
          {
            name: "centre",
            label: "Centre",
            type: "select",
            options: centresList.map((c) => [c.id, centreOptionLabel(c)]),
            required: true,
          },
        ]
      : []),
    {
      name: "fundCategory",
      label: "Fund Category",
      type: "select",
      options: fundCategories.map((fc) => [fc.id, fc.name]),
      required: true,
    },
    {
      name: "budgetHead",
      label: "Budget Head",
      type: "select",
      options: budgetHeads.map((bh) => [
        bh.id,
        `${bh.name} (${bh.code})${bh.group ? ` — ${bh.group}` : ""}`,
      ]),
      required: true,
    },
    {
      name: "amount",
      label: "Amount (₹)",
      type: "number",
      required: true,
      hint: "Enter allocation in rupees (e.g. 500000 for ₹5 Lakhs).",
    },
  ];

  const totalFormFields = [
    ...(isNational && !singleCentreId
      ? [
          {
            name: "centre",
            label: "Centre",
            type: "select",
            options: centresList.map((c) => [c.id, centreOptionLabel(c)]),
            required: true,
          },
        ]
      : []),
    {
      name: "amount",
      label: "Total Sanction Amount (₹)",
      type: "number",
      required: true,
      hint: "Total grant/sanction for this centre for the financial year.",
    },
  ];

  // In details view when singleCentreId is active or heads tab is selected
  const isInDetails = Boolean(singleCentreId || tab === "heads");

  const pageTitle =
    isNational && centreFilter ? (
      <div className="row g2" style={{ alignItems: "center" }}>
        <button
          type="button"
          className="btn ghost sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 10px",
            cursor: "pointer",
          }}
          title="Back to all centres"
          onClick={() => {
            setCentreFilter("");
            setFundCategoryFilter("");
          }}
        >
          <ArrowLeft size={16} />
          <span style={{ fontSize: "14px", fontWeight: 500 }}>
            Back to centres
          </span>
        </button>
        <span className="muted">/</span>
        <span>Budget Allocation</span>
      </div>
    ) : (
      "Budget Allocation"
    );

  return (
    <Page
      title={pageTitle}
      actions={
        <div className="row g2">
          {isNational && (
            <button
              className="btn ghost"
              onClick={() =>
                setModal({
                  type: "total",
                  centre: singleCentreId || "",
                  amount: singleCentreSanction || "",
                })
              }
            >
              <PiggyBank size={15} /> Set total sanction
            </button>
          )}
          <button
            className="btn"
            onClick={() =>
              setModal({
                type: "head",
                centre: singleCentreId || "",
              })
            }
          >
            <Plus size={15} /> Add head allocation
          </button>
        </div>
      }
    >
      <div className="stack">
        <ErrorNote error={allocationsQuery.error} />

        {/* Filters Toolbar */}
        <Card pad={false}>
          <div className="toolbar">
            {/* Financial Year Selector */}
            <label className="row g1" style={{ alignItems: "center" }}>
              <Calendar size={15} className="muted" />
              <Select
                value={fy}
                onChange={setFy}
                options={years.map((y) => [
                  y.id,
                  `${y.code}${y.isCurrent ? " (Current)" : ""}`,
                ])}
              />
            </label>

            {/* Centre Selector for National Users, Locked Badge for PI */}
            {isNational ? (
              <label className="row g1" style={{ alignItems: "center" }}>
                <Building2 size={15} className="muted" />
                <Select
                  value={centreFilter}
                  onChange={(val) => {
                    setCentreFilter(val);
                    setFundCategoryFilter("");
                  }}
                  options={centresList.map((c) => [c.id, centreOptionLabel(c)])}
                  all="All centres"
                />
              </label>
            ) : (
              <div className="row g1" style={{ alignItems: "center" }}>
                <Building2 size={15} className="muted" />
                <Badge tone="blue">
                  Centre: <b>{piCentreName}</b>
                </Badge>
              </div>
            )}

            {/* Fund Category Filter in Details View */}
            {isInDetails && (
              <label className="row g1" style={{ alignItems: "center" }}>
                <Filter size={15} className="muted" />
                <Select
                  value={fundCategoryFilter}
                  onChange={setFundCategoryFilter}
                  options={fundCategories.map((fc) => [fc.id, fc.name])}
                  all="All fund categories"
                />
              </label>
            )}

            <label className="search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search head, code, category…"
              />
            </label>

            <span className="grow" />

            {selectedYear && (
              <Badge tone={selectedYear.isOpen ? "green" : "grey"}>
                {selectedYear.code} {selectedYear.isOpen ? "Open" : "Closed"}
              </Badge>
            )}
          </div>
        </Card>

        {/* Summary Statistics */}
        {singleCentreId ? (
          // Single centre view stats (for PI or filtered national user)
          <div className="grid g3">
            <Stat
              icon={Lock}
              label="Centre Total Sanction"
              value={fmtInr(singleCentreSanction)}
              hint={
                singleCentreSanction > 0
                  ? isNational
                    ? "Set by PCU / Super Admin"
                    : "Official Sanction (Read-only)"
                  : "No sanction set yet"
              }
            />
            <Stat
              icon={Wallet}
              label="Allocated to Heads"
              value={fmtInr(singleCentreHeadAllocated)}
              hint={`${heads.filter((h) => (h.centre?.id ?? h.centre?._id ?? h.centre) === singleCentreId).length} heads allocated`}
            />
            <Stat
              icon={PiggyBank}
              label="Remaining to Allocate"
              value={fmtInr(singleCentreRemaining)}
              hint={
                singleCentreRemaining < 0
                  ? "Over-allocated!"
                  : `${singleCentreSanction > 0 ? ((singleCentreHeadAllocated / singleCentreSanction) * 100).toFixed(0) : 0}% utilised`
              }
            />
          </div>
        ) : (
          // National overview stats across all centres
          <div className="grid g4">
            <Stat
              icon={PiggyBank}
              label="Total Sanctioned"
              value={fmtInr(nationalTotalSanction)}
              hint={`Across all centres (${selectedYear?.code || ""})`}
            />
            <Stat
              icon={Wallet}
              label="Allocated to Heads"
              value={fmtInr(nationalTotalHeadAllocated)}
              hint={`${heads.length} head allocation items`}
            />
            <Stat
              icon={AlertCircle}
              label="Unallocated Balance"
              value={fmtInr(nationalRemaining)}
              hint={
                nationalRemaining < 0
                  ? "Over-allocated across centres"
                  : "Available to allocate"
              }
            />
            <Stat
              icon={Building2}
              label="Centres with Allocations"
              value={`${nationalCentresAllocatedCount} / ${centresList.length}`}
              hint="Centres with recorded data"
            />
          </div>
        )}

        {/* Content Tabs (For National overview when 'All centres' is selected) */}
        {isNational && !singleCentreId && (
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              ["overview", "Centres Overview", centreOverviewRows.length],
              ["heads", "Detailed Head Allocations", filteredHeadRows.length],
            ]}
          />
        )}

        {/* Table 1: Centres Overview (National All Centres View) */}
        {isNational && !singleCentreId && tab === "overview" && (
          <Card
            pad={false}
            title={`Centres Sanction & Head Allocations (${selectedYear?.code ?? ""})`}
          >
            <Table
              pageSize={15}
              columns={[
                {
                  label: "Centre",
                  render: (r) => (
                    <div>
                      <b>{centreOptionLabel(r)}</b>{" "}
                      <SmallBody className="mono" muted>
                        ({r.code})
                      </SmallBody>
                    </div>
                  ),
                },
                { label: "State", key: "state" },
                {
                  label: "Total Sanction",
                  num: true,
                  render: (r) =>
                    r.sanction > 0 ? (
                      <b>{fmtInr(r.sanction)}</b>
                    ) : (
                      <span className="muted">Not set</span>
                    ),
                },
                {
                  label: "Head Allocated",
                  num: true,
                  render: (r) => (
                    <span>
                      {fmtInr(r.headSum)}{" "}
                      <SmallBody muted>({r.headCount} heads)</SmallBody>
                    </span>
                  ),
                },
                {
                  label: "Balance",
                  num: true,
                  render: (r) => {
                    if (r.sanction === 0) return "—";
                    const tone =
                      r.balance < 0
                        ? "red"
                        : r.balance === 0
                          ? "green"
                          : "blue";
                    return <Badge tone={tone}>{fmtInr(r.balance)}</Badge>;
                  },
                },
                {
                  label: "Actions",
                  render: (r) => (
                    <div className="row g1">
                      <button
                        className="btn sm ghost"
                        title="View centre allocations"
                        onClick={() => setCentreFilter(r.id)}
                      >
                        View heads
                      </button>
                      <button
                        className="btn sm ghost"
                        title="Set or update sanction"
                        onClick={() =>
                          setModal({
                            type: "total",
                            centre: r.id,
                            amount: r.sanction || "",
                          })
                        }
                      >
                        Sanction
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={centreOverviewRows}
              empty="No centres match the filter"
            />
          </Card>
        )}

        {/* Table 2: Head Allocations (For PI, Single Centre, or National 'heads' tab) */}
        {(!isNational || singleCentreId || tab === "heads") && (
          <Card
            pad={false}
            title={
              singleCentreId
                ? `Head-wise Allocations — ${currentCentreTitle}`
                : "All Head Allocations across Centres"
            }
            actions={
              isNational && centreFilter ? (
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    setCentreFilter("");
                    setFundCategoryFilter("");
                  }}
                >
                  <ArrowLeft size={14} /> Back to all centres
                </button>
              ) : null
            }
          >
            <Table
              pageSize={15}
              columns={[
                ...(isNational && !singleCentreId
                  ? [
                      {
                        label: "Centre",
                        render: (r) => (
                          <div>
                            <b>{centreOptionLabel(r.centre)}</b>{" "}
                            <SmallBody className="mono" muted>
                              ({r.centre?.code})
                            </SmallBody>
                          </div>
                        ),
                      },
                    ]
                  : []),
                {
                  label: "Fund Category",
                  render: (r) =>
                    r.fundCategory?.name ? (
                      <Badge tone="blue">{r.fundCategory.name}</Badge>
                    ) : (
                      "—"
                    ),
                },
                {
                  label: "Budget Head",
                  render: (r) => (
                    <div>
                      <span className="mono bold">{r.budgetHead?.code}</span>{" "}
                      <span>{r.budgetHead?.name}</span>
                    </div>
                  ),
                },
                {
                  label: "Grant-in-Aid",
                  render: (r) => r.budgetHead?.group || "—",
                },
                {
                  label: "Allocated Amount",
                  num: true,
                  render: (r) => <b>{fmtInr(r.amount)}</b>,
                },
                ...(singleCentreSanction > 0
                  ? [
                      {
                        label: "% of Sanction",
                        num: true,
                        render: (r) => (
                          <SmallBody muted>
                            {((r.amount / singleCentreSanction) * 100).toFixed(
                              1,
                            )}
                            %
                          </SmallBody>
                        ),
                      },
                    ]
                  : []),
                {
                  label: "Actions",
                  render: (r) => (
                    <div className="row g1">
                      <button
                        className="btn sm ghost"
                        title="Edit head allocation"
                        onClick={() =>
                          setModal({
                            type: "head",
                            item: r,
                            centre: r.centre?.id ?? r.centre?._id ?? r.centre,
                          })
                        }
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn sm ghost danger"
                        title="Delete head allocation"
                        onClick={() => setModal({ type: "delete", item: r })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={
                singleCentreId
                  ? filteredHeadRows.filter(
                      (h) =>
                        (h.centre?.id ?? h.centre?._id ?? h.centre) ===
                        singleCentreId,
                    )
                  : filteredHeadRows
              }
              empty={
                fundCategoryFilter
                  ? "No allocations found for this fund category"
                  : "No head allocations recorded for this selection"
              }
            />
          </Card>
        )}
      </div>

      {/* Head Allocation Modal (Add / Edit) */}
      {modal?.type === "head" && (
        <AsyncFormModal
          title={modal.item ? "Edit Head Allocation" : "Add Head Allocation"}
          subtitle={
            modal.centre
              ? `Centre: ${centreOptionLabel(centresList.find((c) => c.id === modal.centre)) || piCentreName}`
              : "Allocate funds to an ICAR budget head and fund category"
          }
          fields={headFormFields}
          initial={{
            centre:
              modal.item?.centre?.id ??
              modal.item?.centre?._id ??
              modal.item?.centre ??
              modal.centre ??
              "",
            fundCategory:
              modal.item?.fundCategory?.id ??
              modal.item?.fundCategory?._id ??
              modal.item?.fundCategory ??
              (fundCategoryFilter || ""),
            budgetHead:
              modal.item?.budgetHead?.id ??
              modal.item?.budgetHead?._id ??
              modal.item?.budgetHead ??
              "",
            amount: modal.item?.amount ?? "",
          }}
          onSubmit={async (values) => {
            const payload = {
              centre: values.centre || modal.centre || effectiveCentre,
              fy,
              fundCategory: values.fundCategory,
              budgetHead: values.budgetHead,
              amount: Number(values.amount) || 0,
              isTotal: false,
            };

            if (modal.item?.id) {
              await updateMutation.mutateAsync({
                id: modal.item.id,
                ...payload,
              });
            } else {
              await createMutation.mutateAsync(payload);
            }
          }}
          onDone={() => {
            toast.success(
              modal.item ? "Allocation updated" : "Head allocation added",
            );
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Total Sanction Modal (Super Admin / PCU only) */}
      {modal?.type === "total" && (
        <AsyncFormModal
          title="Set Total Centre Sanction"
          subtitle={
            modal.centre
              ? `Centre: ${centreOptionLabel(centresList.find((c) => c.id === modal.centre)) || ""}`
              : "Set the total grant amount for the centre & financial year"
          }
          fields={totalFormFields}
          initial={{
            centre: modal.centre || singleCentreId || "",
            amount: modal.amount ?? "",
          }}
          onSubmit={async (values) => {
            const targetCentre =
              values.centre || modal.centre || singleCentreId;
            const existingTotal = totals.find(
              (t) =>
                (t.centre?.id ?? t.centre?._id ?? t.centre) === targetCentre,
            );

            const payload = {
              centre: targetCentre,
              fy,
              amount: Number(values.amount) || 0,
              isTotal: true,
              budgetHead: null,
              fundCategory: null,
            };

            if (existingTotal?.id) {
              await updateMutation.mutateAsync({
                id: existingTotal.id,
                ...payload,
              });
            } else {
              await createMutation.mutateAsync(payload);
            }
          }}
          onDone={() => {
            toast.success("Total sanction saved");
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modal?.type === "delete" && modal.item && (
        <Modal
          title="Delete Allocation"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(modal.item.id);
                    toast.success("Allocation deleted");
                    setModal(null);
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p>
            Are you sure you want to delete this allocation of{" "}
            <b>{fmtInr(modal.item.amount)}</b>
            {modal.item.isTotal
              ? " (Total Sanction)?"
              : ` for budget head "${modal.item.budgetHead?.name || modal.item.budgetHead?.code}"?`}
          </p>
        </Modal>
      )}
    </Page>
  );
}
