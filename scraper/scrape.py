"""Scrape MICCAI 2026 open-access list + per-paper info pages into data/papers.json."""
from __future__ import annotations

import html
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass, field
from pathlib import Path

BASE = "https://papers.miccai.org"
INDEX = f"{BASE}/miccai-2026/"
OUT = Path(__file__).resolve().parents[1] / "data" / "papers.json"


@dataclass
class Paper:
    id: str
    title: str
    authors: list[str]
    pdf: str
    info: str
    volume: str = ""
    topics: list[str] = field(default_factory=list)
    abstract: str = ""
    code: str = ""


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def parse_index(src: str) -> list[Paper]:
    out: list[Paper] = []
    for li in re.split(r"<li[ >]", src)[1:]:
        info = re.search(r'href="(/miccai-2026/(\d+)-Paper\d+\.html)"', li)
        title = re.search(r"title\s*=\s*\{\s*\{(.*?)\}\s*\}", li, re.S)
        if not (info and title):
            continue
        pdf = re.search(r'href="(https://papers\.miccai\.org/miccai-2026/paper/[^"]+\.pdf)"', li)
        auth = re.search(r"author\s*=\s*\{(.*?)\}", li, re.S)
        vol = re.search(r"volume\s*=\s*\{\s*(LNCS \d+)", li)
        out.append(Paper(
            id=info.group(2),
            title=clean(title.group(1)),
            authors=[a.strip() for a in clean(auth.group(1)).split(" AND ")] if auth else [],
            pdf=pdf.group(1) if pdf else "",
            info=BASE + info.group(1),
            volume=vol.group(1) if vol else "",
        ))
    return out


def enrich(p: Paper) -> Paper:
    src = get(p.info)
    p.topics = sorted({clean(t) for t in re.findall(r'class="post-category">(.*?)</a>', src, re.S) if "->" in t})
    if m := re.search(r'<h1 id="abstract-id">Abstract</h1>(.*?)<h1', src, re.S):
        p.abstract = clean(m.group(1))
    if m := re.search(r'<h1 id="code-id">.*?</h1>\s*<p>\s*<a href="([^"]+)"', src, re.S):
        p.code = m.group(1)
    return p


def main() -> None:
    papers = parse_index(get(INDEX))
    with ThreadPoolExecutor(24) as ex:
        papers = list(ex.map(enrich, papers))
    OUT.write_text(json.dumps([asdict(p) for p in papers], ensure_ascii=False))
    print(len(papers), "papers |", sum(bool(p.abstract) for p in papers), "abstracts |",
          sum(bool(p.topics) for p in papers), "with topics |", sum(bool(p.code) for p in papers), "code")


if __name__ == "__main__":
    main()
