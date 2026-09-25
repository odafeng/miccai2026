# MICCAI 2026 論文索引

MICCAI 2026 開放取用論文（1165 篇）的靜態索引：依官方主題分類、繁體中文摘要、全文連結，以及 TF-IDF cosine similarity 搜尋。

線上版：https://odafeng.github.io/miccai2026/

## 結構

- `scraper/scrape.py`：抓取 papers.miccai.org 的論文列表、abstract、主題、程式碼連結，輸出 `data/papers.json`
- `data/summaries/*.json`：分批撰寫的繁中摘要（`{paper_id: 摘要}`）
- `web/src/`：前端模組（tokenizer、TF-IDF、facets、render、app、styles、template）
- `build/build.py`：把模組與資料打包成單一 `index.html`
- `build/restore.py`：從已發布的 HTML 還原原始碼與資料

## 重建

```bash
python3 scraper/scrape.py   # 選用：重新抓取
python3 build/build.py      # 輸出 index.html
```

## 注意

- 中文摘要依據 abstract 撰寫，未讀全文。
- 論文版權屬原作者；正式版本請見 SpringerLink，開放取用版本見 https://papers.miccai.org/miccai-2026/。
