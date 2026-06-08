export type Step = 'overview' | 'import' | 'preprocess' | 'analyze' | 'model' | 'tune' | 'results' | 'insights';

export interface DatasetSnapshot {
  id: string;
  name: string;
  data: any[];
  columns: string[];
  columnTypes: Record<string, string>;
  shape: [number, number];
  missingValues: Record<string, number>;
  summaryStats: Record<string, any>;
  timestamp: string;
  // Extended for image datasets
  isImage?: boolean;
  imageShape?: [number, number, number]; // height, width, channels
  classNames?: string[];
}

export interface PreprocessingConfig {
  missingValueStrategy: 'drop' | 'mean' | 'median' | 'mode';
  encoding?: any;
  scaling: string;
  selectedFeatures: string[];
  targetVariable: string;
  trainTestSplit: number;
  randomSeed: number;

  // Preserve legacy if any
  handleMissing?: 'drop' | 'fill_mean' | 'fill_median' | 'fill_mode';
  scaleFeatures?: boolean;
  encodeCategorical?: boolean;
}

export interface ModelConfig {
  taskType?: 'classification' | 'regression';
  targetColumn?: string;           // for tabular data
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  validationSplit?: number;
  // For image models
  imageInputShape?: [number, number, number];
  algorithm?: string;
  type?: string;
  hyperparameters?: Record<string, any>;
}

export interface EvaluationMetrics {
  accuracy?: number;
  loss?: number;
  f1?: number;
  precision?: number;
  recall?: number;
  confusionMatrix?: number[][];
  featureImportance?: Record<string, number>;
  trainingTime: number; // seconds
  r2?: number;
  rmse?: number;
  mae?: number;
  modelArtifacts?: {
    modelTopology: any;
    weightSpecs: any;
    weightDataBase64: string;
  };
}

export interface WorkflowState {
  currentStep: Step;
  completedSteps: Step[];
  rawDataset: DatasetSnapshot | null;
  processedDataset: DatasetSnapshot | null;
  trainSet: DatasetSnapshot | null;
  testSet: DatasetSnapshot | null;
  preprocessingConfig: PreprocessingConfig | null;
  modelConfig: ModelConfig | null;
  evaluationResults: EvaluationMetrics | null;
  history: any[];
  aiGuidance: Record<Step, string>;
  featureEngineeringGuidance?: string;
  goal?: string;
  error?: string | null;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  state: WorkflowState;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  currentState: WorkflowState;
  snapshots: ProjectSnapshot[];
}
