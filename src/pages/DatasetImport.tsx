import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { parseCSV } from '../lib/csvParser';

export default function DataImport() {
  const navigate = useNavigate();
  const { updateState } = useWorkflowStore();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      if (file.name.endsWith('.csv')) {
        const { data, columns } = await parseCSV(file);
        updateState({
          rawDataset: { data, columns },
          processedDataset: { data, columns },
          datasetType: 'tabular',
          currentStep: 'preprocessing'
        });
        navigate('/preprocessing');
      } else if (file.name.endsWith('.zip')) {
        updateState({
          datasetType: 'image',
          imageDataset: { file, status: 'loaded' },
          currentStep: 'preprocessing'
        });
        navigate('/preprocessing');
      } else {
        setError('Unsupported file type. Please upload CSV or ZIP.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Import Dataset</h1>
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">Drag & drop your dataset</p>
        <p className="text-sm text-gray-500 mb-4">CSV (tabular) or ZIP (images)</p>
        <input
          type="file"
          id="file-upload"
          accept=".csv,.zip"
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Choose File
        </label>
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
    </div>
  );
}
