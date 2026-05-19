import { useState } from 'react';
import { CheckCircle2, Download, Share2, FileText, BarChart3, Table as TableIcon, Cpu, ArrowLeft, Sparkles, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { saveProject } from '../services/projectStorage';
import { generateModelZip } from '../utils/modelExport';
import { saveAs } from 'file-saver';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

export default function Results() {
  const { evaluationResults, modelConfig, trainedModel, updateState, rawDataset, processedDataset, preprocessingConfig, trainSet, testSet, featureEngineeringGuidance, datasetType, imageDataset } = useWorkflowStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState('');

  const exportModel = async () => {
    if (!trainedModel) { alert('No trained model to export.'); return; }
    try {
      const blob = await generateModelZip(trainedModel);
      saveAs(blob, `${modelConfig?.algorithm ?? 'model'}_model.zip`);
    } catch (err) { alert('Export failed: ' + (err as Error).message); }
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) { alert('Enter project name.'); return; }
    let modelBlob: Blob | undefined;
    if (trainedModel) { try { modelBlob = await generateModelZip(trainedModel); } catch (err) { console.warn(err); } }
    await saveProject({
      name: projectName,
      state: { rawDataset, processedDataset, preprocessingConfig, modelConfig, evaluationResults, trainSet, testSet, featureEngineeringGuidance, currentStep: 'results', error: null, datasetType, imageDataset: datasetType === 'image' ? { labelNames: imageDataset?.labelNames, numClasses: imageDataset?.numClasses } : null },
      modelBlob,
    });
    alert('Project saved!');
    setShowSaveDialog(false);
    setProjectName('');
  };

  if (!evaluationResults) return (<div className="flex flex-col items-center justify-center py-20 text-slate-400"><CheckCircle2 className="w-12 h-12 mb-4 opacity-20" /><p className="text-lg font-medium">No results yet. Train a model first.</p></div>);

  const isClustering = evaluationResults.isClustering === true;
  const metrics = !isClustering ? [
    { label: 'Accuracy', value: evaluationResults.accuracy, color: 'bg-indigo-600' },
    { label: 'F1-Score', value: evaluationResults.f1, color: 'bg-purple-600' },
    { label: 'Precision', value: evaluationResults.precision, color: 'bg-emerald-600' },
    { label: 'Recall', value: evaluationResults.recall, color: 'bg-amber-600' },
  ].filter(m => m.value !== undefined) : [];

  const featureImportanceData = Object.entries(evaluationResults.featureImportance ?? {}).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value - a.value).slice(0,8);

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" /><div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8"><div><div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-2"><CheckCircle2 className="w-5 h-5" />Training Complete</div><h2 className="text-2xl sm:text-3xl font-extrabold">Model Evaluation <span className="text-indigo-600">Summary</span></h2><p className="text-sm text-slate-500">{modelConfig?.algorithm} trained in {evaluationResults.trainingTime?.toFixed(2)}s</p></div><div className="flex gap-4"><button onClick={exportModel} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 shadow-sm"><Download className="w-4 h-4" />Export Model</button><button onClick={()=>setShowSaveDialog(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100"><Save className="w-4 h-4" />Save Project</button><button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold"><Share2 className="w-4 h-4" />Share</button></div></div></div>

      {!isClustering ? (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{metrics.map(m=><div key={m.label} className="bg-white p-6 rounded-3xl border text-center"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{m.label}</span><div className="text-3xl font-black text-slate-900 mb-4">{(m.value!*100).toFixed(1)}%</div><div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${m.color}`} style={{width:`${m.value!*100}%`}} /></div></div>)}</div>
        {modelConfig?.type === 'regression' && evaluationResults.rmse !== undefined && (<div className="grid grid-cols-3 gap-6">{[
          { label: 'RMSE', value: evaluationResults.rmse?.toFixed(4) },
          { label: 'MAE', value: evaluationResults.mae?.toFixed(4) },
          { label: 'R² Score', value: evaluationResults.r2?.toFixed(4), highlight: true }
        ].map(({label,value,highlight})=><div key={label} className="bg-white p-6 rounded-3xl border text-center"><span className="text-xs font-bold text-slate-400 uppercase block mb-2">{label}</span><div className={`text-2xl font-black ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{value}</div></div>)}</div>)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featureImportanceData.length > 0 && (<div className="bg-white p-8 rounded-3xl border"><h3 className="text-xl font-bold mb-8 flex gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" />Feature Importance</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={featureImportanceData} layout="vertical" margin={{left:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} /><Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} /><Bar dataKey="value" radius={[0,4,4,0]}>{featureImportanceData.map((_,idx)=><Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>)}
          {evaluationResults.confusionMatrix && (<div className="bg-white p-8 rounded-3xl border"><h3 className="text-xl font-bold mb-8 flex gap-2"><TableIcon className="w-5 h-5 text-indigo-600" />Confusion Matrix</h3><div className="grid grid-cols-2 gap-4">{evaluationResults.confusionMatrix.flat().map((val,i)=><div key={i} className={`flex flex-col items-center justify-center rounded-2xl border-2 p-8 ${i===0||i===3?'bg-indigo-50 border-indigo-200':'bg-slate-50 border-slate-100'}`}><span className="text-3xl font-black text-slate-900">{val}</span><span className="text-[10px] font-bold text-slate-400 uppercase mt-2">{i===0?'True Pos':i===1?'False Pos':i===2?'False Neg':'True Neg'}</span></div>)}</div></div>)}
        </div>
      </>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border text-center"><span className="text-xs font-bold uppercase block mb-2">Algorithm</span><div className="text-2xl font-black">{evaluationResults.algorithm}</div></div>
          <div className="bg-white p-6 rounded-3xl border text-center"><span className="text-xs font-bold uppercase block mb-2">Number of Clusters</span><div className="text-3xl font-black text-indigo-600">{evaluationResults.numClusters}</div></div>
          <div className="bg-white p-6 rounded-3xl border text-center"><span className="text-xs font-bold uppercase block mb-2">Inertia (WCSS)</span><div className="text-xl font-black text-slate-900">{evaluationResults.inertia?.toFixed(2)}</div></div>
          <div className="bg-white p-6 rounded-3xl border text-center"><span className="text-xs font-bold uppercase block mb-2">Silhouette Score</span><div className="text-2xl font-black text-emerald-600">{evaluationResults.silhouette?.toFixed(3)}</div><div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4"><div className="h-full bg-emerald-600" style={{width: `${((evaluationResults.silhouette||0)+1)/2*100}%`}} /></div></div>
        </div>
      )}

      <div className="bg-indigo-900 p-6 sm:p-10 rounded-3xl text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full -mr-48 -mt-48 blur-3xl opacity-20" /><div className="relative z-10"><h3 className="text-xl font-bold mb-4 flex gap-3"><Cpu className="w-6 h-6 text-indigo-300" />Next Steps</h3><p className="text-sm text-indigo-100 max-w-2xl leading-relaxed mb-8">Your model is ready. Download, save, or start a new experiment.</p><div className="flex flex-wrap gap-4"><button className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-2xl text-sm font-bold hover:bg-indigo-50"><FileText className="w-4 h-4" />Download Report</button><button onClick={()=>updateState({currentStep:'overview'})} className="flex items-center gap-2 px-6 py-3 bg-indigo-700 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 border border-indigo-600"><ArrowLeft className="w-4 h-4" />New Experiment</button><button onClick={()=>updateState({currentStep:'projects'})} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-2xl text-sm font-bold hover:bg-white/20 border border-white/20"><Sparkles className="w-4 h-4" />View All Projects</button></div></div></div>

      {showSaveDialog && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-2xl w-96 shadow-2xl"><h3 className="text-lg font-bold mb-4">Save Project</h3><input type="text" placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSaveProject()} className="w-full border border-slate-200 rounded-xl p-3 mb-4 text-sm" autoFocus /><div className="flex justify-end gap-2"><button onClick={()=>setShowSaveDialog(false)} className="px-4 py-2 border rounded-xl text-sm font-medium">Cancel</button><button onClick={handleSaveProject} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Save</button></div></div></div>)}
    </div>
  );
}
