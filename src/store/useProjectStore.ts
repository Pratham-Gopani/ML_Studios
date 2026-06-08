import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project } from '../types';
import { indexedDBStore } from './indexedDBStorage';

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  currentUser: string;
  login: (email: string) => void;
  logout: () => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentUser: 'prathamgopani@gmail.com', // Active subscriber context from metadata

      login: (email) => {
        const cleaned = email.trim().toLowerCase();
        if (!cleaned) return;
        
        // Find if this new user already has a project to restore
        const userProjects = get().projects.filter(p => p.userId === cleaned);
        const lastProjId = userProjects.length > 0 ? userProjects[0].id : null;
        
        set({ 
          currentUser: cleaned,
          currentProjectId: lastProjId
        });
      },

      logout: () => {
        set({
          currentUser: 'guest@mlstudio.io',
          currentProjectId: null
        });
      },

      addProject: (project) => set((state) => ({
        projects: [project, ...state.projects],
        currentProjectId: project.id
      })),

      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
      })),

      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId
      })),

      setCurrentProject: (id) => set({ currentProjectId: id })
    }),
    {
      name: 'ml-studio-projects-storage',
      storage: createJSONStorage(() => indexedDBStore),
    }
  )
);
