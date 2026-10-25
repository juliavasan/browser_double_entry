import { ADAPTERS } from "./adapters/index.js";
import { enterRecord, findBaseUrl } from "./lib/engine.js";
import { InputError, parseRecords, walk } from "./lib/input.js";

const $ = (id) => document.getElementById(id);

const ui = {
  connection: $("connection"),
  connectionText: $("connection-text"),
  recheck: $("recheck"),
  dropzone: $("dropzone"),
  file: $("file"),
  fileChip: $("file-chip"),
  fileName: $("file-name"),
  fileSize: $("file-size"),
  fileError: $("file-error"),
  reviewCard: $("review-card"),
  counts: $("counts"),
  tbody: document.querySelector("#records tbody"),
  runCard: $("run-card"),
  start: $("start"),
  runReady: $("run-ready"),
  runProgress: $("run-progress"),
  progressText: $("progress-text"),
  progressCount: $("progress-count"),
  progressBar: $("progress-bar"),
  runDone: $("run-done"),
  runError: $("run-error"),
  download: $("download"),
  again: $("again"),
};

let records = [];
let rows = new Map(); // record → its table row
let report = [];
let running = false;

// --- Connection: which Salesforce org the records will go to ---

async function checkConnection() {
  const systems = records.length ? new Set([...walk(records)].map((r) => r.system)) : new Set(["salesforce"]);
  const found = [];
  for (const system of systems) {
    const base = await findBaseUrl(ADAPTERS[system]);
    if (!base) {
      setConnection("missing", `Not connected: open ${ADAPTERS[system].label} in this browser and log in`);
      return false;
    }
    found.push(new URL(base).hostname.split(".")[0]);
  }
  setConnection("ok", `Connected to ${found.join(", ")}`);
  return true;
}

function setConnection(state, text) {
  ui.connection.dataset.state = state;
  ui.connectionText.textContent = text;
  ui.recheck.hidden = state !== "missing";
  updateStart();
}

ui.recheck.addEventListener("click", checkConnection);
// The user may log in in another tab and come back.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !running) checkConnection();
});

// --- Step 1: choose a file ---

ui.file.addEventListener("change", () => loadFile(ui.file.files[0]));

for (const type of ["dragenter", "dragover"]) {
  ui.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    ui.dropzone.classList.add("dragging");
  });
}
for (const type of ["dragleave", "drop"]) {
  ui.dropzone.addEventListener(type, () => ui.dropzone.classList.remove("dragging"));
}
ui.dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  loadFile(e.dataTransfer.files[0]);
});

$("clear-file").addEventListener("click", reset);
ui.again.addEventListener("click", reset);

async function loadFile(file) {
  if (!file) return;
  reset();
  ui.dropzone.hidden = true;
  ui.fileChip.hidden = false;
  ui.fileName.textContent = file.name;
  ui.fileSize.textContent = formatSize(file.size);

  try {
    records = parseRecords(await file.text());
    const unknown = [...new Set([...walk(records)].map((r) => r.system))].filter((s) => !ADAPTERS[s]);
    if (unknown.length) throw new InputError(`this extension can't enter records for: ${unknown.join(", ")}`);
    if (records.length === 0) throw new InputError("the file has no records");
  } catch (e) {
    records = [];
    showMessage(ui.fileError, e instanceof InputError ? `This file can't be used: ${e.message}.` : String(e));
    return;
  }

  renderReview();
  ui.reviewCard.hidden = false;
  ui.runCard.hidden = false;
  await checkConnection();
}

function reset() {
  if (running) return;
  records = [];
  report = [];
  rows = new Map();
  ui.file.value = "";
  ui.dropzone.hidden = false;
  ui.fileChip.hidden = true;
  ui.fileError.hidden = true;
  ui.reviewCard.hidden = true;
  ui.runCard.hidden = true;
  ui.runReady.hidden = false;
  ui.runProgress.hidden = true;
  ui.runDone.hidden = true;
  ui.runError.hidden = true;
  ui.tbody.replaceChildren();
  updateStart();
}

// --- Step 2: review ---

function renderReview() {
  const all = [...walk(records)];
  const byObject = {};
  for (const r of all) byObject[r.object] = (byObject[r.object] ?? 0) + 1;
  ui.counts.replaceChildren(
    ...Object.entries(byObject).map(([object, n]) => {
      const chip = el("span", "count");
      chip.append(el("strong", null, String(n)), ` ${plural(object, n)}`);
      return chip;
    }),
  );

  const addRows = (list, depth) => {
    for (const record of list) {
      const row = ui.tbody.insertRow();
      row.className = depth === 0 ? "account" : "contact";
      row.insertCell().className = "num";
      row.cells[0].textContent = ui.tbody.rows.length;
      const name = row.insertCell();
      name.className = "name";
      name.textContent = recordName(record);
      row.insertCell().append(el("span", "type", record.object));
      const details = row.insertCell();
      details.className = "details";
      details.textContent = recordDetails(record);
      row.insertCell();
      setStatus(row, "ready", "Ready");
      rows.set(record, row);
      addRows(record.children, depth + 1);
    }
  };
  addRows(records, 0);

  ui.start.textContent = `Create ${all.length} ${all.length === 1 ? "record" : "records"} in Salesforce`;
}

