import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Search } from "lucide-react";
import { useAuth } from "../auth";
import { AsyncFormModal, ErrorNote } from "../components/forms";
import {
  Badge,
  Body,
  Card,
  Page,
  Select,
  SmallBody,
  Table,
} from "../components/ui";
import { HOST_TYPES, ROUTES, TABLE_PAGE_SIZE } from "../config/constants";
import { useDebounced } from "../hooks";
import { programme } from "../programme/config";
import { useCentres, useCreateCentre } from "../queries/centres";
import { useMasterOptions } from "../queries/masters";

/** Fields shared by "Add centre" and "Edit centre". `zones` = names from the agro-climatic zones master. */
export const centreFields = (isEdit, zones = []) => [
  {
    name: "code",
    label: "Centre code",
    hint: "2–10 letters, unique. Stored in capitals.",
    required: !isEdit,
  },
  { name: "name", label: "Centre (location) name" },
  { name: "host", label: "Host institution", full: true },
  { name: "hostShort", label: "Host short name", required: false },
  {
    name: "hostType",
    label: "Host type",
    type: "select",
    options: HOST_TYPES,
    required: false,
  },
  { name: "city", label: "City", required: false },
  { name: "state", label: "State" },
  { name: "pincode", label: "Pincode", required: false },
  {
    name: "zone",
    label: "Agro-climatic zone",
    type: "select",
    options: zones,
    required: false,
  },
  {
    name: "type",
    label: "Centre type",
    type: "select",
    options: programme.centreTypes,
  },
];

export default function Centres() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("true");
  const [adding, setAdding] = useState(false);
  const q = useDebounced(search);

  const centres = useCentres({ search: q, isActive: status });
  const createCentre = useCreateCentre();
  const zones = useMasterOptions("zone");
  const rows = centres.data?.data ?? [];

  return (
    <Page
      title="Centres & Centre PIs"
      actions={
        can("centres.manage") && (
          <button className="btn" onClick={() => setAdding(true)}>
            <Plus size={15} /> Add centre
          </button>
        )
      }
    >
      <div className="stack">
        <ErrorNote error={centres.error} />
        <Card pad={false}>
          <div className="toolbar">
            <label className="search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, host, city or state…"
              />
            </label>
            <Select
              value={status}
              onChange={setStatus}
              options={[
                ["true", "Active centres"],
                ["false", "Inactive centres"],
              ]}
              all="All centres"
            />
            <span className="grow" />
            <SmallBody muted className="row" style={{ gap: 6 }}>
              {centres.isFetching && <Loader2 size={13} className="spin" />}
              {centres.isPending
                ? "Loading…"
                : `${rows.length} centre${rows.length === 1 ? "" : "s"}`}
            </SmallBody>
          </div>
          <Table
            rows={rows}
            pageSize={TABLE_PAGE_SIZE}
            onRow={(c) => navigate(ROUTES.centre(c.id))}
            empty={centres.isPending ? "Loading…" : "No centres match."}
            columns={[
              { label: "Code", key: "code" },
              {
                label: "Centre",
                render: (c) => (
                  <Body as="b" style={{ fontWeight: 550 }}>
                    {c.name}
                  </Body>
                ),
              },
              {
                label: "Host",
                render: (c) => (
                  <span title={c.host}>{c.hostShort || c.host}</span>
                ),
              },
              { label: "State", key: "state" },
              { label: "Zone", render: (c) => c.zone || "—" },
              {
                label: "Centre PI",
                render: (c) =>
                  c.currentPi ? (
                    c.currentPi.name
                  ) : (
                    <Badge tone="amber">Not assigned</Badge>
                  ),
              },
              {
                label: "Status",
                render: (c) => (
                  <Badge>{c.isActive ? "Active" : "Inactive"}</Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {adding && (
        <AsyncFormModal
          title="Add centre"
          fields={centreFields(
            false,
            zones.options.map(([, name]) => name),
          )}
          initial={{ type: programme.centreTypes[0] }}
          submitLabel="Add centre"
          onSubmit={createCentre.mutateAsync}
          onDone={(centre) => navigate(ROUTES.centre(centre.id))}
          onClose={() => setAdding(false)}
        />
      )}
    </Page>
  );
}
