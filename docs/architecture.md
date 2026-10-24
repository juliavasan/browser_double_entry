# Architecture

## Goal

People often have to type the same data into several systems by hand. This proof of
concept shows another way: describe the data once in a JSON file, and let a local
Python process enter it into each system through the browser.

Salesforce is the first target system. More will follow.

## Flow

```
┌────────────┐     ┌──────────────────────┐     ┌──────────────────┐     ┌──────────────┐
│ input.json │ ──▶ │ bde (Python process) │ ──▶ │ Chrome over CDP  │ ──▶ │ Salesforce … │
└────────────┘     └──────────┬───────────┘     └──────────────────┘     └──────────────┘
                              │
                              ▼
                        JSON report
```

1. **Load:** `input.py` reads the JSON file and checks every record.
2. **Plan:** `cli.py` makes sure there's an adapter for every `system` named in the
   input. `--dry-run` stops here and prints the plan.
3. **Connect:** `browser.py` attaches to a Chrome the user already started with
   `--remote-debugging-port`. The user logs in to each system in that Chrome
   window, so the tool never handles passwords.
4. **Enter:** each record goes to the adapter for its system, which drives the
   page: it navigates, fills in the fields and saves.
5. **Report:** a JSON list with one entry per record (`ok`, `message`) is printed
   to stdout. The exit code is `0` if every record worked and `1` if any failed.

## Components

| Module | Responsibility |
| --- | --- |
| `cli.py` | Parses arguments, runs the steps above, prints the report |
| `input.py` | `Record` dataclass, JSON loading and validation |
| `browser.py` | Connects to Chrome over CDP (Playwright `connect_over_cdp`) |
| `adapters/base.py` | `Adapter` interface and `Result` |
| `adapters/salesforce.py` | Creates records through the Salesforce Lightning UI |
| `adapters/__init__.py` | Registry that maps a system name to its adapter class |

## Input format

```json
{
  "records": [
    {
      "system": "salesforce",
      "object": "Contact",
      "fields": {"FirstName": "Ada", "LastName": "Lovelace"}
    }
  ]
}
```

- `system`: which adapter handles the record.
- `object`: the kind of record in that system, such as a Salesforce object API name.
- `fields`: the field names and values to enter.

## Adapter contract

```python
class Adapter(ABC):
    name: str
    def enter(self, page: Page, record: Record) -> Result: ...
```

An adapter gets a live Playwright `Page` and a single record, and returns a
`Result`. If an adapter raises an exception, the CLI records it as a failure and
moves on to the next record, so one bad record doesn't stop the run.

To add a system:

1. Create `adapters/<system>.py` with a subclass of `Adapter`.
2. Register it in `ADAPTERS` in `adapters/__init__.py`.
3. Use the new `system` name in the input JSON.

## Why drive the browser instead of calling APIs

- It works the same way a person does, using the access they already have. No API
  keys, connected apps or admin setup are needed, which matters for a POC.
- It's the same approach for every system, including ones that have no API.
- The tradeoff is that UI automation breaks more easily than API calls. Adapters
  should keep selectors in one place and prefer stable hooks such as roles,
  labels and `name` attributes.

## Current limitations

- The Salesforce adapter hasn't been tested against a real org yet. Lightning
  shows field labels that can differ from API names, so the field mapping still
  needs work (see the `TODO` in `salesforce.py`).
- Records are entered one at a time, in a single tab.
- Nothing is rolled back on failure. If a record fails partway through a run, the
  records before it stay saved.
- It runs only on the user's own machine.

## Possible next steps

- Map Salesforce field labels to API names, per org.
- Add a second system's adapter.
- Let one input record go to several systems.
- Save reports to `reports/` with a timestamp, plus screenshots of failures.
