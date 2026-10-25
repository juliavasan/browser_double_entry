import { InputError, parseRecords } from "./input.js";
import { parseCsv, parseTable } from "./table.js";

export const ACCEPTED = ".xlsx,.xls,.csv,.json";

// Reads a file the user picked into records. Spreadsheets have no "system"
// column; their records go to defaultSystem.
export async function readRecordsFromFile(file, defaultSystem) {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "json") return parseRecords(await file.text());
  if (ext === "csv") return parseTable(parseCsv(await file.text()), defaultSystem);
  if (ext === "xlsx" || ext === "xls") return parseTable(readWorkbook(await file.arrayBuffer()), defaultSystem);
  throw new InputError("choose an Excel (.xlsx), CSV (.csv) or JSON (.json) file");
}

// Rows of the workbook's first sheet, as the text each cell shows in Excel.
// XLSX is the SheetJS library, loaded by app.html from vendor/.
export function readWorkbook(data, XLSX = globalThis.XLSX) {
  let workbook;
  try {
    workbook = XLSX.read(data, { type: "array" });
  } catch (e) {
    throw new InputError(`the spreadsheet could not be read (${e.message})`);
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new InputError("the spreadsheet has no sheets");
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
}
