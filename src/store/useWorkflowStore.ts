import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Step = 'overview' | 'import' | 'preprocessing' | 'model-selection' | 'tuning' | 'results' | 'insights' | 'projects';

export interface WorkflowState {
  currentStep: Step;
  rawDataset: any;
  processedDataset: any;
  datasetType: 'tabular' | 'image';
  imageDataset: any;
  trainSet: any[];
  testSet: any[];
  preprocessingConfig: any;
  modelConfig: any;
  evaluationResults: any;
  trainedModel: any;
  featureEngineeringGuidance: string;
  error: string | null;
  updateState: (updates: Partial<WorkflowState>) => void;
  setTrainedModel: (model: any) => void;
  setDatasetType: (type: 'tabular' | 'image') => void;
  setImageDataset: (data: any) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      currentStep: 'overview',
      rawDataset: null,
      processedDataset: null,
      datasetType: 'tabular',
      imageDataset: null,
      trainSet: [],
      testSet: [],
      preprocessingConfig: null,
      modelConfig: null,
      evaluationResults: null,
      trainedModel: null,
      featureEngineeringGuidance: '',
      error: null,
      updateState: (updates) => set((state) => ({ ...state, ...updates })),
      setTrainedModel: (model) => set({ trainedModel: model }),
      setDatasetType: (type) => set({ datasetType: type }),
      setImageDataset: (data) => set({ imageDataset: data }),
    }),
    { name: 'ml-workflow-storage' }
  )
);
