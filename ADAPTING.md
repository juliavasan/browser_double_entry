# Adapting it to your system

The extension has two parts:

- **The engine** (`extension/lib/`, `app.js`) reads the JSON, opens forms, fills
  them in, saves, links children to parents and reports results. You shouldn't
  need to change it.
- **An adapter** (`extension/adapters/<system>.js`) describes one system: where
  its forms are, how to find each field, and how to tell a save worked.

To support a new system or new objects, you write an adapter. Most adapters are
about 40 lines.

## What to change

| # | File | What to change |
| --- | --- | --- |
| 1 | `extension/adapters/<your-system>.js` | Copy `template.js` and fill in each `TODO` (details below) |
| 2 | `extension/adapters/index.js` | Import your adapter and add it to `ADAPTERS` |
| 3 | `extension/manifest.json` | Put your system's address in `host_permissions`, matching the adapter's `urls` |
| 4 | Your JSON file | Use your adapter's `name` as `system`, and your objects and fields |
| 5 | `extension/app.html`, `manifest.json` | The page text, name and description are written for Salesforce Accounts and Contacts: change them to describe your system and objects |
| 6 | `extension/sample.json`, `icons/` | Replace the downloadable sample file with one for your objects, and optionally the icon |
| 7 | `extension/app.js`, `recordName()` and `recordDetails()` | Optional: which fields name and describe a record in the review table |

Only adding objects or fields to a system that already has an adapter, such as
more Salesforce objects? Usually only step 4 changes. Fields whose form input is
named differently from the field go in the adapter's input-name list (for
Salesforce, `INPUT_NAMES`).

## Finding what to put in the adapter

Open your system in Chrome, log in, and open the form for creating a new record.
Then work out each property:

| Property | Question to answer | How to find it |
| --- | --- | --- |
| `urls` | Which addresses are your system? | The address bar. Use a [match pattern](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns), e.g. `https://app.example.com/*` |
| `baseUrl` | Which part of the address stays the same on every page? | The address bar, usually `https://` plus the domain |
| `newRecordUrl` | Which address opens an empty form for an object? | Open the form, copy the address. If the form only opens from a button (no address of its own), see [below](#forms-without-their-own-address) |
| `inputSelector` | How do you find each field's input? | Right-click the field → **Inspect**. Look for a `name`, `id`, `aria-label` or `data-*` attribute that names the field |
| `saveButtonText` | What does the save button say? | The text on the button, exactly, e.g. `Save` or `Create` |
| `savedRecordId` | How do you know the save worked, and what's the new record's ID? | Save a record by hand and look at the address. It usually changes to the new record's page, with its ID in it |
| `isLoggedIn` | What does the address look like when the session has expired? | Log out, open the form's address, see where it sends you |
| `errorSelector` | Where do error messages appear? | Save a form with a required field empty, then Inspect the error |

Test with one record before running a whole file. If something fails, the
results table says which step and which field.

## Linking children

When a record has `children`, the engine saves the parent first and reads its ID
with `savedRecordId`. It then calls `newRecordUrl(base, childObject, parent)`
for each child, where `parent` is `{ object, id }`.

The simplest way to link a child is to put the parent's ID in the form's address,
if your system supports that. Salesforce does, with
`?defaultFieldValues=AccountId=<id>`. Many apps open a child form prefilled from
the parent's page, so check the address of the parent's "New child" button.

If your system can't do that, the child has a lookup field to fill in instead,
which needs custom code: see the next section.

## Fields that aren't plain text

`fillForm` in `lib/page.js` handles text inputs and text areas. Other kinds of
fields need a few more steps, which you'd add there:

| Field | What a person does | What the code has to do |
| --- | --- | --- |
| Dropdown (`<select>`) | Picks an option | Set `value` to the option's value, fire `change` |
| Custom dropdown (picklist) | Clicks it, clicks an option | Click the field, wait for the option list, click the option by its text |
| Lookup | Types a name, picks from suggestions | Type the text, wait for suggestions, click the matching one |
| Checkbox | Clicks it | Click it if its state differs from the value |
| Date picker | Types or picks a date | Usually typing in the app's date format works; else click through the picker |

A tidy way to add these: let `inputSelector` return a field type as well as a
selector, and branch on the type in `fillForm`.

## Forms without their own address

Some apps open the "new" form as a dialog from a button, with no address of its
own. Then `newRecordUrl` returns the address of the list page, and `fillForm`
first clicks the "New" button. Add a `newButtonText` property to your adapter
and pass it through `lib/engine.js` to `fillForm`.

## Checking your adapter

`npm test` (Node 20+) checks that every adapter in `ADAPTERS` has all the
properties the engine needs. Add tests for your own `baseUrl`, `newRecordUrl`
and `savedRecordId` to `tests/adapters.test.js`, the same way the Salesforce ones
are tested.
