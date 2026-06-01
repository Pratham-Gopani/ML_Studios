import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Table, ArrowRight, AlertTriangle } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Preprocessing() {
  const navigate = useNavigate();
  const { processedDataset, datasetType, updateState } = useWorkflowStore();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [missingStrategy, setMissingStrategy] = useState<'drop' | 'impute'>('impute');
  const [imputeMethod, setImputeMethod] = useState<'mean' | 'median' | 'mode' | 'constant'>('mean');
  const [constantValue, setConstantValue] = useState(0);
  const [scalingMethod, setScalingMethod] = useState<'none' | 'minmax' | 'standard'>('none');
  const [outlierMethod, setOutlierMethod] = useState<'none' | 'iqr' | 'cap'>('none');
  const [encodingMethod] = useState<'label' | 'onehot'>('label');

  const columns: string[] = processedDataset?.columns ?? [];
  const data: Record<string, any>[] = processedDataset?.data ?? [];

  const handleMissing = (rows: Record<string, any>[]) => {
    if (missingStrategy === 'drop') {
      return rows.filter(row => [...selectedFeatures, targetColumn].every(col => row[col] != null && row[col] !== ''));
    } else {
      return rows.map(row => {
        const newRow = { ...row };
        [...selectedFeatures, targetColumn].forEach(col => {
          if (newRow[col] == null || newRow[col] === '') {
            const values = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            if (values.length === 0) newRow[col] = 0;
            else if (imputeMethod === 'mean') newRow[col] = values.reduce((a,b)=>a+b,0)/values.length;
            else if (imputeMethod === 'median') {
              values.sort((a,b)=>a-b);
              newRow[col] = values[Math.floor(values.length/2)];
            } else if (imputeMethod === 'mode') {
              const freq: Record<string, number> = {};
              rows.forEach(r => { const v = String(r[col]); freq[v] = (freq[v]||0)+1; });
              newRow[col] = Object.keys(freq).reduce((a,b) => freq[a] > freq[b] ? a : b);
            } else newRow[col] = constantValue;
          }
        });
        return newRow;
      });
    }
  };

  const handleOutliers = (rows: Record<string, any>[]) => {
    if (outlierMethod === 'none') return rows;
    const numericCols = selectedFeatures.filter(col => rows.every(r => !isNaN(parseFloat(r[col]))));
    if (outlierMethod === 'iqr') {
      return rows.filter(row => {
        for (const col of numericCols) {
          const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          const q1 = vals[Math.floor(vals.length * 0.25)];
          const q3 = vals[Math.floor(vals.length * 0.75)];
          const iqr = q3 - q1;
          const lower = q1 - 1.5*iqr;
          const upper = q3 + 1.5*iqr;
          const val = parseFloat(row[col]);
          if (val < lower || val > upper) return false;
        }
        return true;
      });
    } else {
      return rows.map(row => {
        const newRow = { ...row };
        for (const col of numericCols) {
          const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          const q1 = vals[Math.floor(vals.length * 0.25)];
          const q3 = vals[Math.floor(vals.length * 0.75)];
          const iqr = q3 - q1;
          const lower = q1 - 1.5*iqr;
          const upper = q3 + 1.5*iqr;
          let val = parseFloat(newRow[col]);
          if (val < lower) val = lower;
          if (val > upper) val = upper;
          newRow[col] = val;
        }
        return newRow;
      });
    }
  };

  const handleScaling = (rows: Record<string, any>[]) => {
    if (scalingMethod === 'none') return rows;
    const numericCols = selectedFeatures.filter(col => rows.every(r => !isNaN(parseFloat(r[col]))));
    return rows.map(row => {
      const newRow = { ...row };
      for (const col of numericCols) {
        const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
        const std = Math.sqrt(vals.reduce((a,b)=>a+Math.pow(b-mean,2),0)/vals.length);
        let val = parseFloat(newRow[col]);
        if (scalingMethod === 'minmax' && max !== min) val = (val - min) / (max - min);
        else if (scalingMethod === 'standard' && std !== 0) val = (val - mean) / std;
        newRow[col] = val;
      }
      return newRow;
    });
  };

  const handleApply = () => {
    if (!targetColumn || selectedFeatures.length === 0) {
      alert('Select at least one feature and a target column.');
      return;
    }
    let rows = [...data];
    rows = handleMissing(rows);
    rows = handleOutliers(rows);
    rows = handleScaling(rows);
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    const idx = Math.floor(rows.length * splitRatio);
    updateState({
      trainSet: rows.slice(0, idx),
      testSet: rows.slice(idx),
      preprocessingConfig: {
        selectedFeatures,
        targetVariable: targetColumn,
        splitRatio,
        missingStrategy,
        imputeMethod,
        encodingMethod,
        scalingMethod,
        outlierMethod
      },
      currentStep: 'analyze'
    });
    navigate('/analyze');
  };

  if (datasetType === 'image') {
    return <div className="p-8">Image preprocessing coming soon. Use CSV for now.</div>;
  }

  if (!data.length) return <div className="p-8">No dataset loaded. Go back to Import.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Data Preprocessing</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex gap-2"><Table /> Dataset Info</h2>
          <p>Rows: {data.length}</p>
          <p>Columns: {columns.length}</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Feature & Target Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="font-medium">Features</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {columns.map(col => (
                    <label key={col} className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedFeatures.includes(col)} onChange={() => {
                        if (selectedFeatures.includes(col)) setSelectedFeatures(selectedFeatures.filter(c=>c!==col));
                        else setSelectedFeatures([...selectedFeatures, col]);
                      }} /> {col}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-medium">Target Column</label>
                <select value={targetColumn} onChange={e=>setTargetColumn(e.target.value)} className="w-full mt-1 p-2 border rounded-xl">
                  <option value="">Select</option>
                  {columns.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-medium">Train/Test Split: {Math.round(splitRatio*100)}% / {Math.round((1-splitRatio)*100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={splitRatio} onChange={e=>setSplitRatio(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex gap-2"><AlertTriangle /> Data Cleaning</h2>
            <div className="space-y-4">
              <div>
                <label>Missing Values</label>
                <div className="flex gap-4">
                  <label><input type="radio" value="impute" checked={missingStrategy==='impute'} onChange={()=>setMissingStrategy('impute')} /> Impute</label>
                  <label><input type="radio" value="drop" checked={missingStrategy==='drop'} onChange={()=>setMissingStrategy('drop')} /> Drop rows</label>
                </div>
              </div>
              {missingStrategy === 'impute' && (
                <div>
                  <label>Imputation Method</label>
                  <div className="flex flex-wrap gap-4">
                    {['mean','median','mode','constant'].map(m => (
                      <label key={m}><input type="radio" value={m} checked={imputeMethod===m} onChange={()=>setImputeMethod(m as any)} /> {m}</label>
                    ))}
                  </div>
                  {imputeMethod === 'constant' && <input type="number" value={constantValue} onChange={e=>setConstantValue(parseFloat(e.target.value))} className="mt-2 p-2 border rounded-xl w-full" />}
                </div>
              )}
              <div>
                <label>Outlier Handling</label>
                <select value={outlierMethod} onChange={e=>setOutlierMethod(e.target.value as any)} className="w-full p-2 border rounded-xl">
                  <option value="none">None</option>
                  <option value="iqr">Remove (IQR)</option>
                  <option value="cap">Cap (IQR)</option>
                </select>
              </div>
              <div>
                <label>Scaling</label>
                <select value={scalingMethod} onChange={e=>setScalingMethod(e.target.value as any)} className="w-full p-2 border rounded-xl">
                  <option value="none">None</option>
                  <option value="minmax">Min-Max</option>
                  <option value="standard">Standardization</option>
                </select>
              </div>
            </div>
          </div>
          <button onClick={handleApply} className="w-full flex justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-bold">Apply & Continue to Analysis <ArrowRight /></button>
        </div>
      </div>
    </div>
  );
}