// --- Step 3: create ---

ui.start.addEventListener("click", async () => {
  if (!(await checkConnection())) return;

  running = true;
  report = [];
  updateStart();
  ui.runReady.hidden = true;
  ui.runError.hidden = true;
  ui.runProgress.hidden = false;
  $("clear-file").hidden = true;
  const total = rows.size;
  updateProgress(0, total);

  const appTab = await chrome.tabs.getCurrent();
  let workTab;
  try {
    const bases = {};
    for (const system of new Set([...walk(records)].map((r) => r.system))) {
      bases[system] = await findBaseUrl(ADAPTERS[system]);
    }
    workTab = await chrome.tabs.create({ url: "about:blank", active: true });
    await enterAll(records, null, bases, workTab.id, total);
    showSummary();
  } catch (e) {
    showMessage(ui.runError, `The run stopped: ${e.message}`);
    ui.runReady.hidden = false;
  } finally {
    if (workTab) await chrome.tabs.remove(workTab.id).catch(() => {});
    await chrome.tabs.update(appTab.id, { active: true });
    ui.runProgress.hidden = true;
    $("clear-file").hidden = false;
    running = false;
    updateStart();
  }
});

// Enters each record, then its children linked to it. Children of a record
// that was not saved are skipped.
async function enterAll(list, parent, bases, tabId, total) {
  for (const record of list) {
    const row = rows.get(record);
    row.classList.add("current");
    let result;
    if (parent && !parent.id) {
      result = { ok: false, skipped: true, message: `${parent.name} was not saved` };
    } else {
      setStatus(row, "working", "Saving…");
      updateProgress(report.length, total, `Saving ${recordName(record)}`);
      try {
        result = await enterRecord(ADAPTERS[record.system], bases[record.system], tabId, record, parent);
      } catch (e) {
        result = { ok: false, message: e.message };
      }
    }
    row.classList.remove("current");
    showResult(row, result);
    report.push({
      system: record.system,
      object: record.object,
      name: recordName(record),
      parent: parent?.name ?? null,
      ok: result.ok,
      skipped: Boolean(result.skipped),
      url: result.url ?? null,
      message: result.message ?? null,
    });
    updateProgress(report.length, total);
    await enterAll(record.children, { object: record.object, id: result.id, name: recordName(record) }, bases, tabId, total);
  }
}

function showResult(row, result) {
  if (result.ok) {
    setStatus(row, "ok", "Saved");
    const link = el("a", "status-detail", "Open in Salesforce ↗");
    link.href = result.url;
    link.target = "_blank";
    row.cells[4].append(link);
  } else if (result.skipped) {
    setStatus(row, "skip", "Skipped", result.message);
  } else {
    setStatus(row, "fail", "Failed", result.message);
  }
}

function showSummary() {
  const saved = report.filter((r) => r.ok).length;
  const skipped = report.filter((r) => r.skipped).length;
  $("sum-saved").textContent = saved;
  $("sum-failed").textContent = report.length - saved - skipped;
  $("sum-skipped").textContent = skipped;
  ui.runDone.hidden = false;
}

ui.download.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bulk-entry-results-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

// --- Helpers ---

function updateStart() {
  const connected = ui.connection.dataset.state === "ok";
  ui.start.disabled = running || records.length === 0 || !connected;
}

function updateProgress(done, total, text) {
  ui.progressBar.style.width = `${Math.round((done / total) * 100)}%`;
  ui.progressCount.textContent = `${done} of ${total}`;
  if (text) ui.progressText.textContent = text;
}

function setStatus(row, kind, label, detail) {
  const cell = row.cells[4];
  const status = el("span", `status ${kind}`, label);
  cell.replaceChildren(status);
  if (detail) cell.append(el("span", "status-detail", detail));
}

// A readable name for a record. Adjust for your objects' fields.
function recordName(record) {
  const f = record.fields;
  const name = [f.FirstName, f.LastName].filter(Boolean).join(" ");
  return name || f.Name || String(Object.values(f)[0] ?? record.object);
}

// A short summary of the record's other fields, for the review table.
function recordDetails(record) {
  const skip = new Set(["Name", "FirstName", "LastName"]);
  return Object.entries(record.fields)
    .filter(([k, v]) => !skip.has(k) && v !== "" && v != null)
    .slice(0, 2)
    .map(([, v]) => String(v))
    .join(" · ");
}

function plural(word, n) {
  return n === 1 ? word : word.endsWith("s") ? word : `${word}s`;
}

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function showMessage(target, text) {
  target.textContent = text;
  target.hidden = false;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

checkConnection();
