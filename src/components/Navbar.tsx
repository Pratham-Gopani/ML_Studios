import { Brain, User, LogOut, ChevronDown, LogIn, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useProjectStore } from '../store/useProjectStore';

export default function Navbar() {
  const { updateState, resetState } = useWorkflowStore();
  const { currentUser, login, logout } = useProjectStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  // Extract a readable nickname from the active user's email
  const userNick = currentUser.includes('@') ? currentUser.split('@')[0] : currentUser;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim()) {
      login(loginEmail);
      setLoginEmail('');
      setShowLoginModal(false);
      setShowMenu(false);
    }
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => updateState({ currentStep: 'overview' })}>
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-tight">ML Studio</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Studio</span>
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="hidden sm:flex flex-col items-start max-w-[150px]">
            <span className="text-xs font-bold text-slate-700 capitalize truncate w-full text-left">{userNick}</span>
            <span className="text-[10px] text-slate-400 truncate w-full text-left">{currentUser}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Account</p>
                <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{currentUser}</p>
              </div>

              <button onClick={() => { setShowLoginModal(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-medium">
                <LogIn className="w-4 h-4" />Switch / Sign In
              </button>

              <button onClick={() => { logout(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
                <LogOut className="w-4 h-4" />Sign Out Guest
              </button>

              <div className="h-px bg-slate-100 my-2" />

              <button onClick={() => { resetState(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all">
                <X className="w-4 h-4" />Reset Workspace
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Login / Custom Email Switcher Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />Login to Workspace
                </h3>
                <button onClick={() => setShowLoginModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-6">Enter your email to load your partitioned projects list. Multiple profiles can save and run independent pipelines simultaneously.</p>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">User Email</label>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required
                    placeholder="e.g. user@example.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <button type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-indigo-100 transition-all">
                  Initialize Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
