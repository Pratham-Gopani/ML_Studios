import { ArrowRight, Cpu, Database, BarChart3, Settings2, CheckCircle2, Wand2, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Overview({ onNext }: { onNext: () => void }) {
  const { goal, updateState } = useWorkflowStore();

  const steps = [
    { icon: Database, title: '1. Import Dataset', desc: 'Upload CSV/Excel or JSON files.' },
    { icon: Wand2, title: '2. Preprocess', desc: 'Clean data, handle missing values, and encode features.' },
    { icon: BarChart3, title: '3. Analyze Data', desc: 'Explore patterns, correlations, and distributions.' },
    { icon: Cpu, title: '4. Choose Model', desc: 'Select from classification, regression, or clustering.' },
    { icon: Settings2, title: '5. Tune & Evaluate', desc: 'Optimize hyperparameters and assess performance.' },
    { icon: CheckCircle2, title: '6. Results', desc: 'Export models, reports, and visualizations.' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Interactive Machine Learning <br />
            <span className="text-indigo-600">Workflow Studio</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-8">
            A professional-grade workbench to streamline your ML pipeline. From data ingestion to model deployment, guided by AI.
          </p>
          <div className="max-w-2xl mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">What is your project goal?</label>
            <textarea
              value={goal}
              onChange={(e) => updateState({ goal: e.target.value })}
              placeholder="e.g., Predict customer churn based on usage patterns..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
            />
          </div>
          <button
            onClick={onNext}
            className="group flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Start New Project
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-3 bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2">AI-Guided Workflow</h3>
              <p className="text-indigo-100 leading-relaxed max-w-2xl">
                Built-in AI assistant helps at every step — suggests data cleaning methods, recommends models, and provides insights into results.
                Look for the <span className="font-bold text-white italic">"AI Assistant"</span> chat button for real-time guidance.
              </p>
            </div>
          </div>
        </div>
        {steps.map((step, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
              <step.icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
