import { ADAPTERS } from "./adapters/index.js";
import { InputError, parseRecords } from "./input.js";

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
    const unknown = [...new Set(records.map((r) => r.system))].filter((s) => !ADAPTERS[s]);
    if (unknown.length) throw new InputError(`no adapter for: ${unknown.join(", ")}`);
  } catch (e) {
    records = [];
    setNote(summary, e instanceof InputError ? `${file.name}: ${e.message}` : String(e), true);
    return;
  }

  const n = total(records);
  setNote(summary, `${n} record${n === 1 ? "" : "s"} ready: ${describe(records)}`);
  startButton.disabled = records.length === 0;
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
    const adapters = {};
    for (const system of new Set(records.map((r) => r.system))) {
      adapters[system] = new ADAPTERS[system]();
      const org = await adapters[system].prepare();
      setNote(status, `Using ${org}`);
    }

    workTab = await chrome.tabs.create({ url: "about:blank", active: true });
    const enterAll = async (list, parent) => {
      for (const record of list) {
        const cell = addRow(record, parent);
        let result;
        if (parent && !parent.id) {
          result = { ok: false, skipped: true, message: `Skipped: ${parent.object} was not saved` };
        } else {
          try {
            result = await adapters[record.system].enter(workTab.id, record, parent);
          } catch (e) {
            result = { ok: false, message: e.message };
          }
        }
        showResult(cell, result);
        report.push({
          system: record.system,
          object: record.object,
          name: recordName(record),
          parent: parent ? parent.name : null,
          ok: result.ok,
          message: result.message,
        });
        await enterAll(record.children, { object: record.object, id: result.id, name: recordName(record) });
      }
    };
    await enterAll(records, null);

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

downloadButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `results-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

function describe(records) {
  const counts = {};
  const count = (list) => {
    for (const r of list) {
      const key = `${r.object} → ${r.system}`;
      counts[key] = (counts[key] ?? 0) + 1;
      count(r.children);
    }
  };
  count(records);
  return Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(", ");
}

function total(list) {
  return list.reduce((n, r) => n + 1 + total(r.children), 0);
}

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
    link.href = result.message;
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
