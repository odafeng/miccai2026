// DOM rendering for facet sidebar and paper cards.
window.M = window.M || {};
(() => {
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k);
    return n;
  };
  M.el = el;
  const AXIS_KEY = { "Body": "body", "Modalities": "mod", "Applications": "app", "Surgery": "surg", "Machine Learning": "ml", "Special Topic": "sp" };

  M.renderFacets = (root, facets, counts, onToggle) => {
    root.replaceChildren(...M.AXES.map(([axis, zh]) => {
      const topics = [...facets.byAxis.get(axis)].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
      const nOn = facets.selected.get(axis)?.size || 0;
      return el("details", { class: "axis", "data-axis": AXIS_KEY[axis], open: axis === "Body" || axis === "Surgery" || nOn > 0 },
        el("summary", {}, el("span", {}, zh), nOn ? el("span", { class: "axis-on" }, `已選 ${nOn}`) : null),
        el("ul", {}, topics.map((t) => el("li", {},
          el("button", { class: "facet" + (facets.isOn(t) ? " on" : ""), "aria-pressed": facets.isOn(t) ? "true" : "false",
            disabled: !counts.get(t) && !facets.isOn(t), onclick: () => onToggle(t) },
            el("span", {}, M.topicLabel(t)), el("span", { class: "n" }, String(counts.get(t) || 0)))))));
    }));
  };

  const authorLine = (a) => a.length <= 4 ? a.join("; ") : `${a.slice(0, 3).join("; ")} 等 ${a.length} 人`;

  const ext = (href, label, cls) => href && el("a", { class: "lnk " + cls, href, target: "_blank", rel: "noopener" }, label);

  M.renderCard = (p, i, { score, summary, facets, onTopic, onSimilar }) => el("article", { class: "card" },
    el("div", { class: "card-head" },
      el("h3", { lang: "en" }, el("a", { href: p.info, target: "_blank", rel: "noopener" }, p.title)),
      score != null ? el("span", { class: "score", style: `--s:${Math.min(1, score / 0.5).toFixed(3)}`, title: `cosine similarity ${score.toFixed(3)}` },
        el("span", { class: "bar" }), score.toFixed(2)) : null),
    el("p", { class: "authors", lang: "en" }, authorLine(p.authors)),
    summary ? el("p", { class: "zh" }, summary)
      : el("p", { class: "zh pending", lang: "en", title: "點擊展開／收合", onclick: (e) => e.currentTarget.classList.toggle("open") }, el("span", { class: "tag" }, "中文摘要撰寫中"), p.abstract),
    summary ? el("details", { class: "abs" }, el("summary", {}, "英文原文摘要"), el("p", { lang: "en" }, p.abstract)) : null,
    el("div", { class: "chips" }, p.topics.filter((t) => !t.endsWith("-> Deep Learning")).map((t) =>
      el("button", { class: "chip" + (facets.isOn(t) ? " on" : ""), "data-axis": AXIS_KEY[t.split(" -> ")[0]], onclick: () => onTopic(t) }, M.topicLabel(t)))),
    el("div", { class: "links" },
      ext(p.pdf, "全文 PDF", "pdf"), ext(p.info, "論文頁與審稿意見", "info"), ext(p.code, "程式碼", "code"),
      el("button", { class: "sim", onclick: () => onSimilar(i) }, "找相似論文")));
})();
