# Architecture

## Goal

Show how a browser extension can enter many records into a web app from one
file, by filling in the app's own forms. People type the same kinds of records
in by hand, one form at a time; this does it for them, in their own logged-in
browser session.

## Flow

```
spreadsheet or JSON → app page (app.js) → engine (lib/engine.js) → work tab: "New" form → saved record
                                         ↑ adapter (adapters/<system>.js) says where and how
```

1. **Pick a file.** `lib/files.js` picks the reader by file type: `lib/table.js`
   turns an Excel or CSV sheet into records, and `lib/input.js` reads JSON.
   Every record is checked, children included. The page shows how many records of each object are ready.
2. **Find the system.** For each system in the file, the engine finds a tab the
   user already has open and logged in, and takes the system's address from it.
3. **Enter each record.** In one work tab, for each record:
   1. Open the adapter's `newRecordUrl`. For a child, the parent's ID goes in it.
   2. Check the session didn't expire (`isLoggedIn`).
   3. Run `fillForm` inside the page: wait for the save button, fill each field
      found by `inputSelector`, click save.
   4. Wait until the address shows a saved record (`savedRecordId`). If it
      doesn't, read the page's error messages (`errorSelector`).
4. **Children.** After a record is saved, its children are entered with its ID as
   their parent. If it wasn't saved, they're marked as skipped.
5. **Report.** Each record gets a row with ✓ and a link, ✗ and the reason, or –
   for skipped. The results can be saved as a JSON file.

## Components

| File | Responsibility |
| --- | --- |
| `manifest.json` | Name and permissions: `scripting`, plus the app's domains only |
| `background.js` | Toolbar icon opens the app page in a tab |
| `app.html`, `app.js` | File picker, run, results table, download |
| `lib/input.js` | JSON reading and validation, `walk()` over records and children |
| `lib/table.js` | Spreadsheet rows (`Object.Field` columns, one row per child) into records; CSV parser |
| `lib/files.js` | Chooses the reader by file extension; reads Excel with SheetJS (`vendor/`) |
| `lib/engine.js` | `findBaseUrl()` and `enterRecord()`: one record, start to finish |
| `lib/page.js` | Tab helpers (`navigate`, `waitForTabUrl`, `runInPage`) and in-page functions (`fillForm`, `readErrors`) |
| `adapters/*.js` | One object per system: addresses, selectors, success check |

## Design choices

- **A tab, not a popup.** A popup closes when the run switches to the work tab,
  which would stop the run. The app page stays open in its own tab.
- **No CDP or debugger.** The extension fills fields with a script in the page,
  so it needs no debugging port and shows no "being controlled" warning. The
  cost is that script events aren't "trusted"; plain inputs accept them, but
  some widgets may not. `chrome.debugger` is the fallback for those.
- **Search inside shadow DOM.** Apps built from web components (Salesforce
  Lightning, many design systems) hide inputs inside shadow roots.
- **Native value setter plus events.** Setting `value` directly isn't noticed by
  frameworks like React or Lightning; the native setter followed by `input` and
  `change` events is.
- **Wait for the form, not the network.** Single-page apps keep connections
  open, so "network idle" never comes. The engine waits for the save button.
- **Link children through the address.** Prefilling the parent from the form's
  address avoids lookup fields, the most fragile part of a form.
