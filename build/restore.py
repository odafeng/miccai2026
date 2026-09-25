"""Rebuild the workspace (sources + data) from a published miccai2026.html."""
from __future__ import annotations

import base64
import io
import json
import re
import sys
import tarfile
from pathlib import Path

ROOT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/home/claude/miccai")


def main(html_path: str) -> None:
    html = Path(html_path).read_text()
    src = re.search(r'<script id="src-bundle" type="text/plain">(.*?)</script>', html, re.S).group(1)
    tarfile.open(fileobj=io.BytesIO(base64.b64decode(src)), mode="r:gz").extractall(ROOT)
    data = json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>', html, re.S).group(1).replace("<\\/", "</"))
    (ROOT / "data" / "summaries").mkdir(parents=True, exist_ok=True)
    (ROOT / "data" / "papers.json").write_text(json.dumps(data["papers"], ensure_ascii=False))
    (ROOT / "data" / "summaries" / "restored.json").write_text(json.dumps(data["summaries"], ensure_ascii=False))
    print(f"restored {len(data['papers'])} papers, {len(data['summaries'])} summaries -> {ROOT}")


if __name__ == "__main__":
    main(sys.argv[1])
