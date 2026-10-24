# browser-double-entry

Proof of concept: stop typing the same data into several systems by hand.

```
input.json  ->  python process  ->  browser (CDP)  ->  Salesforce, ...  ->  report
```

You describe the records once in a JSON file. A local Python process drives a real
Chrome browser over the Chrome DevTools Protocol (CDP), enters the data into each
target system through its adapter, and prints a report of what succeeded and what failed.

The first adapter is **Salesforce**. More will follow.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
playwright install chromium
```

## Usage

1. Start Chrome with remote debugging enabled and log in to Salesforce in that window:

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-port=9222 --user-data-dir="$PWD/browser-profile"
   ```

2. Run the tool:

   ```bash
   bde examples/sample.json --cdp-url http://localhost:9222
   ```

   Add `--dry-run` to validate the input and see the plan without touching the browser.

## Input format

See [`examples/sample.json`](examples/sample.json).

```json
{
  "records": [
    {"system": "salesforce", "object": "Contact", "fields": {"FirstName": "Ada", "LastName": "Lovelace"}}
  ]
}
```

## Layout

```
src/browser_double_entry/
  cli.py              entry point: load JSON, run adapters, print report
  input.py            input loading and validation
  browser.py          connect to Chrome over CDP
  adapters/base.py    adapter interface
  adapters/salesforce.py
```

## Architecture

See [`docs/architecture.md`](docs/architecture.md).

## Adding a system

Subclass `Adapter` in `adapters/`, implement `enter(page, record)`, and register it in
`adapters/__init__.py`.
