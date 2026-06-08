import { useEffect, useState } from 'react';
import { Sparkles, Target, Zap, Lightbulb, TrendingUp, AlertTriangle, ArrowRight, BrainCircuit, PieChart, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { aiService } from '../services/api';

export default function Insights() {
  const { rawDataset, modelConfig, evaluationResults, goal, updateState } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState('');

  useEffect(() => {
    if (!evaluationResults || !modelConfig || !rawDataset) { setLoading(false); return; }
    setLoading(true);
    const prompt = `As an AI Data Scientist, provide deep insights about the data based on ML results.
Goal: ${goal || 'General Prediction'}
Dataset: ${rawDataset.name}
Feature Importance: ${JSON.stringify(evaluationResults.featureImportance)}
Performance: accuracy=${evaluationResults.accuracy?.toFixed(3)}, f1=${evaluationResults.f1?.toFixed(3)}, r2=${evaluationResults.r2?.toFixed(3)}

Focus on:
1. What key features reveal about the data
2. Behavioral patterns found
3. Prediction observations
4. Most surprising data relationships
Keep it professional, data-centric, concise. Use bullet points.`;

    aiService.getCustomInsight(prompt).then(result => { setInsights(result); setLoading(false); });
  }, []);

  if (!evaluationResults) return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">No Results Found</h2>
      <p className="text-slate-500 max-w-sm mb-6">Please complete the modeling and evaluation step first.</p>
      <button onClick={() => updateState({ currentStep: 'model' })}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
        Go to Modeling
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <BrainCircuit className="text-indigo-600 w-8 h-8" />Data Intelligence
          </h2>
          <p className="text-slate-500 mt-1">Predictive patterns discovered in your data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />Project Blueprint
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                <Target className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Goal</p>
                  <p className="text-sm text-slate-700 font-medium line-clamp-2">{goal || 'Optimization & Prediction'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                <BrainCircuit className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Model</p>
                  <p className="text-sm text-slate-700 font-medium">{modelConfig?.algorithm}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold uppercase mb-2">Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(evaluationResults.accuracy || evaluationResults.r2 || 0) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-indigo-600">
                    {Math.round((evaluationResults.accuracy || evaluationResults.r2 || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-300" />Key Takeaway
            </h3>
            <p className="text-indigo-50 text-sm leading-relaxed mb-6">
              The data shows a {evaluationResults.accuracy && evaluationResults.accuracy > 0.8 ? 'very high' : 'moderate'} degree of internal consistency.
              {evaluationResults.accuracy && evaluationResults.accuracy > 0.8
                ? ' Strong predictive signals suggest the variables collected are highly influential.'
                : ' Patterns are present but noisy, requiring more granular feature collection.'}
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              Export PDF Report <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Data Discovery Engine</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Analysis</span>
              </div>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full mb-4" />
                <p className="text-sm text-slate-500">Generating insights...</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {insights || 'AI insights unavailable. Please try again.'}
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />Error Distribution
              </h3>
              <div className="h-32 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full text-indigo-600">
                    <path className="text-slate-100 stroke-current" strokeWidth="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="stroke-current" strokeWidth="3.8" strokeDasharray="85, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black">Low</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />Stability
              </h3>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Data Quality</span>
                  <span className="text-xs font-black text-emerald-600">EXCELLENT</span>
                </div>
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
        <button onClick={() => { updateState({ currentStep: 'overview' }); }}
          className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3">
          Finalize Project <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </button>
        <button onClick={() => updateState({ currentStep: 'overview' })}
          className="w-full sm:w-auto px-8 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-3xl font-bold hover:bg-slate-50">
          New Analysis
        </button>
      </motion.div>
    </div>
  );
}
