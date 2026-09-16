// Loads the exported sign_classifier.json (see ml/src/export_model.py) and runs
// its forward pass in plain JS. The network is a tiny StandardScaler + MLP
// (126 -> 64 -> 32 -> 19, relu hidden / softmax output) trained in
// ml/src/train_classifier.py — small enough that hand-rolling this is simpler
// than pulling in ONNX Runtime Web or TF.js for it.
//
// Usage:
//   import { loadSignClassifier } from './ml/signClassifier';
//   import { landmarksToVector } from './ml/normalize';
//   const classifier = await loadSignClassifier();
//   const { label, confidence } = classifier.predict(landmarksToVector(left, right));

import modelData from './sign_classifier.json';

function relu(v) {
  return v.map((x) => (x > 0 ? x : 0));
}

function softmax(v) {
  const max = Math.max(...v);
  const exps = v.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

// x: plain array, layer: { weights: number[nIn][nOut], biases: number[nOut] }
function denseLayer(x, layer) {
  const { weights, biases } = layer;
  const nOut = biases.length;
  const out = new Array(nOut).fill(0);
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    const row = weights[i];
    for (let j = 0; j < nOut; j++) {
      out[j] += xi * row[j];
    }
  }
  for (let j = 0; j < nOut; j++) out[j] += biases[j];
  return out;
}

class SignClassifier {
  constructor({ classes, scaler, layers }) {
    this.classes = classes;
    this.scaler = scaler;
    this.layers = layers;
  }

  // vector: length-126 array/Float32Array in the same layout as
  // ml/src/normalize.py's landmarks_to_vector output.
  predict(vector) {
    const { mean, scale } = this.scaler;
    let x = Array.from(vector, (v, i) => (v - mean[i]) / scale[i]);

    for (let i = 0; i < this.layers.length; i++) {
      x = denseLayer(x, this.layers[i]);
      const isOutputLayer = i === this.layers.length - 1;
      x = isOutputLayer ? softmax(x) : relu(x);
    }

    let bestIdx = 0;
    for (let i = 1; i < x.length; i++) {
      if (x[i] > x[bestIdx]) bestIdx = i;
    }

    return { label: this.classes[bestIdx], confidence: x[bestIdx], probabilities: x };
  }
}

// modelData is bundled at build time (Vite JSON import), so this resolves
// synchronously — kept async so swapping to a runtime fetch() later (e.g. to
// let the model update without a rebuild) doesn't change the call site.
export async function loadSignClassifier() {
  return new SignClassifier(modelData);
}
