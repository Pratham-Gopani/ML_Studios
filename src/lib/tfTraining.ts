import * as tf from '@tensorflow/tfjs';
import { RandomForestClassifier as RFClassifier, RandomForestRegression as RFRegression } from 'ml-random-forest';
import { kmeans } from 'ml-kmeans';
import type { ModelConfig, EvaluationResults } from '../types';

// Euclidean distance
function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

// Silhouette score for clustering
function silhouetteScore(vectors: number[][], labels: number[], centroids: number[][], ignoreNoise = false): number {
  const unique = [...new Set(labels)];
  let total = 0, count = 0;
  for (let i = 0; i < vectors.length; i++) {
    if (ignoreNoise && labels[i] === -1) continue;
    let a = 0, aCount = 0;
    for (let j = 0; j < vectors.length; j++) {
      if (i !== j && labels[j] === labels[i]) {
        a += euclidean(vectors[i], vectors[j]);
        aCount++;
      }
    }
    a = aCount === 0 ? 0 : a / aCount;
    let b = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      if (c === labels[i]) continue;
      const dist = euclidean(vectors[i], centroids[c]);
      if (dist < b) b = dist;
    }
    if (b === Infinity) continue;
    const s = (b - a) / Math.max(a, b);
    total += s;
    count++;
  }
  return count === 0 ? 0 : total / count;
}

// Random Forest classification
async function trainRandomForest(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  featureColumns: string[],
  targetColumn: string
): Promise<{ metrics: EvaluationResults; model: any }> {
  const features = trainData.map(row => featureColumns.map(col => Number(row[col])));
  const labels = trainData.map(row => String(row[targetColumn]));
  const rf = new RFClassifier({ nEstimators: 100, maxFeatures: Math.sqrt(featureColumns.length), maxDepth: 10, seed: 42 });
  rf.train(features, labels);
  const testFeatures = testData.map(row => featureColumns.map(col => Number(row[col])));
  const predictions = rf.predict(testFeatures);
  const trueLabels = testData.map(row => String(row[targetColumn]));
  const unique = [...new Set(trueLabels)];
  const cm = Array(unique.length).fill(0).map(() => Array(unique.length).fill(0));
  let correct = 0;
  for (let i = 0; i < trueLabels.length; i++) {
    const t = unique.indexOf(trueLabels[i]);
    const p = unique.indexOf(predictions[i]);
    cm[t][p]++;
    if (t === p) correct++;
  }
  const accuracy = correct / trueLabels.length;
  let precisionSum = 0, recallSum = 0, f1Sum = 0;
  for (let c = 0; c < unique.length; c++) {
    const tp = cm[c][c];
    const fp = cm.reduce((sum, row) => sum + row[c], 0) - tp;
    const fn = cm[c].reduce((sum, v) => sum + v, 0) - tp;
    const prec = tp / (tp + fp) || 0;
    const rec = tp / (tp + fn) || 0;
    const f1 = (2 * prec * rec) / (prec + rec) || 0;
    precisionSum += prec;
    recallSum += rec;
    f1Sum += f1;
  }
  const metrics: EvaluationResults = {
    accuracy, f1: f1Sum / unique.length, precision: precisionSum / unique.length, recall: recallSum / unique.length,
    confusionMatrix: cm, trainingTime: 0, featureImportance: {}
  };
  return { metrics, model: rf };
}

