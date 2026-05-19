import { useState, useRef } from 'react';
import { Upload, FileText, ImageIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import ImageImport from '../components/ImageImport';

function parseCSV(text: string): { columns: string[]; data: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have header and data rows.');
  const columns = lines[0].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(columns.map((col, i) => [col, values[i] ?? '']));
  });
  return { columns, data };
}

export default function DatasetImport() {
  const [mode, setMode] = useState<'tabular' | 'image'>('tabular');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { updateState, setDatasetType } = useWorkflowStore();

  const processFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const { columns, data } = parseCSV(text);
      const dataset = { columns, data, fileName: file.name, rowCount: data.length };
      setDatasetType('tabular');
      updateState({ rawDataset: dataset, processedDataset: dataset, currentStep: 'preprocessing' });
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-black">Import Dataset</h2><p className="text-slate-500">Choose data type.</p></div>
      <div className="flex gap-3">
        {(['tabular', 'image'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
            {m === 'tabular' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            {m === 'tabular' ? 'Tabular (CSV)' : 'Image (ZIP)'}
          </button>
        ))}
      </div>
      {mode === 'tabular' ? (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()} className={`cursor-pointer border-2 border-dashed rounded-3xl p-16 text-center transition-all ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
          <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-700 mb-1">Drop CSV file here, or click to browse</p>
          <p className="text-sm text-slate-400">First row must be column headers.</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
        </div>
      ) : <ImageImport />}
      {error && <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700"><AlertCircle className="w-5 h-5" /><p className="text-sm font-medium">{error}</p></div>}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-3 text-sm">Sample CSV</h3>
        <pre className="text-xs font-mono text-slate-500 overflow-x-auto">{`age,income,education,purchased\n25,45000,Bachelor,1\n34,72000,Master,0`}</pre>
        <button onClick={() => { const csv = `age,income,education,purchased\n25,45000,3,1\n34,72000,4,0`; const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sample.csv'; a.click(); URL.revokeObjectURL(url); }} className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"><ArrowRight className="w-3 h-3" /> Download sample CSV</button>
      </div>
    </div>
  );
}
