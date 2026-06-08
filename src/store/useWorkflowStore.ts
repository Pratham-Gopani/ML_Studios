import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Step, WorkflowState } from '../types';
import { indexedDBStore } from './indexedDBStorage';

interface WorkflowStore extends WorkflowState {
  updateState: (updates: Partial<WorkflowState>) => void;
  resetState: () => void;
  canNavigateTo: (step: Step) => boolean;
}

const INITIAL_STATE: WorkflowState = {
  currentStep: 'overview',
  completedSteps: ['overview'],
  rawDataset: null,
  processedDataset: null,
  trainSet: null,
  testSet: null,
  preprocessingConfig: null,
  modelConfig: null,
  evaluationResults: null,
  history: [],
  aiGuidance: {
    overview: '',
    import: '',
    preprocess: '',
    analyze: '',
    model: '',
    tune: '',
    results: '',
    insights: ''
  },
  featureEngineeringGuidance: '',
  goal: '',
  error: null
};

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      updateState: (updates) => {
        set((state) => {
          const newState = { ...state, ...updates };

          if (updates.rawDataset && state.rawDataset && updates.rawDataset.id !== state.rawDataset.id) {
            newState.processedDataset = null;
            newState.trainSet = null;
            newState.testSet = null;
            newState.preprocessingConfig = null;
            newState.modelConfig = null;
            newState.evaluationResults = null;
            newState.completedSteps = ['overview', 'import'];
          }

          if (updates.goal !== undefined && updates.goal !== state.goal) {
            newState.aiGuidance = INITIAL_STATE.aiGuidance;
          }

          if (updates.currentStep && !state.completedSteps.includes(updates.currentStep)) {
            newState.completedSteps = [...state.completedSteps, updates.currentStep];
          }
          return newState;
        });
      },

      resetState: () => set(INITIAL_STATE),

      canNavigateTo: (step) => {
        const state = get();
        const stepOrder: Step[] = ['overview', 'import', 'preprocess', 'analyze', 'model', 'tune', 'results', 'insights'];
        const targetIndex = stepOrder.indexOf(step);
        const currentIndex = stepOrder.indexOf(state.currentStep);
        if (targetIndex <= currentIndex) return true;
        if (state.completedSteps.includes(step)) return true;

        switch (step) {
          case 'overview': return true;
          case 'import': return true;
          case 'preprocess': return !!state.rawDataset;
          case 'analyze': return !!state.processedDataset;
          case 'model': return !!state.processedDataset;
          case 'tune': return !!state.modelConfig && !!state.trainSet;
          case 'results': return !!state.evaluationResults;
          case 'insights': return !!state.evaluationResults;
          default: return false;
        }
      }
    }),
    {
      name: 'ml-workflow-storage',
      storage: createJSONStorage(() => indexedDBStore),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        rawDataset: state.rawDataset,
        processedDataset: state.processedDataset,
        trainSet: state.trainSet,
        testSet: state.testSet,
        preprocessingConfig: state.preprocessingConfig,
        modelConfig: state.modelConfig,
        evaluationResults: state.evaluationResults,
        history: state.history,
        aiGuidance: state.aiGuidance,
        featureEngineeringGuidance: state.featureEngineeringGuidance,
        goal: state.goal
      })
    }
  )
);