// Random Forest regression
async function trainRandomForestRegressor(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  featureColumns: string[],
  targetColumn: string
): Promise<{ metrics: EvaluationResults; model: any }> {
  const features = trainData.map(row => featureColumns.map(col => Number(row[col])));
  const labels = trainData.map(row => Number(row[targetColumn]));
  const rf = new RFRegression({ nEstimators: 100, maxFeatures: Math.sqrt(featureColumns.length), maxDepth: 10, seed: 42 });
  rf.train(features, labels);
  const testFeatures = testData.map(row => featureColumns.map(col => Number(row[col])));
  const predictions = rf.predict(testFeatures);
  const trueLabels = testData.map(row => Number(row[targetColumn]));
  let sumSqErr = 0, sumAbsErr = 0, sumSqTotal = 0;
  const meanTrue = trueLabels.reduce((a,b)=>a+b,0)/trueLabels.length;
  for (let i = 0; i < trueLabels.length; i++) {
    const err = trueLabels[i] - predictions[i];
    sumSqErr += err*err;
    sumAbsErr += Math.abs(err);
    sumSqTotal += (trueLabels[i] - meanTrue)**2;
  }
  const metrics: EvaluationResults = {
    rmse: Math.sqrt(sumSqErr/trueLabels.length), mae: sumAbsErr/trueLabels.length, r2: 1 - sumSqErr/sumSqTotal,
    accuracy:0, f1:0, precision:0, recall:0, trainingTime:0, featureImportance: {}
  };
  return { metrics, model: rf };
}

// TensorFlow.js models (classification & regression)
async function trainTFModel(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: ModelConfig,
  featureColumns: string[],
  targetColumn: string
): Promise<{ metrics: EvaluationResults; model: tf.LayersModel }> {
  const isClassification = modelConfig.type === 'classification';
  const features = trainData.map(row => featureColumns.map(col => Number(row[col])));
  let labels = trainData.map(row => row[targetColumn]);
  let numClasses = 0;
  if (isClassification) {
    const unique = [...new Set(labels)];
    const labelMap = new Map(unique.map((v,i)=>[v,i]));
    labels = labels.map(l => labelMap.get(l)!);
    numClasses = unique.length;
  }
  const trainXs = tf.tensor2d(features);
  const trainYs = isClassification ? tf.tensor1d(labels as number[], 'int32') : tf.tensor1d(labels as number[]);
  const testFeatures = testData.map(row => featureColumns.map(col => Number(row[col])));
  const testLabels = testData.map(row => row[targetColumn]);
  const testXs = tf.tensor2d(testFeatures);
  let testYs: tf.Tensor;
  if (isClassification) {
    const unique = [...new Set(testLabels)];
    const map = new Map(unique.map((v,i)=>[v,i]));
    testYs = tf.tensor1d(testLabels.map(l => map.get(l)!), 'int32');
  } else {
    testYs = tf.tensor1d(testLabels as number[]);
  }
  const inputDim = featureColumns.length;
  let model: tf.Sequential;
  if (isClassification) {
    const units = numClasses === 2 ? 1 : numClasses;
    const activation = numClasses === 2 ? 'sigmoid' : 'softmax';
    const loss = numClasses === 2 ? 'binaryCrossentropy' : 'sparseCategoricalCrossentropy';
    if (modelConfig.algorithm === 'Logistic Regression') {
      model = tf.sequential();
      model.add(tf.layers.dense({ units, activation, inputShape: [inputDim] }));
    } else if (modelConfig.algorithm === 'Support Vector Machine') {
      model = tf.sequential();
      model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputDim] }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units, activation }));
    } else if (modelConfig.algorithm === 'Gradient Boosting Classifier' || modelConfig.algorithm === 'XGBoost') {
      model = tf.sequential();
      model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [inputDim] }));
      model.add(tf.layers.dropout({ rate: 0.3 }));
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dense({ units, activation }));
    } else { // Neural Network Classifier
      model = tf.sequential();
      model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputDim] }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units, activation }));
    }
    model.compile({ optimizer: 'adam', loss, metrics: ['accuracy'] });
  } else {
    let reg = null;
    if (modelConfig.algorithm === 'Ridge Regression') reg = tf.regularizers.l2({ l2: 0.01 });
    if (modelConfig.algorithm === 'Lasso Regression') reg = tf.regularizers.l1({ l1: 0.01 });
    if (modelConfig.algorithm === 'Linear Regression' || modelConfig.algorithm === 'Ridge Regression' || modelConfig.algorithm === 'Lasso Regression') {
      model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, activation: 'linear', inputShape: [inputDim], kernelRegularizer: reg }));
    } else if (modelConfig.algorithm === 'Gradient Boosting Regressor' || modelConfig.algorithm === 'XGBoost Regressor') {
      model = tf.sequential();
      model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [inputDim] }));
      model.add(tf.layers.dropout({ rate: 0.3 }));
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
    } else { // Neural Network Regressor
      model = tf.sequential();
      model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputDim] }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
    }
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError', metrics: ['mae'] });
  }
  await model.fit(trainXs, trainYs, { epochs: 50, batchSize: 32, validationSplit: 0.1, verbose: 0 });
  const predTensor = model.predict(testXs) as tf.Tensor;
  let predictions: number[];
  if (isClassification && numClasses === 2) {
    const probs = await predTensor.data();
    predictions = Array.from(probs).map(p => p > 0.5 ? 1 : 0);
  } else if (isClassification) {
    const predClasses = predTensor.argMax(-1);
    predictions = Array.from(await predClasses.data());
  } else {
    predictions = Array.from(await predTensor.data());
  }
  const trueValues = Array.from(await testYs.data());
  let metrics: EvaluationResults;
  if (isClassification) {
    const unique = [...new Set(trueValues)];
    const cm = Array(unique.length).fill(0).map(()=>Array(unique.length).fill(0));
    let correct = 0;
    for (let i=0; i<trueValues.length; i++) {
      const t = trueValues[i];
      const p = predictions[i];
      cm[t][p]++;
      if (t===p) correct++;
    }
    const accuracy = correct / trueValues.length;
    let precisionSum = 0, recallSum = 0, f1Sum = 0;
    for (let c=0; c<unique.length; c++) {
      const tp = cm[c][c];
      const fp = cm.reduce((sum,row)=>sum+row[c],0)-tp;
      const fn = cm[c].reduce((sum,v)=>sum+v,0)-tp;
      const prec = tp/(tp+fp)||0;
      const rec = tp/(tp+fn)||0;
      const f1 = (2*prec*rec)/(prec+rec)||0;
      precisionSum += prec;
      recallSum += rec;
      f1Sum += f1;
    }
    metrics = { accuracy, f1: f1Sum/unique.length, precision: precisionSum/unique.length, recall: recallSum/unique.length, confusionMatrix: cm, trainingTime:0, featureImportance:{} };
  } else {
    let sumSq=0, sumAbs=0, sumSqTotal=0;
    const meanTrue = trueValues.reduce((a,b)=>a+b,0)/trueValues.length;
    for (let i=0; i<trueValues.length; i++) {
      const err = trueValues[i] - predictions[i];
      sumSq += err*err;
      sumAbs += Math.abs(err);
      sumSqTotal += (trueValues[i]-meanTrue)**2;
    }
    metrics = { rmse: Math.sqrt(sumSq/trueValues.length), mae: sumAbs/trueValues.length, r2: 1 - sumSq/sumSqTotal, accuracy:0, f1:0, precision:0, recall:0, trainingTime:0, featureImportance:{} };
  }
  tf.dispose([trainXs, trainYs, testXs, testYs, predTensor]);
  return { metrics, model };
}

