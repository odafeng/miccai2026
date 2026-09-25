// Sparse TF-IDF vectors with an inverted index; cosine = dot product of L2-normalised vectors.
window.M = window.M || {};
M.TfIdf = class {
  constructor(docs) {                        // docs: Array<Array<[text, weight]>>
    const counts = docs.map((fields) => {
      const tf = new Map();
      for (const [text, w] of fields) for (const t of M.tokenize(text)) tf.set(t, (tf.get(t) || 0) + w);
      return tf;
    });
    const df = new Map();
    for (const tf of counts) for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
    const N = docs.length;
    this.idf = new Map([...df].map(([t, d]) => [t, Math.log((N + 1) / (d + 1)) + 1]));
    this.postings = new Map();
    this.vectors = counts.map((tf, i) => {
      const v = this.#weigh(tf);
      for (const [t, x] of v) { let p = this.postings.get(t); if (!p) this.postings.set(t, (p = [])); p.push([i, x]); }
      return v;
    });
  }
  #weigh(tf) {
    const v = new Map(); let norm = 0;
    for (const [t, c] of tf) { const idf = this.idf.get(t); if (!idf) continue; const x = (1 + Math.log(c)) * idf; v.set(t, x); norm += x * x; }
    norm = Math.sqrt(norm) || 1;
    for (const [t, x] of v) v.set(t, x / norm);
    return v;
  }
  #score(qv, exclude = -1) {
    const s = new Map();
    for (const [t, qx] of qv) for (const [i, x] of this.postings.get(t) || []) if (i !== exclude) s.set(i, (s.get(i) || 0) + qx * x);
    return s;                                 // Map<docIndex, cosine>
  }
  query(text, synonyms = {}) {
    const tf = new Map();
    const add = (t, w) => tf.set(t, (tf.get(t) || 0) + w);
    const raw = text.toLowerCase();
    for (const t of M.tokenize(text)) add(t, 1);
    for (const [k, syns] of Object.entries(synonyms))
      if (raw.includes(k)) for (const s of syns) for (const t of M.tokenize(s)) add(t, 0.5);
    return this.#score(this.#weigh(tf));
  }
  similar(i) { return this.#score(this.vectors[i], i); }
};
