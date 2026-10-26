// Template for a new system. To use it:
//
//   1. Copy this file to adapters/<your-system>.js.
//   2. Replace every TODO with what your system does. The values below are
//      made up for an app at https://app.example.com.
//   3. Register it in adapters/index.js.
//   4. Add your system's address to host_permissions in manifest.json.
//
// To find what to put here, open your system's "new record" form in Chrome,
// right-click a field and choose Inspect. See ADAPTING.md for a walkthrough.

export default {
  // TODO: the name used in the JSON "system" field.
  name: "example",
  // TODO: the name shown to users in messages.
  label: "Example App",

  // TODO: which tabs belong to this system. Must match host_permissions in
  // manifest.json. Chrome match patterns: https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
  urls: ["https://app.example.com/*"],

  // TODO: the part of a tab's URL that stays the same for every page, or null
  // if this tab is not a logged-in page of your system.
  baseUrl(tabUrl) {
    return this.isLoggedIn(tabUrl) ? new URL(tabUrl).origin : null;
  },

  // TODO: true for a page you only see when logged in, false for the login
  // page. If the session expires mid-run, the run pauses until this is true.
  isLoggedIn(tabUrl) {
    return tabUrl.startsWith("https://app.example.com/") && !tabUrl.includes("/login");
  },

  // TODO: the address of an empty "new record" form for this object. For a
  // child record, parent is { object, id } of its saved parent; link to it
  // here if your system can prefill a field from the address. If it can't,
  // see "Linking children" in ADAPTING.md.
  newRecordUrl(base, object, parent) {
    const url = `${base}/${object.toLowerCase()}s/new`;
    return parent ? `${url}?${parent.object.toLowerCase()}_id=${parent.id}` : url;
  },

  // TODO: a CSS selector for the input of a field. The field names in your
  // JSON can be anything this function understands.
  inputSelector(object, field) {
    return `[name="${field}"]`;
  },

  // TODO: the exact text on the button that saves the form.
  saveButtonText: "Save",

  // TODO: the new record's ID once the tab shows a saved record, else null.
  // This is how the extension knows the save worked.
  savedRecordId(tabUrl) {
    return /\/\w+s\/(\d+)$/.exec(tabUrl)?.[1] ?? null;
  },

  // TODO: a CSS selector for the error messages shown when a save fails.
  errorSelector: ".error, [role='alert']",
};
