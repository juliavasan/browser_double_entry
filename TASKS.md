# Progress

## Phase 1: Python POC (done)

Python command that drove Chrome over CDP. Entered 3 test contacts into Salesforce on 2026-10-25. Removed in Phase 4 (still in git history).

- [x] 1. Log in to GitHub from the terminal
- [x] 2. Create the public repo
- [x] 3. Confirm the tool drives the browser over CDP (not the Salesforce API)
- [x] 4. Confirm the GitHub account
- [x] 5. Pick the email for commits
- [x] 6. Get a Salesforce org to test in (Developer Edition)
- [x] 7. Pick the first object and fields: Contact with FirstName, LastName, Email, Phone, Title
- [x] 8. Start Chrome with remote debugging and log in to the test org in that window
- [x] 9. Run the dry run
- [x] 10. Run it for real and share the report

## Phase 2: Chrome extension

Users can't run commands in a terminal, so the tool moved into a Chrome extension. It runs in the user's normal browser and login, with no CDP and no debugging port.

- [x] 12. Create the extension (Manifest V3), with permission only for the Salesforce domains
- [x] 13. App page: choose a JSON file, check it, show how many records are ready
- [x] 14. Fill in and save the Salesforce form from a page script
- [x] 15. Show results with a link to each record, and let the user save them as a file
- [x] 16. Load it unpacked in Chrome and enter test records successfully
- [ ] 17. Test harder field types: lookup, picklist, date
- [x] 18. Write install and usage steps (README)
- [ ] 19. Write security notes for IT review: permissions used, no outside network calls
- [ ] 20. Ask IT how extensions get approved and installed, and whether "Load unpacked" is allowed

## Phase 3: Parent and child records (Account → Contacts)

Enter a company and its people in one go. The JSON nests contacts under their account; the extension saves the account first, then opens each contact's form with the account already filled in.

- [x] 21. Choose the parent–child example: Account → Contacts (standard objects, no setup)
- [x] 22. Add `children` to the JSON format
- [x] 23. Create the sample file `examples/accounts-contacts.json` (2 accounts, 5 contacts)
- [x] 25. Run it with the extension and check each contact is linked to its account

## Phase 4: Clean up as a reusable example

The project's goal is now an example of bulk data entry with a browser extension, which others copy and adapt to their own system and objects.

- [x] 26. Rename: repo `bulk-entry-extension`, extension "Bulk Entry"
- [x] 27. Remove the Python tool and its CDP setup
- [x] 28. Split a generic engine (`extension/lib/`) from per-system adapters (`extension/adapters/`)
- [x] 29. Add `adapters/template.js`, a commented starting point for a new system
- [x] 30. Write `ADAPTING.md`: what to change, and how to find selectors in your own app
- [x] 31. Replace the Python tests with Node tests (`npm test`), including a check that every adapter is complete
- [x] 32. Rename the GitHub repo to `bulk-entry-extension`
- [x] 33. Reload the extension and run `examples/accounts-contacts.json` with the cleaned-up code
- [x] 34. Add a license (MIT)

## Phase 5: Professional interface

- [x] 35. Redesign the page for Salesforce Account + Contact bulk entry: connection status, drag-and-drop file, review table, live progress, results summary, light and dark mode
- [x] 36. Add a toolbar icon and a downloadable sample file

## Phase 6: Excel and CSV files

- [x] 38. Spreadsheet format: `Object.Field` columns, one row per Contact, empty Account cells continue the Account above
- [x] 39. Read CSV (own parser) and Excel (bundled SheetJS, no network)
- [x] 40. Add `examples/accounts-contacts.xlsx` and `.csv`, downloadable from the page
- [x] 41. Simplify the page around spreadsheets: example table and three rules; JSON as an option
- [x] 43. Simplify the page: steps are Prepare your file → Upload it → Check the results; say it's a Salesforce utility and an example project
- [x] 44. Page: just the upload area under the steps, with Excel, CSV and JSON sample files to download (no example table)
- [x] 45. Make logging in to Salesforce step 1, with a "Log in to Salesforce first" prompt when not connected
- [ ] 42. Reload the extension and run `examples/accounts-contacts.xlsx`

## Phase 7: Distribution without the Chrome Web Store

- [x] 46. `npm run package` builds a zip with one `bulk-entry-for-salesforce` folder to load
- [x] 47. Write `INSTALL.md` for non-technical users: download, Load unpacked, use, update, remove, troubleshooting
- [x] 48. Publish GitHub release v0.1.0 with the zip
- [ ] 49. Try the install steps on another computer or Chrome profile
- [ ] 50. Optional: publish to the Chrome Web Store (one-time $5 fee) so users can install with one click

## Phase 8: Handle Salesforce logins during a run

- [x] 51. Fix: every record failed with "log in again", because a login or Setup page on `my.salesforce.com` counted as connected and the redirect to `lightning.force.com` looked like a logout
- [x] 52. If Salesforce asks for a login mid-run, pause on the login page, show it on the page and the toolbar icon, and continue by itself after login
- [x] 53. Add a Stop button to end a run; the rest are marked not created
- [ ] 54. Run `bulk-entry-test.xlsx` (5 Accounts, 13 Contacts) for real
- [ ] 55. Release v0.1.1 with the fix

## Later

- [ ] 11. Add a second example adapter, to show adapting to a different app