// Clustering (K‑Means, DBSCAN, Hierarchical)
async function trainClustering(
  data: Record<string, any>[],
  modelConfig: ModelConfig,
  featureColumns: string[]
): Promise<EvaluationResults> {
  const vectors = data.map(row => featureColumns.map(col => Number(row[col])));
  const algo = modelConfig.algorithm;
  const hyper = modelConfig.hyperparameters || {};
  if (algo === 'K-Means') {
    const k = hyper.numClusters || 3;
    const result = kmeans(vectors, k, { initialization: 'kmeans++' });
    const centroids = result.centroids.map(c=>c.centroid);
    const clusters = result.clusters;
    let inertia = 0;
    for (let i=0; i<vectors.length; i++) inertia += euclidean(vectors[i], centroids[clusters[i]])**2;
    const silhouette = silhouetteScore(vectors, clusters, centroids);
    return { isClustering: true, algorithm: 'K-Means', numClusters: k, inertia, silhouette, accuracy:0,f1:0,precision:0,recall:0,trainingTime:0,featureImportance:{} };
  }
  if (algo === 'DBSCAN') {
    const eps = hyper.eps || 0.5;
    const minPts = hyper.minPts || 5;
    const n = vectors.length;
    const visited = new Array(n).fill(false);
    const clusters = new Array(n).fill(-1);
    let clusterId = 0;
    function regionQuery(idx: number): number[] {
      const neighbors = [];
      for (let i=0; i<n; i++) {
        if (i!==idx && euclidean(vectors[idx], vectors[i]) <= eps) neighbors.push(i);
      }
      return neighbors;
    }
    function expandCluster(idx: number, neighbors: number[]): void {
      clusters[idx] = clusterId;
      for (let i=0; i<neighbors.length; i++) {
        const nidx = neighbors[i];
        if (!visited[nidx]) {
          visited[nidx] = true;
          const nNeighbors = regionQuery(nidx);
          if (nNeighbors.length >= minPts) neighbors.push(...nNeighbors.filter(n=>!neighbors.includes(n)));
        }
        if (clusters[nidx] === -1) clusters[nidx] = clusterId;
      }
    }
    for (let i=0; i<n; i++) {
      if (visited[i]) continue;
      visited[i] = true;
      const neighbors = regionQuery(i);
      if (neighbors.length < minPts) clusters[i] = -1;
      else expandCluster(i, neighbors);
      clusterId++;
    }
    const unique = [...new Set(clusters.filter(c=>c!==-1))];
    const numClusters = unique.length;
    const centroids = unique.map(cid => {
      const pts = vectors.filter((_,i)=>clusters[i]===cid);
      return pts[0].map((_,dim)=>pts.reduce((s,p)=>s+p[dim],0)/pts.length);
    });
    let inertia = 0;
    for (let i=0; i<n; i++) {
      const c = clusters[i];
      if (c!==-1) inertia += euclidean(vectors[i], centroids[c])**2;
    }
    const silhouette = silhouetteScore(vectors, clusters, centroids, true);
    return { isClustering: true, algorithm: 'DBSCAN', numClusters, inertia, silhouette, accuracy:0,f1:0,precision:0,recall:0,trainingTime:0,featureImportance:{} };
  }
  if (algo === 'Hierarchical Clustering') {
    const nClusters = hyper.numClusters || 3;
    let clusters: number[][] = vectors.map((_,i)=>[i]);
    const distances: number[][] = Array(vectors.length).fill(null).map(()=>Array(vectors.length).fill(0));
    for (let i=0; i<vectors.length; i++) {
      for (let j=i+1; j<vectors.length; j++) {
        const d = euclidean(vectors[i], vectors[j]);
        distances[i][j] = d;
        distances[j][i] = d;
      }
    }
    function clusterDist(c1: number[], c2: number[]): number {
      let min = Infinity;
      for (const i of c1) for (const j of c2) min = Math.min(min, distances[i][j]);
      return min;
    }
    while (clusters.length > nClusters) {
      let minDist = Infinity;
      let mergeIdx = [0,0];
      for (let i=0; i<clusters.length; i++) {
        for (let j=i+1; j<clusters.length; j++) {
          const d = clusterDist(clusters[i], clusters[j]);
          if (d < minDist) { minDist = d; mergeIdx = [i, j]; }
        }
      }
      const newCluster = [...clusters[mergeIdx[0]], ...clusters[mergeIdx[1]]];
      clusters = clusters.filter((_,idx)=>idx!==mergeIdx[0] && idx!==mergeIdx[1]);
      clusters.push(newCluster);
    }
    const assignments = new Array(vectors.length).fill(-1);
    for (let cid=0; cid<clusters.length; cid++) {
      for (const idx of clusters[cid]) assignments[idx] = cid;
    }
    const centroids = clusters.map(cl => {
      const pts = cl.map(i=>vectors[i]);
      return pts[0].map((_,dim)=>pts.reduce((s,p)=>s+p[dim],0)/pts.length);
    });
    let inertia = 0;
    for (let i=0; i<vectors.length; i++) inertia += euclidean(vectors[i], centroids[assignments[i]])**2;
    const silhouette = silhouetteScore(vectors, assignments, centroids);
    return { isClustering: true, algorithm: 'Hierarchical', numClusters: nClusters, inertia, silhouette, accuracy:0,f1:0,precision:0,recall:0,trainingTime:0,featureImportance:{} };
  }
  throw new Error(`Clustering algorithm ${algo} not implemented`);
}

