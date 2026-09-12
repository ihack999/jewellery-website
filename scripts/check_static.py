#!/usr/bin/env python3
"""Offline static-page integrity checks. Run from any working directory."""
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.refs, self.errors = path, set(), [], []
        self.schema, self.schemas = None, 0
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identifier = attrs.get("id")
        if identifier:
            if identifier in self.ids:
                self.errors.append(f"duplicate id: {identifier}")
            self.ids.add(identifier)
        for key in ("href", "src", "poster"):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if attrs.get("srcset") and not attrs["srcset"].startswith("data:"):
            self.refs.extend(part.strip().split()[0] for part in attrs["srcset"].split(",") if part.strip())
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.schema = []

    def handle_data(self, data):
        if self.schema is not None:
            self.schema.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.schema is not None:
            try:
                value = json.loads("".join(self.schema))
                if not isinstance(value, (dict, list)):
                    raise ValueError("expected an object or array")
            except ValueError as error:
                self.errors.append(f"invalid JSON-LD: {error}")
            self.schemas += 1
            self.schema = None


def check(root=ROOT):
    root = root.resolve()
    paths = sorted(path for path in root.rglob("*.html")
                   if not any(part.startswith(".") or part in {"node_modules", "vendor"}
                              for part in path.relative_to(root).parts))
    pages = {path.resolve(): Page(path) for path in paths}
    errors, references = [], 0
    for path, page in pages.items():
        errors.extend(f"{path.relative_to(root)}: {error}" for error in page.errors)
        for ref in page.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            references += 1
            target = ((root / unquote(url.path).lstrip("/")) if url.path.startswith("/")
                      else (path.parent / unquote(url.path)) if url.path else path).resolve()
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                errors.append(f"{path.relative_to(root)}: missing local target {ref}")
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f"{path.relative_to(root)}: missing anchor {ref}")
    for error in errors:
        print(error, file=sys.stderr)
    print(f"{'FAIL' if errors else 'PASS'}: {len(pages)} pages, {references} local references, "
          f"{sum(page.schemas for page in pages.values())} JSON-LD blocks; {len(errors)} errors")
    return bool(errors)


if __name__ == "__main__":
    sys.exit(check())
