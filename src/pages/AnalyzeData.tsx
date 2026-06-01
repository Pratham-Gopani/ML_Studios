import { useState, useEffect } from 'react';
import { BarChart3, Table, Download } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AnalyzeData() {
  const { processedDataset } = useWorkflowStore();
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [distribution, setDistribution] = useState<any[]>([]);

  const columns: string[] = processedDataset?.columns ?? [];
  const data: Record<string, any>[] = processedDataset?.data ?? [];

  useEffect(() => {
    if (columns.length && data.length) {
      computeCorrelation();
      computeSummaryStats();
      if (columns.length) setSelectedFeature(columns[0]);
    }
  }, [columns, data]);

  useEffect(() => {
    if (selectedFeature) computeDistribution();
  }, [selectedFeature, data]);

  const computeCorrelation = () => {
    const numericCols = columns.filter(col => data.every(row => !isNaN(parseFloat(row[col]))));
    const matrix = [];
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i+1; j < numericCols.length; j++) {
        const col1 = numericCols[i];
        const col2 = numericCols[j];
        const vals1 = data.map(row => parseFloat(row[col1]));
        const vals2 = data.map(row => parseFloat(row[col2]));
        const corr = pearson(vals1, vals2);
        matrix.push({ feature1: col1, feature2: col2, correlation: corr });
      }
    }
    setCorrelationData(matrix);
  };

  const pearson = (x: number[], y: number[]) => {
    const n = x.length;
    const sumX = x.reduce((a,b) => a + b, 0);
    const sumY = y.reduce((a,b) => a + b, 0);
    const sumX2 = x.reduce((a,b) => a + b*b, 0);
    const sumY2 = y.reduce((a,b) => a + b*b, 0);
    const sumXY = x.reduce((a,b,i) => a + b*y[i], 0);
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n*sumX2 - sumX*sumX) * (n*sumY2 - sumY*sumY));
    return den === 0 ? 0 : num / den;
  };

  const computeSummaryStats = () => {
    const stats = columns.map(col => {
      const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (values.length === 0) return { column: col, type: 'categorical', count: data.length };
      const mean = values.reduce((a,b) => a + b, 0) / values.length;
      const sorted = [...values].sort((a,b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const std = Math.sqrt(values.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / values.length);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      return { column: col, type: 'numeric', mean, median, std, min, max, count: values.length };
    });
    setSummaryStats(stats);
  };

  const computeDistribution = () => {
    const values = data.map(row => parseFloat(row[selectedFeature])).filter(v => !isNaN(v));
    if (values.length === 0) return;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 10;
    const binWidth = (max - min) / binCount;
    const bins = Array(binCount).fill(0);
    values.forEach(v => {
      let binIndex = Math.floor((v - min) / binWidth);
      if (binIndex === binCount) binIndex--;
      bins[binIndex]++;
    });
    const hist = bins.map((count, i) => ({
      bin: `${(min + i * binWidth).toFixed(2)} - ${(min + (i+1) * binWidth).toFixed(2)}`,
      count
    }));
    setDistribution(hist);
  };

  if (!data.length) return <div className="p-8">No dataset loaded. Go to Import first.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Data Analysis</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex gap-2"><BarChart3 /> Correlation Matrix</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature1" angle={45} textAnchor="start" height={80} />
              <YAxis domain={[-1,1]} />
              <Tooltip />
              <Bar dataKey="correlation">
                {correlationData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.correlation > 0 ? '#6366f1' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4 flex gap-2"><Table /> Summary Statistics</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Column</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Mean</th>
                <th className="text-left p-2">Std</th>
                <th className="text-left p-2">Min</th>
                <th className="text-left p-2">Max</th>
               </tr>
            </thead>
            <tbody>
              {summaryStats.map((stat, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-mono">{stat.column}</td>
                  <td className="p-2">{stat.type}</td>
                  <td className="p-2">{stat.mean?.toFixed(2) || '-'}</td>
                  <td className="p-2">{stat.std?.toFixed(2) || '-'}</td>
                  <td className="p-2">{stat.min?.toFixed(2) || '-'}</td>
                  <td className="p-2">{stat.max?.toFixed(2) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Feature Distribution</h2>
          <select
            value={selectedFeature}
            onChange={e => setSelectedFeature(e.target.value)}
            className="mb-4 p-2 border rounded-xl w-full"
          >
            {columns.map(col => <option key={col}>{col}</option>)}
          </select>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" angle={45} textAnchor="start" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Data Quality</h2>
          <div className="space-y-2">
            <p>Total rows: {data.length}</p>
            <p>Total columns: {columns.length}</p>
            <p>Numeric columns: {summaryStats.filter(s => s.type === 'numeric').length}</p>
            <p>Categorical columns: {summaryStats.filter(s => s.type !== 'numeric').length}</p>
            <button
              onClick={() => {
                const csv = [columns.join(','), ...data.map(row => columns.map(c => row[c]).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dataset.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl"
            >
              <Download className="w-4 h-4" /> Export Cleaned Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
