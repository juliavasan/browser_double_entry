export class InputError extends Error {}

// Same rules as the Python tool's input.py. A record may have "children":
// records of another object that are linked to it. They use the parent's system.
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