// Image CNN (simplified, uses all data for training, no split)
async function trainImageCNN(imageDataset: any): Promise<{ metrics: EvaluationResults; model: tf.LayersModel }> {
  const { images, labels, numClasses, imageSize } = imageDataset;
  const [h,w,c] = imageSize;
  const xs = tf.stack(images) as tf.Tensor4D;
  const ys = tf.tensor1d(labels, 'int32');
  const model = tf.sequential();
  model.add(tf.layers.conv2d({ inputShape: [h,w,c], filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });
  await model.fit(xs, ys, { epochs: 10, batchSize: 16, verbose: 0 });
  const preds = model.predict(xs) as tf.Tensor;
  const predLabels = preds.argMax(-1).arraySync() as number[];
  const actualLabels = Array.from(ys.arraySync() as Int32Array);
  const unique = [...new Set(actualLabels)];
  const cm = Array(unique.length).fill(0).map(()=>Array(unique.length).fill(0));
  let correct = 0;
  for (let i=0; i<actualLabels.length; i++) {
    const t = actualLabels[i];
    const p = predLabels[i];
    cm[t][p]++;
    if (t===p) correct++;
  }
  const accuracy = correct / actualLabels.length;
  let precisionSum=0, recallSum=0, f1Sum=0;
  for (let c=0; c<unique.length; c++) {
    const tp = cm[c][c];
    const fp = cm.reduce((sum,row)=>sum+row[c],0)-tp;
    const fn = cm[c].reduce((sum,v)=>sum+v,0)-tp;
    const prec = tp/(tp+fp)||0;
    const rec = tp/(tp+fn)||0;
    const f1 = (2*prec*rec)/(prec+rec)||0;
    precisionSum += prec;
    recallSum += rec;
    f1Sum += f1;
  }
  const metrics: EvaluationResults = {
    accuracy, f1: f1Sum/unique.length, precision: precisionSum/unique.length, recall: recallSum/unique.length,
    confusionMatrix: cm, trainingTime: 0, featureImportance: {}
  };
  tf.dispose([xs, ys, preds]);
  return { metrics, model };
}

// Main entry point
export async function trainModel(
  trainData: Record<string, any>[],
  testData: Record<string, any>[],
  modelConfig: ModelConfig,
  featureColumns: string[],
  targetColumn: string,
  imageDataset?: any
): Promise<{ metrics: EvaluationResults; model?: any }> {
  const start = Date.now();
  if (imageDataset && imageDataset.images) {
    const res = await trainImageCNN(imageDataset);
    res.metrics.trainingTime = (Date.now() - start) / 1000;
    return res;
  }
  if (modelConfig.type === 'clustering') {
    const metrics = await trainClustering(trainData, modelConfig, featureColumns);
    metrics.trainingTime = (Date.now() - start) / 1000;
    return { metrics, model: null };
  }
  if (modelConfig.algorithm === 'Random Forest Classifier') {
    const res = await trainRandomForest(trainData, testData, featureColumns, targetColumn);
    res.metrics.trainingTime = (Date.now() - start) / 1000;
    return res;
  }
  if (modelConfig.algorithm === 'Random Forest Regressor') {
    const res = await trainRandomForestRegressor(trainData, testData, featureColumns, targetColumn);
    res.metrics.trainingTime = (Date.now() - start) / 1000;
    return res;
  }
  const res = await trainTFModel(trainData, testData, modelConfig, featureColumns, targetColumn);
  res.metrics.trainingTime = (Date.now() - start) / 1000;
  return res;
}
