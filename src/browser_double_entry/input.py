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
    # Records of another object linked to this one. They use the parent's system.
    children: list["Record"] = field(default_factory=list)


def load_records(path: Path) -> list[Record]:
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        raise InputError(f"{path}: invalid JSON: {e}") from e

    raw = data.get("records") if isinstance(data, dict) else None
    if not isinstance(raw, list):
        raise InputError(f"{path}: expected an object with a 'records' list")
    return [_parse(item, f"records[{i}]", None) for i, item in enumerate(raw)]


def _parse(item: object, path: str, system: str | None) -> Record:
    if not isinstance(item, dict):
        raise InputError(f"{path}: expected an object")
    for key in ("object",) if system else ("system", "object"):
        if not isinstance(item.get(key), str) or not item[key]:
            raise InputError(f"{path}: missing '{key}'")
    fields = item.get("fields", {})
    if not isinstance(fields, dict):
        raise InputError(f"{path}: 'fields' must be an object")
    children = item.get("children", [])
    if not isinstance(children, list):
        raise InputError(f"{path}: 'children' must be a list")

    sys = system or item["system"]
    return Record(
        system=sys,
        object=item["object"],
        fields=fields,
        children=[_parse(c, f"{path}.children[{j}]", sys) for j, c in enumerate(children)],
    )
