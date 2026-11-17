import { Search } from "lucide-react";
import { Select } from "../../../components/ui";

export function MasterToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  linkedTo,
  onLinkedToChange,
  linkedOptions,
  linkedLabel,
  description,
}) {
  return (
    <div className="toolbar">
      <label className="search">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search code or name…"
        />
      </label>
      <Select
        value={status}
        onChange={onStatusChange}
        options={[
          ["true", "Active"],
          ["false", "Inactive"],
        ]}
        all="All"
      />
      {linkedOptions && (
        <Select
          value={linkedTo}
          onChange={onLinkedToChange}
          options={linkedOptions}
          all={
            linkedLabel === "Fund Category"
              ? "All fund categories"
              : `All ${linkedLabel.toLowerCase()}s`
          }
        />
      )}
      <span className="grow" />
      {description && <span className="muted small">{description}</span>}
    </div>
  );
}
