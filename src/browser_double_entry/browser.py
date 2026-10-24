from contextlib import contextmanager
from typing import Iterator

from playwright.sync_api import Browser, sync_playwright


@contextmanager
def connect(cdp_url: str) -> Iterator[Browser]:
    """Attach to an already running Chrome (started with --remote-debugging-port)."""
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(cdp_url)
        try:
            yield browser
        finally:
            # Disconnects only; the user's Chrome window stays open.
            browser.close()
