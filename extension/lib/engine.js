import { fillForm, navigate, readErrors, runInPage, waitForTabUrl } from "./page.js";

// Finds the system's address from a tab the user already has open and is
// logged in to. Returns null when there is none.
export async function findBaseUrl(adapter) {
  const tabs = await chrome.tabs.query({ url: adapter.urls });
  return tabs.map((t) => adapter.baseUrl(t.url)).find(Boolean) ?? null;
}

// Enters one record in the tab: opens the system's "new record" form, fills
// in the fields, saves, and waits for the saved record's page.
// parent is { object, id } of the saved record this one belongs to, or null.
// Resolves with { ok, id?, url?, message? }.
export async function enterRecord(adapter, base, tabId, record, parent) {
  await navigate(tabId, adapter.newRecordUrl(base, record.object, parent));

  const tab = await chrome.tabs.get(tabId);
  if (!adapter.isLoggedIn(tab.url ?? "", base)) {
    return { ok: false, message: `${adapter.label} asked you to log in again. Log in, then start again.` };
  }

  const inputs = Object.entries(record.fields).map(([field, value]) => [
    field,
    adapter.inputSelector(record.object, field),
    String(value),
  ]);
  const filled = await runInPage(tabId, fillForm, [inputs, adapter.saveButtonText]);
  if (!filled.ok) return filled;

  const url = await waitForTabUrl(tabId, (u) => adapter.savedRecordId(u) !== null, 20_000);
  if (url) return { ok: true, id: adapter.savedRecordId(url), url };

  const errors = await runInPage(tabId, readErrors, [adapter.errorSelector]);
  return { ok: false, message: errors || `${adapter.label} did not save the record` };
}
