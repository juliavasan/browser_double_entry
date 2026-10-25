// Clicking the toolbar icon opens the app page in a tab. A tab, unlike a popup,
// stays alive while the run switches to the Salesforce tab.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
});
