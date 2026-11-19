// Every TanStack Query key in one place. Keys are hierarchical, so invalidating a prefix
// refreshes everything below it: invalidateQueries({ queryKey: queryKeys.centres.all })
// refreshes centre lists, single centres and PI histories.

export const queryKeys = {
  centres: {
    all: ["centres"],
    list: (filters) => ["centres", "list", filters],
    detail: (id) => ["centres", "detail", id],
    pis: (id) => ["centres", "detail", id, "pis"],
  },
  users: {
    all: ["users"],
    list: (filters) => ["users", "list", filters],
    roles: () => ["users", "roles"],
  },
  masters: {
    all: ["masters"],
    types: () => ["masters", "types"],
    list: (type, filters) => ["masters", "list", type, filters],
  },
  financialYears: {
    all: ["financialYears"],
  },
  parameters: {
    all: ["parameters"],
    list: (filters) => ["parameters", "list", filters],
  },
  audit: {
    all: ["audit"],
    list: (filters) => ["audit", "list", filters],
  },
  budgetAllocations: {
    all: ["budgetAllocations"],
    list: (filters) => ["budgetAllocations", "list", filters],
    detail: (id) => ["budgetAllocations", "detail", id],
  },
  assignments: {
    all: ["assignments"],
    list: (filters) => ["assignments", "list", filters],
    detail: (id) => ["assignments", "detail", id],
  },
  // Research data. A sheet carries its protocol and a trial its experiment, so research mutations
  // invalidate the whole 'research' tree.
  research: {
    all: ["research"],
    experiments: (filters) => ["research", "experiments", "list", filters],
    experiment: (id) => ["research", "experiments", "detail", id],
    trials: (filters) => ["research", "trials", "list", filters],
    trial: (id) => ["research", "trials", "detail", id],
    sheets: (filters) => ["research", "sheets", "list", filters],
    sheet: (id) => ["research", "sheets", "detail", id],
    analysis: (id) => ["research", "sheets", "detail", id, "analysis"],
    summary: (filters) => ["research", "sheets", "summary", filters],
    reporting: (experimentId) => [
      "research",
      "sheets",
      "reporting",
      experimentId,
    ],
    trend: (params) => ["research", "sheets", "trend", params],
  },
};
