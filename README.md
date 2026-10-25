# bulk-entry-extension

An example browser extension that enters many records into a web app from one
JSON file, by filling in and saving the app's own forms the way a person would.

It's meant to be copied and adapted. It comes with a working **Salesforce**
adapter (Accounts, Contacts, and Contacts linked to their Account), and
[ADAPTING.md](ADAPTING.md) shows how to point it at your own system and objects.

```
records.json  →  Bulk Entry (extension)  →  your app's "New" form, once per record  →  results table
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

## Try it with Salesforce

1. Get a free Salesforce Developer Edition at
   [developer.salesforce.com/signup](https://developer.salesforce.com/signup), and log in to it in Chrome.
2. Open `chrome://extensions`, turn on **Developer mode** (top right), click
   **Load unpacked** and choose the `extension` folder.
3. Click the **Bulk Entry** icon in the toolbar (it may be under the puzzle-piece menu).
   A page opens in a new tab.
4. Choose [`examples/accounts-contacts.json`](examples/accounts-contacts.json) and click **Start**.

The extension saves each Account, then opens each of its Contacts' forms with the
Account already filled in. Each record's result appears in the table, with a link
to it, and you can save the results as a file.

After you change any file in `extension/`, click the reload icon on the
extension's card in `chrome://extensions`.

## Input format

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
  app.html, app.js       page to pick a file, run, and show results
  lib/input.js           reads and checks the JSON
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

Add a license before others reuse this. MIT is a common choice for examples.
