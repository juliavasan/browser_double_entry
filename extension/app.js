import { ADAPTERS } from "./adapters/index.js";
import { enterRecord, findBaseUrl } from "./lib/engine.js";
import { InputError, parseRecords, walk } from "./lib/input.js";

const fileInput = document.getElementById("file");
const summary = document.getElementById("summary");
const startButton = document.getElementById("start");
const status = document.getElementById("status");
const table = document.getElementById("results");
const tbody = table.querySelector("tbody");
const downloadButton = document.getElementById("download");

let records = [];
let report = [];

fileInput.addEventListener("change", async () => {
  records = [];
  startButton.disabled = true;
  setNote(summary, "");
  const file = fileInput.files[0];
  if (!file) return;

  try {
    records = parseRecords(await file.text());
    const unknown = [...new Set([...walk(records)].map((r) => r.system))].filter((s) => !ADAPTERS[s]);
    if (unknown.length) throw new InputError(`no adapter for: ${unknown.join(", ")}`);
  } catch (e) {
    records = [];
    setNote(summary, e instanceof InputError ? `${file.name}: ${e.message}` : String(e), true);
    return;
  }

  const all = [...walk(records)];
  setNote(summary, `${all.length} record${all.length === 1 ? "" : "s"} ready: ${describe(all)}`);
  startButton.disabled = all.length === 0;
});

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  fileInput.disabled = true;
  downloadButton.hidden = true;
  report = [];
  tbody.replaceChildren();
  table.hidden = false;

  const appTab = await chrome.tabs.getCurrent();
  let workTab;
  try {
    // Each system's address comes from a tab the user is already logged in to.
    const bases = {};
    for (const system of new Set([...walk(records)].map((r) => r.system))) {
      const adapter = ADAPTERS[system];
      bases[system] = await findBaseUrl(adapter);
      if (!bases[system]) throw new Error(`Open ${adapter.label} in this browser and log in, then try again.`);
    }
    setNote(status, `Using ${Object.values(bases).join(", ")}`);

    // One work tab for the whole run, so the user can watch the forms fill.
    workTab = await chrome.tabs.create({ url: "about:blank", active: true });
    await enterAll(records, null, bases, workTab.id);

    const saved = report.filter((r) => r.ok).length;
    setNote(status, `Done: ${saved} of ${report.length} saved.`, saved < report.length);
    downloadButton.hidden = false;
  } catch (e) {
    setNote(status, e.message, true);
  } finally {
    if (workTab) await chrome.tabs.remove(workTab.id).catch(() => {});
    await chrome.tabs.update(appTab.id, { active: true });
    fileInput.disabled = false;
    startButton.disabled = records.length === 0;
  }
});

// Enters each record, then its children linked to it. Children of a record
// that was not saved are skipped.
async function enterAll(list, parent, bases, tabId) {
  for (const record of list) {
    const cell = addRow(record, parent);
    let result;
    if (parent && !parent.id) {
      result = { ok: false, skipped: true, message: `Skipped: ${parent.name} was not saved` };
    } else {
      try {
        result = await enterRecord(ADAPTERS[record.system], bases[record.system], tabId, record, parent);
      } catch (e) {
        result = { ok: false, message: e.message };
      }
    }
    showResult(cell, result);
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
    await enterAll(record.children, { object: record.object, id: result.id, name: recordName(record) }, bases, tabId);
  }
}

downloadButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `results-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

function describe(all) {
  const counts = {};
  for (const r of all) {
    const key = `${r.object} → ${r.system}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(", ");
}

// A readable name for the results table. Adjust for your objects' fields.
function recordName(record) {
  const f = record.fields;
  const name = [f.FirstName, f.LastName].filter(Boolean).join(" ");
  return name || f.Name || Object.values(f)[0] || record.object;
}

function addRow(record, parent) {
  const row = tbody.insertRow();
  const name = parent ? `↳ ${recordName(record)}` : recordName(record);
  for (const text of [tbody.rows.length, name, `${record.object} · ${record.system}`]) {
    row.insertCell().textContent = text;
  }
  if (parent) row.classList.add("child");
  const cell = row.insertCell();
  cell.textContent = "Working…";
  return cell;
}

function showResult(cell, result) {
  cell.className = result.ok ? "ok" : result.skipped ? "skip" : "fail";
  cell.replaceChildren();
  if (result.ok) {
    const link = document.createElement("a");
    link.href = result.url;
    link.target = "_blank";
    link.textContent = "Saved, open record";
    cell.append("✓ ", link);
  } else {
    cell.textContent = result.skipped ? `– ${result.message}` : `✗ ${result.message}`;
  }
}

function setNote(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle("error", isError);
}
