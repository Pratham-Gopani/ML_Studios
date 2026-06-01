import { useState, useEffect } from 'react';
import { Settings2, Play, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { trainModel } from '../lib/tfTraining';
import { hyperparamSearch } from '../lib/hyperparamOptimization';

export default function Tuning() {
  const { trainSet, testSet, preprocessingConfig, modelConfig, updateState } = useWorkflowStore();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tuningStrategy, setTuningStrategy] = useState<'grid' | 'random' | 'bayesian'>('grid');
  const [cvFolds, setCvFolds] = useState(5);
  const [hyperparamGrid, setHyperparamGrid] = useState<any>({});

  useEffect(() => {
    if (modelConfig) {
      if (modelConfig.type === 'classification' || modelConfig.type === 'regression') {
        setHyperparamGrid({
          nEstimators: [50, 100, 200],
          maxDepth: [5, 10, 15]
        });
      } else {
        setHyperparamGrid({ numClusters: [3, 5, 7, 10] });
      }
    }
  }, [modelConfig]);

  const handleTrain = async () => {
    setIsTraining(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 3, 92)), 200);
    try {
      if (!trainSet?.length || !testSet?.length) throw new Error('Missing train/test data');
      if (!preprocessingConfig) throw new Error('No preprocessing config');
      const { selectedFeatures, targetVariable } = preprocessingConfig;
      let bestParams = null;
      if (tuningStrategy !== 'grid') {
        bestParams = await hyperparamSearch(
          trainSet, testSet, modelConfig, selectedFeatures, targetVariable,
          tuningStrategy, cvFolds, hyperparamGrid
        );
        updateState({
          modelConfig: { ...modelConfig, hyperparameters: { ...modelConfig.hyperparameters, ...bestParams } }
        });
      }
      const finalConfig = bestParams ? { ...modelConfig, hyperparameters: { ...modelConfig.hyperparameters, ...bestParams } } : modelConfig;
      const result = await trainModel(trainSet, testSet, finalConfig, selectedFeatures, targetVariable);
      clearInterval(interval);
      setProgress(100);
      updateState({ evaluationResults: result.metrics, trainedModel: result.model, currentStep: 'results' });
    } catch (err) {
      clearInterval(interval);
      updateState({ error: err instanceof Error ? err.message : 'Training failed' });
      alert(`Error: ${err instanceof Error ? err.message : 'Training failed'}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Hyperparameter Tuning</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex gap-2"><Settings2 /> Tuning Strategy</h2>
            <div className="flex gap-4 mb-4">
              {(['grid', 'random', 'bayesian'] as const).map(s => (
                <label key={s} className="flex items-center gap-2">
                  <input type="radio" name="strategy" value={s} checked={tuningStrategy === s} onChange={() => setTuningStrategy(s)} />
                  {s.charAt(0).toUpperCase() + s.slice(1)} Search
                </label>
              ))}
            </div>
            <div>
              <label>Cross-Validation Folds: {cvFolds}</label>
              <input type="range" min={2} max={10} value={cvFolds} onChange={e => setCvFolds(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Hyperparameter Grid</h2>
            <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(hyperparamGrid, null, 2)}</pre>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">Training</h2>
            {isTraining ? (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }} /></div>
                <p className="text-center text-sm">{progress}%</p>
              </div>
            ) : (
              <button onClick={handleTrain} className="w-full flex justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-bold">
                <Play className="w-4 h-4" /> Start Training
              </button>
            )}
            <div className="mt-4 text-sm text-gray-500">
              <p>Model: {modelConfig?.algorithm}</p>
              <p>Train samples: {trainSet?.length || 0}</p>
              <p>Test samples: {testSet?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
