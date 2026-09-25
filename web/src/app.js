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
  const nZh = Object.keys(summaries).length;
  $("#stat-zh").textContent = `${nZh} / ${papers.length}`;
  $("#zh-bar").style.width = `${(100 * nZh / papers.length).toFixed(1)}%`;
  $("#stat-code").textContent = String(papers.filter((p) => p.code).length);

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
    $("#status").replaceChildren(...[M.el("span", { class: "mode" }, mode, M.el("b", {}, ` ${results.length} `), "篇"),
      state.simOf != null && M.el("button", { class: "linkbtn", onclick: () => { state.simOf = null; reset(); } }, "結束相似模式")].filter(Boolean));
    $("#active").replaceChildren(...[...facets.selected.values()].flatMap((set) => [...set]).map((t) =>
      M.el("button", { class: "chip on", title: "移除此篩選", onclick: () => { facets.toggle(t); reset(); } }, M.topicLabel(t), " ×")));
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
  $("#theme").addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
  });
  const totop = $("#totop");
  totop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  addEventListener("scroll", () => { totop.hidden = scrollY < 900; }, { passive: true });
  new IntersectionObserver((es) => { if (es[0].isIntersecting && !$("#more").hidden) more(); },
    { rootMargin: "600px" }).observe($("#more"));
  render();
})();
