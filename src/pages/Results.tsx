import { useWorkflowStore } from '../store/useWorkflowStore';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, CheckCircle } from 'lucide-react';
import { exportModel } from '../lib/modelExport';
import ModelComparison from '../components/ModelComparison';

export default function Results() {
  const { evaluationResults, trainedModel, reset } = useWorkflowStore();
  const navigate = useNavigate();

  const handleExport = async () => {
    if (trainedModel) {
      await exportModel(trainedModel, 'ml_model.json');
    }
  };

  const handleNew = () => {
    reset();
    navigate('/');
  };

  if (!evaluationResults) {
    return (
      <div className="text-center p-12">
        <p>No results yet. Train a model first.</p>
        <button onClick={() => navigate('/tuning')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl">Go to Tuning</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Results</h1>
      <div className="grid gap-6">
        <ModelComparison />
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Training Status</h2>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" /> Training completed successfully
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
            <Download className="w-4 h-4" /> Export Model
          </button>
          <button onClick={handleNew} className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold">
            <RefreshCw className="w-4 h-4" /> Start New Project
          </button>
        </div>
      </div>
    </div>
  );
}
