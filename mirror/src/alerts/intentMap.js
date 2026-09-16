// Maps a chain of confirmed signs to a single family-facing intent phrase, per
// CLAUDE.md/PRD's "System chains 2-3 sequential signs into a single intent
// (e.g. HEAD + PAIN -> 'headache')" requirement.
//
// FLAG: that HEAD + PAIN example uses "HEAD", which isn't in the frozen
// 19-word vocabulary (ml/src/labels.py) — it's a leftover illustrative example
// from before the vocabulary was frozen, not a real mapping. No actual
// combo -> intent phrase mappings have been defined anywhere in the docs for
// the real vocabulary. Rather than invent plausible-sounding ones, this map
// starts empty; unmapped chains fall back to a joined label (see signChain.js)
// so the pipeline still works end-to-end, but the *wording* shown to family
// members needs the team to actually decide it before demo.
export const INTENT_MAP = {
  // "DOCTOR,PAIN": "Needs a doctor for pain",
};

export function keyFor(signs) {
  return signs.join(",");
}
