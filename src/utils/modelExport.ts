import * as tf from '@tensorflow/tfjs';
import JSZip from 'jszip';

export async function generateModelZip(model: any): Promise<Blob> {
  const zip = new JSZip();
  if (model.save && typeof model.save === 'function') {
    await model.save(tf.io.withSaveHandler(async (artifacts) => {
      zip.file('model.json', JSON.stringify({
        modelTopology: artifacts.modelTopology,
        weightsManifest: [{ paths: ['group1-shard1of1.bin'], weights: artifacts.weightSpecs }],
        format: 'tfjs-layers'
      }));
      zip.file('group1-shard1of1.bin', artifacts.weightData);
    }));
  } else if (model.toJSON) {
    zip.file('model.json', JSON.stringify(model.toJSON(), null, 2));
  } else {
    throw new Error('Model type not supported for export');
  }
  return await zip.generateAsync({ type: 'blob' });
}
