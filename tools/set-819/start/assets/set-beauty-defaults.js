window.SET_BEAUTY_DEFAULTS = {
  schemaVersion: 1,
  pilotName: "Beauty Prototype Workspace",
  brand: "Beauty",
  // Populated only from the indexed FLOORSET_CALENDAR.csv at runtime.
  floorsets: [],
  roles: [
    {
      id: "associate",
      label: "Store associate",
      scope: "Own store and assigned actions",
      permissions: ["View exact store actions", "Open approved guide and training", "Report an exception"],
      restrictions: ["No fleet data", "No payroll approval", "No prototype changes"]
    },
    {
      id: "manager",
      label: "Store manager",
      scope: "Own store, team, readiness, and exception flow",
      permissions: ["View store plan and hours", "Assign store work", "Request partner-store support", "Approve own-store readiness"],
      restrictions: ["No cross-brand payroll routing", "No locked-source changes"]
    },
    {
      id: "field",
      label: "Field visual partner",
      scope: "Assigned stores and visual execution",
      permissions: ["Compare prototype to store", "Review exceptions", "Support visual sequencing", "Escalate source conflicts"],
      restrictions: ["No payroll transfer approval", "No unsupported fixture changes"]
    },
    {
      id: "district",
      label: "District leader",
      scope: "District stores and proposed partner-store relationships",
      permissions: ["See modeled same-day workload collision", "Review proposed support", "Approve a documented cross-store request", "Track execution risk"],
      restrictions: ["No automatic payroll transfer", "Must follow labor and timekeeping policy"]
    },
    {
      id: "home-office",
      label: "Home office partner",
      scope: "Assigned brand, floorset, and owner-approved fleet view",
      permissions: ["Build prototype and translation", "Review source coverage", "Stage store impact", "Prepare approval evidence"],
      restrictions: ["Cannot claim live enterprise data", "Cannot bypass accountable owners"]
    },
    {
      id: "limited",
      label: "Intern / limited partner",
      scope: "Assigned project content only",
      permissions: ["View assigned source files", "Prepare draft analysis", "Submit for review"],
      restrictions: ["Read-only authority", "No store PII", "No publishing or approval"]
    }
  ],
  brandRows: [
    { id: "beauty", label: "Beauty", demand: 0, scheduled: 0, partner: true },
    { id: "vs", label: "VS", demand: 0, scheduled: 0, partner: true },
    { id: "pink", label: "PINK", demand: 0, scheduled: 0, partner: true },
    { id: "pink-beauty", label: "PINK Beauty", demand: 0, scheduled: 0, partner: true }
  ],
  sourceKinds: [
    { id: "beauty-prototype", label: "Tier prototypes", note: "Owner-approved Beauty prototype or shell files, when supplied" },
    { id: "map-history", label: "Store shell history", note: "Current and prior Space Planning / Blue Yonder maps" },
    { id: "brand-guide", label: "Brand Guides", note: "Store-scoped Brand Guide and execution-guide candidates" },
    { id: "line-list", label: "Line list", note: "Tier-specific assortment and approved style data" },
    { id: "marketing", label: "Marketing", note: "Approved AdTrax or campaign inputs" },
    { id: "payroll", label: "Payroll + time studies", note: "Approved labor drivers and action minutes" },
    { id: "fixture", label: "Fixture authority", note: "Fixture registry, capacity, and architecture" },
    { id: "calendar", label: "Calendar", note: "Floorset and update collision schedule" },
    { id: "store-input", label: "Other store inputs", note: "Store-scoped CSV and reference inputs not yet assigned a specific source role" }
  ],
  stageOrder: [
    {
      order: 1,
      title: "Protect source + remove pulsed promo",
      detail: "Lock the approved shell. Remove temporary promotional layers first."
    },
    {
      order: 2,
      title: "Stage architecture and fixture movement",
      detail: "Move complete physical fixture assemblies; never separate grouped pieces."
    },
    {
      order: 3,
      title: "Set floorset, emotional, and navigation layers",
      detail: "Establish customer journey and readable navigation before decorative layers."
    },
    {
      order: 4,
      title: "Build Beauty presentations",
      detail: "Maintain Beauty adjacencies and keep outpost tower/caddy integrations tied to their approved tables."
    },
    {
      order: 5,
      title: "Add approved assortment + marketing",
      detail: "Use the selected tier line list and approved source-grounded marketing only."
    },
    {
      order: 6,
      title: "Restore layered promo last + QA",
      detail: "Add pulsed signage last, then check navigation, capacity, ADA, readiness, and exceptions."
    }
  ],
  fieldAliases: {
    key: ["STORE_FIXTURE_KEY", "FIXTURE_DBKEY", "FIXTURE_ID", "DBKEY", "ASSET_ID", "FIXTURE"],
    store: ["STORE_NUMBER", "STORE", "STORE_ID"],
    floorset: ["FLOORSET_ID", "FLOORSET", "FLOORSET_DATE", "EFFECTIVE_DATE", "EXECUTION_DATE"],
    brand: ["BRAND", "BANNER"],
    room: ["ROOM", "ROOM_NAME", "ROOM_ID"],
    zone: ["ZONE", "ZONE_ID", "ZONE_NAME", "EMOTIONAL_SPACE", "COLLECTION"],
    x: ["X", "X_PCT", "X_COORD", "X_COORDINATE", "LEFT"],
    y: ["Y", "Y_PCT", "Y_COORD", "Y_COORDINATE", "TOP"],
    width: ["W_PCT", "W", "WIDTH", "WIDTH_PCT"],
    height: ["H_PCT", "H", "HEIGHT", "HEIGHT_PCT"],
    action: ["ACTION", "CHANGE_TYPE", "PAYROLL_ACTION", "MOVE_TYPE"],
    quantity: ["QUANTITY", "QTY", "UNITS", "COUNT"],
    baseMinutes: ["BASE_MINUTES", "BASE_TIME_MIN", "BASE_TIME", "BASE_WORK_MINUTES"],
    unitMinutes: ["UNIT_MINUTES", "UNIT_TIME_MIN", "SINGLE_UNIT_MINUTES", "UNIT_WORK_MINUTES"],
    totalMinutes: ["TOTAL_MINUTES", "TASK_MINUTES", "SUPPORTED_MINUTES", "PHYSICAL_MINUTES"],
    taskId: ["TASK_ID", "WORKLOAD_ID"],
    sourceIds: ["SOURCE_IDS", "SOURCE_ID", "SOURCE_RECORD_IDS"],
    approvalStatus: ["APPROVAL_STATUS", "LABOR_APPROVAL_STATUS", "TIME_STANDARD_STATUS"],
    assumptionStatus: ["ASSUMPTION_STATUS", "EVIDENCE_STATUS"],
    description: ["DESCRIPTION", "FIXTURE_NAME", "PRESENTATION", "STYLE_DESCRIPTION"]
  }
};
