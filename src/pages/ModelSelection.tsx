import { useState, useEffect } from 'react';
import { Cpu, ChevronRight, Sparkles, Loader2, BrainCircuit, Network, LineChart, Image as ImageIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { ModelConfig } from '../types';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { aiService } from '../services/api';

const MODEL_FAMILIES = [
  { id: 'classification', name: 'Classification', description: 'Predict categorical labels (e.g., Spam or Not Spam)', icon: BrainCircuit, algorithms: ['Logistic Regression', 'Random Forest', 'SVM', 'XGBoost', 'Neural Network'] },
  { id: 'regression', name: 'Regression', description: 'Predict continuous values (e.g., House Prices)', icon: LineChart, algorithms: ['Linear Regression', 'Ridge', 'Lasso', 'Random Forest Regressor', 'XGBoost Regressor'] },
  { id: 'clustering', name: 'Clustering', description: 'Group similar data points together', icon: Network, algorithms: ['K-Means', 'DBSCAN', 'Hierarchical Clustering'] }
];

const IMAGE_FAMILIES = [
  { id: 'image-classification', name: 'Image Classification', description: 'Classify visual patterns into category classes', icon: ImageIcon, algorithms: ['CNN', 'RNN (Spatial LSTM)', 'VGG16 (Simplified Deep Net)'] }
];

export default function ModelSelection() {
  const { rawDataset, modelConfig, featureEngineeringGuidance, updateState } = useWorkflowStore();
  
  const isImageDataset = !!rawDataset?.isImage;
  const initialFamily = isImageDataset ? 'image-classification' : (modelConfig?.type || null);
  
  const [selectedFamily, setSelectedFamily] = useState<string | null>(initialFamily);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [guidance, setGuidance] = useState(featureEngineeringGuidance || '');

  useEffect(() => {
    if (isImageDataset) {
      setSelectedFamily('image-classification');
    }
  }, [isImageDataset]);

  const familiesToRender = isImageDataset ? IMAGE_FAMILIES : MODEL_FAMILIES;

  const handleFetchGuidance = async () => {
    if (!rawDataset || !selectedFamily) return;
    setLoadingGuidance(true);
    try {
      const tempConfig: ModelConfig = { type: selectedFamily as any, algorithm: isImageDataset ? 'CNN' : 'Random Forest', hyperparameters: {} };
      const result = await aiService.getFeatureEngineering(rawDataset, tempConfig, useWorkflowStore.getState().goal);
      setGuidance(result);
      updateState({ featureEngineeringGuidance: result });
    } finally {
      setLoadingGuidance(false);
    }
  };

  const handleSelectAlgorithm = (algo: string) => {
    if (!selectedFamily) return;
    
    // Select stable default learning rates per algorithm class
    let defaultLr = 0.01;
    if (isImageDataset) {
      if (algo.toLowerCase().includes('vgg')) {
        defaultLr = 0.0005; // Deeper models require a smaller learning rate to prevent divergence
      } else {
        defaultLr = 0.001;  // Standard CNN or Spatial LSTM
      }
    }

    const config: ModelConfig = { 
      type: selectedFamily as any, 
      algorithm: algo, 
      hyperparameters: {},
      taskType: isImageDataset ? 'classification' : (selectedFamily === 'regression' ? 'regression' : 'classification'),
      epochs: isImageDataset ? 5 : 10,
      batchSize: 32,
      learningRate: defaultLr,
      validationSplit: 0.2
    };
    updateState({ modelConfig: config, currentStep: 'tune' });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {familiesToRender.map(family => {
          const Icon = family.icon;
          const isActive = selectedFamily === family.id;
          return (
            <button key={family.id} onClick={() => setSelectedFamily(family.id)}
              className={`p-8 rounded-3xl border-2 transition-all text-left group ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isActive ? 'bg-white/20' : 'bg-indigo-50 group-hover:bg-indigo-100'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{family.name}</h3>
              <p className={`text-xs leading-relaxed ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>{family.description}</p>
            </button>
          );
        })}
      </div>

      {selectedFamily && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Select Algorithm
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {familiesToRender.find(f => f.id === selectedFamily)?.algorithms.map(algo => (
                <button key={algo} onClick={() => handleSelectAlgorithm(algo)}
                   className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-white transition-all group">
                  <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{algo}</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900">AI Deep Learning Suggestions</h4>
            </div>
            {guidance ? (
              <div className="prose prose-slate prose-xs max-w-none text-xs leading-relaxed">
                <Markdown>{guidance}</Markdown>
                <button onClick={handleFetchGuidance} className="mt-4 text-[10px] font-bold text-indigo-600 hover:underline">Regenerate</button>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-500 mb-4">Get tailored suggestions based on your dataset.</p>
                <button onClick={handleFetchGuidance} disabled={loadingGuidance || !selectedFamily}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {loadingGuidance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get AI Suggestions
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
