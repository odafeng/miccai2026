"""Bundle web/src modules + data into one self-contained HTML (published artifacts must be single-file).

The bundle also embeds the project source (base64 tar) and all data, so `restore.py` can rebuild the
workspace from the published page alone.
"""
from __future__ import annotations

import base64
import io
import json
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "web" / "src"
JS_ORDER = ["topics_zh.js", "synonyms.js", "tokenizer.js", "tfidf.js", "facets.js", "render.js", "app.js"]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "index.html"


def load_summaries() -> dict[str, str]:
    merged: dict[str, str] = {}
    for f in sorted((ROOT / "data" / "summaries").glob("*.json")):
        merged |= json.loads(f.read_text())
    return merged


def src_tarball() -> str:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for d in ("scraper", "web", "build"):
            tar.add(ROOT / d, arcname=d, filter=lambda ti: None if "__pycache__" in ti.name else ti)
    return base64.b64encode(buf.getvalue()).decode()


def main() -> None:
    papers = json.loads((ROOT / "data" / "papers.json").read_text())
    summaries = load_summaries()
    data = json.dumps({"papers": papers, "summaries": summaries}, ensure_ascii=False, separators=(",", ":"))
    html = (SRC / "template.html").read_text()
    html = (html.replace("/*__CSS__*/", (SRC / "styles.css").read_text())
                .replace("__N__", str(len(papers)))
                .replace("__SRC__", src_tarball())
                .replace("__DATA__", data.replace("</", "<\\/"))
                .replace("/*__JS__*/", "\n".join((SRC / f).read_text() for f in JS_ORDER)))
    OUT.write_text(html)
    print(f"{OUT} {OUT.stat().st_size / 1e6:.2f} MB | summaries {len(summaries)}/{len(papers)}")


if __name__ == "__main__":
    main()
