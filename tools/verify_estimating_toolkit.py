#!/usr/bin/env python3
"""Static QA for Adam Knight's curated construction estimating toolkit."""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_CATEGORIES = {"drawing-takeoff", "bim-qto", "rates-estimating", "contract-controls", "automation"}
VALID_MODES = {"Browser", "Desktop", "Self-hosted", "Python", "Add-on"}
VALID_LICENSES = {"Apache-2.0", "AGPL-3.0", "MIT", "GPL-3.0", "LGPL-3.0", "LGPL-2.1", "LGPL-3.0 (Ifc5D)"}


def verify():
    data = json.loads((ROOT / "assets" / "estimating-resources.json").read_text(encoding="utf-8"))
    page = (ROOT / "estimating-tools.html").read_text(encoding="utf-8")
    script = (ROOT / "estimating-tools.js").read_text(encoding="utf-8")
    css = (ROOT / "estimating-tools.css").read_text(encoding="utf-8")
    home = (ROOT / "index.html").read_text(encoding="utf-8")

    resources = data["resources"]
    assert len(resources) == 16, "Expected 16 checked starter resources"
    assert len({r["id"] for r in resources}) == len(resources), "Duplicate resource IDs"
    assert len({r["source"] for r in resources}) == len(resources), "Duplicate upstream repositories"
    assert set(c["id"] for c in data["categories"]) == EXPECTED_CATEGORIES, "Changed categories"
    assert data["checkedOn"] == "2026-10-09", "Research date changed without review"
    assert data["attribution"] and data["methodology"], "Original author / verification disclaimer missing"
    assert sum(bool(r["featured"]) for r in resources) >= 3, "Featured first-step options missing"
    for r in resources:
        assert r["category"] in EXPECTED_CATEGORIES, r
        assert r["mode"] in VALID_MODES, r
        assert r["license"] in VALID_LICENSES, r
        assert isinstance(r["tags"], list) and r["tags"], r
        assert r["name"] and r["summary"] and r["caution"], r
        src = urlparse(r["source"])
        assert (src.scheme, src.netloc) == ("https", "github.com"), f"Source not on GitHub: {src}"
        assert len(src.path.strip("/").split("/")) == 2, f"Not a canonical repository: {src}"
        if r.get("demo"):
            demo = urlparse(r["demo"])
            assert demo.scheme == "https" and demo.netloc, "Demo URL must use HTTPS"
        assert "OPL-1" not in r["license"] and "NC" not in r["license"], "Restricted source incorrectly listed as open source"

    for anchor in ('id="qs-grid"', 'id="qs-categories"', 'id="qs-query"',
                   'id="qs-deployment"', 'id="qs-result-count"', 'id="qs-empty"'):
        assert anchor in page, f"Missing interactive component: {anchor}"
    assert '<script src="/estimating-tools.js?v=1" defer></script>' in page
    assert 'href="/estimating-tools.css?v=1"' in page
    assert "assets/estimating-resources.json" in script
    assert "replaceChildren(...nodes)" in script and ".textContent" in script
    assert "new URL(item.source)" in script and "'noopener noreferrer'" in script
    assert "prefers-reduced-motion" in css
    assert "third-party" in page.lower() and "does not mirror" in page.lower()
    assert home.count('href="/estimating-tools.html"') == 3, "Portfolio discovery links missing"
    assert "One catalog. Three ways to use it." in home, "MegaRepo original showcase overwritten"
    assert "/assets/site-views/portfolio.svg" in home, "Portfolio counter removed"
    print(f"PASS: {len(resources)} unique resource records with checked licenses, secure links, five categories, and limitations")
    print("PASS: Static page, accessible search/filter markup, author attribution, and responsive styling")
    print("PASS: Portfolio navigation and existing featured project remain intact")


if __name__ == "__main__":
    verify()
