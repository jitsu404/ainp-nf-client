import { Body, SmallBody } from "../../../components/ui";

export const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: state.isDisabled
      ? "var(--bg, #f5f7f5)"
      : "var(--surface, #ffffff)",
    borderColor: state.isFocused
      ? "var(--green, #1b7f4b)"
      : "var(--line, #e3e8e4)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--green, #1b7f4b)" : "none",
    borderRadius: "var(--radius, 6px)",
    minHeight: "36px",
    fontSize: "0.875rem",
    opacity: state.isDisabled ? 0.65 : 1,
    cursor: state.isDisabled ? "not-allowed" : "default",
    "&:hover": {
      borderColor: state.isFocused ? "var(--green, #1b7f4b)" : "#cbd5e1",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--surface, #ffffff)",
    border: "1px solid var(--line, #e3e8e4)",
    borderRadius: "var(--radius, 6px)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--green, #1b7f4b)"
      : state.isFocused
        ? "var(--green-bg, #e7f5ec)"
        : "transparent",
    color: state.isSelected ? "#ffffff" : "var(--ink, #1b2420)",
    fontSize: "0.875rem",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "var(--green, #1b7f4b)",
      color: "#ffffff",
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--green-bg, #e7f5ec)",
    borderRadius: "4px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "var(--green, #1b7f4b)",
    fontWeight: 500,
    fontSize: "0.8rem",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--green, #1b7f4b)",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(27, 127, 75, 0.15)",
      color: "var(--red, #b3261e)",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--text-muted, #647069)",
    fontSize: "0.875rem",
  }),
};

export function ExperimentSeasonsField({
  value = [],
  onChange,
  seasonOptions = [],
}) {
  const selectedCodes = Array.isArray(value)
    ? value.map((s) => (typeof s === "string" ? s : s?.code)).filter(Boolean)
    : value && typeof value === "object"
      ? Object.keys(value)
      : [];

  const allSelected =
    seasonOptions.length > 0 &&
    seasonOptions.every(([code]) => selectedCodes.includes(code));
  const someSelected =
    seasonOptions.some(([code]) => selectedCodes.includes(code)) &&
    !allSelected;

  const toggleSeason = (code, checked) => {
    const next = checked
      ? [...selectedCodes, code]
      : selectedCodes.filter((c) => c !== code);
    onChange(next);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onChange(seasonOptions.map(([code]) => code));
    } else {
      onChange([]);
    }
  };

  return (
    <div className="field full">
      <div className="row spread" style={{ marginBottom: 6 }}>
        <Body as="label" style={{ margin: 0, fontWeight: 600 }}>
          Seasons
        </Body>
        <SmallBody muted>
          {selectedCodes.length === 0
            ? "All seasons (unrestricted)"
            : `${selectedCodes.length} of ${seasonOptions.length} season${selectedCodes.length === 1 ? "" : "s"} selected`}
        </SmallBody>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
          padding: "10px 14px",
          borderRadius: "var(--radius, 8px)",
          border: "1px solid var(--line, #e3e8e4)",
          backgroundColor: "var(--surface, #ffffff)",
          minHeight: 44,
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            userSelect: "none",
            fontSize: "0.8125rem",
            color: "var(--text-muted, #556056)",
            fontWeight: 550,
            paddingRight: 14,
            borderRight: "1px solid var(--line, #e3e8e4)",
          }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={handleSelectAll}
            title={allSelected ? "Deactivate all" : "Activate all"}
            style={{
              cursor: "pointer",
              width: 16,
              height: 16,
              accentColor: "var(--green, #1b7f4b)",
            }}
          />
          <span>Select all</span>
        </label>

        {seasonOptions.map(([code, name]) => {
          const isActive = selectedCodes.includes(code);

          return (
            <label
              key={code}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                userSelect: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 450,
                color: isActive
                  ? "var(--ink, #1b2420)"
                  : "var(--text-muted, #556056)",
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => toggleSeason(code, e.target.checked)}
                style={{
                  cursor: "pointer",
                  width: 16,
                  height: 16,
                  accentColor: "var(--green, #1b7f4b)",
                }}
              />
              <span>{name}</span>
              <span
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted, #647069)",
                }}
              >
                ({code})
              </span>
            </label>
          );
        })}
      </div>
      <SmallBody
        muted
        style={{
          display: "block",
          marginTop: 4,
          fontSize: "0.775rem",
        }}
      >
        Select the seasons this experiment runs in. If none are selected, it
        applies to all seasons.
      </SmallBody>
    </div>
  );
}
