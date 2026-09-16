// Sign chaining: combine 2-3 confirmed signs into a single intent before an
// alert is ever emitted. Per the PRD's architecture diagram (ISL model ->
// sign chaining -> alert) and TEAM_GUIDE's contract, chaining happens here on
// the client, upstream of the single `alert` socket event server/ relays —
// the server never sees individual signs, only the finished result.
//
// Input to push() is an already hold-to-confirm'd sign (majority-voted over
// recent frames) — this module doesn't do per-frame smoothing, only chaining.

import { INTENT_MAP, keyFor } from "./intentMap.js";

const DEFAULT_WINDOW_MS = 2500;
const DEFAULT_MAX_CHAIN_LENGTH = 3;

export class SignChainBuffer {
  constructor({
    windowMs = DEFAULT_WINDOW_MS,
    maxChainLength = DEFAULT_MAX_CHAIN_LENGTH,
    onAlert,
  } = {}) {
    this.windowMs = windowMs;
    this.maxChainLength = maxChainLength;
    this.onAlert = onAlert;
    this.buffer = [];
    this.timer = null;
  }

  // confirmedSign: { sign, confidence, timestamp }
  push(confirmedSign) {
    this.buffer.push(confirmedSign);
    clearTimeout(this.timer);

    if (this.buffer.length >= this.maxChainLength) {
      this.flush();
      return;
    }
    this.timer = setTimeout(() => this.flush(), this.windowMs);
  }

  // Fires the buffered chain as one alert. Safe to call when buffer is empty
  // (e.g. a stray timer fire right after an external flush) — no-ops.
  flush() {
    clearTimeout(this.timer);
    this.timer = null;
    if (this.buffer.length === 0) return;

    const chain = this.buffer;
    this.buffer = [];

    const signs = chain.map((c) => c.sign);
    const composedSign = INTENT_MAP[keyFor(signs)] ?? signs.join(" + ");
    // Weakest link: a chain is only as trustworthy as its least-confident sign.
    const confidence = Math.min(...chain.map((c) => c.confidence));

    this.onAlert?.({
      sign: composedSign,
      timestamp: Date.now(),
      confidence,
    });
  }

  // Call on unmount so a pending timer doesn't fire an alert after teardown.
  dispose() {
    clearTimeout(this.timer);
    this.timer = null;
    this.buffer = [];
  }
}
