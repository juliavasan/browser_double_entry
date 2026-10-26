import assert from "node:assert/strict";
import { test } from "node:test";

import { ADAPTERS } from "../extension/adapters/index.js";
import salesforce, { linkField } from "../extension/adapters/salesforce.js";
import template from "../extension/adapters/template.js";

// Every adapter must have these, or the engine fails partway through a run.
const CONTRACT = {
  name: "string",
  label: "string",
  urls: "object",
  baseUrl: "function",
  isLoggedIn: "function",
  newRecordUrl: "function",
  inputSelector: "function",
  saveButtonText: "string",
  savedRecordId: "function",
  errorSelector: "string",
};

for (const adapter of [...Object.values(ADAPTERS), template]) {
  test(`${adapter.name} adapter has every required property`, () => {
    for (const [key, type] of Object.entries(CONTRACT)) {
      assert.equal(typeof adapter[key], type, `${adapter.name}.${key}`);
    }
    assert.ok(adapter.urls.length > 0, `${adapter.name}.urls is empty`);
  });
}

test("registry keys match adapter names", () => {
  for (const [key, adapter] of Object.entries(ADAPTERS)) assert.equal(key, adapter.name);
});

const ORG = "https://acme-dev-ed.develop.lightning.force.com";

const MY_DOMAIN = "https://acme-dev-ed.develop.my.salesforce.com";
const LOGIN_PAGE = `${MY_DOMAIN}/?ec=302&startURL=%2Flightning%2Fo%2FAccount%2Fnew`;

test("salesforce: finds the org only from a logged-in tab", () => {
  assert.equal(salesforce.baseUrl(`${ORG}/lightning/page/home`), ORG);
  assert.equal(salesforce.baseUrl(`${MY_DOMAIN}/lightning/setup/SetupOneHome/home`), MY_DOMAIN);
  assert.equal(salesforce.baseUrl(LOGIN_PAGE), null);
  assert.equal(salesforce.baseUrl("https://login.salesforce.com/"), null);
  assert.equal(salesforce.baseUrl("https://www.linkedin.com/feed/"), null);
});

test("salesforce: tells logged-in pages from the login page", () => {
  assert.ok(salesforce.isLoggedIn(`${ORG}/lightning/o/Contact/new`));
  // A my.salesforce.com address redirects to lightning.force.com: still logged in.
  assert.ok(salesforce.isLoggedIn(`${ORG}/lightning/r/Account/001aj00000ABCDEFGH/view`));
  assert.ok(!salesforce.isLoggedIn(LOGIN_PAGE));
  assert.ok(!salesforce.isLoggedIn("https://login.salesforce.com/"));
  assert.ok(!salesforce.isLoggedIn("about:blank"));
});

test("salesforce: new record form links children to their parent", () => {
  assert.equal(salesforce.newRecordUrl(ORG, "Account", null), `${ORG}/lightning/o/Account/new`);
  assert.equal(
    salesforce.newRecordUrl(ORG, "Contact", { object: "Account", id: "001aj00000ABCDEFGH" }),
    `${ORG}/lightning/o/Contact/new?defaultFieldValues=AccountId=001aj00000ABCDEFGH`,
  );
  assert.equal(linkField("Community__c"), "Community__c");
});

test("salesforce: maps Name fields to Lightning's input names", () => {
  assert.equal(salesforce.inputSelector("Contact", "FirstName"), 'input[name="firstName"], textarea[name="firstName"]');
  assert.equal(salesforce.inputSelector("Contact", "Email"), 'input[name="Email"], textarea[name="Email"]');
});

test("salesforce: reads the saved record's ID", () => {
  assert.equal(salesforce.savedRecordId(`${ORG}/lightning/r/003aj00002XXFgzAAH/view`), "003aj00002XXFgzAAH");
  assert.equal(salesforce.savedRecordId(`${ORG}/lightning/r/Account/001aj00000ABCDEFGH/view`), "001aj00000ABCDEFGH");
  assert.equal(salesforce.savedRecordId(`${ORG}/lightning/o/Contact/new`), null);
});
