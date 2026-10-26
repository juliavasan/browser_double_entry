# bulk-entry-extension

An example browser extension that enters many records into a web app from one
spreadsheet (Excel or CSV) or JSON file, by filling in and saving the app's own
forms the way a person would.

It's meant to be copied and adapted. It comes with a working **Salesforce**
adapter (Accounts, Contacts, and Contacts linked to their Account), and
[ADAPTING.md](ADAPTING.md) shows how to point it at your own system and objects.

```
spreadsheet  →  Bulk Entry for Salesforce (extension)  →  your app's "New" form, once per record  →  results table
```

## Why an extension

- **Nothing to install but the extension.** No Python, no terminal, no desktop app.
  In a company, IT can review a few small files and install it for users centrally.
- **Uses the user's own login.** It works in the browser session they already
  have open, so it needs no API keys, admin setup or passwords.
- **Works on apps without an API.** If a person can fill in the form, so can the extension.
- **Stays local.** It only has access to the app's own domain, and sends nothing
  anywhere else.

The tradeoff: filling in forms breaks more easily than an API when the app's
screens change, and complex fields (lookups, dropdowns, date pickers) need
extra code. See [Limitations](#limitations).

## Install

To use it without the source code, follow [INSTALL.md](INSTALL.md): download
the zip from the [latest release](https://github.com/juliavasan/bulk-entry-extension/releases/latest)
and add it to Chrome with **Load unpacked**. It isn't in the Chrome Web Store.

To build that zip yourself: `npm run package` (writes `dist/bulk-entry-for-salesforce-v<version>.zip`).

## Try it with Salesforce

1. Get a free Salesforce Developer Edition at
   [developer.salesforce.com/signup](https://developer.salesforce.com/signup), and log in to it in Chrome.
2. Open `chrome://extensions`, turn on **Developer mode** (top right), click
   **Load unpacked** and choose the `extension` folder.
3. Click the **Bulk Entry for Salesforce** icon in the toolbar (it may be under the
   puzzle-piece menu). A page opens in a new tab and shows which org it's connected to.
4. Drop [`examples/accounts-contacts.xlsx`](examples/accounts-contacts.xlsx) on the page (or use
   **Download a sample**), review the records, and click **Create 7 records in Salesforce**.

The extension saves each Account, then opens each of its Contacts' forms with the
Account already filled in. Each record's result appears in the table, with a link
to it, and you can save the results as a file.

After you change any file in `extension/`, click the reload icon on the
extension's card in `chrome://extensions`.

## Input format

### Spreadsheet (Excel or CSV)

One row per Contact. Account columns come first, then Contact columns. Leave the
Account cells empty to add more Contacts to the Account above. Column names are
`Object.Field`, with Salesforce field names. Only the first sheet is read.

| Account.Name | Account.Phone | Contact.FirstName | Contact.LastName |
| --- | --- | --- | --- |
| Northwind Logistics | +1 312 555 0100 | Maria | Gonzalez |
| | | James | Okafor |
| Bluebird Clinics | +1 303 555 0100 | Daniel | Kim |

Examples: [`accounts-contacts.xlsx`](examples/accounts-contacts.xlsx),
[`accounts-contacts.csv`](examples/accounts-contacts.csv). The first object in
the columns is the parent and the second is the child, so the same layout works
for other objects.

### JSON

```json
{
  "records": [
    {
      "system": "salesforce",
      "object": "Account",
      "fields": { "Name": "Northwind Logistics", "Phone": "+1 312 555 0100" },
      "children": [
        { "object": "Contact", "fields": { "FirstName": "Maria", "LastName": "Gonzalez" } }
      ]
    }
  ]
}
```

| Key | Meaning |
| --- | --- |
| `system` | Which adapter enters the record (see `extension/adapters/index.js`) |
| `object` | The kind of record, in the adapter's terms (for Salesforce, the object's API name) |
| `fields` | Field names and values to fill in, in the adapter's terms |
| `children` | Optional. Records linked to this one; they use the parent's `system`. The parent is saved first, and if it fails its children are skipped |

## Project layout

```
extension/
  manifest.json          name, permissions (your app's domain goes here)
  background.js          toolbar icon opens the app page
  app.html, app.css      the page: pick a file, review, run, results
  app.js                 page logic: connection check, review table, run
  sample.*               sample files users can download from the page
  icons/                 toolbar and page icons
  lib/input.js           reads and checks JSON
  lib/table.js           reads spreadsheet rows (and CSV) into the same records
  lib/files.js           picks the reader by file type
  vendor/                SheetJS, for reading Excel files (Apache 2.0)
  lib/engine.js          enters one record: open form, fill, save, confirm
  lib/page.js            generic tab helpers and the in-page form filler
  adapters/index.js      list of systems
  adapters/salesforce.js the Salesforce adapter
  adapters/template.js   starting point for your own system
examples/                sample JSON files
tests/                   run with `npm test` (Node 20+, no dependencies)
docs/architecture.md     how it works
```

## Limitations

- Fills in text inputs and text areas. Lookups, dropdowns, checkboxes and date
  pickers need extra code in `lib/page.js` (see [ADAPTING.md](ADAPTING.md#fields-that-arent-plain-text)).
- One record at a time, in one tab.
- No rollback: records saved before a failure stay saved.
- Chrome and other Chromium browsers (Edge, Brave). Firefox would need small changes.

## License

[MIT](LICENSE). Copy it, change it, use it in your company.
