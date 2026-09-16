// Sign chaining: combine a run of confirmed signs into one sentence-like
// intent before an alert is ever emitted. Per the PRD's architecture diagram
// (ISL model -> sign chaining -> alert) and TEAM_GUIDE's contract, chaining
// happens here on the client, upstream of the single `alert` socket event
// server/ relays — the server never sees individual signs, only the
// finished result.
//
// Input to push() is an already hold-to-confirm'd sign (majority-voted over
// recent frames) — this module doesn't do per-frame smoothing, only chaining.
// A sentence only ends when the caller explicitly calls flush() (the mirror
// UI's "Done" button) — maxChainLength is just a runaway-input safety cap,
// not a normal way sentences end.

import { INTENT_MAP, keyFor } from "./intentMap.js";

const DEFAULT_MAX_CHAIN_LENGTH = 12;

export class SignChainBuffer {
  constructor({ maxChainLength = DEFAULT_MAX_CHAIN_LENGTH, onAlert, onUpdate } = {}) {
    this.maxChainLength = maxChainLength;
    this.onAlert = onAlert;
    this.onUpdate = onUpdate;
    this.buffer = [];
  }

  // confirmedSign: { sign, confidence, timestamp }
  push(confirmedSign) {
    this.buffer.push(confirmedSign);
    this.onUpdate?.(this.buffer.map((c) => c.sign));

    if (this.buffer.length >= this.maxChainLength) this.flush();
  }

  // Fires the buffered chain as one alert. Safe to call when buffer is empty
  // (e.g. "Done" pressed with nothing signed yet) — no-ops.
  flush() {
    if (this.buffer.length === 0) return;

    const chain = this.buffer;
    this.buffer = [];
    this.onUpdate?.([]);

    const signs = chain.map((c) => c.sign);
    // Known short combos get their family-facing phrasing from intentMap;
    // anything longer just reads left-to-right as a sentence.
    const composedSign = INTENT_MAP[keyFor(signs)] ?? signs.join(" ").toLowerCase();
    // Weakest link: a chain is only as trustworthy as its least-confident sign.
    const confidence = Math.min(...chain.map((c) => c.confidence));

    this.onAlert?.({
      sign: composedSign,
      timestamp: Date.now(),
      confidence,
    });
  }

  // Call on unmount so a stale buffer doesn't leak.
  dispose() {
    this.buffer = [];
  }
}
