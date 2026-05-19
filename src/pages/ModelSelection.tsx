import { useState } from 'react';
import { Brain, GitBranch, Layers, Sigma, Grid, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import type { ModelConfig } from '../types';

const GROUPS = [
  { type: 'classification' as const, label: 'Classification', icon: Brain, color: 'indigo', algorithms: ['Logistic Regression', 'Random Forest Classifier', 'Neural Network Classifier', 'Support Vector Machine', 'Gradient Boosting Classifier'] },
  { type: 'regression' as const, label: 'Regression', icon: Sigma, color: 'violet', algorithms: ['Linear Regression', 'Ridge Regression', 'Lasso Regression', 'Random Forest Regressor', 'Neural Network Regressor'] },
  { type: 'clustering' as const, label: 'Clustering', icon: Grid, color: 'emerald', algorithms: ['K-Means', 'DBSCAN', 'Hierarchical Clustering'] },
];

export default function ModelSelection() {
  const { datasetType, updateState } = useWorkflowStore();
  const [selectedType, setSelectedType] = useState<ModelConfig['type']>('classification');
  const [selectedAlgo, setSelectedAlgo] = useState('');
  const group = GROUPS.find(g => g.type === selectedType)!;

  const handleContinue = () => {
    if (!selectedAlgo) { alert('Select an algorithm.'); return; }
    updateState({ modelConfig: { type: selectedType, algorithm: selectedAlgo, hyperparameters: selectedType === 'clustering' ? { numClusters: 3 } : {} }, currentStep: 'tuning' });
  };

  if (datasetType === 'image') {
    return (<div className="space-y-8"><div><h2 className="text-2xl font-black">Select Model</h2><p>Image dataset – CNN will be used automatically.</p></div><div className="bg-white p-8 rounded-3xl border border-indigo-200"><div className="flex items-center gap-3 mb-4"><Layers className="w-8 h-8 text-indigo-600" /><div><h3 className="font-bold">Convolutional Neural Network</h3><p className="text-sm text-slate-500">2 Conv layers + Dense + Dropout</p></div></div><div className="grid grid-cols-2 gap-2 text-sm">{['Conv2D (32)', 'MaxPooling2D', 'Conv2D (64)', 'Dense (128)', 'Dropout 50%', 'Softmax'].map(l=><div key={l} className="bg-indigo-50 px-3 py-2 rounded-lg text-indigo-700 font-medium text-xs">{l}</div>)}</div></div><button onClick={()=>updateState({ modelConfig: { type:'classification', algorithm:'CNN', hyperparameters:{} }, currentStep:'tuning' })} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Use CNN<ArrowRight className="w-5 h-5" /></button></div>);
  }

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-black">Select Model</h2><p>Choose problem type and algorithm.</p></div>
      <div className="flex flex-wrap gap-3">{GROUPS.map(g => (<button key={g.type} onClick={()=>{ setSelectedType(g.type); setSelectedAlgo(''); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${selectedType===g.type ? `bg-${g.color}-600 text-white shadow-lg` : 'bg-white border border-slate-200 text-slate-600'}`}><g.icon className="w-4 h-4" />{g.label}</button>))}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{group.algorithms.map(algo => (<button key={algo} onClick={()=>setSelectedAlgo(algo)} className={`text-left p-5 rounded-2xl border-2 transition-all ${selectedAlgo===algo ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}><GitBranch className={`w-5 h-5 mb-3 ${selectedAlgo===algo ? 'text-indigo-600' : 'text-slate-300'}`} /><p className="font-bold text-sm">{algo}</p></button>))}</div>
      <button onClick={handleContinue} disabled={!selectedAlgo} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-40">Configure & Train<ArrowRight className="w-5 h-5" /></button>
    </div>
  );
}
