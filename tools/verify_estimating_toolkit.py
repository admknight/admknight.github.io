#!/usr/bin/env python3
"""Static QA for Adam Knight's curated construction estimating toolkit."""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_CATEGORIES = {"drawing-takeoff", "bim-qto", "rates-estimating", "contract-controls", "automation", "survey-earthworks", "ai-skills-mcp"}
VALID_MODES = {"Browser", "Desktop", "Self-hosted", "Python", "Add-on", "SDK", "AI Skill", "MCP Server", "Prompt Pack"}
VALID_LICENSES = {"Apache-2.0", "AGPL-3.0", "MIT", "GPL-3.0", "LGPL-3.0", "LGPL-2.1", "LGPL-3.0 (Ifc5D)", "GPL-2.0", "BSD-3-Clause", "MPL-2.0", "CC BY 4.0", "MIT (code) / CC BY 4.0 (data)", "MIT-style (core)"}


def verify():
    data = json.loads((ROOT / "assets" / "estimating-resources.json").read_text(encoding="utf-8"))
    page = (ROOT / "estimating-tools.html").read_text(encoding="utf-8")
    script = (ROOT / "estimating-tools.js").read_text(encoding="utf-8")
    css = (ROOT / "estimating-tools.css").read_text(encoding="utf-8")
    home = (ROOT / "index.html").read_text(encoding="utf-8")

    resources = data["resources"]
    assert len(resources) == 54, "Expected 54 independently linked resources"
    assert len({r["id"] for r in resources}) == len(resources), "Duplicate resource IDs"
    assert len({r["source"] for r in resources}) == len(resources), "Duplicate upstream repositories"
    assert set(c["id"] for c in data["categories"]) == EXPECTED_CATEGORIES, "Changed categories"
    assert data["checkedOn"] == "2026-10-09", "Research date changed without review"
    assert data["attribution"] and data["methodology"], "Original author / verification disclaimer missing"
    assert sum(bool(r["featured"]) for r in resources) >= 6, "Featured options missing"
    assert sum(r["category"] == "ai-skills-mcp" for r in resources) == 16, "AI skills category missing entries"
    assert sum(r["category"] == "survey-earthworks" for r in resources) == 8, "Survey category missing entries"
    for r in resources:
        assert r["category"] in EXPECTED_CATEGORIES, r
        assert r["mode"] in VALID_MODES, r
        assert r["license"] in VALID_LICENSES, r
        assert isinstance(r["tags"], list) and r["tags"], r
        assert r["name"] and r["summary"] and r["caution"], r
        if "compatibleWith" in r:
            assert r["category"] == "ai-skills-mcp" and isinstance(r["compatibleWith"], list) and r["compatibleWith"], r
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
    assert "<strong id=\"qs-total\">54</strong>" in page
    assert "compatibleWith" in script and "ai-skills-mcp" in script
    assert "ChatGPT-compatible prompt packs" in page
    assert "replaceChildren(...nodes)" in script and ".textContent" in script
    assert "new URL(item.source)" in script and "'noopener noreferrer'" in script
    assert "prefers-reduced-motion" in css
    assert "third-party" in page.lower() and "does not mirror" in page.lower()
    assert home.count('href="/estimating-tools.html"') == 3, "Portfolio discovery links missing"
    assert "One catalog. Three ways to use it." in home, "MegaRepo original showcase overwritten"
    assert "/assets/site-views/portfolio.svg" in home, "Portfolio counter removed"
    print(f"PASS: {len(resources)} unique resource records with checked licenses, secure links, seven categories, AI host notes and limitations")
    print("PASS: Static page, accessible search/filter markup, author attribution, and responsive styling")
    print("PASS: Portfolio navigation and existing featured project remain intact")


if __name__ == "__main__":
    verify()
