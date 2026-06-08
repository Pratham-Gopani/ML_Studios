import { DatasetSnapshot, PreprocessingConfig, ModelConfig, Step } from '../types';
import { preprocessDataset, trainAndEvaluate } from '../lib/ml-engine';

async function callAI(payload: any): Promise<string> {
  try {
    const res = await fetch('/api/ai-guidance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return 'AI guidance unavailable.';
    const data = await res.json();
    return data.text || 'No guidance available.';
  } catch {
    return 'AI guidance unavailable. Please proceed manually.';
  }
}

export const mlService = {
  async preprocess(snapshot: DatasetSnapshot, config: PreprocessingConfig) {
    if (snapshot.isImage) {
      return await preprocessDataset(snapshot, config);
    }
    try {
      const res = await fetch('/api/ml/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, config })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Preprocessing failed');
      }
      return await res.json();
    } catch {
      return await preprocessDataset(snapshot, config);
    }
  },

  async train(
    trainSet: DatasetSnapshot,
    testSet: DatasetSnapshot,
    config: ModelConfig,
    onEpochEnd?: (epoch: number, logs?: any) => void
  ) {
    // Execute training directly inside the client browser thread.
    // This allows real-time progressive epoch logs/telemetry to render on screen,
    // leverages browser hardware acceleration (WebGL/WebGPU) if available,
    // and prevents expensive model-fitting loops from locking the backend NodeJS server thread.
    return await trainAndEvaluate(trainSet, testSet, config, onEpochEnd);
  }
};

export const aiService = {
  async getGuidance(step: Step, context: any): Promise<string> {
    return callAI({ type: 'guidance', step, context });
  },

  async getFeatureEngineering(dataset: DatasetSnapshot, modelConfig: ModelConfig, goal?: string): Promise<string> {
    return callAI({ type: 'feature_engineering', step: 'model', context: { dataset, modelConfig, goal } });
  },

  async getCustomInsight(prompt: string): Promise<string> {
    return callAI({ type: 'custom', prompt });
  }
};
