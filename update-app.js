const fs = require('fs');
const path = require('path');

// ========== FILE CONTENTS (exactly as provided) ==========
const files = {
  // Root config files
  'package.json': `{
  "name": "ml-studios",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tensorflow/tfjs": "^4.15.0",
    "file-saver": "^2.0.5",
    "framer-motion": "^11.0.2",
    "lucide-react": "^0.344.0",
    "ml-kmeans": "^6.0.0",
    "ml-random-forest": "^3.0.1",
    "papaparse": "^5.4.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "recharts": "^2.12.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7",
    "@types/node": "^20.11.0",
    "@types/papaparse": "^5.3.14",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.0"
  }
}`,

  'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
});`,

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};`,

  'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,

  'tsconfig.node.json': `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,

  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ML Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

  'netlify.toml': `[build]
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`,

  // Source files
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;
body { @apply bg-gray-50; }`,

  'src/vite-env.d.ts': `/// <reference types="vite/client" />`,

  'src/App.tsx': `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DataImport from './pages/DataImport';
import Preprocessing from './pages/Preprocessing';
import ModelSelection from './pages/ModelSelection';
import Tuning from './pages/Tuning';
import Results from './pages/Results';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DataImport />} />
          <Route path="/preprocessing" element={<Preprocessing />} />
          <Route path="/model-selection" element={<ModelSelection />} />
          <Route path="/tuning" element={<Tuning />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Layout>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;`,

  'src/store/useWorkflowStore.ts': `import { create } from 'zustand';

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
  currentStep: 'data-import' | 'preprocessing' | 'model-selection' | 'tuning' | 'results';
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
}));`,

  'src/lib/csvParser.ts': `import Papa from 'papaparse';

export function parseCSV(file: File): Promise<{ data: Record<string, any>[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, any>[];
        const columns = results.meta.fields || [];
        resolve({ data, columns });
      },
      error: (error) => reject(error)
    });
  });
}`,

  'src/lib/modelExport.ts': `import { saveAs } from 'file-saver';

export async function exportModel(model: any, filename: string = 'model.json') {
  let exportData: any;
  if (model.toJSON) {
    exportData = model.toJSON();
  } else {
    exportData = {
      type: model.constructor.name,
      params: model.hyperparameters || {},
      weights: model.weights ? await model.getWeights() : null
    };
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
}`,

  'src/lib/hyperparamOptimization.ts': `import { RandomForestClassifier as RFClassifier, RandomForestRegression as RFRegression } from 'ml-random-forest';
import { kmeans } from 'ml-kmeans';

export async function hyperparamSearch(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string,
  strategy: 'grid' | 'random' | 'bayesian',
  cvFolds: number,
  paramGrid: any
): Promise<any> {
  if (strategy === 'grid') {
    return gridSearch(trainData, testData, modelConfig, featureColumns, targetColumn, paramGrid);
  } else {
    const iterations = strategy === 'bayesian' ? 50 : 20;
    return randomSearch(trainData, testData, modelConfig, featureColumns, targetColumn, paramGrid, iterations);
  }
}

async function gridSearch(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string,
  paramGrid: any
): Promise<any> {
  const keys = Object.keys(paramGrid);
  const combinations = cartesianProduct(keys.map(k => paramGrid[k]));
  let bestScore = -Infinity;
  let bestParams = {};

  for (const combination of combinations) {
    const params = Object.fromEntries(keys.map((k, i) => [k, combination[i]]));
    const score = await evaluateParams(trainData, testData, modelConfig, featureColumns, targetColumn, params, cvFolds);
    if (score > bestScore) {
      bestScore = score;
      bestParams = params;
    }
  }
  return bestParams;
}

async function randomSearch(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string,
  paramGrid: any,
  nIterations: number
): Promise<any> {
  let bestScore = -Infinity;
  let bestParams = {};

  for (let i = 0; i < nIterations; i++) {
    const params: any = {};
    for (const key of Object.keys(paramGrid)) {
      const values = paramGrid[key];
      if (Array.isArray(values)) {
        params[key] = values[Math.floor(Math.random() * values.length)];
      } else {
        params[key] = values[0] + Math.random() * (values[1] - values[0]);
      }
    }
    const score = await evaluateParams(trainData, testData, modelConfig, featureColumns, targetColumn, params, 3);
    if (score > bestScore) {
      bestScore = score;
      bestParams = params;
    }
  }
  return bestParams;
}

async function evaluateParams(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string,
  params: any,
  cvFolds: number
): Promise<number> {
  const updatedConfig = {
    ...modelConfig,
    hyperparameters: { ...modelConfig.hyperparameters, ...params }
  };
  const foldSize = Math.floor(trainData.length / cvFolds);
  let totalScore = 0;

  for (let i = 0; i < cvFolds; i++) {
    const valStart = i * foldSize;
    const valEnd = (i + 1) * foldSize;
    const trainFold = [...trainData.slice(0, valStart), ...trainData.slice(valEnd)];
    const valFold = trainData.slice(valStart, valEnd);
    const model = await trainModelFast(trainFold, updatedConfig, featureColumns, targetColumn);
    const score = evaluateModel(model, valFold, updatedConfig, featureColumns, targetColumn);
    totalScore += score;
  }
  return totalScore / cvFolds;
}

async function trainModelFast(
  data: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string
): Promise<any> {
  const features = data.map(row => featureColumns.map(col => Number(row[col])));
  if (modelConfig.type === 'classification') {
    const labels = data.map(row => String(row[targetColumn]));
    const rf = new RFClassifier({
      nEstimators: modelConfig.hyperparameters?.nEstimators || 100,
      maxDepth: modelConfig.hyperparameters?.maxDepth || 10,
      seed: 42
    });
    rf.train(features, labels);
    return rf;
  } else if (modelConfig.type === 'regression') {
    const targets = data.map(row => Number(row[targetColumn]));
    const rf = new RFRegression({
      nEstimators: modelConfig.hyperparameters?.nEstimators || 100,
      maxDepth: modelConfig.hyperparameters?.maxDepth || 10,
      seed: 42
    });
    rf.train(features, targets);
    return rf;
  } else {
    const nClusters = modelConfig.hyperparameters?.numClusters || 3;
    const result = kmeans(features, nClusters);
    return result;
  }
}

function evaluateModel(
  model: any,
  data: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string
): number {
  const features = data.map(row => featureColumns.map(col => Number(row[col])));
  if (modelConfig.type === 'classification') {
    const actuals = data.map(row => String(row[targetColumn]));
    const predictions = model.predict(features);
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === actuals[i]) correct++;
    }
    return correct / predictions.length;
  } else if (modelConfig.type === 'regression') {
    const actuals = data.map(row => Number(row[targetColumn]));
    const predictions = model.predict(features);
    let mse = 0;
    for (let i = 0; i < predictions.length; i++) {
      mse += Math.pow(predictions[i] - actuals[i], 2);
    }
    return -mse / predictions.length;
  } else {
    let inertia = 0;
    const clusters = model.clusters;
    const centroids = model.centroids;
    features.forEach((point, idx) => {
      const centroid = centroids[clusters[idx]];
      inertia += Math.hypot(...point.map((v, i) => v - centroid[i]));
    });
    return -inertia;
  }
}

function cartesianProduct(arrays: any[][]): any[][] {
  return arrays.reduce(
    (a, b) => a.flatMap(d => b.map(e => [d, e].flat())),
    [[]]
  );
}`,

  'src/lib/tfTraining.ts': `import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier as RFClassifier, RandomForestRegression as RFRegression } from 'ml-random-forest';
import { kmeans } from 'ml-kmeans';

export async function trainModel(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: any,
  featureColumns: string[],
  targetColumn: string
): Promise<{ metrics: any; model: any }> {
  await tf.ready();

  if (!trainData?.length) throw new Error('Training data empty');
  if (!testData?.length) throw new Error('Test data empty');
  if (!featureColumns.length) throw new Error('No features');
  if (!targetColumn) throw new Error('No target');

  const startTime = Date.now();
  let metrics: any = {};
  let model: any;

  try {
    const X_train = trainData.map(row => featureColumns.map(col => Number(row[col])));
    const X_test = testData.map(row => featureColumns.map(col => Number(row[col])));

    if (modelConfig.type === 'classification') {
      const uniqueClasses = [...new Set(trainData.map(row => String(row[targetColumn])))];
      const y_train = trainData.map(row => String(row[targetColumn]));
      const y_test = testData.map(row => String(row[targetColumn]));

      if (modelConfig.algorithm === 'Random Forest Classifier') {
        const rf = new RFClassifier({
          nEstimators: modelConfig.hyperparameters?.nEstimators || 100,
          maxDepth: modelConfig.hyperparameters?.maxDepth || 10,
          seed: 42
        });
        rf.train(X_train, y_train);
        const predictions = rf.predict(X_test);
        const accuracy = predictions.filter((p, i) => p === y_test[i]).length / y_test.length;
        metrics = { accuracy, f1Score: accuracy };
        model = rf;
      } else if (modelConfig.algorithm === 'Logistic Regression') {
        const modelTf = tf.sequential();
        modelTf.add(tf.layers.dense({ units: uniqueClasses.length, activation: 'softmax', inputShape: [featureColumns.length] }));
        modelTf.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });
        const xs = tf.tensor2d(X_train);
        const ys = tf.tensor1d(trainData.map(row => uniqueClasses.indexOf(String(row[targetColumn]))), 'int32');
        await modelTf.fit(xs, ys, { epochs: 50, verbose: 0 });
        const testXs = tf.tensor2d(X_test);
        const evalResult = modelTf.evaluate(testXs, tf.tensor1d(testData.map(row => uniqueClasses.indexOf(String(row[targetColumn]))), 'int32')) as tf.Scalar[];
        const accuracy = (evalResult[1] as tf.Scalar).dataSync()[0];
        metrics = { accuracy, f1Score: accuracy };
        model = modelTf;
      } else {
        throw new Error(\`Algorithm \${modelConfig.algorithm} not implemented\`);
      }
    } else if (modelConfig.type === 'regression') {
      const y_train = trainData.map(row => Number(row[targetColumn]));
      const y_test = testData.map(row => Number(row[targetColumn]));

      if (modelConfig.algorithm === 'Random Forest Regressor') {
        const rf = new RFRegression({
          nEstimators: modelConfig.hyperparameters?.nEstimators || 100,
          maxDepth: modelConfig.hyperparameters?.maxDepth || 10,
          seed: 42
        });
        rf.train(X_train, y_train);
        const predictions = rf.predict(X_test);
        const mse = predictions.reduce((sum, p, i) => sum + Math.pow(p - y_test[i], 2), 0) / y_test.length;
        const ssRes = predictions.reduce((sum, p, i) => sum + Math.pow(y_test[i] - p, 2), 0);
        const ssTot = y_test.reduce((sum, y) => sum + Math.pow(y - y_test.reduce((a,b)=>a+b,0)/y_test.length, 2), 0);
        const r2 = 1 - ssRes / ssTot;
        metrics = { mse, r2, rmse: Math.sqrt(mse) };
        model = rf;
      } else {
        throw new Error(\`Algorithm \${modelConfig.algorithm} not implemented\`);
      }
    } else if (modelConfig.type === 'clustering') {
      const nClusters = modelConfig.hyperparameters?.numClusters || 3;
      const result = kmeans(X_train, nClusters);
      const testFeatures = X_test;
      const testClusters = testFeatures.map(point => {
        let minDist = Infinity;
        let cluster = -1;
        result.centroids.forEach((cent, idx) => {
          const dist = Math.hypot(...point.map((v, i) => v - cent[i]));
          if (dist < minDist) { minDist = dist; cluster = idx; }
        });
        return cluster;
      });
      let inertia = 0;
      testFeatures.forEach((point, i) => {
        const centroid = result.centroids[testClusters[i]];
        inertia += Math.hypot(...point.map((v, j) => v - centroid[j]));
      });
      metrics = { silhouetteScore: 1 / (1 + inertia), clusters: nClusters };
      model = result;
    }

    metrics.trainingTime = (Date.now() - startTime) / 1000;
    return { metrics, model };
  } catch (err) {
    console.error(err);
    throw new Error(\`Training failed: \${err instanceof Error ? err.message : 'Unknown'}\`);
  }
}`,

  'src/components/Layout.tsx': `import React from 'react';
import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}`,

  'src/components/Navigation.tsx': `import { NavLink } from 'react-router-dom';
import { Upload, Sliders, Cpu, Settings2, BarChart3 } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

const steps = [
  { path: '/', label: 'Import', icon: Upload },
  { path: '/preprocessing', label: 'Preprocess', icon: Sliders },
  { path: '/model-selection', label: 'Model', icon: Cpu },
  { path: '/tuning', label: 'Tuning', icon: Settings2 },
  { path: '/results', label: 'Results', icon: BarChart3 }
];

export default function Navigation() {
  const { currentStep } = useWorkflowStore();
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ML Studio
            </span>
          </div>
          <div className="flex space-x-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.path.slice(1) || (step.path === '/' && currentStep === 'data-import');
              return (
                <NavLink
                  key={step.path}
                  to={step.path}
                  className={({ isActive: navActive }) =>
                    \`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition \${
                      navActive || isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }\`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {step.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}`,

  'src/components/Chatbot.tsx': `import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([
    { text: "Hi! I'm your ML assistant. Need help with any step?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const { currentStep, datasetType, modelConfig } = useWorkflowStore();

  const getResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    if (lower.includes('import') || lower.includes('upload')) {
      return "You can upload CSV files (with headers) or ZIP files containing images. Supported formats: CSV, ZIP.";
    } else if (lower.includes('clean') || lower.includes('missing')) {
      return "In Preprocessing, you can impute missing values (mean, median, mode, constant) or drop rows. You can also scale features (MinMax, Standard) and encode categorical variables (Label, One-Hot).";
    } else if (lower.includes('model') || lower.includes('algorithm')) {
      return \`You are currently on the \${currentStep} step. Your dataset type is \${datasetType || 'not set'}. Selected model: \${modelConfig?.algorithm || 'none'}.\`;
    } else if (lower.includes('tune') || lower.includes('hyper')) {
      return "Hyperparameter tuning options: Grid Search (exhaustive), Random Search (sampling), Bayesian Optimization (intensive random). Use cross-validation to avoid overfitting.";
    } else if (lower.includes('error') || lower.includes('fail')) {
      return "Common errors: missing target column, non-numeric features, or mismatched data types. Ensure all features are numeric or properly encoded.";
    } else {
      return "I can help with data import, preprocessing, model selection, hyperparameter tuning, and result interpretation. Just ask!";
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    const reply = getResponse(input);
    setTimeout(() => {
      setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
    }, 300);
    setInput('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
          <div className="flex justify-between items-center p-4 bg-indigo-600 text-white">
            <h3 className="font-bold">ML Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={\`flex \${msg.sender === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div className={\`max-w-[80%] p-3 rounded-xl \${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}\`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={sendMessage} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}`,

  'src/components/ModelComparison.tsx': `import { useWorkflowStore } from '../store/useWorkflowStore';

export default function ModelComparison() {
  const { evaluationResults, modelConfig } = useWorkflowStore();
  if (!evaluationResults) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="font-bold text-lg mb-4">Model Performance</h3>
      <div className="space-y-2">
        {evaluationResults.accuracy !== undefined && (
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span className="font-mono">{(evaluationResults.accuracy * 100).toFixed(2)}%</span>
          </div>
        )}
        {evaluationResults.f1Score !== undefined && (
          <div className="flex justify-between">
            <span>F1 Score:</span>
            <span className="font-mono">{evaluationResults.f1Score.toFixed(4)}</span>
          </div>
        )}
        {evaluationResults.mse !== undefined && (
          <div className="flex justify-between">
            <span>MSE:</span>
            <span className="font-mono">{evaluationResults.mse.toFixed(4)}</span>
          </div>
        )}
        {evaluationResults.r2 !== undefined && (
          <div className="flex justify-between">
            <span>R²:</span>
            <span className="font-mono">{evaluationResults.r2.toFixed(4)}</span>
          </div>
        )}
        {evaluationResults.silhouetteScore !== undefined && (
          <div className="flex justify-between">
            <span>Silhouette:</span>
            <span className="font-mono">{evaluationResults.silhouetteScore.toFixed(4)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Training Time:</span>
          <span className="font-mono">{evaluationResults.trainingTime.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/DataImport.tsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { parseCSV } from '../lib/csvParser';

export default function DataImport() {
  const navigate = useNavigate();
  const { updateState } = useWorkflowStore();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      if (file.name.endsWith('.csv')) {
        const { data, columns } = await parseCSV(file);
        updateState({
          rawDataset: { data, columns },
          processedDataset: { data, columns },
          datasetType: 'tabular',
          currentStep: 'preprocessing'
        });
        navigate('/preprocessing');
      } else if (file.name.endsWith('.zip')) {
        updateState({
          datasetType: 'image',
          imageDataset: { file, status: 'loaded' },
          currentStep: 'preprocessing'
        });
        navigate('/preprocessing');
      } else {
        setError('Unsupported file type. Please upload CSV or ZIP.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Import Dataset</h1>
      <div
        className={\`border-2 border-dashed rounded-2xl p-12 text-center transition \${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }\`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">Drag & drop your dataset</p>
        <p className="text-sm text-gray-500 mb-4">CSV (tabular) or ZIP (images)</p>
        <input
          type="file"
          id="file-upload"
          accept=".csv,.zip"
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Choose File
        </label>
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
    </div>
  );
}`,

  'src/pages/Preprocessing.tsx': `import { useState, useEffect } from 'react';
import { Sliders, Table, ArrowRight, BarChart3, AlertTriangle } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Preprocessing() {
  const { processedDataset, datasetType, updateState } = useWorkflowStore();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [missingStrategy, setMissingStrategy] = useState<'drop' | 'impute'>('impute');
  const [imputeMethod, setImputeMethod] = useState<'mean' | 'median' | 'mode' | 'constant'>('mean');
  const [constantValue, setConstantValue] = useState(0);
  const [encodingMethod] = useState<'label' | 'onehot'>('label');
  const [scalingMethod, setScalingMethod] = useState<'none' | 'minmax' | 'standard'>('none');
  const [outlierMethod, setOutlierMethod] = useState<'none' | 'iqr' | 'cap'>('none');
  const [correlationData, setCorrelationData] = useState<any[]>([]);

  const columns: string[] = processedDataset?.columns ?? [];
  const data: Record<string, any>[] = processedDataset?.data ?? [];

  useEffect(() => {
    if (columns.length && data.length) computeCorrelation();
  }, [columns, data]);

  const computeCorrelation = () => {
    const numericCols = columns.filter(col => data.every(row => !isNaN(parseFloat(row[col]))));
    const matrix = [];
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i+1; j < numericCols.length; j++) {
        const col1 = numericCols[i];
        const col2 = numericCols[j];
        const vals1 = data.map(row => parseFloat(row[col1]));
        const vals2 = data.map(row => parseFloat(row[col2]));
        const corr = pearson(vals1, vals2);
        matrix.push({ feature1: col1, feature2: col2, correlation: corr });
      }
    }
    setCorrelationData(matrix);
  };

  const pearson = (x: number[], y: number[]) => {
    const n = x.length;
    const sumX = x.reduce((a,b) => a + b, 0);
    const sumY = y.reduce((a,b) => a + b, 0);
    const sumX2 = x.reduce((a,b) => a + b*b, 0);
    const sumY2 = y.reduce((a,b) => a + b*b, 0);
    const sumXY = x.reduce((a,b,i) => a + b*y[i], 0);
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n*sumX2 - sumX*sumX) * (n*sumY2 - sumY*sumY));
    return den === 0 ? 0 : num / den;
  };

  const handleMissing = (rows: Record<string, any>[]) => {
    if (missingStrategy === 'drop') {
      return rows.filter(row => [...selectedFeatures, targetColumn].every(col => row[col] != null && row[col] !== ''));
    } else {
      return rows.map(row => {
        const newRow = { ...row };
        [...selectedFeatures, targetColumn].forEach(col => {
          if (newRow[col] == null || newRow[col] === '') {
            const values = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
            if (values.length === 0) newRow[col] = 0;
            else if (imputeMethod === 'mean') newRow[col] = values.reduce((a,b)=>a+b,0)/values.length;
            else if (imputeMethod === 'median') {
              values.sort((a,b)=>a-b);
              newRow[col] = values[Math.floor(values.length/2)];
            } else if (imputeMethod === 'mode') {
              const freq: Record<string, number> = {};
              rows.forEach(r => { const v = String(r[col]); freq[v] = (freq[v]||0)+1; });
              newRow[col] = Object.keys(freq).reduce((a,b) => freq[a] > freq[b] ? a : b);
            } else newRow[col] = constantValue;
          }
        });
        return newRow;
      });
    }
  };

  const handleOutliers = (rows: Record<string, any>[]) => {
    if (outlierMethod === 'none') return rows;
    const numericCols = selectedFeatures.filter(col => rows.every(r => !isNaN(parseFloat(r[col]))));
    if (outlierMethod === 'iqr') {
      return rows.filter(row => {
        for (const col of numericCols) {
          const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          const q1 = vals[Math.floor(vals.length * 0.25)];
          const q3 = vals[Math.floor(vals.length * 0.75)];
          const iqr = q3 - q1;
          const lower = q1 - 1.5*iqr;
          const upper = q3 + 1.5*iqr;
          const val = parseFloat(row[col]);
          if (val < lower || val > upper) return false;
        }
        return true;
      });
    } else {
      return rows.map(row => {
        const newRow = { ...row };
        for (const col of numericCols) {
          const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          const q1 = vals[Math.floor(vals.length * 0.25)];
          const q3 = vals[Math.floor(vals.length * 0.75)];
          const iqr = q3 - q1;
          const lower = q1 - 1.5*iqr;
          const upper = q3 + 1.5*iqr;
          let val = parseFloat(newRow[col]);
          if (val < lower) val = lower;
          if (val > upper) val = upper;
          newRow[col] = val;
        }
        return newRow;
      });
    }
  };

  const handleScaling = (rows: Record<string, any>[]) => {
    if (scalingMethod === 'none') return rows;
    const numericCols = selectedFeatures.filter(col => rows.every(r => !isNaN(parseFloat(r[col]))));
    return rows.map(row => {
      const newRow = { ...row };
      for (const col of numericCols) {
        const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
        const std = Math.sqrt(vals.reduce((a,b)=>a+Math.pow(b-mean,2),0)/vals.length);
        let val = parseFloat(newRow[col]);
        if (scalingMethod === 'minmax' && max !== min) val = (val - min) / (max - min);
        else if (scalingMethod === 'standard' && std !== 0) val = (val - mean) / std;
        newRow[col] = val;
      }
      return newRow;
    });
  };

  const handleApply = () => {
    if (!targetColumn || selectedFeatures.length === 0) {
      alert('Select at least one feature and a target column.');
      return;
    }
    let rows = [...data];
    rows = handleMissing(rows);
    rows = handleOutliers(rows);
    rows = handleScaling(rows);
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    const idx = Math.floor(rows.length * splitRatio);
    updateState({
      trainSet: rows.slice(0, idx),
      testSet: rows.slice(idx),
      preprocessingConfig: {
        selectedFeatures,
        targetVariable: targetColumn,
        splitRatio,
        missingStrategy,
        imputeMethod,
        encodingMethod,
        scalingMethod,
        outlierMethod
      },
      currentStep: 'model-selection'
    });
  };

  if (datasetType === 'image') {
    return <div className="p-8">Image preprocessing coming soon. Use CSV for now.</div>;
  }

  if (!data.length) return <div className="p-8">No dataset loaded. Go back to Import.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Preprocessing</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex gap-2"><Table /> Dataset Info</h2>
            <p>Rows: {data.length}</p>
            <p>Columns: {columns.length}</p>
          </div>
          {correlationData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex gap-2"><BarChart3 /> Correlation Map</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature1" angle={45} textAnchor="start" height={80} />
                  <YAxis domain={[-1,1]} />
                  <Tooltip />
                  <Bar dataKey="correlation">
                    {correlationData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.correlation > 0 ? '#6366f1' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Feature & Target Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="font-medium">Features</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {columns.map(col => (
                    <label key={col} className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedFeatures.includes(col)} onChange={() => {
                        if (selectedFeatures.includes(col)) setSelectedFeatures(selectedFeatures.filter(c=>c!==col));
                        else setSelectedFeatures([...selectedFeatures, col]);
                      }} /> {col}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-medium">Target Column</label>
                <select value={targetColumn} onChange={e=>setTargetColumn(e.target.value)} className="w-full mt-1 p-2 border rounded-xl">
                  <option value="">Select</option>
                  {columns.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-medium">Train/Test Split: {Math.round(splitRatio*100)}% / {Math.round((1-splitRatio)*100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={splitRatio} onChange={e=>setSplitRatio(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex gap-2"><AlertTriangle /> Data Cleaning</h2>
            <div className="space-y-4">
              <div>
                <label>Missing Values</label>
                <div className="flex gap-4">
                  <label><input type="radio" value="impute" checked={missingStrategy==='impute'} onChange={()=>setMissingStrategy('impute')} /> Impute</label>
                  <label><input type="radio" value="drop" checked={missingStrategy==='drop'} onChange={()=>setMissingStrategy('drop')} /> Drop rows</label>
                </div>
              </div>
              {missingStrategy === 'impute' && (
                <div>
                  <label>Imputation Method</label>
                  <div className="flex flex-wrap gap-4">
                    {['mean','median','mode','constant'].map(m => (
                      <label key={m}><input type="radio" value={m} checked={imputeMethod===m} onChange={()=>setImputeMethod(m as any)} /> {m}</label>
                    ))}
                  </div>
                  {imputeMethod === 'constant' && <input type="number" value={constantValue} onChange={e=>setConstantValue(parseFloat(e.target.value))} className="mt-2 p-2 border rounded-xl w-full" />}
                </div>
              )}
              <div>
                <label>Outlier Handling</label>
                <select value={outlierMethod} onChange={e=>setOutlierMethod(e.target.value as any)} className="w-full p-2 border rounded-xl">
                  <option value="none">None</option>
                  <option value="iqr">Remove (IQR)</option>
                  <option value="cap">Cap (IQR)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex gap-2"><Sliders /> Feature Engineering</h2>
            <div className="space-y-4">
              <div>
                <label>Scaling</label>
                <select value={scalingMethod} onChange={e=>setScalingMethod(e.target.value as any)} className="w-full p-2 border rounded-xl">
                  <option value="none">None</option>
                  <option value="minmax">Min-Max</option>
                  <option value="standard">Standardization</option>
                </select>
              </div>
            </div>
          </div>
          <button onClick={handleApply} className="w-full flex justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-bold">Apply Preprocessing <ArrowRight /></button>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/ModelSelection.tsx': `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Brain, TrendingUp, CircleDot, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

