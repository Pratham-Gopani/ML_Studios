import { Brain, Database, Sliders, BarChart3, FolderOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

const steps = [
  { id: 'import', icon: Database, title: 'Import Data', description: 'Upload CSV or image ZIP.', color: 'bg-blue-50 text-blue-600' },
  { id: 'preprocessing', icon: Sliders, title: 'Preprocess', description: 'Select features, handle missing data.', color: 'bg-violet-50 text-violet-600' },
  { id: 'model-selection', icon: Brain, title: 'Select Model', description: 'Choose classification, regression, or clustering.', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'tuning', icon: Sparkles, title: 'Train & Tune', description: 'Configure hyperparameters, start training.', color: 'bg-amber-50 text-amber-600' },
  { id: 'results', icon: BarChart3, title: 'Evaluate', description: 'Review metrics and export model.', color: 'bg-emerald-50 text-emerald-600' },
];

export default function Overview() {
  const { updateState } = useWorkflowStore();
  return (
    <div className="space-y-10">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4"><Brain className="w-10 h-10 text-indigo-200" /><h1 className="text-4xl font-black">ML Studio</h1></div>
          <p className="text-indigo-100 text-lg max-w-xl leading-relaxed mb-8">Browser‑based ML platform – train models client‑side with TensorFlow.js.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => updateState({ currentStep: 'import' })} className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-black hover:bg-indigo-50 shadow-xl"><ArrowRight className="w-5 h-5" />Get Started</button>
            <button onClick={() => updateState({ currentStep: 'projects' })} className="flex items-center gap-2 px-6 py-4 bg-white/10 rounded-2xl font-bold hover:bg-white/20 border border-white/20"><FolderOpen className="w-5 h-5" />Saved Projects</button>
          </div>
        </div>
      </div>
      <div><h2 className="text-xl font-bold mb-6">Workflow Steps</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((step, idx) => (<button key={step.id} onClick={() => updateState({ currentStep: step.id })} className="group text-left bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${step.color}`}><step.icon className="w-6 h-6" /></div>
          <span className="text-xs font-bold text-slate-400">STEP {idx+1}</span>
          <h3 className="font-bold text-slate-900 mt-1">{step.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{step.description}</p>
        </button>))}
      </div></div>
    </div>
  );
}
