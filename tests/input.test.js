import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parseRecords, walk } from "../extension/lib/input.js";

const parse = (data) => parseRecords(JSON.stringify(data));

test("reads the example files", () => {
  for (const file of ["accounts-contacts.json"]) {
    const records = parseRecords(readFileSync(new URL(`../examples/${file}`, import.meta.url), "utf8"));
    assert.ok(records.length > 0, file);
  }
});

test("children use their parent's system", () => {
  const [account] = parse({
    records: [{ system: "salesforce", object: "Account", fields: { Name: "A" }, children: [{ object: "Contact" }] }],
  });
  assert.deepEqual(account.children[0], { system: "salesforce", object: "Contact", fields: {}, children: [] });
});

test("walk lists parents before their children", () => {
  const records = parse({
    records: [{ system: "s", object: "A", children: [{ object: "B", children: [{ object: "C" }] }] }, { system: "s", object: "D" }],
  });
  assert.deepEqual([...walk(records)].map((r) => r.object), ["A", "B", "C", "D"]);
});

test("rejects bad input with the path to the problem", () => {
  const cases = [
    ["not json", /invalid JSON/],
    ["{}", /'records' list/],
    [JSON.stringify({ records: [{ object: "Contact" }] }), /records\[0\]: missing 'system'/],
    [JSON.stringify({ records: [{ system: "s", object: "A", fields: [] }] }), /'fields' must be an object/],
    [JSON.stringify({ records: [{ system: "s", object: "A", children: {} }] }), /'children' must be a list/],
    [JSON.stringify({ records: [{ system: "s", object: "A", children: [{}] }] }), /records\[0\]\.children\[0\]: missing 'object'/],
  ];
  for (const [text, message] of cases) assert.throws(() => parseRecords(text), message);
});

test("the extension's downloadable sample matches examples/accounts-contacts.json", () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  assert.equal(read("../extension/sample.json"), read("../examples/accounts-contacts.json"));
});
