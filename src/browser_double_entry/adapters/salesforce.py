from playwright.sync_api import Page

from browser_double_entry.adapters.base import Adapter, Result
from browser_double_entry.input import Record


class SalesforceAdapter(Adapter):
    """Creates records through the Lightning UI of a Salesforce org.

    Expects the browser to already be logged in to the org.
    """

    name = "salesforce"

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url

    def enter(self, page: Page, record: Record) -> Result:
        base = self.base_url or _org_base_url(page.url)
        if not base:
            return Result(record, ok=False, message="no Salesforce tab open; log in first or pass --salesforce-url")

        page.goto(f"{base}/lightning/o/{record.object}/new")
        page.wait_for_load_state("networkidle")

        # TODO: Lightning field labels differ from API names and per org.
        # Map record.fields to the right inputs and fill them, then save.
        for api_name, value in record.fields.items():
            page.locator(f'[name="{api_name}"]').first.fill(str(value))

        page.get_by_role("button", name="Save", exact=True).click()
        page.wait_for_url("**/view", timeout=15_000)
        return Result(record, ok=True, message=page.url)


def _org_base_url(url: str) -> str | None:
    if ".lightning.force.com" in url or ".my.salesforce.com" in url:
        scheme, rest = url.split("://", 1)
        return f"{scheme}://{rest.split('/', 1)[0]}"
    return None
