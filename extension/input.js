export class InputError extends Error {}

// Same rules as the Python tool's input.py.
export function parseRecords(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new InputError(`invalid JSON: ${e.message}`);
  }

  const raw = data && typeof data === "object" && !Array.isArray(data) ? data.records : undefined;
  if (!Array.isArray(raw)) {
    throw new InputError("expected an object with a 'records' list");
  }

  return raw.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new InputError(`records[${i}]: expected an object`);
    }
    for (const key of ["system", "object"]) {
      if (typeof item[key] !== "string" || !item[key]) {
        throw new InputError(`records[${i}]: missing '${key}'`);
      }
    }
    const fields = item.fields ?? {};
    if (typeof fields !== "object" || Array.isArray(fields) || fields === null) {
      throw new InputError(`records[${i}]: 'fields' must be an object`);
    }
    return { system: item.system, object: item.object, fields };
  });
}
