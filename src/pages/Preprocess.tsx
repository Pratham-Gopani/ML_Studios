import { useState } from 'react';
import { Wand2, ArrowRight, CheckCircle2, ChevronDown, ListFilter, Trash2, Sparkles, Loader2, Image as ImageIcon, Layers, RefreshCw } from 'lucide-react';
import { PreprocessingConfig } from '../types';
import { mlService, aiService } from '../services/api';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Preprocess() {
  const { rawDataset, preprocessingConfig, updateState, aiGuidance } = useWorkflowStore();
  const [config, setConfig] = useState<PreprocessingConfig>(preprocessingConfig || {
    missingValueStrategy: 'mean',
    encoding: {},
    scaling: 'standard',
    selectedFeatures: rawDataset?.columns || [],
    targetVariable: rawDataset?.columns?.[rawDataset.columns.length - 1] || 'label',
    trainTestSplit: 0.8,
    randomSeed: 42
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(aiGuidance.preprocess || '');

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    try {
      const guidance = await aiService.getGuidance('preprocess', {
        goal: useWorkflowStore.getState().goal,
        rawDataset: rawDataset ? { columns: rawDataset.columns, shape: rawDataset.shape, missingValues: rawDataset.missingValues, columnTypes: rawDataset.columnTypes } : null
      });
      setAiSuggestion(guidance);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApply = async () => {
    if (!rawDataset) return;
    setIsProcessing(true);
    try {
      const { processed, train, test } = await mlService.preprocess(rawDataset, config);
      updateState({ processedDataset: processed, trainSet: train, testSet: test, preprocessingConfig: config, currentStep: 'analyze' });
    } catch (err) {
      updateState({ error: 'Preprocessing failed. Please check your configuration.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFeature = (col: string) => {
    setConfig(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(col)
        ? prev.selectedFeatures.filter(f => f !== col)
        : [...prev.selectedFeatures, col]
    }));
  };

  if (!rawDataset) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Trash2 className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-lg font-medium">Please import a dataset first</p>
    </div>
  );

  // High quality specialized Image Preprocessing Panel
  if (rawDataset.isImage) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Computer Vision Preprocessing Pipeline</h3>
                <p className="text-xs text-slate-500">Automated normalisation, tensor encoding, and dimensionality mapping.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" /> Dimension Target
                </div>
                <div className="font-extrabold text-slate-900 text-lg">128 × 128 Pixels</div>
                <div className="text-xs text-slate-500 font-medium">Bilinear scaling ratio down-sampling with RGB tensor flattening.</div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                  <RefreshCw className="w-4 h-4" /> Pixel Normalisation
                </div>
                <div className="font-extrabold text-slate-900 text-lg">Range [0.0, 1.0]</div>
                <div className="text-xs text-slate-500 font-medium">Auto floating-point division by 255.0 to optimize optimizer convergence.</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <label className="text-sm font-bold text-slate-700">Train/Test Distribution Split</label>
              <div className="flex items-center gap-4">
                <input type="range" min="0.5" max="0.9" step="0.05" value={config.trainTestSplit}
                  onChange={(e) => setConfig(p => ({ ...p, trainTestSplit: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <span className="text-xs font-black text-indigo-600 w-20 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-center">
                  {Math.round(config.trainTestSplit * 100)}% Train
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Splits your zip collection into mutually exclusive subsets. The model trains on {Math.round(config.trainTestSplit * 100)}% of images and makes final blind evaluations on the remaining {Math.round((1 - config.trainTestSplit) * 100)}%.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">ZIP Dataset Properties</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Classes</span>
                <p className="text-lg font-black text-slate-800 mt-1">{rawDataset.summaryStats?.numClasses || 0}</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 text-center col-span-2 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Detected folders / classes</span>
                <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                  {rawDataset.summaryStats?.classNames?.join(', ') || 'No subfolders detected'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
            <h4 className="font-bold text-slate-900 mb-6">Summary</h4>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pipeline Mode</span>
                <span className="font-bold text-indigo-600">Computer Vision</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Input Resolution</span>
                <span className="font-bold text-slate-900">128 × 128 (RGB)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Classes Detected</span>
                <span className="font-bold text-slate-900">{rawDataset.summaryStats?.numClasses || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Train/Validation ratio</span>
                <span className="font-bold text-slate-900">{Math.round(config.trainTestSplit * 100)}/{Math.round((1 - config.trainTestSplit) * 100)}</span>
              </div>
            </div>
            <button onClick={handleApply} disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? <><Wand2 className="w-5 h-5 animate-spin" />Assembling Tensors...</> : <>Scale & Segment Dataset<ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-600" />
                Preprocessing Configuration
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={handleAiSuggest} disabled={isAiLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  AI Suggestion
                </button>
                <span className="text-[10px] text-slate-500 font-bold border border-slate-100 bg-slate-50 rounded-full px-3 py-1">
                  {rawDataset.columns.length} Features
                </span>
              </div>
            </div>

            {aiSuggestion && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-700 leading-relaxed">
                <strong className="block mb-1">AI Suggestion:</strong>
                {aiSuggestion}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Missing Values Strategy <ChevronDown className="w-4 h-4 text-slate-400" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['mean', 'median', 'mode', 'drop'] as const).map(s => (
                    <button key={s} onClick={() => setConfig(p => ({ ...p, missingValueStrategy: s }))}
                      className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${config.missingValueStrategy === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Feature Scaling <ChevronDown className="w-4 h-4 text-slate-400" />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'minmax', 'none'] as const).map(s => (
                    <button key={s} onClick={() => setConfig(p => ({ ...p, scaling: s }))}
                      className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all ${config.scaling === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700">Target Variable</label>
                <select value={config.targetVariable} onChange={(e) => setConfig(p => ({ ...p, targetVariable: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                  {rawDataset.columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700">Train/Test Split</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="0.5" max="0.9" step="0.05" value={config.trainTestSplit}
                    onChange={(e) => setConfig(p => ({ ...p, trainTestSplit: parseFloat(e.target.value) }))}
                    className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600 w-16">{Math.round(config.trainTestSplit * 100)}% Train</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-indigo-600" />
                Feature Selection
              </h3>
              <button onClick={() => setConfig(p => ({ ...p, selectedFeatures: rawDataset.columns }))}
                className="text-xs font-bold text-indigo-600 hover:underline">
                Select All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {rawDataset.columns.map(col => (
                <button key={col} disabled={col === config.targetVariable} onClick={() => toggleFeature(col)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all text-left ${
                    col === config.targetVariable ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' :
                    config.selectedFeatures.includes(col) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                  }`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${config.selectedFeatures.includes(col) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                    {config.selectedFeatures.includes(col) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{col}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
            <h4 className="font-bold text-slate-900 mb-6">Summary</h4>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Selected Features</span>
                <span className="font-bold text-slate-900">{config.selectedFeatures.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Target Variable</span>
                <span className="font-bold text-indigo-600 truncate ml-2">{config.targetVariable || 'None'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Split Ratio</span>
                <span className="font-bold text-slate-900">{Math.round(config.trainTestSplit * 100)}/{Math.round((1 - config.trainTestSplit) * 100)}</span>
              </div>
            </div>
            <button onClick={handleApply} disabled={isProcessing || !config.targetVariable}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? <><Wand2 className="w-5 h-5 animate-spin" />Processing...</> : <>Apply & Analyze<ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
