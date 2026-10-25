import { InputError } from "./input.js";

// Turns a spreadsheet (Excel or CSV) into the same records as a JSON file.
//
// Row 1 holds headers written as Object.Field. The first object is the
// parent, the second (optional) is the child:
//
//   Account.Name        | Account.Phone   | Contact.FirstName | Contact.LastName
//   Northwind Logistics | +1 312 555 0100 | Maria             | Gonzalez
//                       |                 | James             | Okafor
//   Bluebird Clinics    | +1 303 555 0100 | Daniel            | Kim
//
// One row per child. A row with parent cells filled in starts that parent;
// a row with them left empty adds a child to the parent above it. Rows that
// repeat a parent's exact values add to that same parent.
export function parseTable(rows, system) {
  const [header, ...body] = rows;
  if (!header || header.every(isBlank)) throw new InputError("the first row must hold the column names");

  const columns = header.map((h, i) => {
    const text = String(h ?? "").trim();
    if (!text) return null;
    const dot = text.indexOf(".");
    if (dot <= 0 || dot === text.length - 1) {
      throw new InputError(`column ${columnName(i)} "${text}" must look like Object.Field, e.g. Account.Name`);
    }
    return { index: i, object: text.slice(0, dot).trim(), field: text.slice(dot + 1).trim() };
  }).filter(Boolean);

  const objects = [...new Set(columns.map((c) => c.object))];
  if (objects.length > 2) {
    throw new InputError(`found ${objects.length} objects (${objects.join(", ")}); use one parent and at most one child`);
  }
  const [parentObject, childObject] = objects;
  const parentCols = columns.filter((c) => c.object === parentObject);
  const childCols = columns.filter((c) => c.object === childObject);

  const records = [];
  const byValues = new Map();
  let current = null;

  body.forEach((row, i) => {
    const rowNum = i + 2;
    const parentFields = readFields(row, parentCols);
    const childFields = readFields(row, childCols);
    if (!parentFields && !childFields) return;

    if (parentFields) {
      const key = JSON.stringify(parentFields);
      current = byValues.get(key);
      if (!current) {
        current = { system, object: parentObject, fields: parentFields, children: [] };
        byValues.set(key, current);
        records.push(current);
      }
    } else if (!current) {
      throw new InputError(`row ${rowNum} has a ${childObject} but no ${parentObject} above it`);
    }

    if (childFields) {
      current.children.push({ system, object: childObject, fields: childFields, children: [] });
    }
  });

  return records;
}

// Splits CSV text into rows of cells. Handles quoted cells with commas,
// quotes ("") and line breaks, and semicolon-separated files from Excel in
// some locales. Values are kept exactly as written.
export function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const sep = count(firstLine, ";") > count(firstLine, ",") ? ";" : ",";

  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function readFields(row, cols) {
  const fields = {};
  for (const c of cols) {
    const value = row[c.index];
    if (!isBlank(value)) fields[c.field] = String(value).trim();
  }
  return Object.keys(fields).length ? fields : null;
}

function isBlank(v) {
  return v == null || String(v).trim() === "";
}

function count(s, ch) {
  return s.split(ch).length - 1;
}

// 0 → A, 25 → Z, 26 → AA, as in a spreadsheet.
function columnName(i) {
  let name = "";
  for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) name = String.fromCharCode(65 + ((i - 1) % 26)) + name;
  return name;
}
