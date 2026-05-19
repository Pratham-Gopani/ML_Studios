import { useEffect, useState } from 'react';
import { getAllProjects, deleteProject, type StoredProject } from '../services/projectStorage';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { Trash2, FolderOpen, Download, ArrowLeft, FolderX } from 'lucide-react';
import pkg from "file-saver";
const { saveAs } = pkg;

export default function Projects() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateState, setDatasetType, setImageDataset } = useWorkflowStore();

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    const all = await getAllProjects();
    setProjects(all.sort((a,b)=>b.updatedAt - a.updatedAt));
    setLoading(false);
  };

  const handleLoad = (project: StoredProject) => {
    updateState({ ...project.state });
    setDatasetType(project.state.datasetType ?? 'tabular');
    if (project.state.imageDataset) setImageDataset(project.state.imageDataset);
    alert(project.state.datasetType === 'image' ? 'Project loaded. Images must be re‑uploaded.' : 'Project loaded.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await deleteProject(id);
    loadProjects();
  };

  const handleExportState = (project: StoredProject) => {
    const blob = new Blob([JSON.stringify(project.state, null, 2)], { type: 'application/json' });
    saveAs(blob, `${project.name.replace(/\s+/g, '_')}_state.json`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4"><button onClick={()=>updateState({currentStep:'overview'})} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5 text-slate-600" /></button><div><h2 className="text-2xl font-black">Saved Projects</h2><p className="text-sm text-slate-500">Projects are stored locally in your browser (IndexedDB).</p></div></div>
      {loading ? (<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />Loading…</div>) : projects.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-slate-400"><FolderX className="w-12 h-12 mb-4 opacity-30" /><p className="font-medium">No saved projects yet.</p><p className="text-sm mt-1">Train a model and click "Save Project" on the Results page.</p></div>) : (<div className="grid gap-4">{projects.map(p=>(<div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 hover:border-indigo-200 shadow-sm"><div className="flex-1 min-w-0"><p className="font-bold text-slate-900 truncate">{p.name}</p><p className="text-xs text-slate-400 mt-0.5">Updated {new Date(p.updatedAt).toLocaleString()}</p><div className="flex flex-wrap gap-2 mt-2">{p.state.datasetType && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase">{p.state.datasetType}</span>}{p.state.modelConfig?.algorithm && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">{p.state.modelConfig.algorithm}</span>}{p.state.currentStep && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">{p.state.currentStep}</span>}</div></div><div className="flex gap-2"><button onClick={()=>handleLoad(p)} title="Load" className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl"><FolderOpen className="w-4 h-4" /></button><button onClick={()=>handleExportState(p)} title="Export JSON" className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl"><Download className="w-4 h-4" /></button><button onClick={()=>handleDelete(p.id)} title="Delete" className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>)}
    </div>
  );
}
