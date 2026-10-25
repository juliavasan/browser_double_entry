import json

import pytest

from browser_double_entry.cli import main
from browser_double_entry.input import InputError, load_records


def write(tmp_path, data):
    p = tmp_path / "in.json"
    p.write_text(json.dumps(data))
    return p


def test_load_records(tmp_path):
    p = write(tmp_path, {"records": [{"system": "salesforce", "object": "Contact", "fields": {"LastName": "X"}}]})
    [r] = load_records(p)
    assert (r.system, r.object, r.fields) == ("salesforce", "Contact", {"LastName": "X"})


def test_missing_system(tmp_path):
    with pytest.raises(InputError, match="system"):
        load_records(write(tmp_path, {"records": [{"object": "Contact"}]}))


def test_dry_run(tmp_path, capsys):
    p = write(tmp_path, {"records": [{"system": "salesforce", "object": "Contact", "fields": {}}]})
    assert main([str(p), "--dry-run"]) == 0
    assert "would enter Contact into salesforce" in capsys.readouterr().out


def test_unknown_system(tmp_path):
    p = write(tmp_path, {"records": [{"system": "nope", "object": "X"}]})
    assert main([str(p), "--dry-run"]) == 2


def test_children_inherit_system(tmp_path):
    p = write(tmp_path, {"records": [{"system": "salesforce", "object": "Account", "fields": {"Name": "A"},
                                      "children": [{"object": "Contact", "fields": {"LastName": "B"}}]}]})
    [acct] = load_records(p)
    [contact] = acct.children
    assert (contact.system, contact.object) == ("salesforce", "Contact")


def test_child_missing_object(tmp_path):
    with pytest.raises(InputError, match=r"children\[0\]: missing 'object'"):
        load_records(write(tmp_path, {"records": [{"system": "salesforce", "object": "Account", "children": [{}]}]}))


def test_link_field():
    from browser_double_entry.adapters.salesforce import link_field
    assert link_field("Account") == "AccountId"
    assert link_field("Community__c") == "Community__c"
