import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Brain, TrendingUp, CircleDot, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

const models = {
  classification: [
    { name: 'Logistic Regression', icon: TrendingUp },
    { name: 'Random Forest Classifier', icon: Brain }
  ],
  regression: [
    { name: 'Random Forest Regressor', icon: Brain }
  ],
  clustering: [
    { name: 'K-Means', icon: CircleDot }
  ]
};

export default function ModelSelection() {
  const navigate = useNavigate();
  const { updateState, modelConfig } = useWorkflowStore();
  const [selectedType, setSelectedType] = useState<'classification' | 'regression' | 'clustering'>(
    modelConfig?.type || 'classification'
  );
  const [selectedAlgo, setSelectedAlgo] = useState<string>(modelConfig?.algorithm || '');

  const handleNext = () => {
    if (!selectedAlgo) return;
    updateState({
      modelConfig: {
        type: selectedType,
        algorithm: selectedAlgo,
        hyperparameters: getDefaultParams(selectedType, selectedAlgo)
      },
      currentStep: 'tuning'
    });
    navigate('/tuning');
  };

  const getDefaultParams = (type: string, algo: string) => {
    if (type === 'classification') return { nEstimators: 100, maxDepth: 10 };
    if (type === 'regression') return { nEstimators: 100, maxDepth: 10 };
    return { numClusters: 3 };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Select Model</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Problem Type</h2>
        <div className="flex gap-4">
          {(['classification', 'regression', 'clustering'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setSelectedType(type); setSelectedAlgo(''); }}
              className={`px-6 py-2 rounded-xl font-medium transition ${
                selectedType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models[selectedType].map(model => {
          const Icon = model.icon;
          return (
            <button
              key={model.name}
              onClick={() => setSelectedAlgo(model.name)}
              className={`p-6 rounded-2xl border-2 transition text-left ${
                selectedAlgo === model.name ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <Icon className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-lg">{model.name}</h3>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedAlgo}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
        >
          Next: Hyperparameter Tuning <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
