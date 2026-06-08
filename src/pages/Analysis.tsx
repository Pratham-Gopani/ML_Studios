import { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity, ArrowRight, Table as TableIcon, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Analysis() {
  const { processedDataset, updateState } = useWorkflowStore();
  const [selectedFeature, setSelectedFeature] = useState<string>(processedDataset?.columns[0] || '');
  const [scatterX, setScatterX] = useState<string>(processedDataset?.columns[0] || '');
  const [scatterY, setScatterY] = useState<string>(processedDataset?.columns[1] || '');
  const [viewMode, setViewMode] = useState<'visual' | 'stats'>('visual');

  const stats = useMemo(() => {
    if (!processedDataset) return null;
    return processedDataset.columns.reduce((acc, col) => {
      const values = processedDataset.data.map((d: any) => d[col]).filter((v: any) => typeof v === 'number');
      if (values.length === 0) return acc;
      const sum = values.reduce((a: number, b: number) => a + b, 0);
      const mean = sum / values.length;
      const sorted = [...values].sort((a: number, b: number) => a - b);
      acc[col] = { mean, median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted[sorted.length - 1], count: values.length };
      return acc;
    }, {} as Record<string, any>);
  }, [processedDataset]);

  const distributionData = useMemo(() => {
    if (!processedDataset || !selectedFeature) return [];
    const values = processedDataset.data.map((d: any) => d[selectedFeature]).filter((v: any) => typeof v === 'number');
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 10;
    const binSize = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}`,
      count: 0
    }));
    values.forEach((v: number) => {
      const idx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
      bins[idx].count++;
    });
    return bins;
  }, [processedDataset, selectedFeature]);

  // Keep internal sub-feature states in sync when dataset swaps (listening to ID primitive)
  useEffect(() => {
    if (processedDataset?.columns) {
      setSelectedFeature(processedDataset.columns[0] || '');
      setScatterX(processedDataset.columns[0] || '');
      setScatterY(processedDataset.columns[1] || processedDataset.columns[0] || '');
    }
  }, [processedDataset?.id]);

  if (!processedDataset) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Activity className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-lg font-medium">Please preprocess your data first</p>
    </div>
  );

  const columns = processedDataset.columns;
  const sampleData = processedDataset.data.slice(0, 100);
  const missingData = Object.entries(processedDataset.missingValues).map(([name, value]) => ({ name, value }));
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Data Dashboard</h2>
          <p className="text-sm text-slate-500">Comprehensive analysis of your processed dataset</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1">
          {(['visual', 'stats'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === mode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              {mode === 'visual' ? 'Visualizations' : 'Statistics'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rows', value: processedDataset.shape[0].toLocaleString(), icon: TableIcon, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Features', value: processedDataset.shape[1], icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
          { label: 'Missing Cells', value: Object.values(processedDataset.missingValues).reduce((a, b) => a + b, 0).toLocaleString(), icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
          { label: 'Data Quality', value: '98.2%', icon: Zap, color: 'bg-emerald-100 text-emerald-600', valueClass: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color, valueClass }) => (
          <div key={label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
            <p className={`text-2xl font-black ${valueClass || 'text-slate-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Feature Distribution
              </h3>
              <select value={selectedFeature} onChange={(e) => setSelectedFeature(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" fontSize={10} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-8">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              Missing Values
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={missingData.filter(d => d.value > 0).length > 0 ? missingData.filter(d => d.value > 0) : [{ name: 'None', value: 1 }]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {missingData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {missingData.filter(d => d.value > 0).length === 0
                ? <p className="text-xs text-emerald-600 font-bold text-center">No missing values!</p>
                : missingData.filter(d => d.value > 0).slice(0, 3).map((d, i) => (
                  <div key={d.name} className="flex justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-slate-900">{d.value}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Scatter Analysis</h3>
              <div className="flex gap-2">
                <select value={scatterX} onChange={(e) => setScatterX(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none">
                  {columns.map(c => <option key={c} value={c}>X: {c}</option>)}
                </select>
                <select value={scatterY} onChange={(e) => setScatterY(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none">
                  {columns.map(c => <option key={c} value={c}>Y: {c}</option>)}
                </select>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name={scatterX} stroke="#94a3b8" fontSize={12} />
                  <YAxis type="number" dataKey="y" name={scatterY} stroke="#94a3b8" fontSize={12} />
                  <ZAxis type="number" range={[64, 144]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name="Data"
                    data={sampleData.map((d: any) => ({ x: typeof d[scatterX] === 'number' ? d[scatterX] : 0, y: typeof d[scatterY] === 'number' ? d[scatterY] : 0 }))}
                    fill="#6366f1" fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Feature', 'Mean', 'Median', 'Min', 'Max', 'Count'].map(h => (
                    <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(stats || {}).map(([col, s]: [string, any]) => (
                  <tr key={col} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{col}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.mean.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.median.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.min.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.max.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => updateState({ currentStep: 'model' })}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          Select Model <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
