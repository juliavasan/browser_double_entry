const SALESFORCE_URLS = ["https://*.lightning.force.com/*", "https://*.my.salesforce.com/*"];

// Lightning names the inputs of compound fields (Name, addresses) differently
// from their API names. Other fields use the API name as the input name.
const INPUT_NAMES = {
  Salutation: "salutation",
  FirstName: "firstName",
  MiddleName: "middleName",
  LastName: "lastName",
  Suffix: "suffix",
};

export class SalesforceAdapter {
  name = "salesforce";

  // Finds the org from a Salesforce tab the user is already logged in to.
  async prepare() {
    const tabs = await chrome.tabs.query({ url: SALESFORCE_URLS });
    this.base = tabs.map((t) => orgBaseUrl(t.url)).find(Boolean);
    if (!this.base) {
      throw new Error("Open Salesforce in this browser and log in, then try again.");
    }
    return this.base;
  }

  async enter(tabId, record) {
    await navigate(tabId, `${this.base}/lightning/o/${record.object}/new`);

    const tab = await chrome.tabs.get(tabId);
    if (!tab.url?.startsWith(this.base)) {
      return { ok: false, message: "Salesforce asked you to log in again. Log in, then start again." };
    }

    const result = await runInPage(tabId, fillForm, [record.fields, INPUT_NAMES, true]);
    if (!result.ok) return result;

    const url = await waitForUrl(tabId, /\/lightning\/r\/.+\/view/, 20_000);
    if (url) return { ok: true, message: url };

    const errors = await runInPage(tabId, readErrors, []);
    return { ok: false, message: errors || "Salesforce did not save the record" };
  }
}

// Lightning can still redirect after the page reports it has loaded, which
// cuts off a script mid-run. Retry a few times in that case.
async function runInPage(tabId, func, args) {
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

export function orgBaseUrl(url) {
  const m = /^(https:\/\/[^/]+\.(?:lightning\.force|my\.salesforce)\.com)\//.exec(url ?? "");
  return m ? m[1] : null;
}

function navigate(tabId, url) {
  return new Promise((resolve, reject) => {
    let sawLoading = false;
    const timer = setTimeout(() => done(new Error("Salesforce page did not load")), 30_000);
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

async function waitForUrl(tabId, pattern, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const tab = await chrome.tabs.get(tabId);
    if (pattern.test(tab.url ?? "")) return tab.url;
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// Runs inside the Salesforce page. It is serialized by executeScript, so it
// must not use anything from outside its own body.
async function fillForm(fields, inputNames, save) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Lightning components may use shadow DOM, so search inside shadow roots too.
  const deepAll = (selector) => {
    const out = [];
    const walk = (root) => {
      out.push(...root.querySelectorAll(selector));
      for (const el of root.querySelectorAll("*")) if (el.shadowRoot) walk(el.shadowRoot);
    };
    walk(document);
    return out;
  };
  const visible = (el) => el.getClientRects().length > 0;
  const findSave = () =>
    deepAll("button").find((b) => b.textContent.trim() === "Save" && visible(b));
  const findInput = (name) =>
    deepAll(`input[name="${name}"], textarea[name="${name}"]`).find(visible);

  const end = Date.now() + 30_000;
  while (!findSave() && Date.now() < end) await sleep(300);
  const saveButton = findSave();
  if (!saveButton) return { ok: false, message: "the New record form did not appear" };

  for (const [apiName, value] of Object.entries(fields)) {
    const input = findInput(inputNames[apiName] ?? apiName);
    if (!input) return { ok: false, message: `no input for field ${apiName}` };
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    input.focus();
    Object.getOwnPropertyDescriptor(proto, "value").set.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    input.blur();
    if (input.value !== String(value)) {
      return { ok: false, message: `field ${apiName} did not accept the value` };
    }
  }

  if (save) saveButton.click();
  return { ok: true };
}

// Runs inside the Salesforce page after a save that did not finish.
function readErrors() {
  const out = [];
  const walk = (root) => {
    out.push(...root.querySelectorAll(".slds-form-element__help, .pageLevelErrors, [role='alert']"));
    for (const el of root.querySelectorAll("*")) if (el.shadowRoot) walk(el.shadowRoot);
  };
  walk(document);
  const texts = out.map((e) => e.textContent.trim()).filter(Boolean);
  return [...new Set(texts)].join("; ").slice(0, 500);
}
