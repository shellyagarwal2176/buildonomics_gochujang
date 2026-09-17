// Sign chaining: combine a run of confirmed signs into one sentence-like
// intent before an alert is ever emitted. Per the PRD's architecture diagram
// (ISL model -> sign chaining -> alert) and TEAM_GUIDE's contract, chaining
// happens here on the client, upstream of the single `alert` socket event
// server/ relays — the server never sees individual signs, only the
// finished result.
//
// Input to push() is an already hold-to-confirm'd sign (majority-voted over
// recent frames) — this module doesn't do per-frame smoothing, only chaining.
// A sentence ends either by the caller explicitly calling flush() (the
// mirror UI's "Done" button) or automatically after inactivityMs of no new
// sign — 7s of silence is read as "the sentence is finished," not a stray
// pause mid-sentence. maxChainLength is just a runaway-input safety cap.

import { INTENT_MAP, keyFor } from "./intentMap.js";
import { composeSentence } from "./composeSentence.js";

const DEFAULT_MAX_CHAIN_LENGTH = 12;
const DEFAULT_INACTIVITY_MS = 7000;

export class SignChainBuffer {
  constructor({
    maxChainLength = DEFAULT_MAX_CHAIN_LENGTH,
    inactivityMs = DEFAULT_INACTIVITY_MS,
    onAlert,
    onUpdate,
  } = {}) {
    this.maxChainLength = maxChainLength;
    this.inactivityMs = inactivityMs;
    this.onAlert = onAlert;
    this.onUpdate = onUpdate;
    this.buffer = [];
    this.timer = null;
  }

  // confirmedSign: { sign, confidence, timestamp }
  push(confirmedSign) {
    this.buffer.push(confirmedSign);
    this.onUpdate?.(this.buffer.map((c) => c.sign));
    this._restartInactivityTimer();

    if (this.buffer.length >= this.maxChainLength) this.flush();
  }

  // Drop the most recently confirmed sign — the mirror UI's backspace
  // button, for when the classifier locks in the wrong word. No-ops on an
  // empty buffer.
  removeLast() {
    this.buffer.pop();
    this.onUpdate?.(this.buffer.map((c) => c.sign));
    if (this.buffer.length > 0) this._restartInactivityTimer();
    else clearTimeout(this.timer);
  }

  // Fires the buffered chain as one alert. Safe to call when buffer is empty
  // (e.g. "Done" pressed with nothing signed yet, or the inactivity timer
  // firing right after a manual flush) — no-ops.
  flush() {
    clearTimeout(this.timer);
    this.timer = null;
    if (this.buffer.length === 0) return;

    const chain = this.buffer;
    this.buffer = [];
    this.onUpdate?.([]);

    const signs = chain.map((c) => c.sign);
    // Known short combos get their hand-authored family-facing phrasing from
    // intentMap; anything else is composed into a real sentence (see
    // composeSentence.js) instead of a raw word join.
    const composedSign = INTENT_MAP[keyFor(signs)] ?? composeSentence(signs);
    // Weakest link: a chain is only as trustworthy as its least-confident sign.
    const confidence = Math.min(...chain.map((c) => c.confidence));

    this.onAlert?.({
      sign: composedSign,
      timestamp: Date.now(),
      confidence,
    });
  }

  _restartInactivityTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.inactivityMs);
  }

  // Call on unmount so a pending timer doesn't fire an alert after teardown.
  dispose() {
    clearTimeout(this.timer);
    this.timer = null;
    this.buffer = [];
  }
}
