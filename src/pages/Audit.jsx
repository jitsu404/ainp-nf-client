import { useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../auth";
import { AuditTable } from "../components/AuditTrail";
import { Card, Page, Select } from "../components/ui";
import { AUDIT_MODULES } from "../config/constants";
import { useDebounced } from "../hooks";
import { useCentres } from "../queries/centres";

// Who did what, when and from where. PCU and Super Admin see the whole programme; a Centre PI
// sees their own centre's activity (the API scopes it). Click a row for old → new values.

export default function Audit() {
  const { role } = useAuth();
  const national = role.scope === "national";
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [roleId, setRoleId] = useState("");
  const [centreId, setCentreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const q = useDebounced(search);
  const centres = useCentres({}, { enabled: national });

  const filters = Object.fromEntries(
    Object.entries({ search: q, module, roleId, centreId, from, to }).filter(
      ([, v]) => v,
    ),
  );

  return (
    <Page title={national ? "Audit trail" : "Audit trail of my centre"}>
      <Card pad={false}>
        <div className="toolbar" style={{ flexWrap: "wrap" }}>
          <label className="search">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or person…"
            />
          </label>
          <Select
            value={module}
            onChange={setModule}
            options={Object.entries(AUDIT_MODULES)}
            all="All modules"
          />
          {national && (
            <Select
              value={roleId}
              onChange={setRoleId}
              options={[
                ["superadmin", "Super Admin"],
                ["pc", "PCU"],
                ["pi", "Centre PI"],
              ]}
              all="All roles"
            />
          )}
          {national && (
            <Select
              value={centreId}
              onChange={setCentreId}
              options={(centres.data?.data ?? []).map((c) => [c.id, c.name])}
              all="All centres"
            />
          )}
          <label className="row small" style={{ gap: 6 }}>
            From
            <input
              type="date"
              className="select"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
            />
          </label>
          <label className="row small" style={{ gap: 6 }}>
            To
            <input
              type="date"
              className="select"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
            />
          </label>
        </div>
        {/* A new filter starts again at page 1. */}
        <AuditTable
          key={JSON.stringify(filters)}
          filters={filters}
          exportable
        />
      </Card>
    </Page>
  );
}
