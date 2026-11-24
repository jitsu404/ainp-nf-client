// Every TanStack Query key in one place. Keys are hierarchical, so invalidating a prefix
// refreshes everything below it: invalidateQueries({ queryKey: queryKeys.centres.all })
// refreshes centre lists, single centres and PI histories.

export const queryKeys = {
  public: {
    all: ["public"],
    summary: () => ["public", "summary"],
  },
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
  communications: {
    all: ["communications"],
    list: (filters) => ["communications", "list", filters],
    detail: (id) => ["communications", "detail", id],
    replies: (id, centreId) => [
      "communications",
      "replies",
      id,
      centreId ?? null,
    ],
    unread: () => ["communications", "unread"],
  },
  croppingSystems: {
    all: ["croppingSystems"],
    list: (filters) => ["croppingSystems", "list", filters],
  },
  parameters: {
    all: ["parameters"],
    list: (filters) => ["parameters", "list", filters],
  },
  // Experiment PI seats (pi1.npnf@…). Experiments show their PI, so changes also refresh 'research'.
  experimentPis: {
    all: ["experimentPis"],
    list: () => ["experimentPis", "list"],
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
    // ICAR metadata is partly derived from the protocol, trial and sheets, so it sits in this
    // tree: any research change refreshes it.
    metadata: ["research", "metadata"],
    trialMetadata: (trialId) => ["research", "metadata", "trial", trialId],
    experimentMetadata: (experimentId) => [
      "research",
      "metadata",
      "experiment",
      experimentId,
    ],
  },
};
