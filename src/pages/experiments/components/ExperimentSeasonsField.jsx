import Select from "react-select";

const customSelectStyles = {
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
  value = {},
  onChange,
  seasonOptions = [],
  cropOptions = [],
}) {
  // Normalize value to Record<string, string[]>
  const seasonsMap = (() => {
    if (!value) return {};
    if (value instanceof Map) {
      const obj = {};
      for (const [k, v] of value.entries()) {
        obj[k] = Array.isArray(v)
          ? v.map((item) =>
              typeof item === "object" ? item?._id || item?.id : String(item),
            )
          : [];
      }
      return obj;
    }
    if (Array.isArray(value)) {
      return Object.fromEntries(
        value.map((s) => [typeof s === "string" ? s : s?.code, []]),
      );
    }
    if (typeof value === "object") {
      const obj = {};
      for (const [k, v] of Object.entries(value)) {
        obj[k] = Array.isArray(v)
          ? v.map((item) =>
              typeof item === "object" ? item?._id || item?.id : String(item),
            )
          : [];
      }
      return obj;
    }
    return {};
  })();

  const selectedSeasonCodes = Object.keys(seasonsMap);
  const allSelected =
    seasonOptions.length > 0 &&
    seasonOptions.every(([code]) => selectedSeasonCodes.includes(code));
  const someSelected =
    seasonOptions.some(([code]) => selectedSeasonCodes.includes(code)) &&
    !allSelected;

  const toggleSeason = (code, checked) => {
    const next = { ...seasonsMap };
    if (checked) {
      next[code] = next[code] || [];
    } else {
      delete next[code];
    }
    onChange(next);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const next = {};
      for (const [code] of seasonOptions) {
        next[code] = seasonsMap[code] || [];
      }
      onChange(next);
    } else {
      onChange({});
    }
  };

  const handleCropsChange = (seasonCode, selected) => {
    const newCropIds = (selected ?? []).map((s) => s.value);
    onChange({
      ...seasonsMap,
      [seasonCode]: newCropIds,
    });
  };

  const cropSelectOptions = cropOptions.map((c) => ({
    value: String(c._id || c.id),
    label: `${c.name}${c.code ? ` (${c.code})` : ""}`,
  }));

  return (
    <div className="field full">
      <div className="row spread" style={{ marginBottom: 8 }}>
        <label style={{ margin: 0, fontWeight: 600 }}>Seasons & Crops</label>
        <span className="muted small">
          {selectedSeasonCodes.length === 0
            ? "No seasons activated (applies to all)"
            : `${selectedSeasonCodes.length} of ${seasonOptions.length} season${selectedSeasonCodes.length === 1 ? "" : "s"} activated`}
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--line, #e3e8e4)",
          borderRadius: "var(--radius, 8px)",
          overflow: "hidden",
          backgroundColor: "var(--surface, #ffffff)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "var(--bg, #f5f7f5)",
                borderBottom: "1px solid var(--line, #e3e8e4)",
                textAlign: "left",
              }}
            >
              <th
                style={{
                  width: "48px",
                  padding: "10px 12px",
                  textAlign: "center",
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
                  style={{ cursor: "pointer", width: 16, height: 16 }}
                />
              </th>
              <th
                style={{
                  width: "180px",
                  padding: "10px 12px",
                  fontWeight: 600,
                  color: "var(--ink, #1b2420)",
                }}
              >
                Season
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  fontWeight: 600,
                  color: "var(--ink, #1b2420)",
                }}
              >
                Crops (Multi-select)
              </th>
            </tr>
          </thead>
          <tbody>
            {seasonOptions.map(([code, name]) => {
              const isActive = selectedSeasonCodes.includes(code);
              const selectedCropIds = seasonsMap[code] || [];
              const selectedValues = cropSelectOptions.filter((opt) =>
                selectedCropIds.includes(opt.value),
              );

              return (
                <tr
                  key={code}
                  style={{
                    borderBottom: "1px solid var(--line, #e3e8e4)",
                    backgroundColor: isActive
                      ? "var(--surface, #ffffff)"
                      : "var(--bg, #f5f7f5)",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => toggleSeason(code, e.target.checked)}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: isActive ? 600 : 500,
                          color: isActive
                            ? "var(--ink, #1b2420)"
                            : "var(--text-muted, #647069)",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleSeason(code, !isActive)}
                      >
                        {name}
                      </span>
                      <span
                        className="mono muted small"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {code}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      verticalAlign: "middle",
                    }}
                  >
                    <Select
                      isMulti
                      isDisabled={!isActive}
                      options={cropSelectOptions}
                      value={isActive ? selectedValues : []}
                      onChange={(selected) => handleCropsChange(code, selected)}
                      placeholder={
                        isActive
                          ? `Select crops for ${name}…`
                          : "Check season to select crops"
                      }
                      styles={customSelectStyles}
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      closeMenuOnSelect={false}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: "0.775rem",
          color: "var(--text-muted, #647069)",
        }}
      >
        Check a season to activate it for this experiment, then select the
        relevant crops.
      </div>
    </div>
  );
}
