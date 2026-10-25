import argparse
import json
import sys
from pathlib import Path

from browser_double_entry.adapters import ADAPTERS, Result
from browser_double_entry.input import InputError, load_records


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="bde", description=__doc__)
    parser.add_argument("input", type=Path, help="JSON file with records to enter")
    parser.add_argument("--cdp-url", default="http://localhost:9222", help="Chrome remote debugging URL")
    parser.add_argument("--salesforce-url", help="Salesforce org base URL (default: detect from open tab)")
    parser.add_argument("--dry-run", action="store_true", help="validate input and print the plan only")
    args = parser.parse_args(argv)

    try:
        records = load_records(args.input)
    except (InputError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    unknown = sorted({r.system for r in records} - ADAPTERS.keys())
    if unknown:
        print(f"error: no adapter for: {', '.join(unknown)}", file=sys.stderr)
        return 2

    if args.dry_run:
        for r in records:
            print(f"would enter {r.object} into {r.system}: {r.fields}")
        return 0

    from browser_double_entry.browser import connect

    adapters = {"salesforce": ADAPTERS["salesforce"](base_url=args.salesforce_url)}
    results: list[Result] = []
    with connect(args.cdp_url) as browser:
        context = browser.contexts[0] if browser.contexts else browser.new_context()
        # Work in a new tab so the user's open tabs are left alone.
        page = context.new_page()
        for r in records:
            try:
                results.append(adapters[r.system].enter(page, r))
            except Exception as e:  # report and keep going with the next record
                results.append(Result(r, ok=False, message=str(e)))

    report = [
        {"system": res.record.system, "object": res.record.object, "ok": res.ok, "message": res.message}
        for res in results
    ]
    print(json.dumps(report, indent=2))
    return 0 if all(res.ok for res in results) else 1
