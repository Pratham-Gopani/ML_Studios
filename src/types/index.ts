export interface ModelConfig {
  type: 'classification' | 'regression' | 'clustering';
  algorithm: string;
  hyperparameters?: Record<string, any>;
}

export interface EvaluationResults {
  accuracy?: number;
  f1?: number;
  precision?: number;
  recall?: number;
  confusionMatrix?: number[][];
  rmse?: number;
  mae?: number;
  r2?: number;
  trainingTime?: number;
  featureImportance?: Record<string, number>;
  isClustering?: boolean;
  algorithm?: string;
  numClusters?: number;
  inertia?: number;
  silhouette?: number;
}

export interface ImageDataset {
  images: any[];
  labels: number[];
  labelNames: string[];
  numClasses: number;
  imageSize: [number, number, number];
}
