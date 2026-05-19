import { useState, useEffect } from 'react';
import { Sliders, Table, CheckSquare, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Preprocessing() {
  const { processedDataset, datasetType, imageDataset, updateState } = useWorkflowStore();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [dropMissing, setDropMissing] = useState(true);

  const columns: string[] = processedDataset?.columns ?? [];
  const data: Record<string, string>[] = processedDataset?.data ?? [];

  useEffect(() => {
    if (columns.length && selectedFeatures.length === 0) {
      const last = columns[columns.length - 1];
      setTargetColumn(last);
      setSelectedFeatures(columns.slice(0, -1));
    }
  }, [columns]);

  const toggleFeature = (col: string) => setSelectedFeatures(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);

  const handleApply = () => {
    if (datasetType === 'image' && imageDataset) {
      updateState({ preprocessingConfig: { type: 'image' }, currentStep: 'model-selection' });
      return;
    }
    if (!targetColumn || selectedFeatures.length === 0) { alert('Select features and target.'); return; }
    let rows = [...data];
    if (dropMissing) rows = rows.filter(row => [...selectedFeatures, targetColumn].every(col => row[col] !== '' && row[col] !== undefined));
    for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
    const idx = Math.floor(rows.length * splitRatio);
    updateState({ trainSet: rows.slice(0, idx), testSet: rows.slice(idx), preprocessingConfig: { selectedFeatures, targetVariable: targetColumn, splitRatio, dropMissing }, currentStep: 'model-selection' });
  };

  if (datasetType === 'image' && imageDataset) {
    return (
      <div className="space-y-8">
        <div><h2 className="text-2xl font-black">Preprocessing</h2><p>Image dataset loaded – images are 128×128 and normalized.</p></div>
        <div className="bg-white p-8 rounded-3xl border"><div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 p-4 text-center"><p className="text-xs uppercase font-bold">Images</p><p className="text-2xl font-black">{imageDataset.images.length}</p></div><div className="bg-slate-50 p-4 text-center"><p className="text-xs uppercase font-bold">Classes</p><p className="text-2xl font-black">{imageDataset.numClasses}</p></div></div><div className="flex flex-wrap gap-2 mt-4">{imageDataset.labelNames.map((name: string) => <span key={name} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{name}</span>)}</div></div>
        <button onClick={handleApply} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Continue<ArrowRight className="w-5 h-5" /></button>
      </div>
    );
  }

  if (!processedDataset || !columns.length) return <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Sliders className="w-12 h-12 mb-4 opacity-20" /><p>No dataset loaded.</p></div>;

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-black">Preprocessing</h2><p>{data.length} rows × {columns.length} columns</p></div>
      <div className="bg-white rounded-3xl border overflow-hidden"><div className="px-6 py-4 border-b"><Table className="w-4 h-4 text-indigo-500 inline mr-2" />Data Preview (first 5)</div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-slate-50">{columns.map(col => <th key={col} className="px-4 py-2 text-left font-bold">{col}</th>)}</tr></thead><tbody>{data.slice(0,5).map((row,i)=><tr key={i} className="border-t">{columns.map(col=><td key={col} className="px-4 py-2">{row[col]}</td>)}</tr>)}</tbody></table></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border"><h3 className="font-bold mb-4 flex gap-2"><CheckSquare className="w-4 h-4" />Feature Columns</h3><div className="space-y-2 max-h-60 overflow-y-auto">{columns.map(col => (<label key={col} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${col===targetColumn ? 'opacity-40 cursor-not-allowed' : selectedFeatures.includes(col) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}><input type="checkbox" checked={selectedFeatures.includes(col)} disabled={col===targetColumn} onChange={()=>toggleFeature(col)} className="accent-indigo-600" /><span className="text-sm font-medium">{col}</span></label>))}</div></div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border"><h3 className="font-bold mb-4">Target Column</h3><select value={targetColumn} onChange={e=>{ setTargetColumn(e.target.value); setSelectedFeatures(prev=>prev.filter(c=>c!==e.target.value)); }} className="w-full px-3 py-2 border rounded-xl text-sm">{columns.map(col=><option key={col} value={col}>{col}</option>)}</select></div>
          <div className="bg-white p-6 rounded-3xl border"><h3 className="font-bold mb-4">Train / Test Split</h3><div className="flex justify-between text-sm"><span>Train: {Math.round(splitRatio*100)}%</span><span>Test: {Math.round((1-splitRatio)*100)}%</span></div><input type="range" min={50} max={90} step={5} value={Math.round(splitRatio*100)} onChange={e=>setSplitRatio(parseInt(e.target.value)/100)} className="w-full accent-indigo-600" /></div>
          <div className="bg-white p-6 rounded-3xl border"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={dropMissing} onChange={e=>setDropMissing(e.target.checked)} className="accent-indigo-600" /><div><p className="font-bold text-sm">Drop missing values</p><p className="text-xs text-slate-400">Remove rows with empty cells.</p></div></label></div>
        </div>
      </div>
      <button onClick={handleApply} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Apply & Continue<ArrowRight className="w-5 h-5" /></button>
    </div>
  );
}
