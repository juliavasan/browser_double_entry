# Progress

## Phase 1: Python POC (done)

Python command that drives Chrome over CDP. Entered 3 test contacts into Salesforce on 2026-10-25.

- [x] 1. Log in to GitHub from the terminal
- [x] 2. Create the public repo `browser_double_entry`
- [x] 3. Confirm the tool drives the browser over CDP (not the Salesforce API)
- [x] 4. Confirm `juliavasan` is the right GitHub account
- [x] 5. Pick the email for commits
- [x] 6. Get a Salesforce org to test in (Developer Edition)
- [x] 7. Pick the first object and fields: Contact with FirstName, LastName, Email, Phone, Title (`examples/contacts.json`)
- [x] 8. Start Chrome with remote debugging (command in README) and log in to the test org in that window
- [x] 9. Run the dry run: `.venv/bin/bde examples/contacts.json --dry-run`
- [x] 10. Run it for real, `.venv/bin/bde examples/contacts.json`, and share the report

## Phase 2: Chrome extension

Users can't run commands in a terminal, so the tool moves into a Chrome extension. It runs in the user's normal browser and Salesforce login, with no CDP and no debugging port. It uses the same JSON format.

- [ ] 12. Create the extension (Manifest V3), with permission only for the Salesforce domains
- [ ] 13. Popup: choose a JSON file, check it, show how many records are ready
- [ ] 14. Fill in and save the Salesforce Contact form from a page script (port the Python adapter)
- [ ] 15. Show results in the popup with a link to each record, and let the user save them as a file
- [ ] 16. Load it unpacked in Chrome and enter the 3 test contacts
- [ ] 17. Test harder field types: lookup (Account Name), picklist, date
- [ ] 18. Write install and usage steps for users
- [ ] 19. Write security notes for IT review: permissions used, no outside network calls
- [ ] 20. Ask IT how extensions get approved and installed, and whether "Load unpacked" is allowed

## Later

- [ ] 11. Choose the second system to support after Salesforce
