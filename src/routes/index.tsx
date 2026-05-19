import { createFileRoute } from '@tanstack/react-router';
import { Brain, Database, Sliders, BarChart3, Cpu, FolderOpen, ChevronRight, AlertCircle, X } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import Overview from '../pages/Overview';
import DatasetImport from '../pages/DatasetImport';
import Preprocessing from '../pages/Preprocessing';
import ModelSelection from '../pages/ModelSelection';
import Tuning from '../pages/Tuning';
import Results from '../pages/Results';
import Projects from '../pages/Projects';

export const Route = createFileRoute('/')({ component: MLStudio });

const NAV_STEPS = [
  { id: 'overview', label: 'Overview', icon: Brain },
  { id: 'import', label: 'Import Data', icon: Database },
  { id: 'preprocessing', label: 'Preprocess', icon: Sliders },
  { id: 'model-selection', label: 'Model', icon: Cpu },
  { id: 'tuning', label: 'Train', icon: ChevronRight },
  { id: 'results', label: 'Results', icon: BarChart3 },
];
const STEP_ORDER = ['overview', 'import', 'preprocessing', 'model-selection', 'tuning', 'results'];

function Sidebar() {
  const { currentStep, updateState } = useWorkflowStore();
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:flex flex-col bg-white border-r border-slate-100 min-h-screen">
      <div className="px-5 py-6 border-b border-slate-100"><div className="flex items-center gap-2"><Brain className="w-6 h-6 text-indigo-600" /><span className="font-black text-slate-900 text-lg">ML Studio</span></div></div>
      <nav className="flex-1 px-3 py-4 space-y-1">{NAV_STEPS.map((step, idx) => { const isActive = currentStep === step.id; const isPast = STEP_ORDER.indexOf(currentStep) > idx; return (<button key={step.id} onClick={() => updateState({ currentStep: step.id })} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : isPast ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}><step.icon className="w-4 h-4 flex-shrink-0" />{step.label}</button>);})}</nav>
      <div className="px-3 py-4 border-t border-slate-100"><button onClick={() => updateState({ currentStep: 'projects' })} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStep === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><FolderOpen className="w-4 h-4" />Projects</button></div>
    </aside>
  );
}

function MobileNav() {
  const { currentStep, updateState } = useWorkflowStore();
  return (<div className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">ML Studio</span></div><select value={currentStep} onChange={e => updateState({ currentStep: e.target.value })} className="text-sm border rounded-lg px-2 py-1 bg-white"><option value="overview">Overview</option><option value="import">Import Data</option><option value="preprocessing">Preprocess</option><option value="model-selection">Model</option><option value="tuning">Train</option><option value="results">Results</option><option value="projects">Projects</option></select></div>);
}

function StepBreadcrumb() {
  const { currentStep, updateState } = useWorkflowStore();
  const idx = STEP_ORDER.indexOf(currentStep);
  if (idx < 0 || currentStep === 'overview') return null;
  return (<div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">{STEP_ORDER.slice(0, idx+1).map((step,i)=>(<span key={step} className="flex items-center gap-1.5">{i>0 && <ChevronRight className="w-3 h-3" />}<button onClick={()=>updateState({currentStep:step})} className={`hover:text-indigo-600 transition ${step===currentStep ? 'text-slate-700 font-semibold' : ''}`}>{NAV_STEPS.find(n=>n.id===step)?.label ?? step}</button></span>))}</div>);
}

function ErrorBanner() {
  const { error, updateState } = useWorkflowStore();
  if (!error) return null;
  return (<div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700 mb-6"><AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium flex-1">{error}</p><button onClick={()=>updateState({error:null})} className="p-1 hover:bg-red-100 rounded-lg"><X className="w-4 h-4" /></button></div>);
}

function PageContent() {
  const { currentStep } = useWorkflowStore();
  switch(currentStep) {
    case 'overview': return <Overview />;
    case 'import': return <DatasetImport />;
    case 'preprocessing': return <Preprocessing />;
    case 'model-selection': return <ModelSelection />;
    case 'tuning': return <Tuning />;
    case 'results': return <Results />;
    case 'projects': return <Projects />;
    default: return <Overview />;
  }
}

function MLStudio() {
  return (<div className="min-h-screen bg-slate-50 flex flex-col"><MobileNav /><div className="flex flex-1"><Sidebar /><main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full"><ErrorBanner /><StepBreadcrumb /><PageContent /></main></div></div>);
}
