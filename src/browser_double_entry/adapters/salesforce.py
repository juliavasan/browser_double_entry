from playwright.sync_api import Page

import re

from browser_double_entry.adapters.base import Adapter, Parent, Result
from browser_double_entry.input import Record

# Lightning names the inputs of compound fields (Name, addresses) differently
# from their API names. Other fields use the API name as the input name.
INPUT_NAMES = {
    "Salutation": "salutation",
    "FirstName": "firstName",
    "MiddleName": "middleName",
    "LastName": "lastName",
    "Suffix": "suffix",
}

RECORD_URL = re.compile(r"/lightning/r/(?:\w+/)?([a-zA-Z0-9]{15,18})/view")


class SalesforceAdapter(Adapter):
    """Creates records through the Lightning UI of a Salesforce org.

    Expects the browser to already be logged in to the org.
    """

    name = "salesforce"

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url

    def enter(self, page: Page, record: Record, parent: Parent | None = None) -> Result:
        base = self.base_url or next(
            (b for p in page.context.pages if (b := _org_base_url(p.url))), None
        )
        if not base:
            return Result(record, ok=False, message="no Salesforce tab open; log in first or pass --salesforce-url")

        # Lightning keeps connections open, so wait for the form, not for the network.
        url = f"{base}/lightning/o/{record.object}/new"
        if parent:
            # Opens the form with the link to the parent already filled in.
            url += f"?defaultFieldValues={link_field(parent.object)}={parent.id}"
        page.goto(url, wait_until="domcontentloaded")
        save = page.get_by_role("button", name="Save", exact=True)
        save.wait_for(timeout=30_000)

        for api_name, value in record.fields.items():
            field = page.locator(f'[name="{INPUT_NAMES.get(api_name, api_name)}"]')
            if field.count() == 0:
                return Result(record, ok=False, message=f"no input for field {api_name}")
            field.first.fill(str(value))

        save.click()
        page.wait_for_url(RECORD_URL, timeout=15_000)
        return Result(record, ok=True, message=page.url, id=RECORD_URL.search(page.url).group(1))


def link_field(parent_object: str) -> str:
    """The child's field that points at its parent: AccountId for Account."""
    return parent_object if parent_object.endswith("__c") else f"{parent_object}Id"


def _org_base_url(url: str) -> str | None:
    if ".lightning.force.com" in url or ".my.salesforce.com" in url:
        scheme, rest = url.split("://", 1)
        return f"{scheme}://{rest.split('/', 1)[0]}"
    return None
