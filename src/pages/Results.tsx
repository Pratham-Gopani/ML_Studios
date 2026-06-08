import { useState } from 'react';
import JSZip from 'jszip';
import { CheckCircle2, Download, Share2, FileText, BarChart3, Table as TableIcon, Cpu, ArrowLeft, Sparkles, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useProjectStore } from '../store/useProjectStore';

export default function Results() {
  const { evaluationResults, modelConfig, updateState } = useWorkflowStore();
  const [exporting, setExporting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState('');

  const { projects, currentProjectId, updateProject } = useProjectStore();
  const currentProject = projects.find(p => p.id === currentProjectId);

  if (!evaluationResults) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-lg font-medium">No results yet. Please train a model first.</p>
    </div>
  );

  const openSaveDialog = () => {
    setProjectName(currentProject?.name || '');
    setShowSaveDialog(true);
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      updateState({ error: 'Please enter a valid project name.' });
      return;
    }
    if (currentProjectId) {
      updateProject(currentProjectId, { name: projectName });
      setShowSaveDialog(false);
    }
  };

  const handleExportModel = async () => {
    if (!evaluationResults?.modelArtifacts) {
      updateState({ error: 'No serialized model artifacts are found. Please re-run the training process.' });
      return;
    }

    setExporting(true);
    try {
      const { modelTopology, weightSpecs, weightDataBase64 } = evaluationResults.modelArtifacts;

      const zip = new JSZip();

      // Reconstruct model.json with standard TF.js JSON structure referencing single binary weight file
      const modelJsonString = JSON.stringify({
        modelTopology,
        weightsManifest: [
          {
            paths: ['model.weights.bin'],
            weights: weightSpecs
          }
        ]
      }, null, 2);

      zip.file('model.json', modelJsonString);

      // Reconstruct weight binary bytes from base64 string
      const binaryString = atob(weightDataBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      zip.file('model.weights.bin', bytes.buffer);

      // Generate localized zip archive
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = `${modelConfig?.algorithm?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'trained_model'}_tfjs.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Failed to export model ZIP bundle:', err);
      updateState({ error: 'Failed to bundle model: ' + err.message });
    } finally {
      setExporting(false);
    }
  };

  const metrics = [
    { label: 'Accuracy', value: evaluationResults.accuracy, color: 'bg-indigo-600' },
    { label: 'F1-Score', value: evaluationResults.f1, color: 'bg-purple-600' },
    { label: 'Precision', value: evaluationResults.precision, color: 'bg-emerald-600' },
    { label: 'Recall', value: evaluationResults.recall, color: 'bg-amber-600' },
  ];

  const featureImportanceData = Object.entries(evaluationResults.featureImportance || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2">
              <CheckCircle2 className="w-5 h-5" />Training Complete
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Model Evaluation <span className="text-indigo-600">Summary</span>
            </h2>
            <p className="text-sm text-slate-500">
              {modelConfig?.algorithm} trained in {evaluationResults.trainingTime?.toFixed(2)}s
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleExportModel}
              disabled={exporting}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              {exporting ? 'Exporting...' : 'Export TF.js Model'}
            </button>
            <button 
              onClick={openSaveDialog}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              <Save className="w-4 h-4" />Save Project
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Share2 className="w-4 h-4" />Share
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.filter(m => m.value !== undefined).map((m) => (
          <div key={m.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{m.label}</span>
            <div className="text-3xl font-black text-slate-900 mb-4">{(m.value! * 100).toFixed(1)}%</div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${m.color}`} style={{ width: `${m.value! * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {modelConfig?.type === 'regression' && evaluationResults.rmse !== undefined && (
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'RMSE', value: evaluationResults.rmse?.toFixed(4) },
            { label: 'MAE', value: evaluationResults.mae?.toFixed(4) },
            { label: 'R² Score', value: evaluationResults.r2?.toFixed(4), highlight: true }
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</span>
              <div className={`text-2xl font-black ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />Feature Importance
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {featureImportanceData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-600" />Confusion Matrix
          </h3>
          <div className="grid grid-cols-2 gap-4 h-[350px]">
            {evaluationResults.confusionMatrix?.flat().map((val, i) => (
              <div key={i} className={`flex flex-col items-center justify-center rounded-2xl border-2 ${i === 0 || i === 3 ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-2xl font-black text-slate-900">{val}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {i === 0 ? 'True Positive' : i === 1 ? 'False Positive' : i === 2 ? 'False Negative' : 'True Negative'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-indigo-900 p-6 sm:p-10 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full -mr-48 -mt-48 blur-3xl opacity-20" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-300" />Next Steps
          </h3>
          <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed mb-8">
            Your model is ready. Download the trained artifact or generate a full technical report for stakeholders.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-2xl text-sm font-bold hover:bg-indigo-50">
              <FileText className="w-4 h-4" />Download Report
            </button>
            <button onClick={() => updateState({ currentStep: 'insights' })}
              className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-900 rounded-2xl text-lg font-black hover:bg-indigo-50 shadow-xl">
              <Sparkles className="w-5 h-5 text-indigo-600" />See AI Insights
            </button>
            <button onClick={() => updateState({ currentStep: 'overview' })}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-700 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 border border-indigo-600">
              <ArrowLeft className="w-4 h-4" />New Experiment
            </button>
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-3xl w-96 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-600" />Rename & Save Project
            </h3>
            <p className="text-xs text-slate-500 mb-4">Enter a descriptive name for your machine learning project.</p>
            <input 
              type="text" 
              placeholder="e.g., Cat vs Dog CNN Classifier" 
              value={projectName} 
              onChange={e => setProjectName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSaveProject()} 
              className="w-full border border-slate-200 rounded-xl p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" 
              autoFocus 
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-650 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSaveProject} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100">
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
