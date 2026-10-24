from abc import ABC, abstractmethod
from dataclasses import dataclass

from playwright.sync_api import Page

from browser_double_entry.input import Record


@dataclass
class Result:
    record: Record
    ok: bool
    message: str = ""


class Adapter(ABC):
    name: str

    @abstractmethod
    def enter(self, page: Page, record: Record) -> Result:
        """Enter one record into the target system using the given page."""
