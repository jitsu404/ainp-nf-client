/**
 * Master Data Tabs Configuration.
 * Static configuration for all lookup lists, standard master types,
 * custom views (Financial Years, Parameters, Roles), groups, relationships,
 * and usage metrics.
 */

export const MASTER_TABS = [
  // ── 1. Standard Master Types (interact with /masters/:type) ─────────────
  {
    id: "season",
    label: "Seasons",
    description:
      "Cropping seasons used in observation sheets (PCU master table).",
    kind: "standard",
    usage: {
      resource: "experiments",
      label: "Experiments",
      by: "code",
      extract: (e) => e.seasons,
    },
  },
  {
    id: "unit",
    label: "Units",
    description: "Units of measurement for parameters (kg/ha, %, no./m² …).",
    kind: "standard",
    usage: {
      resource: "parameters",
      label: "Parameters",
      by: "code",
      extract: (p) => [p.unitCode],
    },
  },
  {
    id: "crop",
    label: "Crops",
    description:
      "Crops and commodities used in cropping systems and varietal trials.",
    kind: "standard",
    groups: [
      "Cereal",
      "Millet",
      "Pulse",
      "Oilseed",
      "Vegetable",
      "Fruit",
      "Spice",
      "Fibre",
      "Sugar",
      "Fodder",
      "Tuber",
      "Other",
    ],
    groupLabel: "Crop group",
    usage: {
      resource: "trials",
      label: "Trials",
      by: "code",
      extract: (t) =>
        t.croppingSystems?.flatMap((cs) =>
          cs.seasons?.flatMap((s) => [s.mainCropCode, s.intercropCode]),
        ),
    },
  },
  {
    id: "nfInput",
    label: "NF / organic inputs",
    description:
      "Natural farming and organic inputs (Jeevamrit, Ghanjeevamrit, FYM …).",
    kind: "standard",
    groups: ["Natural farming", "Organic", "Botanical", "Biological", "Other"],
    groupLabel: "Input type",
  },
  {
    id: "programme",
    label: "Programmes",
    description: "AINP-NF research programmes (Research Highlights proforma).",
    kind: "standard",
    usage: {
      resource: "experiments",
      label: "Experiments",
      by: "code",
      extract: (e) => [e.programmeCode],
    },
  },
  {
    id: "budgetHead",
    label: "Budget heads",
    description: "ICAR budget heads used in BE, releases, expenditure and AUC.",
    kind: "standard",
    groups: ["Salaries", "General", "Capital"],
    groupLabel: "Grant-in-Aid",
    // linkedTo: "fundCategory",
    // linkedLabel: "Fund Category",
  },
  {
    id: "fundCategory",
    label: "Fund categories",
    description:
      "ICAR fund streams: General (other than TSP/SCSP/NEH), TSP, SCSP, NEH.",
    kind: "standard",
  },
  {
    id: "staffPost",
    label: "Staff posts",
    description:
      "Project posts at centres and the PCU (monthly staff position sheet).",
    kind: "standard",
    groups: [
      "Scientific",
      "Research fellow",
      "Technical",
      "Administrative",
      "Other",
    ],
    groupLabel: "Category",
  },

  {
    id: "zone",
    label: "Agro-climatic zones",
    description:
      "Planning Commission agro-climatic zones; each centre is in one (PCU master table).",
    kind: "standard",
    usage: {
      resource: "centres",
      label: "Centres",
      by: "name",
      extract: (c) => [c.zone],
    },
  },

  // ── 2. Custom Tabs (Dedicated APIs & Components) ─────────────────────
  {
    id: "fy",
    label: "Financial years",
    description:
      "A closed year is locked: no observation data or other entries can be added or changed in it. The current year is the default everywhere.",
    kind: "custom",
  },
  {
    id: "parameters",
    label: "Parameter library",
    description:
      "Parameter definitions, measurement metrics, and ranges library.",
    kind: "custom",
  },
  {
    id: "roles",
    label: "Roles",
    description:
      "Read-only overview of the roles, built by the server from the same definitions it enforces.",
    kind: "custom",
    permission: "users.manage",
  },
];

export const MASTER_TAB_MAP = new Map(MASTER_TABS.map((t) => [t.id, t]));

export const getMasterTabConfig = (id) => MASTER_TAB_MAP.get(id);

export const getAvailableTabs = (can) =>
  MASTER_TABS.filter((t) => !t.permission || can(t.permission));
