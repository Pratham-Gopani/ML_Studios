import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DatasetSnapshot } from '../types';
import { processFile } from '../lib/ml-engine';

interface ImportDatasetProps {
  onDatasetLoaded: (snapshot: DatasetSnapshot) => void;
}

export default function ImportDataset({ onDatasetLoaded }: ImportDatasetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const snapshot = await processFile(acceptedFiles[0]);
      onDatasetLoaded(snapshot);
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
    } finally {
      setLoading(false);
    }
  }, [onDatasetLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'],
      'application/zip': ['.zip']
    },
    maxFiles: 1
  });

  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center cursor-pointer bg-gray-50 dark:bg-gray-800"
         {...getRootProps()}>
      <input {...getInputProps()} />
      {loading ? (
        <p>Processing file...</p>
      ) : isDragActive ? (
        <p>Drop the file here...</p>
      ) : (
        <div>
          <p className="text-lg font-medium">Drag & drop a dataset</p>
          <p className="text-sm text-gray-500 mt-1">
            CSV, Excel, JSON, or ZIP (images organised in subfolders)
          </p>
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md">
            Select file
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-red-600">{error}</p>}
    </div>
  );
}
