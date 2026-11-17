import { useState } from "react";
import {
  Plus,
  IndianRupee,
  Wallet,
  PiggyBank,
  ArrowDownToLine,
} from "lucide-react";
import { useStore, today } from "../store";
import {
  Badge,
  Bars,
  Card,
  ExportBar,
  FormModal,
  Page,
  Progress,
  Select,
  Stat,
  Table,
  Tabs,
  useSearch,
  lakh,
  num,
  fmtDate,
} from "../components/ui";
import { finRows, headRows, sum, pct } from "../data/calc";

export default function Finance() {
  const {
    db,
    fy,
    centre,
    centres,
    centreName,
    can,
    add,
    update,
    scope,
    programme,
  } = useStore();
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState(null);
  const [pick, setPick] = useState("");
  const heads = programme.budgetHeads;
  const centreOpts = db.centres.map((c) => [c.id, c.name]);
  const ids = centre
    ? [centre.id]
    : pick
      ? [pick]
      : db.centres.map((c) => c.id);
  const fin = finRows(db, fy, centres);
  const tot = {
    allocated: sum(fin, "allocated"),
    released: sum(fin, "released"),
    received: sum(fin, "received"),
    spent: sum(fin, "spent"),
  };
  const hr = headRows(db, fy, ids, heads);
  const releases = scope(db.releases).filter((r) => r.fy === fy);
  const [relRows, relSearch] = useSearch(releases, "Search release orders…");
  const spends = scope(db.expenditures).filter(
    (e) => e.fy === fy && ids.includes(e.centreId),
  );
  const reqs = scope(db.reapprops).filter((r) => r.fy === fy);
  const centreFilter = !centre && (
    <Select
      value={pick}
      onChange={setPick}
      options={centreOpts}
      all="All centres"
    />
  );

  const statementCols = [
    { label: "Centre", key: "name" },
    {
      label: "Allocation",
      num: true,
      render: (r) => num(r.allocated),
      text: (r) => r.allocated.toFixed(2),
    },
    {
      label: "Released",
      num: true,
      render: (r) => num(r.released),
      text: (r) => r.released.toFixed(2),
    },
    {
      label: "Received",
      num: true,
      render: (r) => num(r.received),
      text: (r) => r.received.toFixed(2),
    },
    {
      label: "Expenditure",
      num: true,
      render: (r) => num(r.spent),
      text: (r) => r.spent.toFixed(2),
    },
    {
      label: "Unspent balance",
      num: true,
      render: (r) => num(r.balance),
      text: (r) => r.balance.toFixed(2),
    },
    {
      label: "Utilisation",
      render: (r) => <Progress value={r.util} />,
      text: (r) => `${r.util.toFixed(0)}%`,
    },
  ];

  return (
    <Page title="Sanction & Finance">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["overview", "Financial progress"],
          ["allocation", "Allocation"],
          ["releases", "Sanction & release orders", releases.length],
          ["expenditure", "Expenditure"],
          ["requests", "Re-appropriation / additional", reqs.length],
          ["statement", "Consolidated statement"],
        ]}
      />

      {tab === "overview" && (
        <div className="stack">
          <div className="grid g4">
            <Stat
              icon={PiggyBank}
              label="Allocation"
              value={lakh(tot.allocated)}
              hint={`${heads.length} budget heads`}
            />
            <Stat
              icon={IndianRupee}
              label="Released"
              value={lakh(tot.released)}
              hint={`${num(pct(tot.released, tot.allocated), 0)}% of allocation`}
            />
            <Stat
              icon={ArrowDownToLine}
              label="Receipt confirmed"
              value={lakh(tot.received)}
              hint={`${lakh(tot.released - tot.received)} awaiting confirmation`}
            />
            <Stat
              icon={Wallet}
              label="Expenditure"
              value={lakh(tot.spent)}
              hint={`Unspent balance ${lakh(tot.released - tot.spent)}`}
            />
          </div>
          <div className="grid g2">
            <Card
              title="Head-wise allocation and expenditure"
              actions={centreFilter}
            >
              <Bars
                legend={["Allocation", "Expenditure"]}
                data={hr.map((h) => ({
                  label: h.head.replace("Grants-in-Aid ", ""),
                  value: h.allocated,
                  value2: h.spent,
                }))}
              />
            </Card>
            <Card
              title={
                centre
                  ? "Quarter-wise expenditure"
                  : "Centre-wise utilisation of released funds"
              }
            >
              {centre ? (
                <Bars
                  data={["Q1", "Q2", "Q3", "Q4"].map((q) => ({
                    label: q,
                    value: sum(spends.filter((e) => e.quarter === q)),
                  }))}
                />
              ) : (
                <Bars
                  fmt={(v) => `${num(v, 0)}%`}
                  max={100}
                  data={fin.map((r) => ({ label: r.name, value: r.util }))}
                />
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "allocation" && (
        <Card
          pad={false}
          title={`Centre and head-wise allocation, ${fy}`}
          actions={
            <>
              {can("finance.manage") && (
                <button
                  className="btn sm"
                  onClick={() => setForm("allocation")}
                >
                  <Plus size={14} /> Add / revise allocation
                </button>
              )}
            </>
          }
        >
          <Table
            pageSize={20}
            columns={[
              { label: "Centre", key: "name" },
              ...heads.map((h) => ({
                label: h
                  .replace("Grants-in-Aid ", "")
                  .replace("General – ", ""),
                num: true,
                render: (r) =>
                  num(
                    sum(
                      db.allocations.filter(
                        (a) =>
                          a.centreId === r.id && a.fy === fy && a.head === h,
                      ),
                    ),
                  ),
              })),
              {
                label: "Total",
                num: true,
                render: (r) => <b>{num(r.allocated)}</b>,
              },
            ]}
            rows={fin}
            foot={[
              "Total",
              ...heads.map((h) =>
                num(
                  sum(
                    db.allocations.filter(
                      (a) =>
                        a.fy === fy &&
                        a.head === h &&
                        fin.some((f) => f.id === a.centreId),
                    ),
                  ),
                ),
              ),
              num(tot.allocated),
            ]}
          />
        </Card>
      )}

      {tab === "releases" && (
        <Card pad={false}>
          <div className="toolbar">
            {relSearch}
            <span className="grow" />
            {can("finance.manage") && (
              <button className="btn sm" onClick={() => setForm("release")}>
                <Plus size={14} /> Record release order
              </button>
            )}
          </div>
          <Table
            columns={[
              { label: "Sanction / release order", key: "orderNo" },
              { label: "Centre", render: (r) => centreName(r.centreId) },
              {
                label: "Instalment",
                render: (r) =>
                  `${r.instalment}${r.instalment === 1 ? "st" : "nd"}`,
              },
              { label: "Date", render: (r) => fmtDate(r.date) },
              { label: "Amount", num: true, render: (r) => lakh(r.amount) },
              {
                label: "Receipt",
                render: (r) =>
                  r.status === "Received" ? (
                    <Badge>Received</Badge>
                  ) : (
                    <Badge tone="amber">Awaiting receipt</Badge>
                  ),
              },
              {
                label: "Received on",
                render: (r) =>
                  r.status === "Received" ? (
                    fmtDate(r.receivedOn)
                  ) : can("finance.receipt") ? (
                    <button
                      className="btn sm"
                      onClick={() =>
                        update(
                          "releases",
                          r.id,
                          { status: "Received", receivedOn: today() },
                          "Fund receipt confirmed",
                        )
                      }
                    >
                      Confirm receipt
                    </button>
                  ) : (
                    "—"
                  ),
              },
            ]}
            rows={relRows}
          />
        </Card>
      )}

      {tab === "expenditure" && (
        <div className="stack">
          <Card
            pad={false}
            title="Head-wise expenditure and balance"
            actions={
              <>
                {centreFilter}
                {can("finance.expenditure") && (
                  <button
                    className="btn sm"
                    onClick={() => setForm("expenditure")}
                  >
                    <Plus size={14} /> Enter expenditure
                  </button>
                )}
              </>
            }
          >
            <Table
              pageSize={10}
              columns={[
                { label: "Budget head", key: "head" },
                {
                  label: "Allocation",
                  num: true,
                  render: (r) => num(r.allocated),
                },
                {
                  label: "Expenditure",
                  num: true,
                  render: (r) => num(r.spent),
                },
                { label: "Balance", num: true, render: (r) => num(r.balance) },
                {
                  label: "Utilisation",
                  render: (r) => <Progress value={r.util} />,
                },
              ]}
              rows={hr}
              foot={[
                "Total",
                num(sum(hr, "allocated")),
                num(sum(hr, "spent")),
                num(sum(hr, "balance")),
                "",
              ]}
            />
          </Card>
          <Card pad={false} title="Expenditure entries">
            <Table
              columns={[
                { label: "Voucher / reference", key: "voucher" },
                { label: "Centre", render: (r) => centreName(r.centreId) },
                { label: "Budget head", key: "head" },
                { label: "Quarter", key: "quarter" },
                { label: "Date", render: (r) => fmtDate(r.date) },
                { label: "Amount", num: true, render: (r) => lakh(r.amount) },
                { label: "Entered by", key: "enteredBy" },
              ]}
              rows={[...spends].sort((a, b) => b.date.localeCompare(a.date))}
            />
          </Card>
        </div>
      )}

      {tab === "requests" && (
        <Card
          pad={false}
          title="Re-appropriation and additional requirement records"
          actions={
            can("finance.request") && (
              <button className="btn sm" onClick={() => setForm("request")}>
                <Plus size={14} /> New request
              </button>
            )
          }
        >
          <Table
            columns={[
              { label: "Centre", render: (r) => centreName(r.centreId) },
              { label: "Type", key: "type" },
              { label: "From head", key: "fromHead" },
              { label: "To head", key: "toHead" },
              { label: "Amount", num: true, render: (r) => lakh(r.amount) },
              { label: "Justification", key: "reason" },
              { label: "Date", render: (r) => fmtDate(r.date) },
              { label: "Status", render: (r) => <Badge>{r.status}</Badge> },
              {
                label: "",
                render: (r) =>
                  can("finance.manage") &&
                  r.status === "Submitted" && (
                    <span
                      className="row"
                      style={{ flexWrap: "nowrap", gap: 6 }}
                    >
                      <button
                        className="btn sm"
                        onClick={() =>
                          update(
                            "reapprops",
                            r.id,
                            { status: "Approved" },
                            "Request approved",
                          )
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="btn sm danger"
                        onClick={() =>
                          update(
                            "reapprops",
                            r.id,
                            { status: "Returned" },
                            "Request returned",
                          )
                        }
                      >
                        Return
                      </button>
                    </span>
                  ),
              },
            ]}
            rows={reqs}
          />
        </Card>
      )}

      {tab === "statement" && (
        <Card
          pad={false}
          title={`Consolidated financial statement, ${fy}`}
          actions={
            <ExportBar
              name={`financial-statement-${fy}`}
              columns={statementCols}
              rows={fin}
            />
          }
        >
          <Table
            pageSize={20}
            columns={statementCols}
            rows={fin}
            foot={[
              "Total",
              num(tot.allocated),
              num(tot.released),
              num(tot.received),
              num(tot.spent),
              num(tot.released - tot.spent),
              `${num(pct(tot.spent, tot.released), 0)}%`,
            ]}
          />
        </Card>
      )}

      {form === "allocation" && (
        <FormModal
          title="Add / revise allocation"
          onClose={() => setForm(null)}
          submitLabel="Save allocation"
          fields={[
            {
              name: "centreId",
              label: "Centre",
              type: "select",
              options: centreOpts,
            },
            {
              name: "head",
              label: "Budget head",
              type: "select",
              options: heads,
            },
            { name: "amount", label: "Amount (₹ lakh)", type: "number" },
            {
              name: "remark",
              label: "Remark",
              type: "textarea",
              required: false,
            },
          ]}
          onSubmit={(v) =>
            add("allocations", { ...v, fy }, "Allocation recorded")
          }
        />
      )}
      {form === "release" && (
        <FormModal
          title="Record sanction / release order"
          onClose={() => setForm(null)}
          submitLabel="Record release"
          initial={{ date: today(), instalment: 2 }}
          fields={[
            {
              name: "centreId",
              label: "Centre",
              type: "select",
              options: centreOpts,
            },
            { name: "orderNo", label: "Order number", full: true },
            { name: "date", label: "Order date", type: "date" },
            { name: "instalment", label: "Instalment", type: "number" },
            { name: "amount", label: "Amount (₹ lakh)", type: "number" },
            { name: "file", label: "Release order (PDF)", type: "file" },
          ]}
          onSubmit={(v) =>
            add(
              "releases",
              { ...v, fy, status: "Released", receivedOn: null },
              "Release order recorded; centre notified",
            )
          }
        />
      )}
      {form === "expenditure" && (
        <FormModal
          title="Enter expenditure"
          onClose={() => setForm(null)}
          submitLabel="Save entry"
          initial={{ date: today(), quarter: "Q3" }}
          fields={[
            {
              name: "head",
              label: "Budget head",
              type: "select",
              options: heads,
              full: true,
            },
            {
              name: "quarter",
              label: "Quarter",
              type: "select",
              options: ["Q1", "Q2", "Q3", "Q4"],
            },
            { name: "date", label: "Date", type: "date" },
            { name: "amount", label: "Amount (₹ lakh)", type: "number" },
            { name: "voucher", label: "Voucher / reference" },
            { name: "file", label: "Supporting document", type: "file" },
          ]}
          onSubmit={(v) =>
            add(
              "expenditures",
              { ...v, fy, centreId: centre.id, enteredBy: "You" },
              "Expenditure entry saved",
            )
          }
        />
      )}
      {form === "request" && (
        <FormModal
          title="Re-appropriation / additional requirement"
          onClose={() => setForm(null)}
          submitLabel="Submit request"
          fields={[
            {
              name: "type",
              label: "Type",
              type: "select",
              options: ["Re-appropriation", "Additional requirement"],
            },
            { name: "amount", label: "Amount (₹ lakh)", type: "number" },
            {
              name: "fromHead",
              label: "From head",
              type: "select",
              options: ["—", ...heads],
            },
            {
              name: "toHead",
              label: "To head",
              type: "select",
              options: heads,
            },
            { name: "reason", label: "Justification", type: "textarea" },
          ]}
          onSubmit={(v) =>
            add(
              "reapprops",
              {
                ...v,
                fy,
                centreId: centre.id,
                status: "Submitted",
                date: today(),
              },
              "Request submitted to the Coordinating Unit",
            )
          }
        />
      )}
    </Page>
  );
}
