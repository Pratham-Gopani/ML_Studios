import { saveAs } from 'file-saver';

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
}
