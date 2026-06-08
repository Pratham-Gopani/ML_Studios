import { useState } from 'react';
import { Settings2, Play, Loader2, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { mlService } from '../services/api';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Tuning() {
  const { trainSet, testSet, processedDataset, preprocessingConfig, modelConfig, updateState } = useWorkflowStore();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [epochLogs, setEpochLogs] = useState<{epoch: number; loss: number; accuracy?: number; val_loss?: number; val_accuracy?: number;}[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);

  const epochsToRun = modelConfig?.epochs || (trainSet?.isImage ? 5 : 10);

  const handleConfigChange = (key: string, value: any) => {
    if (!modelConfig) return;
    updateState({
      modelConfig: {
        ...modelConfig,
        [key]: value
      }
    });
  };

  const handleTrain = async () => {
    let currentTrainSet = trainSet;
    let currentTestSet = testSet;

    if ((!currentTrainSet || !currentTestSet) && processedDataset) {
      try {
        const { train, test } = await mlService.preprocess(processedDataset, preprocessingConfig || {
          missingValueStrategy: 'mean',
          encoding: {},
          scaling: 'standard',
          selectedFeatures: processedDataset.columns,
          targetVariable: processedDataset.columns[processedDataset.columns.length - 1],
          trainTestSplit: 0.8,
          randomSeed: 42
        });
        currentTrainSet = train;
        currentTestSet = test;
        updateState({ trainSet: train, testSet: test });
      } catch (e) {
        console.error('Auto-split failed:', e);
      }
    }

    if (!currentTrainSet || !currentTestSet || !modelConfig) {
      updateState({ error: 'Cannot start training: Missing dataset or model configuration.' });
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setEpochLogs([]);
    setCurrentEpoch(null);

    try {
      const results = await mlService.train(currentTrainSet, currentTestSet, modelConfig, (epoch, logs) => {
        setCurrentEpoch(epoch);
        const epochProg = Math.round((epoch / epochsToRun) * 100);
        setProgress(epochProg);
        if (logs) {
          setEpochLogs(prev => [
            ...prev,
            {
              epoch,
              loss: logs.loss,
              accuracy: logs.acc || logs.accuracy,
              val_loss: logs.val_loss,
              val_accuracy: logs.val_acc || logs.val_accuracy
            }
          ]);
        }
      });
      setProgress(100);
      setTimeout(() => updateState({ evaluationResults: results, currentStep: 'results' }), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Training failed.';
      updateState({ error: msg });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              Hyperparameter Tuning
            </h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Tuning Strategy</label>
                  <div className="flex gap-2">
                    {['Grid Search', 'Random Search', 'Bayesian'].map((s, i) => (
                      <button key={s} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${i === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Cross-Validation Folds (K)</label>
                  <input type="range" min="2" max="10" defaultValue="5" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>2 Folds</span><span>5 Folds</span><span>10 Folds</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Learning Rate</label>
                    <select
                      value={modelConfig?.learningRate ?? (trainSet?.isImage ? (modelConfig?.algorithm?.toLowerCase().includes('vgg') ? 0.0005 : 0.001) : 0.01)}
                      onChange={(e) => handleConfigChange('learningRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="0.0001">0.0001 (Slow/Deep)</option>
                      <option value="0.0005">0.0005 (Optimal VGG)</option>
                      <option value="0.001">0.001 (Default CNN)</option>
                      <option value="0.005">0.005</option>
                      <option value="0.01">0.01 (Default Tabular)</option>
                      <option value="0.05">0.05</option>
                      <option value="0.1">0.1</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Size of gradient steps. Deeper architectures like VGG-16 require smaller LR (e.g. 0.0005).</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Epochs</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={modelConfig?.epochs ?? (trainSet?.isImage ? 5 : 10)}
                      onChange={(e) => handleConfigChange('epochs', parseInt(e.target.value, 10) || 5)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Number of passes through reference datasets.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Batch Size</label>
                    <select
                      value={modelConfig?.batchSize ?? 32}
                      onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value, 10) || 32)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="16">16 (Low Memory)</option>
                      <option value="32">32 (Balanced)</option>
                      <option value="64">64 (Large)</option>
                      <option value="128">128 (Heavy/Parallel)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Forward/backward batch processing dimensions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Evaluation Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Accuracy', 'F1-Score', 'Precision', 'Recall', 'ROC-AUC', 'Log Loss'].map(m => (
                <div key={m} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${isTraining ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                {isTraining ? <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /> : <Play className="w-10 h-10 text-slate-300" />}
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Ready to Train</h4>
              <p className="text-xs text-slate-500">
                {modelConfig?.algorithm || 'No model selected'} training with cross-validation.
              </p>
            </div>

            {isTraining && (
              <div className="mb-8 space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-indigo-600">Training Progress</span>
                  <span className="text-slate-400">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-indigo-600" />
                </div>
              </div>
            )}

            <button onClick={handleTrain} disabled={isTraining}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
              {isTraining ? 'Training...' : <><span>Start Training</span><ArrowRight className="w-5 h-5" /></>}
            </button>

            {(isTraining || epochLogs.length > 0) && (
              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Epoch Monitor</h5>
                  {currentEpoch !== null && (
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      Epoch {currentEpoch}/{epochsToRun}
                    </span>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto bg-slate-900 rounded-2xl p-4 font-mono text-[10px] text-zinc-300 space-y-2 shadow-inner border border-slate-950">
                  {epochLogs.length === 0 ? (
                    <div className="text-zinc-500 italic animate-pulse">Assembling tensors & compiling layers...</div>
                  ) : (
                    epochLogs.map((log) => (
                      <div key={log.epoch} className="border-b border-slate-850 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between text-indigo-400 font-bold">
                          <span>📊 Epoch {log.epoch}/{epochsToRun}</span>
                          <span className="text-emerald-400">
                            {log.accuracy !== undefined ? `Acc: ${(log.accuracy * 100).toFixed(1)}%` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-500 mt-0.5">
                          <span>Loss: {log.loss.toFixed(4)}</span>
                          {log.val_loss !== undefined && (
                            <span>Val Loss: {log.val_loss.toFixed(4)} {log.val_accuracy !== undefined ? `| Val Acc: ${(log.val_accuracy * 100).toFixed(1)}%` : ''}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
