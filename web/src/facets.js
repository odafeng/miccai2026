// Faceted filtering: OR within an axis, AND across axes. Counts exclude the axis's own selection.
window.M = window.M || {};
M.Facets = class {
  constructor(papers) {
    this.papers = papers;
    this.selected = new Map();                // axis -> Set<topic>
    this.byAxis = new Map(M.AXES.map(([a]) => [a, new Set()]));
    for (const p of papers) for (const t of p.topics) this.byAxis.get(t.split(" -> ")[0])?.add(t);
  }
  toggle(topic) {
    const axis = topic.split(" -> ")[0];
    const s = this.selected.get(axis) || new Set();
    s.has(topic) ? s.delete(topic) : s.add(topic);
    s.size ? this.selected.set(axis, s) : this.selected.delete(axis);
  }
  clear() { this.selected.clear(); }
  isOn(topic) { return !!this.selected.get(topic.split(" -> ")[0])?.has(topic); }
  #passes(p, skipAxis) {
    for (const [axis, set] of this.selected) {
      if (axis === skipAxis) continue;
      if (!p.topics.some((t) => set.has(t))) return false;
    }
    return true;
  }
  filter(indices) { return indices.filter((i) => this.#passes(this.papers[i])); }
  counts(indices) {
    const c = new Map();
    for (const [axis] of M.AXES)
      for (const i of indices) { const p = this.papers[i]; if (!this.#passes(p, axis)) continue;
        for (const t of p.topics) if (t.startsWith(axis + " ->")) c.set(t, (c.get(t) || 0) + 1); }
    return c;
  }
};
