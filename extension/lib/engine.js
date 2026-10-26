import { fillForm, navigate, readErrors, runInPage, waitForTabUrl } from "./page.js";

// Finds the system's address from a tab the user already has open and is
// logged in to (adapter.baseUrl returns null for login pages). Returns null
// when there is none.
export async function findBaseUrl(adapter) {
  const tabs = await chrome.tabs.query({ url: adapter.urls });
  return tabs.map((t) => adapter.baseUrl(t.url)).find(Boolean) ?? null;
}

// Enters one record in the tab: opens the system's "new record" form, fills
// in the fields, saves, and waits for the saved record's page.
// parent is { object, id } of the saved record this one belongs to, or null.
// Resolves with { ok, id?, url?, message?, needsLogin? }. needsLogin means the
// system showed its login page instead of the form: nothing was entered, and
// the same record can be tried again once the user has logged in.
export async function enterRecord(adapter, base, tabId, record, parent) {
  await navigate(tabId, adapter.newRecordUrl(base, record.object, parent));

  // Logins can pass through a redirect or two before the form shows.
  const landed = await waitForTabUrl(tabId, (u) => adapter.isLoggedIn(u), { timeout: 5_000 });
  if (!landed) {
    return { ok: false, needsLogin: true, message: `${adapter.label} needs you to log in` };
  }

  const inputs = Object.entries(record.fields).map(([field, value]) => [
    field,
    adapter.inputSelector(record.object, field),
    String(value),
  ]);
  const filled = await runInPage(tabId, fillForm, [inputs, adapter.saveButtonText]);
  if (!filled.ok) return filled;

  const url = await waitForTabUrl(tabId, (u) => adapter.savedRecordId(u) !== null, { timeout: 20_000 });
  if (url) return { ok: true, id: adapter.savedRecordId(url), url };

  const errors = await runInPage(tabId, readErrors, [adapter.errorSelector]);
  return { ok: false, message: errors || `${adapter.label} did not save the record` };
}

// Waits, without a time limit, until the tab is back on a logged-in page of
// the system, e.g. after the user logs in on the login page shown in it.
// Resolves false if signal is aborted (the user stopped the run).
export async function waitForLogin(adapter, tabId, signal) {
  return (await waitForTabUrl(tabId, (u) => adapter.isLoggedIn(u), { signal })) !== null;
}
