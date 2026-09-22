"""Smoke test: Vite + React entry is wired and TSX app is structurally sound."""
from pathlib import Path

ROOT = Path(__file__).parent.parent
COMPONENTS = ("ChatPane.tsx", "Icons.tsx", "ReceiptPane.tsx", "Spinner.tsx")


def test_index_html_loads_app():
    html = (ROOT / "index.html").read_text()
    assert 'src="/index.tsx"' in html, "index.html does not load /index.tsx"
    assert 'id="root"' in html, "index.html has no #root mount point"


def test_react_entry_mounts_root():
    entry = (ROOT / "index.tsx").read_text()
    assert "createRoot" in entry
    assert 'getElementById(\'root\')' in entry or 'getElementById("root")' in entry
    app = (ROOT / "App.tsx").read_text()
    assert "export default" in app


def test_components_present():
    for c in COMPONENTS:
        assert (ROOT / "components" / c).exists(), f"components/{c} missing"
