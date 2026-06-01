import * as tf from '@tensorflow/tfjs';
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
        throw new Error(`Algorithm ${modelConfig.algorithm} not implemented`);
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
        throw new Error(`Algorithm ${modelConfig.algorithm} not implemented`);
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
    throw new Error(`Training failed: ${err instanceof Error ? err.message : 'Unknown'}`);
  }
}
