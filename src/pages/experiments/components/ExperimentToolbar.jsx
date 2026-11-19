import { Loader2, Search } from "lucide-react";
import { Select } from "../../../components/ui";
import { EXPERIMENT_STATUSES } from "../../../config/constants";

export function ExperimentToolbar({
  search,
  onSearchChange,
  programme,
  onProgrammeChange,
  programmeOptions = [],
  status,
  onStatusChange,
  isFetching,
  isPending,
  totalCount,
}) {
  return (
    <div className="toolbar">
      <label className="search">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search code or title…"
        />
      </label>
      <Select
        value={programme}
        onChange={onProgrammeChange}
        options={programmeOptions}
        all="All programmes"
      />
      <Select
        value={status}
        onChange={onStatusChange}
        options={EXPERIMENT_STATUSES}
        all="All statuses"
      />
      <span className="grow" />
      <span className="muted small row" style={{ gap: 6 }}>
        {isFetching && <Loader2 size={13} className="spin" />}
        {isPending
          ? "Loading…"
          : `${totalCount} experiment${totalCount === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}
