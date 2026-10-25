import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

import { readWorkbook } from "../extension/lib/files.js";
import { parseRecords } from "../extension/lib/input.js";
import { parseCsv, parseTable } from "../extension/lib/table.js";

const file = (path) => new URL(`../${path}`, import.meta.url);

// The extension loads SheetJS as a plain script; do the same here.
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(file("extension/vendor/xlsx.mini.min.js"), "utf8"), sandbox);

const expected = parseRecords(readFileSync(file("examples/accounts-contacts.json"), "utf8"));

test("the CSV example gives the same records as the JSON example", () => {
  const rows = parseCsv(readFileSync(file("examples/accounts-contacts.csv"), "utf8"));
  assert.deepEqual(parseTable(rows, "salesforce"), expected);
});

test("the Excel example gives the same records as the JSON example", () => {
  const rows = readWorkbook(readFileSync(file("examples/accounts-contacts.xlsx")), sandbox.XLSX);
  assert.deepEqual(parseTable(rows, "salesforce"), expected);
});

test("the extension's downloadable samples match the examples", () => {
  for (const ext of ["csv", "xlsx"]) {
    assert.deepEqual(readFileSync(file(`extension/sample.${ext}`)), readFileSync(file(`examples/accounts-contacts.${ext}`)), ext);
  }
});

test("rows that repeat the parent's values add to the same parent", () => {
  const records = parseTable(
    [
      ["Account.Name", "Contact.LastName"],
      ["Acme", "One"],
      ["Acme", "Two"],
      ["", ""],
      ["Globex", "Three"],
      ["Acme", "Four"],
    ],
    "salesforce",
  );
  assert.deepEqual(records.map((r) => [r.fields.Name, r.children.map((c) => c.fields.LastName)]), [
    ["Acme", ["One", "Two", "Four"]],
    ["Globex", ["Three"]],
  ]);
});

test("a parent without children, and parent-only files, work", () => {
  const records = parseTable([["Account.Name", "Contact.LastName"], ["Acme", ""], ["Globex", "Kim"]], "s");
  assert.deepEqual(records.map((r) => r.children.length), [0, 1]);
  assert.equal(parseTable([["Account.Name"], ["Acme"]], "s")[0].object, "Account");
});

test("explains spreadsheet mistakes", () => {
  assert.throws(() => parseTable([["Name", "Contact.LastName"]], "s"), /column A "Name" must look like Object\.Field/);
  assert.throws(() => parseTable([["Account.Name", "Contact.LastName", "Case.Subject"]], "s"), /use one parent and at most one child/);
  assert.throws(() => parseTable([["Account.Name", "Contact.LastName"], ["", "Kim"]], "s"), /row 2 has a Contact but no Account above it/);
  assert.throws(() => parseTable([], "s"), /first row must hold the column names/);
});

test("CSV: quotes, commas, line breaks, semicolons and Excel's BOM", () => {
  assert.deepEqual(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\n"two\nlines",\n'), [
    ["a", "b"],
    ["x, y", 'say "hi"'],
    ["two\nlines", ""],
  ]);
  assert.deepEqual(parseCsv("a;b\n1,5;2\n"), [["a", "b"], ["1,5", "2"]]);
});