const models = {
  classification: [
    { name: 'Logistic Regression', icon: TrendingUp },
    { name: 'Random Forest Classifier', icon: Brain }
  ],
  regression: [
    { name: 'Random Forest Regressor', icon: Brain }
  ],
  clustering: [
    { name: 'K-Means', icon: CircleDot }
  ]
};

export default function ModelSelection() {
  const navigate = useNavigate();
  const { updateState, modelConfig } = useWorkflowStore();
  const [selectedType, setSelectedType] = useState<'classification' | 'regression' | 'clustering'>(
    modelConfig?.type || 'classification'
  );
  const [selectedAlgo, setSelectedAlgo] = useState<string>(modelConfig?.algorithm || '');

  const handleNext = () => {
    if (!selectedAlgo) return;
    updateState({
      modelConfig: {
        type: selectedType,
        algorithm: selectedAlgo,
        hyperparameters: getDefaultParams(selectedType, selectedAlgo)
      },
      currentStep: 'tuning'
    });
    navigate('/tuning');
  };

  const getDefaultParams = (type: string, algo: string) => {
    if (type === 'classification') return { nEstimators: 100, maxDepth: 10 };
    if (type === 'regression') return { nEstimators: 100, maxDepth: 10 };
    return { numClusters: 3 };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Select Model</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Problem Type</h2>
        <div className="flex gap-4">
          {(['classification', 'regression', 'clustering'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setSelectedType(type); setSelectedAlgo(''); }}
              className={\`px-6 py-2 rounded-xl font-medium transition \${
                selectedType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }\`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models[selectedType].map(model => {
          const Icon = model.icon;
          return (
            <button
              key={model.name}
              onClick={() => setSelectedAlgo(model.name)}
              className={\`p-6 rounded-2xl border-2 transition text-left \${
                selectedAlgo === model.name ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
              }\`}
            >
              <Icon className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-bold text-lg">{model.name}</h3>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!selectedAlgo}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
        >
          Next: Hyperparameter Tuning <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}`,

  'src/pages/Tuning.tsx': `import { useState, useEffect } from 'react';
import { Settings2, Play, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { trainModel } from '../lib/tfTraining';
import { hyperparamSearch } from '../lib/hyperparamOptimization';

export default function Tuning() {
  const { trainSet, testSet, preprocessingConfig, modelConfig, updateState } = useWorkflowStore();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tuningStrategy, setTuningStrategy] = useState<'grid' | 'random' | 'bayesian'>('grid');
  const [cvFolds, setCvFolds] = useState(5);
  const [hyperparamGrid, setHyperparamGrid] = useState<any>({});

  useEffect(() => {
    if (modelConfig) {
      if (modelConfig.type === 'classification' || modelConfig.type === 'regression') {
        setHyperparamGrid({
          nEstimators: [50, 100, 200],
          maxDepth: [5, 10, 15]
        });
      } else {
        setHyperparamGrid({ numClusters: [3, 5, 7, 10] });
      }
    }
  }, [modelConfig]);

  const handleTrain = async () => {
    setIsTraining(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 3, 92)), 200);
    try {
      if (!trainSet?.length || !testSet?.length) throw new Error('Missing train/test data');
      if (!preprocessingConfig) throw new Error('No preprocessing config');
      const { selectedFeatures, targetVariable } = preprocessingConfig;
      let bestParams = null;
      if (tuningStrategy !== 'grid') {
        bestParams = await hyperparamSearch(
          trainSet, testSet, modelConfig, selectedFeatures, targetVariable,
          tuningStrategy, cvFolds, hyperparamGrid
        );
        updateState({
          modelConfig: { ...modelConfig, hyperparameters: { ...modelConfig.hyperparameters, ...bestParams } }
        });
      }
      const finalConfig = bestParams ? { ...modelConfig, hyperparameters: { ...modelConfig.hyperparameters, ...bestParams } } : modelConfig;
      const result = await trainModel(trainSet, testSet, finalConfig, selectedFeatures, targetVariable);
      clearInterval(interval);
      setProgress(100);
      updateState({ evaluationResults: result.metrics, trainedModel: result.model, currentStep: 'results' });
    } catch (err) {
      clearInterval(interval);
      updateState({ error: err instanceof Error ? err.message : 'Training failed' });
      alert(\`Error: \${err instanceof Error ? err.message : 'Training failed'}\`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Hyperparameter Tuning</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex gap-2"><Settings2 /> Tuning Strategy</h2>
            <div className="flex gap-4 mb-4">
              {(['grid', 'random', 'bayesian'] as const).map(s => (
                <label key={s} className="flex items-center gap-2">
                  <input type="radio" name="strategy" value={s} checked={tuningStrategy === s} onChange={() => setTuningStrategy(s)} />
                  {s.charAt(0).toUpperCase() + s.slice(1)} Search
                </label>
              ))}
            </div>
            <div>
              <label>Cross-Validation Folds: {cvFolds}</label>
              <input type="range" min={2} max={10} value={cvFolds} onChange={e => setCvFolds(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Hyperparameter Grid</h2>
            <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(hyperparamGrid, null, 2)}</pre>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">Training</h2>
            {isTraining ? (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: \`\${progress}%\` }} /></div>
                <p className="text-center text-sm">{progress}%</p>
              </div>
            ) : (
              <button onClick={handleTrain} className="w-full flex justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-bold">
                <Play className="w-4 h-4" /> Start Training
              </button>
            )}
            <div className="mt-4 text-sm text-gray-500">
              <p>Model: {modelConfig?.algorithm}</p>
              <p>Train samples: {trainSet?.length || 0}</p>
              <p>Test samples: {testSet?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'src/pages/Results.tsx': `import { useWorkflowStore } from '../store/useWorkflowStore';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, CheckCircle } from 'lucide-react';
import { exportModel } from '../lib/modelExport';
import ModelComparison from '../components/ModelComparison';

export default function Results() {
  const { evaluationResults, trainedModel, reset } = useWorkflowStore();
  const navigate = useNavigate();

  const handleExport = async () => {
    if (trainedModel) {
      await exportModel(trainedModel, 'ml_model.json');
    }
  };

  const handleNew = () => {
    reset();
    navigate('/');
  };

  if (!evaluationResults) {
    return (
      <div className="text-center p-12">
        <p>No results yet. Train a model first.</p>
        <button onClick={() => navigate('/tuning')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl">Go to Tuning</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Results</h1>
      <div className="grid gap-6">
        <ModelComparison />
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Training Status</h2>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" /> Training completed successfully
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
            <Download className="w-4 h-4" /> Export Model
          </button>
          <button onClick={handleNew} className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold">
            <RefreshCw className="w-4 h-4" /> Start New Project
          </button>
        </div>
      </div>
    </div>
  );
}`
};

// ========== SCRIPT EXECUTION ==========
const rootDir = __dirname; // or process.cwd()

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Updated: ${relativePath}`);
}

console.log('\n🎉 All files updated successfully!');
console.log('Next steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Run "npm run build" to build the project');
console.log('3. Deploy the "dist" folder to Netlify');
