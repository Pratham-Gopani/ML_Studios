import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileUp,
  Wand2,
  BarChart3,
  Cpu,
  Settings2,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  AlertCircle,
  FolderOpen,
  Plus,
  Menu,
  X,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { Step, Project } from './types'
import { useWorkflowStore } from './store/useWorkflowStore'
import { useProjectStore } from './store/useProjectStore'

import Overview from './pages/Overview'
import ImportDataset from './pages/ImportDataset'
import Preprocess from './pages/Preprocess'
import Analysis from './pages/Analysis'
import ModelSelection from './pages/ModelSelection'
import Tuning from './pages/Tuning'
import Results from './pages/Results'
import Insights from './pages/Insights'

import Navbar from './components/Navbar'
import Chatbot from './components/Chatbot'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'import', label: 'Import Dataset', icon: FileUp },
  { id: 'preprocess', label: 'Preprocess', icon: Wand2 },
  { id: 'analyze', label: 'Analyze Data', icon: BarChart3 },
  { id: 'model', label: 'Choose Model', icon: Cpu },
  { id: 'tune', label: 'Tune & Evaluate', icon: Settings2 },
  { id: 'results', label: 'Results', icon: CheckCircle2 },
  { id: 'insights', label: 'Insights', icon: Sparkles },
]

export default function App() {
  const {
    currentStep,
    completedSteps,
    error,
    updateState,
    resetState,
    canNavigateTo
  } = useWorkflowStore()

  const { projects, currentProjectId, currentUser, addProject, setCurrentProject } = useProjectStore()

  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const userProjects = projects.filter(p => p.userId === currentUser)
  const project = userProjects.find(p => p.id === currentProjectId) || null

  useEffect(() => {
    if (!currentProjectId && userProjects.length > 0) {
      const last = userProjects[0]
      setCurrentProject(last.id)
      updateState(last.currentState)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentProjectId) return;
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      const currentProj = useProjectStore.getState().projects.find(p => p.id === currentProjectId);
      if (currentProj) {
        const { updateState: _, resetState: _2, canNavigateTo: _3, ...serializableState } = state;
        useProjectStore.getState().updateProject(currentProjectId, {
          currentState: serializableState as any
        });
      }
    });
    return () => unsubscribe();
  }, [currentProjectId]);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      userId: currentUser,
      name: `Project ${userProjects.length + 1}`,
      description: 'New ML Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentState: useWorkflowStore.getState() as any,
      snapshots: []
    }
    addProject(newProject)
    resetState()
    setShowProjectSelector(false)
  }

  const handleSelectProject = (p: Project) => {
    setCurrentProject(p.id)
    updateState(p.currentState)
    setShowProjectSelector(false)
  }

  const handleBack = () => {
    const order: Step[] = ['overview', 'import', 'preprocess', 'analyze', 'model', 'tune', 'results', 'insights']
    const idx = order.indexOf(currentStep)
    if (idx > 0) updateState({ currentStep: order[idx - 1] })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'overview': return <Overview onNext={() => updateState({ currentStep: 'import' })} />
      case 'import': return <ImportDataset onDatasetLoaded={(snapshot) => updateState({ rawDataset: snapshot, currentStep: 'preprocess' })} />
      case 'preprocess': return <Preprocess />
      case 'analyze': return <Analysis />
      case 'model': return <ModelSelection />
      case 'tune': return <Tuning />
      case 'results': return <Results />
      case 'insights': return <Insights />
      default: return <Overview onNext={() => updateState({ currentStep: 'import' })} />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] text-slate-900 font-sans overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden" />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-[80] transition-transform duration-300 transform lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between lg:hidden">
            <span className="font-bold text-lg">ML Studio</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-100">
            {project ? (
              <button onClick={() => setShowProjectSelector(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-sm text-slate-900 truncate">{project.name}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </button>
            ) : (
              <button onClick={handleCreateProject}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                <Plus className="w-4 h-4" />New Project
              </button>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {STEPS.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.includes(step.id)
              const isLocked = !canNavigateTo(step.id)
              return (
                <button key={step.id} disabled={isLocked}
                  onClick={() => { updateState({ currentStep: step.id }); setIsSidebarOpen(false) }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                    isActive ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-slate-200")}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-500")} />
                  </div>
                  <span className="text-sm">{step.label}</span>
                  {isCompleted && !isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  {isActive && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">
              <Settings className="w-4 h-4" />Settings
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Project Selector Modal */}
          <AnimatePresence>
            {showProjectSelector && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[90] flex items-start justify-center pt-20 px-4"
                onClick={() => setShowProjectSelector(false)}>
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                  className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
                  onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-indigo-600" />Your Projects
                    </h3>
                    <button onClick={handleCreateProject}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
                      <Plus className="w-4 h-4" />New Project
                    </button>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                    {userProjects.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-500 opacity-40">No projects yet.</div>
                    ) : (
                      userProjects.map(p => (
                        <button key={p.id} onClick={() => handleSelectProject(p)}
                          className={cn("w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                            project?.id === p.id ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50")}>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                          </div>
                          {project?.id === p.id && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F9FAFB]">
            <div className="max-w-5xl mx-auto">
              {project && currentStep !== 'overview' && (
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={handleBack}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      ← Back
                    </button>
                    <button onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl">
                      <Menu className="w-4 h-4" />Menu
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Step {STEPS.findIndex(s => s.id === currentStep) + 1} of {STEPS.length}
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-700 text-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                  <button onClick={() => updateState({ error: null })} className="p-1 hover:bg-red-100 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!project && currentStep !== 'overview' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                    <FolderOpen className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Select or Create a Project</h2>
                  <p className="text-sm text-slate-500 max-w-xs mb-8">Create a project to manage your ML workflow.</p>
                  <button onClick={handleCreateProject}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                    <Plus className="w-5 h-5" />Create New Project
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </main>
      </div>
      <Chatbot />
    </div>
  )
}
