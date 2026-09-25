// App state + wiring. Data comes from <script id="data" type="application/json">.
(() => {
  const { papers, summaries } = JSON.parse(document.getElementById("data").textContent);
  const $ = (s) => document.querySelector(s);
  const PAGE = 40;
  const state = { q: "", simOf: null, shown: PAGE };

  const index = new M.TfIdf(papers.map((p) => [
    [p.title, 3], [p.topics.map((t) => t.split(" -> ")[1]).join(" "), 1.5], [summaries[p.id] || "", 1.5], [p.abstract, 1],
  ]));
  const facets = new M.Facets(papers);
  const all = papers.map((_, i) => i);
  $("#progress").textContent = `中文摘要進度 ${Object.keys(summaries).length} / ${papers.length}`;

  let results = [];                           // [[index, score|null]]
  function compute() {
    let scored;
    if (state.simOf != null) scored = [...index.similar(state.simOf)].filter(([, s]) => s > 0.05);
    else if (state.q.trim()) scored = [...index.query(state.q, M.SYNONYMS)].filter(([, s]) => s > 0.01);
    const base = scored ? scored.map(([i]) => i) : all;
    const scoreOf = scored ? new Map(scored) : null;
    const kept = facets.filter(base);
    results = kept.map((i) => [i, scoreOf ? scoreOf.get(i) : null]);
    if (scoreOf) results.sort((a, b) => b[1] - a[1]);
    return base;
  }

  function render() {
    const base = compute();
    M.renderFacets($("#facets"), facets, facets.counts(base), (t) => { facets.toggle(t); reset(); });
    const n = facets.selected.size;
    $("#clear").hidden = !n;
    const mode = state.simOf != null ? `與「${papers[state.simOf].title}」相似` : state.q.trim() ? `搜尋「${state.q.trim()}」` : "全部論文";
    $("#status").replaceChildren(...[M.el("span", {}, `${mode}，共 ${results.length} 篇`),
      state.simOf != null && M.el("button", { class: "linkbtn", onclick: () => { state.simOf = null; reset(); } }, "結束相似模式")].filter(Boolean));
    $("#list").replaceChildren();
    renderMore(0);
  }
  function renderMore(from) {
    const list = $("#list");
    list.append(...results.slice(from, state.shown).map(([i, s]) => M.renderCard(papers[i], i, {
      score: s, summary: summaries[papers[i].id], facets,
      onTopic: (t) => { facets.toggle(t); reset(); },
      onSimilar: (j) => { state.simOf = j; state.q = ""; $("#q").value = ""; reset(); window.scrollTo({ top: 0, behavior: "smooth" }); },
    })));
    if (!results.length && !from) list.append(M.el("p", { class: "empty" }, "沒有符合的論文。試著減少主題篩選，或改用英文關鍵字（例如 colorectal、surgical phase）。"));
    $("#more").hidden = results.length <= state.shown;
  }
  const reset = () => { state.shown = PAGE; render(); };

  let t;
  $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; state.simOf = null; reset(); }, 180); });
  $("#clear").addEventListener("click", () => { facets.clear(); reset(); });
  const more = () => { const from = state.shown; state.shown += PAGE; renderMore(from); };
  $("#more").addEventListener("click", more);
  $("#toggle-facets").addEventListener("click", () => document.body.classList.toggle("facets-open"));
  new IntersectionObserver((es) => { if (es[0].isIntersecting && !$("#more").hidden) more(); },
    { rootMargin: "600px" }).observe($("#more"));
  render();
})();
