import { create } from 'zustand';

export interface PreprocessingConfig {
  selectedFeatures: string[];
  targetVariable: string;
  splitRatio: number;
  missingStrategy: 'drop' | 'impute';
  imputeMethod: 'mean' | 'median' | 'mode' | 'constant';
  encodingMethod: 'label' | 'onehot';
  scalingMethod: 'none' | 'minmax' | 'standard';
  outlierMethod: 'none' | 'iqr' | 'cap';
}

export interface ModelConfig {
  type: 'classification' | 'regression' | 'clustering';
  algorithm: string;
  hyperparameters: Record<string, any>;
}

export interface EvaluationResults {
  accuracy?: number;
  f1Score?: number;
  mse?: number;
  r2?: number;
  silhouetteScore?: number;
  trainingTime: number;
}

interface WorkflowState {
  rawDataset: any | null;
  processedDataset: any | null;
  datasetType: 'tabular' | 'image' | null;
  imageDataset: any | null;
  trainSet: Record<string, any>[] | null;
  testSet: Record<string, any>[] | null;
  preprocessingConfig: PreprocessingConfig | null;
  modelConfig: ModelConfig | null;
  evaluationResults: EvaluationResults | null;
  trainedModel: any | null;
  currentStep: 'data-import' | 'preprocessing' | 'analyze' | 'model-selection' | 'tuning' | 'results' | 'insights' | 'settings';
  error: string | null;
  updateState: (updates: Partial<WorkflowState>) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  rawDataset: null,
  processedDataset: null,
  datasetType: null,
  imageDataset: null,
  trainSet: null,
  testSet: null,
  preprocessingConfig: null,
  modelConfig: null,
  evaluationResults: null,
  trainedModel: null,
  currentStep: 'data-import',
  error: null,
  updateState: (updates) => set((state) => ({ ...state, ...updates })),
  reset: () => set({
    rawDataset: null,
    processedDataset: null,
    datasetType: null,
    imageDataset: null,
    trainSet: null,
    testSet: null,
    preprocessingConfig: null,
    modelConfig: null,
    evaluationResults: null,
    trainedModel: null,
    currentStep: 'data-import',
    error: null
  })
}));
