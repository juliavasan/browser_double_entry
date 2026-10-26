# Install Bulk Entry for Salesforce

Bulk Entry for Salesforce creates many Salesforce Accounts and their Contacts
from one spreadsheet, so you don't have to enter them by hand. It's a Chrome
extension. It isn't in the Chrome Web Store, so you install it from a file.
This takes about 2 minutes, once.

**You need:** Google Chrome or Microsoft Edge, and a Salesforce login.

> On a company computer, your IT team may have turned off installing
> extensions this way. If you can't find **Developer mode** in step 2, ask IT.

## 1. Download it

1. Go to the [latest release](https://github.com/juliavasan/bulk-entry-extension/releases/latest).
2. Under **Assets**, click **bulk-entry-for-salesforce-v….zip**.
3. Unzip it: double-click the file on a Mac, or right-click → **Extract All** on Windows.
4. Move the **bulk-entry-for-salesforce** folder somewhere it can stay, such as
   your Documents folder.

Keep the folder. Chrome runs the extension from it, so if you delete or move
the folder, the extension stops working.

## 2. Add it to Chrome

1. Open Chrome, type `chrome://extensions` in the address bar and press Enter.
2. Turn on **Developer mode** (switch at the top right).
3. Click **Load unpacked** (top left).
4. Choose the **bulk-entry-for-salesforce** folder and click **Select**.
5. Click the puzzle-piece icon in Chrome's toolbar, and click the pin next to
   **Bulk Entry for Salesforce** so its icon stays in the toolbar.

**In Microsoft Edge:** open `edge://extensions`, turn on **Developer mode** in
the left sidebar, then click **Load unpacked** and choose the same folder.

## 3. Use it

1. Log in to Salesforce in Chrome, as usual.
2. Click the **Bulk Entry for Salesforce** icon in the toolbar. A page opens in
   a new tab, and the badge at the top turns green when it finds Salesforce.
3. Download a sample file from the page (Excel, CSV or JSON), replace the
   sample rows with your own Accounts and Contacts, and save it.
4. Drop your file on the page and click **Create records**. You can watch each
   record being saved in Salesforce, then check the results.

Try it with the sample file in a test or sandbox org first: every row in the
file is created as a real record.

## Update to a new version

1. Download and unzip the new version, as in step 1.
2. Replace the old **bulk-entry-for-salesforce** folder with the new one.
3. Open `chrome://extensions` and click the reload icon (↻) on
   **Bulk Entry for Salesforce**.

## Remove it

Open `chrome://extensions`, click **Remove** on **Bulk Entry for Salesforce**,
then delete the folder. You can turn **Developer mode** off again afterwards.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| No **Developer mode** switch, or it's greyed out | Your company has turned it off. Ask IT to install the extension for you |
| "Manifest file is missing or unreadable" | You chose the wrong folder. Choose the folder that has `manifest.json` directly inside it |
| The extension disappeared, or shows an error after a restart | The folder was moved or deleted. Put it back, or load it again from its new place |
| Chrome shows a "Disable developer mode extensions" message | That's Chrome's standard warning for extensions installed this way. Close it to keep using the extension |
| The page says **Not connected to Salesforce** | Log in to Salesforce in this browser, then come back to the page or click **Check again** |
| The run says **Paused: Salesforce needs you to log in again** | Your Salesforce session expired. Log in on the login page in the Salesforce tab: the run continues by itself from the same record. Or click **Stop** |
| A row says **Failed** | The message next to it says why, for example a required field is empty. Fix that row in your file, and upload a file with just the rows that failed |

## Is it safe?

The extension can only open Salesforce pages, and only works while you're
logged in. Your file is read in your browser and sent nowhere else: the
records go into Salesforce through its normal forms, as if you typed them. The
code is open on [GitHub](https://github.com/juliavasan/bulk-entry-extension).
