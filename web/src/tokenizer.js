// Tokenizer: English words (light stemming, hyphen split) + CJK character bigrams.
window.M = window.M || {};
(() => {
  const STOP = new Set(("a an and are as at be by for from has have in into is it its of on or our that the their this to was we "
    + "were which while with via using use used based method methods propose proposed approach framework novel paper results "
    + "show shows demonstrate experiments dataset datasets model models state art existing however also can such these both "
    + "than more other through across two one new each over under between during without within not only first further well "
    + "achieves achieve performance furthermore moreover code available https github com").split(" "));
  const stem = (w) => {
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.length > 3 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  };
  M.tokenize = (text) => {
    const out = [];
    const push = (w) => { if (w.length >= 2 && !/^\d+$/.test(w) && !STOP.has(w)) out.push(stem(w)); };
    for (const [w] of text.toLowerCase().matchAll(/[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
      if (w.includes("-")) { w.split("-").forEach(push); push(w.replace(/-/g, "")); } else push(w);
    }
    for (const [run] of text.matchAll(/[\u3400-\u9fff]+/g)) {
      if (run.length === 1) out.push(run);
      for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
    }
    return out;
  };
})();
