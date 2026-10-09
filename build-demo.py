#!/usr/bin/env python3
"""Build the offline single-file demo without external dependencies."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
OUTPUT = ROOT / "Service-Ecology-DEMO-0.3.0.html"
OPEN_OUTPUT = ROOT / "ОТКРЫТЬ-СЕРВИС-ЭКОЛОГИЯ.html"
FIXED_OUTPUT = ROOT / "СЕРВИС-ЭКОЛОГИЯ-ВХОД-ИСПРАВЛЕН.html"
PUBLIC_OUTPUT = ROOT / "index.html"

html = (WEB / "index.html").read_text(encoding="utf-8")
css = (WEB / "style.css").read_text(encoding="utf-8")
html = html.replace('<link rel="manifest" href="manifest.json">', "")
html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}</style>")
for script in ("config.js", "report-model.js", "reports.js", "app.js"):
    source = (WEB / script).read_text(encoding="utf-8").replace("</script>", "<\\/script>")
    html = html.replace(f'<script src="{script}"></script>', f"<script>{source}</script>")
OUTPUT.write_text(html, encoding="utf-8")
OPEN_OUTPUT.write_text(html, encoding="utf-8")
FIXED_OUTPUT.write_text(html, encoding="utf-8")
PUBLIC_OUTPUT.write_text(html, encoding="utf-8")
print(f"Built {OUTPUT.name} ({OUTPUT.stat().st_size} bytes)")
print(f"Built {OPEN_OUTPUT.name} ({OPEN_OUTPUT.stat().st_size} bytes)")
print(f"Built {FIXED_OUTPUT.name} ({FIXED_OUTPUT.stat().st_size} bytes)")
print(f"Built {PUBLIC_OUTPUT.name} ({PUBLIC_OUTPUT.stat().st_size} bytes)")
