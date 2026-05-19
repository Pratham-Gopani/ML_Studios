import { useState, useEffect } from 'react';
import { Settings2, Play, Loader2, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { trainModel } from '../lib/tfTraining';

export default function Tuning() {
  const { trainSet, testSet, processedDataset, preprocessingConfig, modelConfig, datasetType, imageDataset, updateState } = useWorkflowStore();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');

  useEffect(() => {
    if (datasetType === 'tabular' && preprocessingConfig) {
      setFeatureColumns(preprocessingConfig.selectedFeatures ?? []);
      setTargetColumn(preprocessingConfig.targetVariable ?? '');
    } else if (datasetType === 'tabular' && processedDataset?.columns) {
      const cols = processedDataset.columns;
      setFeatureColumns(cols.slice(0, -1));
      setTargetColumn(cols[cols.length - 1]);
    }
  }, [datasetType, preprocessingConfig, processedDataset]);

  const handleTrain = async () => {
    setIsTraining(true);
    setProgress(0);
    updateState({ error: null });
    const interval = setInterval(() => setProgress(p => Math.min(p + 3, 92)), 200);
    try {
      let currentTrain = trainSet;
      let currentTest = testSet;
      if ((!currentTrain?.length || !currentTest?.length) && processedDataset?.data) {
        const shuffled = [...processedDataset.data];
        for (let i=shuffled.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
        const idx = Math.floor(shuffled.length * 0.8);
        currentTrain = shuffled.slice(0, idx);
        currentTest = shuffled.slice(idx);
        updateState({ trainSet: currentTrain, testSet: currentTest });
      }
      if (!modelConfig) throw new Error('No model selected.');
      const { metrics, model } = await trainModel(
        currentTrain ?? [], currentTest ?? [], modelConfig,
        featureColumns, targetColumn,
        datasetType === 'image' ? imageDataset : null
      );
      clearInterval(interval);
      setProgress(100);
      updateState({ evaluationResults: metrics, trainedModel: model, currentStep: 'results' });
    } catch (err) {
      clearInterval(interval);
      updateState({ error: err instanceof Error ? err.message : 'Training failed' });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-black">Train & Tune</h2><p>Configure hyperparameters and start training <span className="font-semibold text-indigo-600">{modelConfig?.algorithm ?? 'model'}</span>.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border shadow-sm"><h3 className="text-xl font-bold mb-8 flex gap-2"><Settings2 className="w-5 h-5 text-indigo-600" />Hyperparameter Configuration</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-sm font-bold">Tuning Strategy</label><div className="flex gap-2">{['Grid Search', 'Random Search', 'Bayesian'].map((s,i)=><button key={s} className={`px-4 py-2 rounded-xl text-xs font-bold border ${i===0?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-200'}`}>{s}</button>)}</div></div><div className="space-y-2"><label className="text-sm font-bold">Cross-Validation Folds</label><input type="range" min="2" max="10" defaultValue="5" className="w-full accent-indigo-600" /></div></div>
              {modelConfig?.type === 'clustering' && (
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100"><h4 className="text-xs font-bold text-indigo-800 uppercase mb-4">Clustering Parameters</h4>
                  {modelConfig.algorithm === 'K-Means' && (<div className="space-y-2"><label className="text-xs font-bold">Number of Clusters (K)</label><input type="number" min="2" max="10" defaultValue={modelConfig.hyperparameters?.numClusters ?? 3} className="w-full px-3 py-2 bg-white border rounded-lg text-sm" onChange={e=>updateState({ modelConfig: { ...modelConfig, hyperparameters: { ...modelConfig.hyperparameters, numClusters: parseInt(e.target.value) } } })} /></div>)}
                </div>
              )}
              <div className="p-6 bg-slate-50 rounded-2xl border"><h4 className="text-xs font-bold text-slate-400 uppercase">Model Parameters</h4><div className="grid grid-cols-2 gap-4 mt-4"><div><label className="text-xs font-bold">Learning Rate</label><input type="text" defaultValue="0.01" className="w-full px-3 py-2 bg-white border rounded-lg text-xs font-mono" /></div><div><label className="text-xs font-bold">Max Depth</label><input type="text" defaultValue="5" className="w-full px-3 py-2 bg-white border rounded-lg text-xs font-mono" /></div></div></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border"><h3 className="text-lg font-bold mb-6 flex gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" />Evaluation Metrics</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{['Accuracy', 'F1-Score', 'Precision', 'Recall', 'ROC-AUC', 'RMSE'].map(m=><div key={m} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border"><div className="w-4 h-4 rounded-full border-2 border-indigo-600 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" /></div><span className="text-xs font-bold text-slate-600">{m}</span></div>)}</div></div>
        </div>
        <div className="space-y-6"><div className="bg-white p-8 rounded-3xl border shadow-sm sticky top-8"><div className="text-center mb-8"><div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isTraining ? 'bg-indigo-50' : 'bg-slate-50'}`}>{isTraining ? <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /> : <Play className="w-10 h-10 text-slate-300" />}</div><h4 className="font-bold">{isTraining ? 'Training…' : 'Ready to Train'}</h4><p className="text-xs text-slate-500">{modelConfig?.algorithm ?? 'No model selected'}</p></div>{isTraining && <div className="mb-8 space-y-2"><div className="flex justify-between text-[10px] font-bold"><span className="text-indigo-600">Progress</span><span>{progress}%</span></div><div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${progress}%`}} className="h-full bg-indigo-600" /></div></div>}<button onClick={handleTrain} disabled={isTraining || !modelConfig} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50">{isTraining ? 'Training…' : <><span>Start Training</span><ArrowRight className="w-5 h-5" /></>}</button></div></div>
      </div>
    </div>
  );
}
