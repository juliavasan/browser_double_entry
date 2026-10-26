# Bulk Entry for Salesforce

A Chrome extension that creates many Salesforce Accounts and their Contacts from
one spreadsheet, so nobody has to enter them by hand, one form at a time.

**This is an example project.** It works as is for Accounts and Contacts, and
it's meant to be copied and adapted to other Salesforce objects or to another
web app. See [ADAPTING.md](ADAPTING.md).

## The use case

Someone has a list of companies and the people at each one, say after a trade
show or when onboarding new customers, and has to get it into Salesforce. Doing
that by hand means opening New Account, filling it in, saving, then opening New
Contact for each person and linking them to the right Account, over and over.

With Bulk Entry they put the list in Excel, upload it, and watch the extension
do that same data entry for them:

```
Excel / CSV / JSON  →  Bulk Entry  →  Salesforce's New Account and New Contact forms  →  results
```

- **Uses the person's own login.** No API keys, connected apps or admin setup.
  Records are created with their permissions, and Salesforce's own required
  fields and validation rules apply, as if they typed them.
- **Links each Contact to its Account** automatically.
- **Nothing to install but the extension.** No desktop app or command line.
- **Stays local.** It can only access Salesforce, and sends the data nowhere else.

## What the example shows

How to automate bulk data entry in a web app with a browser extension, by
filling in the app's own forms:

- reading Excel, CSV or JSON files of parent and child records
- opening a form, filling its fields and saving, including in apps built from
  web components with shadow DOM (like Salesforce Lightning)
- telling that a save worked and reading the new record's ID
- linking child records to their parent
- a clean page for the person using it: log in, upload, watch, check results

The Salesforce-specific parts sit in one small adapter file, so the same engine
can work with other apps.

## Install

Follow [INSTALL.md](INSTALL.md): download the zip from the
[latest release](https://github.com/juliavasan/bulk-entry-extension/releases/latest)
and add it to Chrome with **Load unpacked**. It isn't in the Chrome Web Store.

## Use it

1. Log in to Salesforce in Chrome.
2. Click the **Bulk Entry for Salesforce** icon. A page opens and shows which org it's connected to.
3. Download a sample file from the page and replace its rows with your own.
4. Upload the file and click **Create records**. Check the results, with a link to each new record.

Try it in a test or sandbox org first: every row in the file becomes a real record.

## File format

One row per Contact, Account columns first. Leave the Account cells empty to
add more Contacts to the Account above. Column names are `Object.Field`, using
Salesforce field names. Only the first sheet is read.

| Account.Name | Account.Phone | Contact.FirstName | Contact.LastName |
| --- | --- | --- | --- |
| Northwind Logistics | +1 312 555 0100 | Maria | Gonzalez |
| | | James | Okafor |
| Bluebird Clinics | +1 303 555 0100 | Daniel | Kim |

Supported fields: text fields such as `Name`, `AccountNumber`, `Site`, `Phone`,
`Website` on Accounts and `FirstName`, `LastName`, `Email`, `Phone`, `Title` on
Contacts. Dropdown, lookup and date fields aren't supported yet.

The same data in JSON lists each Account's Contacts under `children`:

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

Examples of all three formats are in [`examples/`](examples/).

## Develop

```
extension/
  manifest.json              name and permissions (Salesforce domains only)
  app.html, app.css, app.js  the page: login check, upload, progress, results
  lib/                       generic engine: read files, fill forms, save, link children
  adapters/salesforce.js     everything specific to Salesforce
  adapters/template.js       starting point for another system
  vendor/                    SheetJS, for reading Excel files (Apache 2.0)
  sample.*                   sample files offered on the page
examples/                    the same sample data as Excel, CSV and JSON
tests/                       npm test (Node 20+, no dependencies)
scripts/package.js           npm run package: the zip for a release
docs/architecture.md         how it works
```

To run it from the source: open `chrome://extensions`, turn on **Developer
mode**, click **Load unpacked** and choose the `extension` folder. After a
change, click the reload icon on the extension.

## Limitations

- Text fields only. Dropdowns, lookups, checkboxes and dates need extra code
  (see [ADAPTING.md](ADAPTING.md#fields-that-arent-plain-text)).
- One record at a time, in one tab: fine for tens or hundreds of records, not
  for tens of thousands.
- No rollback: records saved before a failure stay saved.
- Chrome and Edge.

## License

[MIT](LICENSE).
