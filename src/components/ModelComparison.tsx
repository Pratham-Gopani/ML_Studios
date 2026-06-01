import { useWorkflowStore } from '../store/useWorkflowStore';

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
}
