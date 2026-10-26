# Progress

## Salesforce setup

- [x] 1. Get a Salesforce Developer Edition org and log in to it in Chrome
- [x] 2. Pick the records to create: Accounts and their Contacts (standard objects, no setup)

## Extension

- [x] 3. Create the Chrome extension (Manifest V3), with access to the Salesforce domains only
- [x] 4. Fill in and save Salesforce's New Account and New Contact forms from a page script
- [x] 5. Link each Contact to its Account by opening its form with the Account already filled in
- [x] 6. Skip a Contact whose Account wasn't saved, and say why
- [x] 7. Split a generic engine (`extension/lib/`) from the Salesforce adapter (`extension/adapters/`), with a template for other systems
- [x] 8. Load it unpacked in Chrome and create test Accounts and Contacts

## Files

- [x] 9. Read JSON files of Accounts with their Contacts
- [x] 10. Read Excel and CSV files: one row per Contact, `Object.Field` columns, empty Account cells continue the Account above
- [x] 11. Sample files (Excel, CSV, JSON) in `examples/`, downloadable from the page

## Page

- [x] 12. Steps: log in to Salesforce, prepare your file, upload it, check the results
- [x] 13. Show which org it's connected to, and a "Log in to Salesforce first" prompt when it isn't
- [x] 14. Upload area, records to create, live status per record, progress and results with links
- [x] 15. Clear sample files section, separate from uploading
- [x] 16. Light and dark mode, toolbar icon

## Logins during a run

- [x] 17. Only logged-in Salesforce pages count as connected (fixes every record failing with "log in again")
- [x] 18. If Salesforce asks for a login mid-run, pause on the login page and continue by itself after login
- [x] 19. Stop button to end a run
- [x] 20. Run `bulk-entry-test.xlsx` (5 Accounts, 13 Contacts) against the real org

## Docs and sharing

- [x] 21. README: the use case, that this is an example, file format, limitations
- [x] 22. `ADAPTING.md`: how to adapt it to other objects or apps
- [x] 23. `INSTALL.md` for non-technical users, and `npm run package` for the zip
- [x] 24. MIT license
- [x] 25. GitHub release v0.1.1 with the zip
- [ ] 26. Release the latest page changes (clearer sample files) as v0.1.2
- [ ] 27. Try the install steps on another computer or Chrome profile
- [ ] 28. Record a demo video

## Later

- [ ] 29. Support dropdown, lookup and date fields
- [ ] 30. Security notes for IT review: permissions used, no outside network calls
- [ ] 31. Optional: publish to the Chrome Web Store (one-time $5 fee) for one-click install
- [ ] 32. Add a second example adapter, to show adapting to a different app
