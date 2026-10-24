from browser_double_entry.adapters.base import Adapter, Result
from browser_double_entry.adapters.salesforce import SalesforceAdapter

ADAPTERS: dict[str, type[Adapter]] = {
    SalesforceAdapter.name: SalesforceAdapter,
}

__all__ = ["ADAPTERS", "Adapter", "Result"]
