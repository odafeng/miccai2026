"""Write Traditional Chinese summaries for papers that lack one, via the Claude API.

Existing hand-written summaries serve as few-shot examples so new ones match their style.

Usage (needs ANTHROPIC_API_KEY):
  python3 scraper/summarize.py sample N     # N synchronous requests, print results, write nothing
  python3 scraper/summarize.py submit       # submit one Message Batch for every paper still missing a summary
  python3 scraper/summarize.py collect ID   # wait for batch ID, write results to data/summaries/bNN.json (50 per file)
"""
from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

ROOT = Path(__file__).resolve().parents[1]
SUMMARIES = ROOT / "data" / "summaries"
MODEL = "claude-opus-5"
N_EXAMPLES = 12
PER_FILE = 50

STYLE = """你為 MICCAI 2026 論文索引撰寫繁體中文摘要，讀者是懂醫學影像與 AI 的臨床醫師和研究者。
只依據提供的英文 abstract，不可編造 abstract 沒有的數字、資料集或結論。

寫法：
- 目標約 110 字元，上限 160 字元（中英文、數字、空白都算），2 到 3 句，一段，不分行。範例的長度就是標準。
- 第一句先講發現或貢獻（方法名稱、做到什麼、贏過什麼），不要從背景開始。
- 方法只講最關鍵的一個設計，不要逐一列舉模組或損失函數。
- 最重要的具體數字（資料量、主要指標或提升幅度）挑一到兩個寫出來。
- abstract 透露的限制要直說（例如只用合成資料、樣本少、只做定性評估），不要美化。
- 專有名詞、方法名、資料集名、指標保留英文原文（例如 Dice、SAM、ADNI、k-space）。
- 台灣用語（資料、模型、影像、訓練）。全形中文標點。不要用破折號。
- 不要提程式碼或資料是否公開（頁面另有連結）。
- 只輸出摘要本文，不要標題、前言或引號。

以下是既有摘要範例，請維持相同風格與密度："""


@dataclass
class Paper:
    id: str
    title: str
    abstract: str

    def prompt(self) -> str:
        return f"Title: {self.title}\n\nAbstract: {self.abstract}"


def load() -> tuple[list[Paper], dict[str, str]]:
    papers = [Paper(p["id"], p["title"], p["abstract"]) for p in json.loads((ROOT / "data" / "papers.json").read_text())]
    done: dict[str, str] = {}
    for f in sorted(SUMMARIES.glob("*.json")):
        done |= json.loads(f.read_text())
    return papers, done


def system_blocks(papers: list[Paper], done: dict[str, str]) -> list[dict]:
    have = [p for p in papers if p.id in done]
    step = max(1, len(have) // N_EXAMPLES)
    shots = "\n\n".join(f"<example>\n{p.prompt()}\n\n摘要：{done[p.id]}\n</example>" for p in have[::step][:N_EXAMPLES])
    return [{"type": "text", "text": f"{STYLE}\n\n{shots}", "cache_control": {"type": "ephemeral"}}]


def params(p: Paper, system: list[dict]) -> MessageCreateParamsNonStreaming:
    return MessageCreateParamsNonStreaming(
        model=MODEL, max_tokens=4000, system=system, output_config={"effort": "medium"},
        messages=[{"role": "user", "content": p.prompt()}],
    )


def text_of(msg: anthropic.types.Message) -> str | None:
    if msg.stop_reason != "end_turn":
        return None
    return "".join(b.text for b in msg.content if b.type == "text").strip() or None


def sample(n: int) -> None:
    client = anthropic.Anthropic()
    papers, done = load()
    system = system_blocks(papers, done)
    for p in [p for p in papers if p.id not in done][:n]:
        msg = client.messages.create(**params(p, system))
        u = msg.usage
        text = text_of(msg) or f"[{msg.stop_reason}]"
        print(f"--- {p.title}\n{text}\n    ({len(text)} chars, "
              f"in {u.input_tokens}, cache read {u.cache_read_input_tokens}, cache write {u.cache_creation_input_tokens}, out {u.output_tokens})")


def submit() -> None:
    client = anthropic.Anthropic()
    papers, done = load()
    system = system_blocks(papers, done)
    todo = [p for p in papers if p.id not in done]
    batch = client.messages.batches.create(requests=[Request(custom_id=p.id, params=params(p, system)) for p in todo])
    print(f"submitted {len(todo)} requests: {batch.id}")


def collect(batch_id: str) -> None:
    client = anthropic.Anthropic()
    while (batch := client.messages.batches.retrieve(batch_id)).processing_status != "ended":
        c = batch.request_counts
        print(f"{batch.processing_status}: {c.succeeded} ok, {c.errored} err, {c.processing} processing", flush=True)
        time.sleep(60)

    papers, done = load()
    got: dict[str, str] = {}
    failed: list[str] = []
    for r in client.messages.batches.results(batch_id):
        text = text_of(r.result.message) if r.result.type == "succeeded" else None
        if text:
            got[r.custom_id] = text
        else:
            failed.append(f"{r.custom_id} ({r.result.type}{'/' + r.result.message.stop_reason if r.result.type == 'succeeded' else ''})")

    ordered = [p.id for p in papers if p.id in got and p.id not in done]
    start = len(list(SUMMARIES.glob("b*.json"))) + 1
    for k in range(0, len(ordered), PER_FILE):
        chunk = {pid: got[pid] for pid in ordered[k:k + PER_FILE]}
        out = SUMMARIES / f"b{start + k // PER_FILE:02d}.json"
        out.write_text(json.dumps(chunk, ensure_ascii=False, indent=0, separators=(",", ":")))
    print(f"wrote {len(ordered)} summaries; failed {len(failed)}: {failed}")


if __name__ == "__main__":
    match sys.argv[1:]:
        case ["sample", n]: sample(int(n))
        case ["submit"]: submit()
        case ["collect", batch_id]: collect(batch_id)
        case _: sys.exit(__doc__)
