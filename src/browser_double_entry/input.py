import json
from dataclasses import dataclass, field
from pathlib import Path


class InputError(ValueError):
    pass


@dataclass
class Record:
    system: str
    object: str
    fields: dict[str, object] = field(default_factory=dict)


def load_records(path: Path) -> list[Record]:
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        raise InputError(f"{path}: invalid JSON: {e}") from e

    raw = data.get("records") if isinstance(data, dict) else None
    if not isinstance(raw, list):
        raise InputError(f"{path}: expected an object with a 'records' list")

    records = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            raise InputError(f"records[{i}]: expected an object")
        for key in ("system", "object"):
            if not isinstance(item.get(key), str) or not item[key]:
                raise InputError(f"records[{i}]: missing '{key}'")
        fields = item.get("fields", {})
        if not isinstance(fields, dict):
            raise InputError(f"records[{i}]: 'fields' must be an object")
        records.append(Record(system=item["system"], object=item["object"], fields=fields))
    return records
