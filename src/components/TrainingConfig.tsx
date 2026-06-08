import React, { useState } from 'react';
import { ModelConfig } from '../types';

interface TrainingConfigProps {
  onTrain: (config: ModelConfig) => void;
  isImageDataset: boolean;
}

export default function TrainingConfig({ onTrain, isImageDataset }: TrainingConfigProps) {
  const [config, setConfig] = useState<ModelConfig>({
    taskType: 'classification',
    epochs: 20,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2,
    targetColumn: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'learningRate' ? parseFloat(value) : parseInt(value, 10) || value
    }));
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <h3 className="text-lg font-semibold">Training Configuration</h3>
      <div>
        <label>Task Type</label>
        <select name="taskType" value={config.taskType} onChange={handleChange} className="block w-full p-2 border rounded">
          <option value="classification">Classification</option>
          <option value="regression">Regression</option>
        </select>
      </div>
      {!isImageDataset && (
        <div>
          <label>Target Column</label>
          <input name="targetColumn" value={config.targetColumn} onChange={handleChange} className="block w-full p-2 border rounded" />
        </div>
      )}
      <div>
        <label>Epochs</label>
        <input name="epochs" type="number" value={config.epochs} onChange={handleChange} className="block w-full p-2 border rounded" />
      </div>
      <div>
        <label>Batch Size</label>
        <input name="batchSize" type="number" value={config.batchSize} onChange={handleChange} className="block w-full p-2 border rounded" />
      </div>
      <div>
        <label>Learning Rate</label>
        <input name="learningRate" type="number" step="0.0001" value={config.learningRate} onChange={handleChange} className="block w-full p-2 border rounded" />
      </div>
      <button onClick={() => onTrain(config)} className="w-full py-2 bg-green-600 text-white rounded">
        Start Training
      </button>
    </div>
  );
}
