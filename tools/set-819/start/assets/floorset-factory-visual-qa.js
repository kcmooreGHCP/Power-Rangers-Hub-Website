(() => {
  "use strict";

  const VISUAL_QA_VERSION = "1.2.0";
  const POSITIVE_PLACEMENT_STATES = new Set([
    "PLACED",
    "ALREADY_CURRENT",
    "REPLACED_SUPERSEDED_VERSION",
  ]);
  const SOURCE_EXTENSIONS = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "psd",
    "tif",
    "tiff",
    "heic",
  ]);
  const PREVIEW_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
  const state = {
    files: [],
    fileMap: new Map(),
    rootPrefix: "",
    manifest: null,
    projectId: "",
    results: [],
    orphans: [],
    unassignedCrops: [],
    objectUrls: [],
    runtimeIndex: null,
    latestPlacementLog: null,
    scanUtc: "",
    manifestReceiptVerified: false,
    receiptVerificationMode: "",
    projectBlockers: [],
    projectWarnings: [],
    imageDocuments: [],
  };

  const qaInput = document.querySelector("#qa-project-folder");
  const qaStatus = document.querySelector("[data-qa-scan-status]");
  const qaResults = document.querySelector("[data-qa-results]");
  const qaControls = document.querySelector("[data-qa-controls]");
  const qaMeta = document.querySelector("[data-qa-project-meta]");
  const qaClear = document.querySelector("[data-qa-clear]");
  const qaGate = document.querySelector("[data-qa-gate]");
  const qaDialog = document.querySelector("[data-qa-preview-dialog]");
  const factoryMain = document.querySelector("#factory-main");
  const qaSection = document.querySelector("#visual-qa");
  const handoffSection = document.querySelector("#handoff");
  const evidenceSection = document.querySelector("#evidence");

  if (factoryMain && handoffSection && qaSection && evidenceSection) {
    factoryMain.append(handoffSection, qaSection, evidenceSection);
  }

  if (!qaInput || !qaResults) return;

  function normalizePath(value) {
    return String(value || "")
      .replaceAll("\\", "/")
      .replace(/^\/+/, "")
      .replace(/\/+/g, "/");
  }

  function safeRelativePath(value) {
    const path = normalizePath(value);
    if (!path || path.startsWith("/") || path.includes("\0")) return false;
    const parts = path.split("/");
    return !parts.some((part) => !part || part === "." || part === "..");
  }

  function fileExtension(path) {
    const match = String(path || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  }

  function basename(path) {
    return normalizePath(path).split("/").pop() || "";
  }

  function dirname(path) {
    const normalized = normalizePath(path);
    const index = normalized.lastIndexOf("/");
    return index < 0 ? "" : normalized.slice(0, index);
  }

  function stem(path) {
    const name = basename(path);
    const index = name.lastIndexOf(".");
    return index > 0 ? name.slice(0, index) : name;
  }

  function mediaPreference(path) {
    const extension = fileExtension(path);
    if (extension === "psd") return 0;
    if (extension === "tif" || extension === "tiff") return 1;
    if (extension === "png") return 2;
    if (extension === "webp") return 3;
    if (extension === "jpg" || extension === "jpeg") return 4;
    return 5;
  }

  function groupLogicalMedia(entries) {
    const groups = new Map();
    for (const entry of entries) {
      const key = `${dirname(entry.relativePath).toLowerCase()}\u001f${stem(
        entry.relativePath,
      ).toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }
    return [...groups.values()].map((members) => {
      members.sort(
        (left, right) =>
          mediaPreference(left.relativePath) -
            mediaPreference(right.relativePath) ||
          naturalCompare(left.relativePath, right.relativePath),
      );
      const primary = members[0];
      const preview =
        members.find((member) =>
          PREVIEW_EXTENSIONS.has(fileExtension(member.relativePath)),
        ) || null;
      return {
        ...primary,
        paths: members.map((member) => member.relativePath),
        previewFile: preview?.file || null,
        previewRelativePath: preview?.relativePath || "",
      };
    });
  }

  function simpleLabel(value) {
    const match = String(value || "")
      .trim()
      .toLowerCase()
      .match(/^0*(\d+)([a-z]?)$/);
    if (!match) return "";
    const number = String(Number(match[1]));
    if (!number || number === "NaN") return "";
    return `${number}${match[2] || "a"}`;
  }

  function joinPath(...parts) {
    return normalizePath(parts.filter(Boolean).join("/"));
  }

  function naturalCompare(a, b) {
    return String(a || "").localeCompare(String(b || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  function cleanText(value) {
    return String(value ?? "").trim();
  }

  function field(row, ...names) {
    for (const name of names) {
      if (row && Object.prototype.hasOwnProperty.call(row, name)) {
        return cleanText(row[name]);
      }
    }
    return "";
  }

  function croppedFolderForSlot(slot) {
    const folder = field(slot, "folderRel", "folder_rel");
    if (!safeRelativePath(folder) || !folder.startsWith("01_TEAM_INTAKE/")) {
      return "";
    }
    return folder.replace(/^01_TEAM_INTAKE\//, "02_CROPPED_ASSETS/");
  }

  function exactKey(slotId, assetId) {
    return `${String(slotId || "")}\u001f${String(assetId || "")}`;
  }

  function versionKey(slotId, assetId, versionId) {
    return `${exactKey(slotId, assetId)}\u001f${String(versionId || "")}`;
  }

  function setScanStatus(message, isError = false) {
    qaStatus.textContent = message;
    qaStatus.classList.toggle("is-error", isError);
  }

  function setGate(kind, label, title, detail) {
    qaGate.className = `qa-gate qa-gate-${kind}`;
    qaGate.querySelector("[data-qa-gate-label]").textContent = label;
    qaGate.querySelector("[data-qa-gate-title]").textContent = title;
    qaGate.querySelector("[data-qa-gate-detail]").textContent = detail;
  }

  function revokeObjectUrls() {
    for (const url of state.objectUrls) URL.revokeObjectURL(url);
    state.objectUrls = [];
  }

  function objectUrl(file) {
    if (!file) return "";
    const url = URL.createObjectURL(file);
    state.objectUrls.push(url);
    return url;
  }

  function resetState({ keepInput = false } = {}) {
    revokeObjectUrls();
    state.files = [];
    state.fileMap = new Map();
    state.rootPrefix = "";
    state.manifest = null;
    state.projectId = "";
    state.results = [];
    state.orphans = [];
    state.unassignedCrops = [];
    state.runtimeIndex = null;
    state.latestPlacementLog = null;
    state.scanUtc = "";
    state.manifestReceiptVerified = false;
    state.receiptVerificationMode = "";
    state.projectBlockers = [];
    state.projectWarnings = [];
    state.imageDocuments = [];
    if (!keepInput) qaInput.value = "";
    qaClear.disabled = true;
    qaControls.hidden = true;
    qaMeta.hidden = true;
    qaMeta.textContent = "";
    qaResults.replaceChildren(emptyMessage());
    updateKpis();
    renderOrphans();
    setScanStatus("No completed project selected.");
    setGate(
      "idle",
      "VISUAL GATE NOT RUN",
      "Select a completed floorset project.",
      "Expected slots remain available in the generated package. This recheck only evaluates the project folder you explicitly select.",
    );
  }

  function emptyMessage(title = "Expected versus actual will appear here.", detail) {
    const wrapper = document.createElement("div");
    wrapper.className = "qa-empty";
    const strong = document.createElement("strong");
    strong.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent =
      detail ||
      "Each card will show the expected slot, source candidate, active PNG preview, registration chain, placement status, approval status, and the reason for every amber or red gate.";
    wrapper.append(strong, paragraph);
    return wrapper;
  }

  async function readText(file) {
    if (!file) throw new Error("Required file is missing.");
    return file.text();
  }

  async function readJson(file, label) {
    try {
      return JSON.parse(await readText(file));
    } catch (error) {
      throw new Error(`${label} is not readable JSON: ${error.message}`);
    }
  }

  async function sha256Bytes(bytes) {
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  async function sha256File(file) {
    return sha256Bytes(await file.arrayBuffer());
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    const source = String(text || "").replace(/^\uFEFF/, "");
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          value += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          value += character;
        }
        continue;
      }
      if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(value);
        value = "";
      } else if (character === "\n") {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        value = "";
      } else {
        value += character;
      }
    }
    if (quoted) throw new Error("CSV contains an unclosed quoted value.");
    if (value || row.length) {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
    }
    const nonempty = rows.filter((item) => item.some((cell) => cell !== ""));
    if (!nonempty.length) return [];
    const headers = nonempty[0].map((header) => cleanText(header));
    return nonempty.slice(1).map((cells) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = cells[index] ?? "";
      });
      return record;
    });
  }

  function csvSafe(value) {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }

  function csvDocument(headers, rows) {
    return [
      headers.map(csvSafe).join(","),
      ...rows.map((row) => headers.map((header) => csvSafe(row[header])).join(",")),
    ].join("\r\n") + "\r\n";
  }

  function downloadText(text, filename, type = "text/plain;charset=utf-8") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function projectRelativePath(file) {
    const raw = normalizePath(file.webkitRelativePath || file.name);
    if (!state.rootPrefix) return raw;
    const prefix = `${state.rootPrefix}/`;
    return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
  }

  function mapSelectedFiles(files) {
    const manifestCandidates = files.filter((file) =>
      normalizePath(file.webkitRelativePath || file.name).endsWith(
        "/00_SET_DATA/project_manifest.json",
      ),
    );
    if (manifestCandidates.length !== 1) {
      throw new Error(
        manifestCandidates.length
          ? `Select one project root. ${manifestCandidates.length} project manifests were found.`
          : "This folder is not a generated Factory project. 00_SET_DATA/project_manifest.json was not found.",
      );
    }
    const manifestRaw = normalizePath(
      manifestCandidates[0].webkitRelativePath || manifestCandidates[0].name,
    );
    state.rootPrefix = manifestRaw.slice(
      0,
      -"/00_SET_DATA/project_manifest.json".length,
    );
    const mapped = new Map();
    for (const file of files) {
      const relativePath = projectRelativePath(file);
      if (!safeRelativePath(relativePath)) {
        throw new Error(`Unsafe selected path: ${relativePath || file.name}`);
      }
      if (mapped.has(relativePath)) {
        throw new Error(`Duplicate project-relative path: ${relativePath}`);
      }
      mapped.set(relativePath, file);
    }
    state.fileMap = mapped;
  }

  function validateExpectedSlots(manifest) {
    const slots = manifest.assetSlots;
    const expected = manifest.expectedAssets;
    if (!Array.isArray(slots) || !Array.isArray(expected)) {
      throw new Error("Manifest assetSlots and expectedAssets must both be arrays.");
    }
    const slotKeys = slots.map((slot) =>
      exactKey(field(slot, "assetSlotId", "asset_slot_id"), field(slot, "assetId", "asset_id")),
    );
    const expectedKeys = expected.map((slot) =>
      exactKey(field(slot, "assetSlotId", "asset_slot_id"), field(slot, "assetId", "asset_id")),
    );
    if (slotKeys.some((key) => key === exactKey("", ""))) {
      throw new Error("An expected slot is missing its stable slot or asset ID.");
    }
    if (new Set(slotKeys).size !== slotKeys.length) {
      throw new Error("Manifest contains duplicate expected slot/asset pairs.");
    }
    if (new Set(slots.map((slot) => field(slot, "assetSlotId", "asset_slot_id"))).size !== slots.length) {
      throw new Error("Manifest contains duplicate asset slot IDs.");
    }
    if (new Set(slots.map((slot) => field(slot, "assetId", "asset_id"))).size !== slots.length) {
      throw new Error("Manifest contains duplicate asset IDs.");
    }
    const expectedSet = new Set(expectedKeys);
    if (
      expectedSet.size !== slotKeys.length ||
      slotKeys.some((key) => !expectedSet.has(key))
    ) {
      throw new Error("Manifest expectedAssets does not exactly match assetSlots.");
    }
    const schemaValidator =
      window.SET_FACTORY_TEST_API?.validatePinnedManifestSchema;
    if (typeof schemaValidator === "function" && !schemaValidator(manifest)) {
      throw new Error("Manifest fails the Factory's pinned v1.5 schema.");
    }
    return slots;
  }

  async function verifyOriginalReceipt(manifestFile) {
    const receiptFile = state.fileMap.get("00_SET_DATA/build_receipt.json");
    if (!receiptFile) {
      state.projectBlockers.push("Original build receipt is missing.");
      return false;
    }
    const receipt = await readJson(receiptFile, "Build receipt");
    const row = Array.isArray(receipt.files)
      ? receipt.files.find(
          (item) => field(item, "relativePath", "relative_path") ===
            "00_SET_DATA/project_manifest.json",
        )
      : null;
    if (!row || !/^[a-f0-9]{64}$/i.test(field(row, "sha256"))) {
      state.projectBlockers.push(
        "Build receipt does not contain a valid manifest fingerprint.",
      );
      return false;
    }
    if (
      field(receipt, "projectId", "project_id") !== state.projectId ||
      Number(field(row, "sizeBytes", "size_bytes")) !== manifestFile.size
    ) {
      state.projectBlockers.push(
        "The original build receipt does not match this project identity and manifest size.",
      );
      return false;
    }
    const expected = field(row, "sha256").toLowerCase();
    const actual = await sha256File(manifestFile);
    if (actual.toLowerCase() === expected) {
      state.receiptVerificationMode = "standard SHA-256 receipt";
      return true;
    }
    state.projectBlockers.push(
      "The original project manifest no longer matches its sealed build receipt.",
    );
    return false;
  }

  async function csvRowsAt(path) {
    const file = state.fileMap.get(path);
    return file ? parseCsv(await readText(file)) : [];
  }

  async function loadRuntimeIndex() {
    const candidates = [];
    for (const [relativePath, file] of state.fileMap) {
      const match = relativePath.match(
        /^04_REVIEW\/SET_VISUAL_QA_RUNTIME_INDEX_R(\d{3})\.csv$/,
      );
      if (match) {
        candidates.push({
          revision: Number(match[1]),
          relativePath,
          file,
        });
      }
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.revision - a.revision);
    const topRevision = candidates[0].revision;
    if (candidates.filter((item) => item.revision === topRevision).length !== 1) {
      state.projectBlockers.push(
        `Runtime hash index revision R${String(topRevision).padStart(3, "0")} is duplicated.`,
      );
      return null;
    }
    const selected = candidates[0];
    const checksumFile = state.fileMap.get(`${selected.relativePath}.sha256`);
    if (!checksumFile) {
      state.projectWarnings.push(
        `Runtime hash index R${String(selected.revision).padStart(3, "0")} has no checksum sidecar.`,
      );
      return null;
    }
    const checksumText = cleanText(await readText(checksumFile));
    const expectedHash = checksumText.split(/\s+/)[0] || "";
    const actualHash = await sha256File(selected.file);
    if (
      !/^[a-f0-9]{64}$/i.test(expectedHash) ||
      expectedHash.toLowerCase() !== actualHash.toLowerCase()
    ) {
      state.projectBlockers.push(
        `Runtime hash index R${String(selected.revision).padStart(3, "0")} fails its checksum.`,
      );
      return null;
    }
    const rows = parseCsv(await readText(selected.file));
    const byPath = new Map();
    for (const row of rows) {
      const relativePath = field(row, "relative_path", "relativePath");
      const projectId = field(row, "project_id", "projectId");
      const sha256 = field(row, "sha256").toLowerCase();
      if (
        projectId !== state.projectId ||
        !safeRelativePath(relativePath) ||
        !/^[a-f0-9]{64}$/.test(sha256)
      ) {
        continue;
      }
      if (byPath.has(relativePath)) {
        state.projectBlockers.push(
          `Runtime hash index contains a duplicate path: ${relativePath}`,
        );
        continue;
      }
      byPath.set(relativePath, {
        relativePath,
        sha256,
        sizeBytes: Number(field(row, "size_bytes", "sizeBytes")) || 0,
        mtimeEpoch: Number(field(row, "mtime_epoch", "mtimeEpoch")) || 0,
        scanUtc: field(row, "scan_utc", "scanUtc"),
      });
    }
    return {
      revision: selected.revision,
      relativePath: selected.relativePath,
      sha256: actualHash,
      rows,
      byPath,
    };
  }

  async function verifiedIndexedHash(relativePath, file, digestCache) {
    const entry = state.runtimeIndex?.byPath.get(relativePath);
    if (!entry) {
      return {
        valid: false,
        kind: "MISSING_INDEX",
        relativePath,
        entry: null,
      };
    }
    if (!file) {
      return {
        valid: false,
        kind: "MISSING_FILE",
        relativePath,
        entry,
      };
    }
    if (entry.sizeBytes !== file.size) {
      return {
        valid: false,
        kind: "HASH_MISMATCH",
        relativePath,
        entry,
      };
    }
    const cacheKey = `${relativePath}\u001f${file.size}\u001f${file.lastModified}`;
    if (!digestCache.has(cacheKey)) {
      digestCache.set(cacheKey, sha256File(file));
    }
    const actual = await digestCache.get(cacheKey);
    if (actual.toLowerCase() !== entry.sha256) {
      return {
        valid: false,
        kind: "HASH_MISMATCH",
        relativePath,
        entry,
        actual,
      };
    }
    return {
      ...entry,
      valid: true,
      kind: "VERIFIED",
      actual,
    };
  }

  async function loadLatestPlacementLog() {
    const candidates = [];
    for (const [relativePath, file] of state.fileMap) {
      const match = relativePath.match(
        /^00_SET_DATA\/placement_log_R(\d{3})\.csv$/,
      );
      if (match) {
        candidates.push({
          revision: Number(match[1]),
          relativePath,
          file,
        });
      }
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.revision - a.revision);
    const topRevision = candidates[0].revision;
    if (candidates.filter((item) => item.revision === topRevision).length !== 1) {
      state.projectBlockers.push(
        `Placement log revision R${String(topRevision).padStart(3, "0")} is duplicated.`,
      );
      return null;
    }
    const selected = candidates[0];
    return {
      revision: selected.revision,
      relativePath: selected.relativePath,
      file: selected.file,
      rows: parseCsv(await readText(selected.file)),
    };
  }

  async function loadApprovalEvents() {
    const events = [];
    if (Array.isArray(state.manifest.approvalEvents)) {
      state.manifest.approvalEvents.forEach((event, index) => {
        events.push({
          ...event,
          __sourcePath: "00_SET_DATA/project_manifest.json",
          __sourceRow: index + 1,
        });
      });
    }
    const approvalPaths = [];
    for (const [relativePath] of state.fileMap) {
      if (
        /^04_REVIEW\/.*APPROVAL.*\.csv$/i.test(relativePath) &&
        !/TEMPLATE/i.test(relativePath)
      ) {
        approvalPaths.push(relativePath);
      }
    }
    approvalPaths.sort(naturalCompare);
    for (const path of approvalPaths) {
      const rows = await csvRowsAt(path);
      rows.forEach((event, index) => {
        events.push({
          ...event,
          __sourcePath: path,
          __sourceRow: index + 2,
        });
      });
    }
    const globalIds = new Map();
    for (const event of events) {
      const eventId = field(
        event,
        "approvalEventId",
        "approval_event_id",
      );
      if (!eventId) continue;
      if (globalIds.has(eventId)) {
        state.projectBlockers.push(
          `Approval event ID is reused: ${eventId}.`,
        );
      } else {
        globalIds.set(eventId, event);
      }
    }
    return events;
  }

  function accountable(value) {
    const text = cleanText(value).toUpperCase();
    return (
      text.length >= 2 &&
      !text.includes("REQUIRED") &&
      !text.includes("UNASSIGNED") &&
      !text.includes("UNKNOWN") &&
      text !== "TBD"
    );
  }

  function validPastDate(value) {
    const text = cleanText(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const date = new Date(`${text}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === text &&
      date.getTime() <= Date.now()
    );
  }

  async function verifyApproval(
    events,
    activeVersionId,
    previewHash,
    placementHash,
    digestCache,
  ) {
    const relevant = events.filter(
      (event) =>
        field(event, "entityType", "entity_type") === "ASSET_VERSION" &&
        field(event, "entityId", "entity_id") === activeVersionId,
    );
    if (!relevant.length) {
      return {
        valid: false,
        severity: "warning",
        label: "Exact-version approval missing",
        event: null,
      };
    }
    const byId = new Map();
    for (const event of relevant) {
      const eventId = field(
        event,
        "approvalEventId",
        "approval_event_id",
      );
      if (
        !/^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(eventId) ||
        byId.has(eventId)
      ) {
        return {
          valid: false,
          severity: "blocker",
          label: "Approval events have a missing, unsafe, or duplicate event ID",
          event: null,
        };
      }
      byId.set(eventId, event);
    }
    const superseded = new Set();
    for (const [eventId, event] of byId) {
      const predecessor = field(
        event,
        "supersedesEventId",
        "supersedes_event_id",
      );
      if (!predecessor) continue;
      if (predecessor === eventId || !byId.has(predecessor)) {
        return {
          valid: false,
          severity: "blocker",
          label: "Approval-event supersession chain is broken",
          event,
        };
      }
      superseded.add(predecessor);
    }
    const activeEvents = [...byId.entries()].filter(
      ([eventId]) => !superseded.has(eventId),
    );
    if (activeEvents.length !== 1) {
      return {
        valid: false,
        severity: "blocker",
        label: "Approval-event history has conflicting active decisions",
        event: null,
      };
    }
    const event = activeEvents[0][1];
    if (field(event, "decision") !== "APPROVED_FOR_RELEASE") {
      return {
        valid: false,
        severity: "blocker",
        label: `Current exact-version decision is ${
          field(event, "decision") || "missing"
        }`,
        event,
      };
    }
    const owner = field(event, "owner");
    const role = field(event, "role");
    const date = field(event, "decisionDate", "decision_date");
    const approvedPreviewHash = field(
      event,
      "previewSha256",
      "preview_sha256",
    ).toLowerCase();
    const approvedPlacementHash = field(
      event,
      "placementMasterSha256",
      "placement_master_sha256",
    ).toLowerCase();
    const evidencePath = field(
      event,
      "evidenceReference",
      "evidence_reference",
    );
    const expectedEvidenceHash = field(
      event,
      "evidenceSha256",
      "evidence_sha256",
    ).toLowerCase();
    if (
      !accountable(owner) ||
      !accountable(role) ||
      !validPastDate(date) ||
      !safeRelativePath(evidencePath) ||
      !/^[a-f0-9]{64}$/.test(expectedEvidenceHash) ||
      !/^[a-f0-9]{64}$/.test(approvedPreviewHash) ||
      !/^[a-f0-9]{64}$/.test(approvedPlacementHash)
    ) {
      return {
        valid: false,
        severity: "warning",
        label:
          "Approval owner, role, date, evidence, or approved asset hashes are incomplete",
        event,
      };
    }
    if (
      approvedPreviewHash !== previewHash ||
      approvedPlacementHash !== placementHash
    ) {
      return {
        valid: false,
        severity: "blocker",
        label: "Approval does not bind the current PNG and PSD hashes",
        event,
      };
    }
    const sourcePath = field(event, "__sourcePath");
    if (sourcePath !== "00_SET_DATA/project_manifest.json") {
      const sourceFile = state.fileMap.get(sourcePath);
      const sourceIndex = await verifiedIndexedHash(
        sourcePath,
        sourceFile,
        digestCache,
      );
      if (!sourceIndex.valid) {
        return {
          valid: false,
          severity:
            sourceIndex.kind === "MISSING_INDEX" ? "warning" : "blocker",
          label: "Approval ledger is not current in the runtime hash index",
          event,
        };
      }
    }
    const evidenceFile = state.fileMap.get(evidencePath);
    if (!evidenceFile) {
      return {
        valid: false,
        severity: "warning",
        label: "Approval evidence file is missing",
        event,
      };
    }
    const evidenceIndex = await verifiedIndexedHash(
      evidencePath,
      evidenceFile,
      digestCache,
    );
    if (!evidenceIndex.valid) {
      return {
        valid: false,
        severity:
          evidenceIndex.kind === "MISSING_INDEX" ? "warning" : "blocker",
        label:
          evidenceIndex.kind === "MISSING_INDEX"
            ? "Approval evidence is not in the runtime hash index"
            : "Approval evidence changed after the runtime hash scan",
        event,
      };
    }
    const actualEvidenceHash = evidenceIndex.sha256;
    if (
      !actualEvidenceHash ||
      actualEvidenceHash.toLowerCase() !== expectedEvidenceHash
    ) {
      return {
        valid: false,
        severity: "blocker",
        label: actualEvidenceHash
          ? "Approval evidence hash does not match"
          : "Approval evidence hash is not verified",
        event,
      };
    }
    return {
      valid: true,
      severity: "",
      label: `Approved by ${owner} / ${role} / ${date}`,
      event,
    };
  }

  function safeBasename(value, extension) {
    const text = cleanText(value);
    const suffix = extension ? `\\.${extension}$` : "\\.[A-Za-z0-9]+$";
    return (
      text &&
      text !== "." &&
      text !== ".." &&
      !text.includes("/") &&
      !text.includes("\\") &&
      new RegExp(`^[A-Za-z0-9_-]+${suffix}`, "i").test(text)
    );
  }

  function sidecarDataLooksRelevant(data) {
    return Boolean(
      data &&
        typeof data === "object" &&
        ("asset_slot_id" in data || "assetSlotId" in data) &&
        ("asset_version_id" in data || "assetVersionId" in data),
    );
  }

  async function loadSidecars() {
    const entries = [];
    for (const [relativePath, file] of state.fileMap) {
      if (
        !relativePath.startsWith("02_CROPPED_ASSETS/") ||
        fileExtension(relativePath) !== "json"
      ) {
        continue;
      }
      try {
        const data = JSON.parse(await readText(file));
        if (!sidecarDataLooksRelevant(data)) {
          state.orphans.push({
            path: relativePath,
            reason: "JSON in cropped assets is not a recognized registration sidecar.",
          });
          continue;
        }
        entries.push({
          relativePath,
          directory: dirname(relativePath),
          file,
          data,
        });
      } catch (error) {
        state.orphans.push({
          path: relativePath,
          reason: `Unreadable registration sidecar: ${error.message}`,
        });
      }
    }
    return entries;
  }

  function validateVersionChain(slot, records) {
    const issues = [];
    const slotId = field(slot, "assetSlotId", "asset_slot_id");
    const assetId = field(slot, "assetId", "asset_id");
    const validRecords = [];
    for (const record of records) {
      const data = record.data;
      if (
        field(data, "project_id", "projectId") !== state.projectId ||
        field(data, "asset_slot_id", "assetSlotId") !== slotId ||
        field(data, "asset_id", "assetId") !== assetId
      ) {
        issues.push(`Mismatched project/slot/asset IDs in ${record.relativePath}.`);
        continue;
      }
      if (
        field(data, "placement_rendition_role", "placementRenditionRole") !==
        "PLACEMENT_MASTER"
      ) {
        issues.push(`Non-placement-master sidecar: ${record.relativePath}.`);
      }
      if (field(data, "version_status", "versionStatus") !== "ACTIVE") {
        issues.push(`Non-active asset version: ${record.relativePath}.`);
      }
      validRecords.push(record);
    }
    const byVersion = new Map();
    for (const record of validRecords) {
      const versionId = field(
        record.data,
        "asset_version_id",
        "assetVersionId",
      );
      if (!versionId || byVersion.has(versionId)) {
        issues.push(
          `Duplicate or missing asset version ID in ${record.relativePath}.`,
        );
      } else {
        byVersion.set(versionId, record);
      }
    }
    const superseded = new Set();
    for (const [versionId, record] of byVersion) {
      const predecessor = field(
        record.data,
        "supersedes_asset_version_id",
        "supersedesAssetVersionId",
      );
      if (predecessor) {
        if (predecessor === versionId || !byVersion.has(predecessor)) {
          issues.push(`Broken predecessor chain at ${versionId}.`);
        }
        superseded.add(predecessor);
      }
    }
    const tips = [...byVersion.entries()].filter(
      ([versionId]) => !superseded.has(versionId),
    );
    if (tips.length !== 1) {
      issues.push(
        `Asset version chain has ${tips.length} active tips; exactly one is required.`,
      );
    }
    const active = tips.length === 1 ? tips[0][1] : null;
    if (active) {
      const visited = new Set();
      let cursor = active;
      while (cursor) {
        const versionId = field(
          cursor.data,
          "asset_version_id",
          "assetVersionId",
        );
        if (visited.has(versionId)) {
          issues.push("Asset version chain is cyclic.");
          break;
        }
        visited.add(versionId);
        const predecessor = field(
          cursor.data,
          "supersedes_asset_version_id",
          "supersedesAssetVersionId",
        );
        cursor = predecessor ? byVersion.get(predecessor) : null;
      }
      if (visited.size !== byVersion.size) {
        issues.push("Asset version chain is disconnected.");
      }
    }
    return {
      valid: issues.length === 0 && Boolean(active),
      issues,
      active,
      records: validRecords,
      byVersion,
    };
  }

  async function inspectImage(file) {
    if (!file || !PREVIEW_EXTENSIONS.has(fileExtension(file.name))) {
      return { valid: false, width: 0, height: 0, reason: "Preview format is not browser-decodable." };
    }
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        const result = {
          valid: true,
          width: bitmap.width,
          height: bitmap.height,
          reason: "",
        };
        bitmap.close();
        return result;
      } catch (error) {
        return {
          valid: false,
          width: 0,
          height: 0,
          reason: `Preview cannot be decoded: ${error.message}`,
        };
      }
    }
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        resolve({
          valid: true,
          width: image.naturalWidth,
          height: image.naturalHeight,
          reason: "",
        });
        URL.revokeObjectURL(url);
      };
      image.onerror = () => {
        resolve({
          valid: false,
          width: 0,
          height: 0,
          reason: "Preview cannot be decoded.",
        });
        URL.revokeObjectURL(url);
      };
      image.src = url;
    });
  }

  function cropProfileMatches(slot, dimensions) {
    if (!dimensions.valid) return false;
    const profile = field(slot, "cropProfile", "crop_profile");
    if (profile === "WIDTH_1000PX") return dimensions.width === 1000;
    if (profile === "HEIGHT_1000PX") return dimensions.height === 1000;
    return Math.max(dimensions.width, dimensions.height) === 1000;
  }

  function sourceCandidatesForSlot(slot) {
    const folder = field(slot, "folderRel", "folder_rel");
    const croppedFolder = croppedFolderForSlot(slot);
    const humanLabel = field(slot, "humanLabel", "human_label");
    if (!safeRelativePath(folder) || !humanLabel) return [];
    const expectedSimpleLabel = simpleLabel(humanLabel);
    const candidates = [];
    for (const [relativePath, file] of state.fileMap) {
      const directory = dirname(relativePath);
      const candidateStem = stem(relativePath);
      const labelMatches =
        candidateStem.toLowerCase() === humanLabel.toLowerCase() ||
        (expectedSimpleLabel &&
          simpleLabel(candidateStem) === expectedSimpleLabel);
      if (
        (directory === folder || directory === croppedFolder) &&
        SOURCE_EXTENSIONS.has(fileExtension(relativePath)) &&
        labelMatches
      ) {
        candidates.push({
          relativePath,
          file,
          kind:
            directory === croppedFolder
              ? "EXISTING_CROP"
              : "TEAM_INTAKE_SOURCE",
        });
      }
    }
    return groupLogicalMedia(candidates).sort((a, b) =>
      naturalCompare(a.relativePath, b.relativePath),
    );
  }

  function exactRegistration(
    registrationRows,
    slotId,
    assetId,
    versionId,
    placementFilename,
    previewFilename,
  ) {
    const matches = registrationRows.filter(
      (row) =>
        field(row, "project_id", "projectId") === state.projectId &&
        field(row, "asset_slot_id", "assetSlotId") === slotId &&
        field(row, "asset_id", "assetId") === assetId &&
        field(row, "asset_version_id", "assetVersionId") === versionId &&
        field(row, "status") === "EXPORTED",
    );
    if (matches.length !== 1) {
      return {
        valid: false,
        severity: matches.length ? "blocker" : "warning",
        label: matches.length
          ? "Duplicate registration ledger rows"
          : "Registration ledger row missing",
      };
    }
    const row = matches[0];
    const psdPath = field(row, "psd_path", "psdPath");
    const pngPath = field(row, "png_path", "pngPath");
    if (
      !psdPath ||
      basename(psdPath) !== placementFilename ||
      !pngPath ||
      basename(pngPath) !== previewFilename
    ) {
      return {
        valid: false,
        severity: "blocker",
        label: "Registration ledger filenames do not match the active sidecar",
      };
    }
    return {
      valid: true,
      severity: "",
      label: "Exact export registration found",
      row,
    };
  }

  async function exactPlacement(
    slotId,
    assetId,
    versionId,
    placementFilename,
    sidecarFilename,
    digestCache,
  ) {
    if (!state.latestPlacementLog) {
      return {
        valid: false,
        severity: "blocker",
        label: "No placement log found",
        row: null,
      };
    }
    const placementLogIndex = await verifiedIndexedHash(
      state.latestPlacementLog.relativePath,
      state.latestPlacementLog.file,
      digestCache,
    );
    if (!placementLogIndex.valid) {
      return {
        valid: false,
        severity:
          placementLogIndex?.kind === "MISSING_INDEX"
            ? "warning"
            : "blocker",
        label: "Latest placement log is not current in the runtime hash index",
        row: null,
      };
    }
    const matches = state.latestPlacementLog.rows.filter(
      (row) =>
        field(row, "asset_slot_id", "assetSlotId") === slotId &&
        field(row, "asset_id", "assetId") === assetId,
    );
    if (matches.length !== 1) {
      return {
        valid: false,
        severity: "blocker",
        label: matches.length
          ? "Latest placement log has duplicate rows"
          : "Slot is absent from the latest placement log",
        row: null,
      };
    }
    const row = matches[0];
    const status = field(row, "status");
    const loggedVersion = field(row, "asset_version_id", "assetVersionId");
    const matchedFile = field(row, "matched_file", "matchedFile");
    const matchedSidecar = field(row, "sidecar");
    if (
      !POSITIVE_PLACEMENT_STATES.has(status) ||
      loggedVersion !== versionId ||
      !matchedFile ||
      basename(matchedFile) !== placementFilename ||
      !matchedSidecar ||
      basename(matchedSidecar) !== sidecarFilename
    ) {
      return {
        valid: false,
        severity: "blocker",
        label:
          loggedVersion && loggedVersion !== versionId
            ? `Stale placement log: ${loggedVersion} is reported instead of ${versionId}`
            : `Latest placement evidence is incomplete or ${status || "missing"}`,
        row,
      };
    }
    return {
      valid: true,
      severity: "",
      label: `${status} / R${String(state.latestPlacementLog.revision).padStart(3, "0")}`,
      row,
    };
  }

  function findPreviewAndPlacement(active) {
    const placementFilename = field(
      active.data,
      "placement_filename",
      "placementFilename",
    );
    const previewFilename = field(
      active.data,
      "preview_filename",
      "previewFilename",
    );
    const issues = [];
    if (!safeBasename(placementFilename, "psd")) {
      issues.push("Placement filename is not a safe PSD basename.");
    }
    if (!safeBasename(previewFilename, "png")) {
      issues.push("Preview filename is not a safe PNG basename.");
    }
    const placementPath = joinPath(active.directory, placementFilename);
    const previewPath = joinPath(active.directory, previewFilename);
    if (dirname(placementPath) !== active.directory) {
      issues.push("Placement path escapes the sidecar folder.");
    }
    if (dirname(previewPath) !== active.directory) {
      issues.push("Preview path escapes the sidecar folder.");
    }
    const placementFile = state.fileMap.get(placementPath);
    const previewFile = state.fileMap.get(previewPath);
    if (!placementFile) issues.push("Active layered PSD is missing.");
    if (!previewFile) issues.push("Active PNG preview is missing.");
    return {
      valid: issues.length === 0,
      issues,
      placementFilename,
      previewFilename,
      placementPath,
      previewPath,
      placementFile,
      previewFile,
    };
  }

  async function buildSlotResult(
    slot,
    sidecarsByKey,
    registrationRows,
    approvalEvents,
    digestCache,
  ) {
    const slotId = field(slot, "assetSlotId", "asset_slot_id");
    const assetId = field(slot, "assetId", "asset_id");
    const required = field(slot, "requiredFlag", "required_flag") !== "NO";
    const sourceCandidates = sourceCandidatesForSlot(slot);
    const blockers = [];
    const warnings = [];
    const confirmations = [];
    const records = sidecarsByKey.get(exactKey(slotId, assetId)) || [];
    const chain = validateVersionChain(slot, records);
    let activeVersionId = "";
    let preview = null;
    let placement = { valid: false, label: "Not evaluated", row: null };
    let registration = { valid: false, label: "Not evaluated", row: null };
    let approval = { valid: false, label: "Not evaluated", event: null };
    let hashVerified = false;
    let previewVerified = false;
    let previewUrl = "";
    let activePreviewHash = "";
    let activePlacementHash = "";

    if (!records.length) {
      if (sourceCandidates.length === 1) {
        warnings.push(
          sourceCandidates[0].kind === "EXISTING_CROP"
            ? "Existing cropped PSD found in the correct folder; batch registration is still required."
            : "One exact-folder source image exists; crop and registration are still required.",
        );
      } else if (sourceCandidates.length > 1) {
        blockers.push("Multiple exact-label source candidates require an explicit choice.");
      } else if (required) {
        blockers.push("Required image is missing.");
      } else {
        confirmations.push("Optional slot has no registered crop.");
      }
    } else if (!chain.valid) {
      blockers.push(...chain.issues);
    } else {
      const active = chain.active;
      activeVersionId = field(
        active.data,
        "asset_version_id",
        "assetVersionId",
      );
      preview = findPreviewAndPlacement(active);
      if (!preview.valid) blockers.push(...preview.issues);
      if (preview.previewFile) {
        const dimensions = await inspectImage(preview.previewFile);
        preview.dimensions = dimensions;
        if (!dimensions.valid) {
          blockers.push(dimensions.reason);
        } else if (!cropProfileMatches(slot, dimensions)) {
          blockers.push(
            `Preview is ${dimensions.width}×${dimensions.height}; it does not match ${field(
              slot,
              "cropProfile",
              "crop_profile",
            ) || "the 1000px crop profile"}.`,
          );
        } else {
          previewVerified = true;
          confirmations.push(
            `PNG preview verified at ${dimensions.width}×${dimensions.height}.`,
          );
        }
        previewUrl = objectUrl(preview.previewFile);
      }

      registration = exactRegistration(
        registrationRows,
        slotId,
        assetId,
        activeVersionId,
        preview.placementFilename,
        preview.previewFilename,
      );
      const registrationLedgerIndex = await verifiedIndexedHash(
        "00_SET_DATA/asset_registration.csv",
        state.fileMap.get("00_SET_DATA/asset_registration.csv"),
        digestCache,
      );
      if (registration.valid && !registrationLedgerIndex.valid) {
        registration = {
          ...registration,
          valid: false,
          severity:
            registrationLedgerIndex.kind === "MISSING_INDEX"
              ? "warning"
              : "blocker",
          label:
            "Registration ledger is not current in the runtime hash index",
        };
      }
      if (!registration.valid) {
        (registration.severity === "blocker" ? blockers : warnings).push(
          registration.label,
        );
      } else {
        confirmations.push(registration.label);
      }

      const sidecarIndex = await verifiedIndexedHash(
        active.relativePath,
        active.file,
        digestCache,
      );
      const placementIndex = await verifiedIndexedHash(
        preview.placementPath,
        preview.placementFile,
        digestCache,
      );
      const previewIndex = await verifiedIndexedHash(
        preview.previewPath,
        preview.previewFile,
        digestCache,
      );
      activePlacementHash = placementIndex.valid ? placementIndex.sha256 : "";
      activePreviewHash = previewIndex.valid ? previewIndex.sha256 : "";
      const declaredHash = field(
        active.data,
        "content_sha256",
        "contentSha256",
      ).toLowerCase();
      if (
        declaredHash &&
        placementIndex.valid &&
        declaredHash !== placementIndex.sha256
      ) {
        blockers.push("Declared PSD hash does not match the runtime index.");
      }
      const hashChecks = [sidecarIndex, placementIndex, previewIndex];
      if (hashChecks.every((check) => check.valid)) {
        hashVerified = true;
        confirmations.push(
          `Sidecar, PSD, and PNG verified in runtime hash scan R${String(
            state.runtimeIndex.revision,
          ).padStart(3, "0")}.`,
        );
      } else if (
        hashChecks.some(
          (check) => !check.valid && check.kind !== "MISSING_INDEX",
        )
      ) {
        blockers.push(
          "Runtime hash mismatch: the active sidecar, PSD, or PNG changed after the selected scan.",
        );
      } else {
        warnings.push(
          "Post-export sidecar, PSD, and PNG hashes are not current. Run the Factory scan command.",
        );
      }

      placement = await exactPlacement(
        slotId,
        assetId,
        activeVersionId,
        preview.placementFilename,
        basename(active.relativePath),
        digestCache,
      );
      if (!placement.valid) {
        (placement.severity === "blocker" ? blockers : warnings).push(
          placement.label,
        );
      } else {
        confirmations.push(`Placement log reported ${placement.label}.`);
      }

      approval = await verifyApproval(
        approvalEvents,
        activeVersionId,
        activePreviewHash,
        activePlacementHash,
        digestCache,
      );
      if (!approval.valid) {
        (approval.severity === "blocker" ? blockers : warnings).push(
          approval.label,
        );
      } else {
        confirmations.push(approval.label);
      }
    }

    let status = "REVIEW";
    if (!required && !records.length && !sourceCandidates.length) {
      status = "OPTIONAL";
    } else if (blockers.length) {
      status = "BLOCKED";
    } else if (
      records.length &&
      registration.valid &&
      previewVerified &&
      hashVerified &&
      placement.valid &&
      approval.valid
    ) {
      status = "READY";
    }

    const sourcePreview = sourceCandidates.find(
      (candidate) =>
        candidate.previewFile ||
        PREVIEW_EXTENSIONS.has(fileExtension(candidate.relativePath)),
    );
    return {
      slot,
      slotId,
      assetId,
      required,
      sourceCandidates,
      sourcePreviewUrl:
        !previewUrl && sourcePreview
          ? objectUrl(sourcePreview.previewFile || sourcePreview.file)
          : "",
      records,
      activeVersionId,
      preview,
      previewUrl,
      registration,
      placement,
      approval,
      hashVerified,
      previewVerified,
      status,
      blockers,
      warnings,
      confirmations,
      activePreviewHash,
      activePlacementHash,
    };
  }

  function applyCrossSlotDuplicateRules(results) {
    const byHash = new Map();
    for (const result of results) {
      if (!result.activePreviewHash) continue;
      if (!byHash.has(result.activePreviewHash)) {
        byHash.set(result.activePreviewHash, []);
      }
      byHash.get(result.activePreviewHash).push(result);
    }
    for (const [hash, matches] of byHash) {
      if (matches.length < 2) continue;
      const presentationIds = new Set(
        matches.map((result) =>
          field(result.slot, "presentationId", "presentation_id"),
        ),
      );
      const groupKinds = new Set(
        matches.map((result) => field(result.slot, "groupKind", "group_kind")),
      );
      const isDistinctMemberConflict =
        presentationIds.size < matches.length ||
        [...groupKinds].some((kind) =>
          ["MULTI_VIEW", "PHYSICAL_RUN"].includes(kind),
        );
      for (const result of matches) {
        const shortHash = hash.slice(0, 12);
        if (isDistinctMemberConflict) {
          result.blockers.push(
            `Identical preview bytes (${shortHash}…) satisfy multiple views or physical members.`,
          );
          result.status = "BLOCKED";
        } else {
          result.warnings.push(
            `Preview bytes are reused by ${matches.length} slots (${shortHash}…); reuse approval is not recorded.`,
          );
          if (result.status === "READY") result.status = "REVIEW";
        }
      }
    }
  }

  function applyCrossSlotCandidateRules(results) {
    const byPath = new Map();
    for (const result of results) {
      for (const candidate of result.sourceCandidates) {
        if (!byPath.has(candidate.relativePath)) {
          byPath.set(candidate.relativePath, []);
        }
        byPath.get(candidate.relativePath).push(result);
      }
    }
    for (const [relativePath, matches] of byPath) {
      if (matches.length < 2) continue;
      for (const result of matches) {
        result.blockers.push(
          `The same unregistered file also matches another expected slot: ${relativePath}`,
        );
        result.status = "BLOCKED";
      }
    }
  }

  function collectOrphans(sidecars, results) {
    const expectedKeys = new Set(
      results.map((result) => exactKey(result.slotId, result.assetId)),
    );
    const referencedPaths = new Set();
    const sourcePaths = new Set(
      results.flatMap((result) =>
        result.sourceCandidates.flatMap((candidate) =>
          candidate.paths?.length
            ? candidate.paths
            : [candidate.relativePath],
        ),
      ),
    );
    state.unassignedCrops = [];
    for (const sidecar of sidecars) {
      referencedPaths.add(sidecar.relativePath);
      const placementFilename = field(
        sidecar.data,
        "placement_filename",
        "placementFilename",
      );
      const previewFilename = field(
        sidecar.data,
        "preview_filename",
        "previewFilename",
      );
      if (safeBasename(placementFilename, "psd")) {
        referencedPaths.add(joinPath(sidecar.directory, placementFilename));
      }
      if (safeBasename(previewFilename, "png")) {
        referencedPaths.add(joinPath(sidecar.directory, previewFilename));
      }
      const key = exactKey(
        field(sidecar.data, "asset_slot_id", "assetSlotId"),
        field(sidecar.data, "asset_id", "assetId"),
      );
      if (
        field(sidecar.data, "project_id", "projectId") !== state.projectId ||
        !expectedKeys.has(key)
      ) {
        state.orphans.push({
          path: sidecar.relativePath,
          reason: "Sidecar does not match an expected project/slot/asset key.",
        });
      }
    }
    const unassignedMedia = [];
    for (const [relativePath, file] of state.fileMap) {
      if (
        relativePath.startsWith("02_CROPPED_ASSETS/") &&
        SOURCE_EXTENSIONS.has(fileExtension(relativePath)) &&
        !referencedPaths.has(relativePath) &&
        !sourcePaths.has(relativePath)
      ) {
        unassignedMedia.push({ relativePath, file });
      }
    }
    state.unassignedCrops = groupLogicalMedia(unassignedMedia).map((group) => ({
      path: group.relativePath,
      paths: group.paths,
      reason:
        "Existing crop found, but it is not yet matched to an expected slot and registered.",
    }));
    const unmatchedIntakeMedia = [];
    for (const [relativePath, file] of state.fileMap) {
      if (
        relativePath.startsWith("01_TEAM_INTAKE/") &&
        SOURCE_EXTENSIONS.has(fileExtension(relativePath)) &&
        !sourcePaths.has(relativePath)
      ) {
        unmatchedIntakeMedia.push({ relativePath, file });
      }
    }
    state.orphans.push(
      ...groupLogicalMedia(unmatchedIntakeMedia).map((group) => ({
        path: group.relativePath,
        paths: group.paths,
        reason:
          "Team-intake media does not exactly match an expected label in its assigned folder.",
      })),
    );
    const deduped = new Map();
    for (const orphan of state.orphans) {
      deduped.set(`${orphan.path}\u001f${orphan.reason}`, orphan);
    }
    state.orphans = [...deduped.values()].sort((a, b) =>
      naturalCompare(a.path, b.path),
    );
    const dedupedCrops = new Map();
    for (const crop of state.unassignedCrops) {
      dedupedCrops.set(crop.path, crop);
    }
    state.unassignedCrops = [...dedupedCrops.values()].sort((a, b) =>
      naturalCompare(a.path, b.path),
    );
  }

  function metadataValue(slot, ...names) {
    const value = field(slot, ...names);
    return value || "Unassigned";
  }

  function appendDefinition(list, term, value) {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    wrapper.append(dt, dd);
    list.appendChild(wrapper);
  }

  function proofItem(label, value) {
    const item = document.createElement("div");
    item.className = "qa-proof-item";
    const span = document.createElement("span");
    const strong = document.createElement("strong");
    span.textContent = label;
    strong.textContent = value;
    item.append(span, strong);
    return item;
  }

  function openPreview(result) {
    const url = result.previewUrl || result.sourcePreviewUrl;
    if (!url) return;
    const image = qaDialog.querySelector("[data-qa-dialog-image]");
    const copy = qaDialog.querySelector("[data-qa-dialog-copy]");
    image.src = url;
    image.alt = `${field(result.slot, "humanLabel", "human_label")} visual QA preview`;
    copy.textContent = [
      field(result.slot, "humanLabel", "human_label"),
      field(result.slot, "roomCode", "room_code"),
      field(result.slot, "fixtureCategory", "fixture_category"),
      result.activeVersionId || "SOURCE CANDIDATE / NOT REGISTERED",
      result.preview?.previewPath ||
        result.sourceCandidates[0]?.relativePath ||
        "",
    ]
      .filter(Boolean)
      .join(" / ");
    if (typeof qaDialog.showModal === "function") qaDialog.showModal();
    else qaDialog.setAttribute("open", "");
  }

  function resultCard(result) {
    const slot = result.slot;
    const card = document.createElement("article");
    card.className = "qa-card";
    card.dataset.status = result.status;
    card.dataset.room = field(slot, "roomCode", "room_code");
    card.dataset.category = field(slot, "fixtureCategory", "fixture_category");
    card.dataset.search = [
      field(slot, "humanLabel", "human_label"),
      field(slot, "roomCode", "room_code"),
      field(slot, "zoneName", "zone_name"),
      field(slot, "fixtureCategory", "fixture_category"),
      field(slot, "collectionName", "collection_name"),
      field(slot, "styleFamily", "style_family"),
      field(slot, "placementRole", "placement_role"),
      field(slot, "stockRole", "stock_role"),
      result.activeVersionId,
    ]
      .join(" ")
      .toLowerCase();

    const meta = document.createElement("div");
    meta.className = "qa-card-meta";
    const label = document.createElement("span");
    label.className = "qa-slot-label";
    label.textContent = field(slot, "humanLabel", "human_label");
    const status = document.createElement("span");
    status.className = `qa-status-pill qa-status-${result.status.toLowerCase()}`;
    status.textContent =
      result.status === "READY"
        ? "Matched + approved"
        : result.status === "REVIEW"
          ? "Review required"
          : result.status === "OPTIONAL"
            ? "Optional / not provided"
            : "Blocked";
    const definition = document.createElement("dl");
    definition.className = "qa-meta-list";
    appendDefinition(
      definition,
      "Room / zone",
      `${metadataValue(slot, "roomCode", "room_code")} / ${metadataValue(
        slot,
        "zoneName",
        "zone_name",
      )}`,
    );
    appendDefinition(
      definition,
      "Category",
      metadataValue(slot, "fixtureCategory", "fixture_category"),
    );
    appendDefinition(
      definition,
      "Collection / style",
      `${metadataValue(slot, "collectionName", "collection_name")} / ${metadataValue(
        slot,
        "styleFamily",
        "style_family",
      )}`,
    );
    appendDefinition(
      definition,
      "Placement / stock",
      `${metadataValue(slot, "placementRole", "placement_role")} / ${metadataValue(
        slot,
        "stockRole",
        "stock_role",
      )}`,
    );
    appendDefinition(
      definition,
      "Slot ID",
      result.slotId,
    );
    meta.append(label, status, definition);

    const preview = document.createElement("div");
    preview.className = "qa-card-preview";
    const frame = document.createElement("div");
    frame.className = "qa-preview-frame";
    const previewUrl = result.previewUrl || result.sourcePreviewUrl;
    if (previewUrl) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Open ${label.textContent} preview`);
      const image = document.createElement("img");
      image.loading = "lazy";
      image.src = previewUrl;
      image.alt = `${label.textContent} ${
        result.previewUrl ? "registered crop" : "source candidate"
      }`;
      button.appendChild(image);
      button.addEventListener("click", () => openPreview(result));
      frame.appendChild(button);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "qa-preview-placeholder";
      placeholder.textContent = result.records.length
        ? "A registration exists, but its exact PNG preview is unavailable."
        : result.sourceCandidates[0]?.kind === "EXISTING_CROP"
          ? "Existing cropped PSD found. Register it to create the browser preview."
          : "No exact source candidate or registered PNG preview is available.";
      frame.appendChild(placeholder);
    }
    const caption = document.createElement("div");
    caption.className = "qa-preview-caption";
    const captionTitle = document.createElement("strong");
    const captionPath = document.createElement("span");
    captionTitle.textContent = result.previewUrl
      ? result.preview?.previewFilename || "Registered preview"
      : result.sourcePreviewUrl
        ? "Source candidate / not registered"
        : result.sourceCandidates[0]?.kind === "EXISTING_CROP"
          ? "Existing crop / ready to register"
        : "Preview missing";
    captionPath.textContent =
      result.preview?.previewPath ||
      (result.sourceCandidates[0]?.paths?.length > 1
        ? `${result.sourceCandidates[0].relativePath} (+${
            result.sourceCandidates[0].paths.length - 1
          } companion rendition${
            result.sourceCandidates[0].paths.length === 2 ? "" : "s"
          })`
        : result.sourceCandidates[0]?.relativePath) ||
      "Expected asset has not been received.";
    caption.append(captionTitle, captionPath);
    preview.append(frame, caption);

    const proof = document.createElement("div");
    proof.className = "qa-card-proof";
    const proofGrid = document.createElement("div");
    proofGrid.className = "qa-proof-grid";
    proofGrid.append(
      proofItem(
        "Image found",
        result.sourceCandidates.length === 1
          ? result.sourceCandidates[0].kind === "EXISTING_CROP"
            ? "Existing crop / registration pending"
            : "Source image / crop pending"
          : result.sourceCandidates.length
            ? `${result.sourceCandidates.length} conflicting candidates`
            : "None",
      ),
      proofItem(
        "Registration",
        result.activeVersionId
          ? `${result.registration.label} / ${result.activeVersionId}`
          : "No active registered version",
      ),
      proofItem(
        "Runtime hash",
        result.hashVerified
          ? `PSD + PNG verified / R${String(
              state.runtimeIndex.revision,
            ).padStart(3, "0")}`
          : "Pending or stale",
      ),
      proofItem(
        "Placement",
        result.placement.label,
      ),
      proofItem(
        "Approval",
        result.approval.label,
      ),
      proofItem(
        "Crop profile",
        result.preview?.dimensions?.valid
          ? `${field(slot, "cropProfile", "crop_profile")} / ${
              result.preview.dimensions.width
            }×${result.preview.dimensions.height}`
          : field(slot, "cropProfile", "crop_profile") || "Unassigned",
      ),
    );
    const reasons = document.createElement("ul");
    reasons.className = "qa-reasons";
    const reasonValues = [
      ...result.blockers,
      ...result.warnings,
      ...(result.blockers.length || result.warnings.length
        ? []
        : result.confirmations.slice(0, 3)),
    ];
    for (const reason of reasonValues) {
      const item = document.createElement("li");
      item.textContent = reason;
      reasons.appendChild(item);
    }
    proof.append(proofGrid, reasons);
    card.append(meta, preview, proof);
    return card;
  }

  function updateFilterOptions() {
    const rooms = [
      ...new Set(
        state.results.map((result) =>
          field(result.slot, "roomCode", "room_code"),
        ),
      ),
    ].sort(naturalCompare);
    const categories = [
      ...new Set(
        state.results.map((result) =>
          field(result.slot, "fixtureCategory", "fixture_category"),
        ),
      ),
    ].sort(naturalCompare);
    const roomSelect = document.querySelector('[data-qa-filter="room"]');
    const categorySelect = document.querySelector(
      '[data-qa-filter="category"]',
    );
    roomSelect.replaceChildren(new Option("All rooms", ""));
    categorySelect.replaceChildren(new Option("All categories", ""));
    rooms.forEach((room) => roomSelect.add(new Option(room, room)));
    categories.forEach((category) =>
      categorySelect.add(new Option(category, category)),
    );
  }

  function applyFilters() {
    const room = document.querySelector('[data-qa-filter="room"]').value;
    const category = document.querySelector(
      '[data-qa-filter="category"]',
    ).value;
    const status = document.querySelector('[data-qa-filter="status"]').value;
    const search = document
      .querySelector('[data-qa-filter="search"]')
      .value.trim()
      .toLowerCase();
    let visible = 0;
    for (const card of qaResults.querySelectorAll(".qa-card")) {
      const matches =
        (!room || card.dataset.room === room) &&
        (!category || card.dataset.category === category) &&
        (!status || card.dataset.status === status) &&
        (!search || card.dataset.search.includes(search));
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    if (!visible && state.results.length) {
      qaResults.appendChild(
        emptyMessage(
          "No slots match these filters.",
          "Clear one or more filters to return to the full visual QA list.",
        ),
      );
    } else {
      const empty = qaResults.querySelector(".qa-empty");
      if (empty) empty.remove();
    }
  }

  function renderResults() {
    qaResults.replaceChildren(
      ...state.results
        .slice()
        .sort((a, b) => {
          const priority =
            Number(field(a.slot, "humanGroupNumber", "human_group_number")) -
            Number(field(b.slot, "humanGroupNumber", "human_group_number"));
          return (
            priority ||
            naturalCompare(
              field(a.slot, "humanLabel", "human_label"),
              field(b.slot, "humanLabel", "human_label"),
            )
          );
        })
        .map(resultCard),
    );
    updateFilterOptions();
    applyFilters();
  }

  function visualCountSummary() {
    let foundSlotCoverage = 0;
    const folderCounts = new Map();
    for (const result of state.results) {
      if (result.registration.valid || result.sourceCandidates.length) {
        foundSlotCoverage += 1;
      }
      if (!result.required) continue;
      const folder = croppedFolderForSlot(result.slot);
      if (!folderCounts.has(folder)) {
        folderCounts.set(folder, {
          required: 0,
          slotCoverage: 0,
          unassigned: 0,
        });
      }
      const counts = folderCounts.get(folder);
      counts.required += 1;
      if (result.registration.valid || result.sourceCandidates.length) {
        counts.slotCoverage += 1;
      }
    }
    for (const crop of state.unassignedCrops) {
      const folder = dirname(crop.path);
      if (folderCounts.has(folder)) {
        folderCounts.get(folder).unassigned += 1;
      }
    }
    let minimumStillNeeded = 0;
    for (const counts of folderCounts.values()) {
      minimumStillNeeded += Math.max(
        counts.required - counts.slotCoverage - counts.unassigned,
        0,
      );
    }
    return {
      found: foundSlotCoverage + state.unassignedCrops.length,
      minimumStillNeeded,
    };
  }

  function updateKpis() {
    const registered = state.results.filter(
      (result) => result.registration.valid,
    ).length;
    const summary = visualCountSummary();
    const values = {
      expected: state.results.length,
      found: summary.found,
      unassigned: state.unassignedCrops.length,
      registered,
      placed: state.results.filter((result) => result.placement.valid).length,
      approved: state.results.filter((result) => result.approval.valid).length,
      missing: summary.minimumStillNeeded,
      exceptions: state.orphans.length,
    };
    for (const [name, value] of Object.entries(values)) {
      const element = document.querySelector(`[data-qa-kpi="${name}"]`);
      if (element) element.textContent = String(value);
    }
  }

  function renderOrphans() {
    const panel = document.querySelector("[data-qa-orphan-panel]");
    const count = document.querySelector("[data-qa-orphan-count]");
    const list = document.querySelector("[data-qa-orphan-list]");
    const total = state.unassignedCrops.length + state.orphans.length;
    panel.hidden = total === 0;
    count.textContent = String(total);
    list.replaceChildren();
    if (!total) return;
    if (state.unassignedCrops.length) {
      const heading = document.createElement("strong");
      heading.textContent = `${state.unassignedCrops.length} existing crop${
        state.unassignedCrops.length === 1 ? "" : "s"
      } found and waiting for assignment/registration`;
      const ul = document.createElement("ul");
      for (const crop of state.unassignedCrops) {
        const li = document.createElement("li");
        const companionCount = Math.max((crop.paths?.length || 1) - 1, 0);
        li.textContent = `${crop.path}${
          companionCount
            ? ` (+${companionCount} companion rendition${
                companionCount === 1 ? "" : "s"
              })`
            : ""
        } — ${crop.reason}`;
        ul.appendChild(li);
      }
      list.append(heading, ul);
    }
    if (state.orphans.length) {
      const heading = document.createElement("strong");
      heading.textContent = `${state.orphans.length} file exception${
        state.orphans.length === 1 ? "" : "s"
      } requiring correction`;
      const ul = document.createElement("ul");
      for (const orphan of state.orphans) {
        const li = document.createElement("li");
        const companionCount = Math.max((orphan.paths?.length || 1) - 1, 0);
        li.textContent = `${orphan.path}${
          companionCount
            ? ` (+${companionCount} companion rendition${
                companionCount === 1 ? "" : "s"
              })`
            : ""
        } — ${orphan.reason}`;
        ul.appendChild(li);
      }
      list.append(heading, ul);
    }
  }

  function updateProjectGate() {
    const blocked = state.results.filter(
      (result) => result.status === "BLOCKED",
    ).length;
    const review = state.results.filter(
      (result) => result.status === "REVIEW",
    ).length;
    const ready = state.results.filter(
      (result) => result.status === "READY",
    ).length;
    const optional = state.results.filter(
      (result) => result.status === "OPTIONAL",
    ).length;
    const fileExceptions = state.orphans.length;
    const unassigned = state.unassignedCrops.length;
    const minimumStillNeeded = visualCountSummary().minimumStillNeeded;
    const manifestBlockers = Array.isArray(state.manifest?.qaIssues)
      ? state.manifest.qaIssues.filter(
          (issue) =>
            field(issue, "severity") === "BLOCKER" &&
            field(issue, "status") !== "CLOSED",
        ).length
      : 0;
    const scopeGateNote = manifestBlockers
      ? ` The original project still contains ${manifestBlockers} non-visual blocker${
          manifestBlockers === 1 ? "" : "s"
        }; visual clearance cannot approve tier, capacity, labor, inventory, or publishing authority.`
      : " Visual clearance still does not prove the InDesign document was saved or clear tier, capacity, labor, inventory, and publishing authority.";
    if (
      state.projectBlockers.length ||
      blocked ||
      fileExceptions ||
      unassigned
    ) {
      setGate(
        "blocked",
        "VISUAL GATE BLOCKED",
        unassigned
          ? `${unassigned} existing crop${
              unassigned === 1 ? " was" : "s were"
            } found—not lost.`
          : blocked
          ? `${blocked} slot${blocked === 1 ? "" : "s"} need correction.`
          : fileExceptions
            ? `${fileExceptions} file exception${
                fileExceptions === 1 ? " needs" : "s need"
              } correction.`
            : "Project integrity needs correction.",
        [
          ...state.projectBlockers,
          unassigned
            ? `The files are in the correct project tree, but their simple names are not yet tied to the current expected-slot records. Run the Photoshop batch registrar; it will register safe matches and create a same-folder assignment sheet for every decision it cannot make safely.`
            : "",
          minimumStillNeeded
            ? `${minimumStillNeeded} additional required image${
                minimumStillNeeded === 1 ? " is" : "s are"
              } still needed based on the current slot count.`
            : "",
          blocked
            ? `${blocked} expected slot${
                blocked === 1 ? "" : "s"
              } remain missing, conflicting, stale, or incorrectly placed.`
            : "",
          fileExceptions
            ? `${fileExceptions} duplicate, unreadable, or structurally invalid project file${
                fileExceptions === 1 ? "" : "s"
              } must be resolved.`
            : "",
          scopeGateNote,
        ]
          .filter(Boolean)
          .join(" "),
      );
    } else if (review) {
      setGate(
        "review",
        "VISUAL GATE NEEDS REVIEW",
        `${review} slot${review === 1 ? "" : "s"} still need evidence.`,
        `${ready} slot${ready === 1 ? "" : "s"} are matched and approved. Missing runtime hashes, exact-version approvals, or other evidence keep the remaining slots amber.${scopeGateNote}`,
      );
    } else if (state.results.length) {
      setGate(
        "ready",
        "VISUAL GATE CLEAR",
        "Every provided slot is matched and approved.",
        `All ${ready} provided slot${
          ready === 1 ? "" : "s"
        } ${ready === 1 ? "has" : "have"} an exact active asset, verified PNG and runtime hashes, a current placement-log result, and exact-version approval.${
          optional
            ? ` ${optional} optional slot${optional === 1 ? " is" : "s are"} intentionally empty.`
            : ""
        }${scopeGateNote}`,
      );
    }
  }

  function renderProjectMeta() {
    const project = state.manifest.project || {};
    const template = state.manifest.template || {};
    const placementText = state.latestPlacementLog
      ? `Placement log R${String(state.latestPlacementLog.revision).padStart(
          3,
          "0",
        )}`
      : "No placement log";
    const indexText = state.runtimeIndex
      ? `Runtime hash index R${String(state.runtimeIndex.revision).padStart(
          3,
          "0",
        )}`
      : "No current runtime hash index";
    qaMeta.textContent = [
      state.projectId,
      field(project, "brand"),
      field(project, "prototypeTier", "prototype_tier"),
      field(template, "templateId", "template_id"),
      `${state.results.length} expected slots`,
      state.receiptVerificationMode,
      placementText,
      indexText,
      `${state.imageDocuments.length} InDesign file${
        state.imageDocuments.length === 1 ? "" : "s"
      } found (save state not inspected)`,
    ]
      .filter(Boolean)
      .join(" / ");
    qaMeta.hidden = false;
  }

  async function scanProject(files) {
    resetState({ keepInput: true });
    state.files = Array.from(files || []);
    if (!state.files.length) return;
    qaClear.disabled = false;
    setScanStatus(`Reading ${state.files.length.toLocaleString()} local files...`);
    try {
      mapSelectedFiles(state.files);
      const manifestFile = state.fileMap.get(
        "00_SET_DATA/project_manifest.json",
      );
      state.manifest = await readJson(manifestFile, "Project manifest");
      state.projectId = field(
        state.manifest.project || {},
        "projectId",
        "project_id",
      );
      if (!state.projectId || basename(state.rootPrefix) !== state.projectId) {
        throw new Error(
          "The selected folder name and manifest project ID do not match.",
        );
      }
      const slots = validateExpectedSlots(state.manifest);
      state.manifestReceiptVerified = await verifyOriginalReceipt(manifestFile);
      state.runtimeIndex = await loadRuntimeIndex();
      state.latestPlacementLog = await loadLatestPlacementLog();
      state.imageDocuments = [...state.fileMap.keys()].filter(
        (path) =>
          path.startsWith("03_IND_WORKING/") &&
          fileExtension(path) === "indd",
      );
      const sidecars = await loadSidecars();
      const sidecarsByKey = new Map();
      for (const sidecar of sidecars) {
        const key = exactKey(
          field(sidecar.data, "asset_slot_id", "assetSlotId"),
          field(sidecar.data, "asset_id", "assetId"),
        );
        if (!sidecarsByKey.has(key)) sidecarsByKey.set(key, []);
        sidecarsByKey.get(key).push(sidecar);
      }
      const registrationRows = await csvRowsAt(
        "00_SET_DATA/asset_registration.csv",
      );
      const approvalEvents = await loadApprovalEvents();
      const digestCache = new Map();
      const results = [];
      let completed = 0;
      for (const slot of slots) {
        results.push(
          await buildSlotResult(
            slot,
            sidecarsByKey,
            registrationRows,
            approvalEvents,
            digestCache,
          ),
        );
        completed += 1;
        if (completed % 10 === 0 || completed === slots.length) {
          setScanStatus(
            `Reconciling exact slots... ${completed} of ${slots.length}`,
          );
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      }
      applyCrossSlotCandidateRules(results);
      applyCrossSlotDuplicateRules(results);
      state.results = results;
      collectOrphans(sidecars, results);
      state.scanUtc = new Date().toISOString();
      renderResults();
      renderOrphans();
      updateKpis();
      renderProjectMeta();
      updateProjectGate();
      qaControls.hidden = false;
      setScanStatus(
        `Recheck complete: ${state.results.length} expected slots reconciled from ${state.files.length.toLocaleString()} local files. Nothing was uploaded or changed.`,
      );
    } catch (error) {
      console.error(error);
      state.projectBlockers.push(error.message);
      qaResults.replaceChildren(
        emptyMessage(
          "The recheck stopped.",
          error.message,
        ),
      );
      updateKpis();
      setScanStatus(`BLOCKED: ${error.message}`, true);
      setGate(
        "blocked",
        "VISUAL GATE BLOCKED",
        "The selected folder could not be trusted.",
        error.message,
      );
    }
  }

  function reportRows() {
    return state.results.map((result) => ({
      project_id: state.projectId,
      scan_utc: state.scanUtc,
      human_label: field(result.slot, "humanLabel", "human_label"),
      asset_slot_id: result.slotId,
      asset_id: result.assetId,
      room_code: field(result.slot, "roomCode", "room_code"),
      zone_name: field(result.slot, "zoneName", "zone_name"),
      fixture_category: field(
        result.slot,
        "fixtureCategory",
        "fixture_category",
      ),
      collection_name: field(result.slot, "collectionName", "collection_name"),
      style_family: field(result.slot, "styleFamily", "style_family"),
      required_flag: result.required ? "YES" : "NO",
      status: result.status,
      source_candidate_count: result.sourceCandidates.length,
      active_asset_version_id: result.activeVersionId,
      preview_path: result.preview?.previewPath || "",
      preview_sha256: result.activePreviewHash,
      placement_master_path: result.preview?.placementPath || "",
      placement_master_sha256: result.activePlacementHash,
      registration_valid: result.registration.valid ? "YES" : "NO",
      preview_verified: result.previewVerified ? "YES" : "NO",
      runtime_hash_verified: result.hashVerified ? "YES" : "NO",
      placement_current: result.placement.valid ? "YES" : "NO",
      placement_status: field(result.placement.row || {}, "status"),
      approval_valid: result.approval.valid ? "YES" : "NO",
      approval_owner: field(result.approval.event || {}, "owner"),
      approval_date: field(
        result.approval.event || {},
        "decisionDate",
        "decision_date",
      ),
      blockers: result.blockers.join(" | "),
      warnings: result.warnings.join(" | "),
    }));
  }

  function exportCsv() {
    const rows = reportRows();
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    downloadText(
      csvDocument(headers, rows),
      `${state.projectId}_SET_VISUAL_QA_REPORT.csv`,
      "text/csv;charset=utf-8",
    );
  }

  function exportJson() {
    const summary = visualCountSummary();
    const document = {
      reportVersion: VISUAL_QA_VERSION,
      projectId: state.projectId,
      scanUtc: state.scanUtc,
      manifestReceiptVerified: state.manifestReceiptVerified,
      receiptVerificationMode: state.receiptVerificationMode,
      runtimeIndex: state.runtimeIndex
        ? {
            revision: state.runtimeIndex.revision,
            relativePath: state.runtimeIndex.relativePath,
            sha256: state.runtimeIndex.sha256,
          }
        : null,
      placementLog: state.latestPlacementLog
        ? {
            revision: state.latestPlacementLog.revision,
            relativePath: state.latestPlacementLog.relativePath,
          }
        : null,
      projectBlockers: state.projectBlockers,
      projectWarnings: state.projectWarnings,
      counts: {
        expected: state.results.length,
        imagesFound: summary.found,
        needsAssignment: state.unassignedCrops.length,
        minimumStillNeeded: summary.minimumStillNeeded,
        ready: state.results.filter((result) => result.status === "READY").length,
        review: state.results.filter((result) => result.status === "REVIEW").length,
        blocked: state.results.filter((result) => result.status === "BLOCKED")
          .length,
        optional: state.results.filter((result) => result.status === "OPTIONAL")
          .length,
        fileExceptions: state.orphans.length,
      },
      slots: reportRows(),
      unassignedCrops: state.unassignedCrops,
      fileExceptions: state.orphans,
      truthBoundary:
        "Placement is based on the newest numbered placement log. This report cannot inspect InDesign frame labels or prove the INDD was saved. Visual clearance does not approve tier, capacity, labor, inventory, fleet translation, or publishing authority.",
    };
    downloadText(
      `${JSON.stringify(document, null, 2)}\n`,
      `${state.projectId}_SET_VISUAL_QA_REPORT.json`,
      "application/json;charset=utf-8",
    );
  }

  function exportApprovalTemplate() {
    const rows = state.results
      .filter((result) => result.activeVersionId)
      .map((result) => ({
        approval_event_id: "",
        entity_type: "ASSET_VERSION",
        entity_id: result.activeVersionId,
        decision: "APPROVED_FOR_RELEASE",
        preview_sha256: result.activePreviewHash,
        placement_master_sha256: result.activePlacementHash,
        owner: "",
        role: "",
        decision_date: "",
        evidence_reference: "",
        evidence_sha256: "",
        supersedes_event_id: "",
        notes: `${field(
          result.slot,
          "humanLabel",
          "human_label",
        )} / ${field(result.slot, "roomCode", "room_code")} / ${field(
          result.slot,
          "fixtureCategory",
          "fixture_category",
        )}`,
      }));
    if (!rows.length) {
      setScanStatus(
        "No active registered versions exist, so an approval template cannot be created.",
        true,
      );
      return;
    }
    downloadText(
      csvDocument(Object.keys(rows[0]), rows),
      `${state.projectId}_SET_VISUAL_QA_APPROVALS_TO_COMPLETE.csv`,
      "text/csv;charset=utf-8",
    );
  }

  qaInput.addEventListener("change", (event) => {
    scanProject(event.target.files);
  });

  qaClear.addEventListener("click", () => resetState());

  qaControls.addEventListener("input", (event) => {
    if (event.target.matches("[data-qa-filter]")) applyFilters();
  });

  qaControls.addEventListener("change", (event) => {
    if (event.target.matches("[data-qa-filter]")) applyFilters();
  });

  qaControls.addEventListener("click", (event) => {
    const type = event.target.dataset.qaExport;
    if (type === "csv") exportCsv();
    if (type === "json") exportJson();
    if (type === "approval") exportApprovalTemplate();
  });

  qaDialog
    ?.querySelector("[data-qa-dialog-close]")
    ?.addEventListener("click", () => qaDialog.close());

  qaDialog?.addEventListener("click", (event) => {
    if (event.target === qaDialog) qaDialog.close();
  });

  window.SET_FACTORY_VISUAL_QA_TEST_API = {
    version: VISUAL_QA_VERSION,
    parseCsv,
    scanProject,
    resetState,
    state,
    validateExpectedSlots,
    validateVersionChain,
    safeRelativePath,
    verifiedIndexedHash,
    updateProjectGate,
  };
})();
