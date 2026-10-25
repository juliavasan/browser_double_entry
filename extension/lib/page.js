// Generic helpers for driving a tab. Nothing in this file is specific to one
// system; adapters describe the system, and lib/engine.js uses these helpers.

// Loads url in the tab and resolves once the new page has finished loading.
export function navigate(tabId, url) {
  return new Promise((resolve, reject) => {
    let sawLoading = false;
    const timer = setTimeout(() => done(new Error("the page did not load")), 30_000);
    function onUpdated(id, info) {
      if (id !== tabId) return;
      if (info.status === "loading") sawLoading = true;
      if (info.status === "complete" && sawLoading) done();
    }
    function done(err) {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      err ? reject(err) : resolve();
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.update(tabId, { url }).catch(done);
  });
}

// Resolves with the tab's URL once matches(url) is true, or null after timeout.
export async function waitForTabUrl(tabId, matches, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const tab = await chrome.tabs.get(tabId);
    if (matches(tab.url ?? "")) return tab.url;
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// Runs func(...args) inside the page. Single-page apps can still redirect after
// the page reports it has loaded, which cuts off a script mid-run; retry then.
export async function runInPage(tabId, func, args) {
  for (let attempt = 1; ; attempt++) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
      return result;
    } catch (e) {
      if (attempt >= 3 || !/removed|destroyed|navigat/i.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// --- The functions below run inside the page, not in the extension. ---
// executeScript copies their source into the page, so they must not use
// anything from outside their own body.

// inputs: [[field, cssSelector, value], ...]. Waits for the save button, fills
// each input the way typing would, then clicks save.
export async function fillForm(inputs, saveButtonText) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Many apps build forms from web components with shadow DOM, which a plain
  // querySelector does not see into. Search inside shadow roots too.
  const deepAll = (selector) => {
    const out = [];
    const search = (root) => {
      out.push(...root.querySelectorAll(selector));
      for (const el of root.querySelectorAll("*")) if (el.shadowRoot) search(el.shadowRoot);
    };
    search(document);
    return out;
  };
  const visible = (el) => el.getClientRects().length > 0;
  const findSave = () =>
    deepAll("button").find((b) => b.textContent.trim() === saveButtonText && visible(b));

  const end = Date.now() + 30_000;
  while (!findSave() && Date.now() < end) await sleep(300);
  const saveButton = findSave();
  if (!saveButton) return { ok: false, message: `no "${saveButtonText}" button appeared` };

  for (const [field, selector, value] of inputs) {
    const input = deepAll(selector).find(visible);
    if (!input) return { ok: false, message: `no input for field ${field}` };
    // Set the value through the native setter, then fire the events a keyboard
    // would, so frameworks like React or Lightning notice the change.
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    input.focus();
    Object.getOwnPropertyDescriptor(proto, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    input.blur();
    if (input.value !== value) return { ok: false, message: `field ${field} did not accept the value` };
  }

  saveButton.click();
  return { ok: true };
}

// Collects the text of error messages shown on the page after a failed save.
export function readErrors(selector) {
  const out = [];
  const search = (root) => {
    out.push(...root.querySelectorAll(selector));
    for (const el of root.querySelectorAll("*")) if (el.shadowRoot) search(el.shadowRoot);
  };
  search(document);
  const texts = out.map((e) => e.textContent.trim()).filter(Boolean);
  return [...new Set(texts)].join("; ").slice(0, 500);
}
