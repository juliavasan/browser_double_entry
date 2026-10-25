export class InputError extends Error {}

// Reads the JSON file the user picked:
//
//   { "records": [ { "system": "...", "object": "...", "fields": {...}, "children": [...] } ] }
//
// "children" are records of another object linked to their parent, such as an
// Account's Contacts. They use the parent's system, so they only need "object".
export function parseRecords(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new InputError(`invalid JSON: ${e.message}`);
  }

  const raw = isObject(data) ? data.records : undefined;
  if (!Array.isArray(raw)) {
    throw new InputError("expected an object with a 'records' list");
  }
  return raw.map((item, i) => parseRecord(item, `records[${i}]`, null));
}

// Every record in the file, children included, parents before their children.
export function* walk(records) {
  for (const r of records) {
    yield r;
    yield* walk(r.children);
  }
}

function parseRecord(item, path, system) {
  if (!isObject(item)) throw new InputError(`${path}: expected an object`);
  const keys = system ? ["object"] : ["system", "object"];
  for (const key of keys) {
    if (typeof item[key] !== "string" || !item[key]) {
      throw new InputError(`${path}: missing '${key}'`);
    }
  }
  const fields = item.fields ?? {};
  if (!isObject(fields)) throw new InputError(`${path}: 'fields' must be an object`);
  const children = item.children ?? [];
  if (!Array.isArray(children)) throw new InputError(`${path}: 'children' must be a list`);

  const sys = system ?? item.system;
  return {
    system: sys,
    object: item.object,
    fields,
    children: children.map((c, j) => parseRecord(c, `${path}.children[${j}]`, sys)),
  };
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
