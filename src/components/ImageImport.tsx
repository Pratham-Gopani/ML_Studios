import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import JSZip from 'jszip';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function ImageImport() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { setDatasetType, setImageDataset, updateState } = useWorkflowStore();

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setSummary(null);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const images: tf.Tensor3D[] = [];
      const labels: number[] = [];
      const labelMap: Record<string, number> = {};
      let labelCounter = 0;
      for (const [path, zipEntry] of Object.entries(contents.files)) {
        if (zipEntry.dir) continue;
        const parts = path.split('/');
        const folder = parts.length > 1 ? parts[0] : null;
        if (!folder) continue;
        const ext = path.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) continue;
        if (!(folder in labelMap)) labelMap[folder] = labelCounter++;
        const blob = await zipEntry.async('blob');
        const img = new Image();
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });
        const tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([128, 128]).toFloat().div(255.0) as tf.Tensor3D;
        images.push(tensor);
        labels.push(labelMap[folder]);
        URL.revokeObjectURL(url);
      }
      if (images.length === 0) throw new Error('No valid images found in ZIP.');
      const imageDataset = {
        images, labels, labelNames: Object.keys(labelMap), numClasses: labelCounter, imageSize: [128, 128, 3] as [number, number, number]
      };
      setDatasetType('image');
      setImageDataset(imageDataset);
      updateState({ processedDataset: { type: 'image', ...imageDataset } });
      setSummary(`Loaded ${images.length} images across ${labelCounter} classes: ${Object.keys(labelMap).join(', ')}`);
    } catch (err) {
      alert('Failed to process ZIP: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-200">
      <h2 className="text-xl font-bold mb-2">Import Image Dataset (ZIP)</h2>
      <p className="text-sm text-slate-500 mb-6">Upload a ZIP where each subfolder name is the class label.</p>
      <input type="file" accept=".zip" onChange={handleZipUpload} disabled={loading} className="block w-full text-sm" />
      {loading && <p className="mt-4 text-sm text-indigo-600 animate-pulse">Processing images…</p>}
      {summary && <p className="mt-4 text-sm text-emerald-600 font-medium">{summary}</p>}
    </div>
  );
}
