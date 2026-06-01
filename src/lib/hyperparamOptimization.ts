import { RandomForestClassifier as RFClassifier, RandomForestRegression as RFRegression } from 'ml-random-forest';
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
}
