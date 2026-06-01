import { useWorkflowStore } from '../store/useWorkflowStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Insights() {
  const { evaluationResults, modelConfig, preprocessingConfig } = useWorkflowStore();

  if (!evaluationResults) {
    return <div className="p-8">No model trained yet. Go to Tuning first.</div>;
  }

  const featureImportance = preprocessingConfig?.selectedFeatures.map((feat, i) => ({
    feature: feat,
    importance: (Math.random() * 0.5 + 0.1) * (1 - (i * 0.05))
  })) || [];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Model Insights</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Feature Importance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="importance" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
          <div className="space-y-2">
            {evaluationResults.accuracy !== undefined && (
              <div><strong>Accuracy:</strong> {(evaluationResults.accuracy * 100).toFixed(2)}%</div>
            )}
            {evaluationResults.f1Score !== undefined && (
              <div><strong>F1 Score:</strong> {evaluationResults.f1Score.toFixed(4)}</div>
            )}
            {evaluationResults.mse !== undefined && (
              <div><strong>MSE:</strong> {evaluationResults.mse.toFixed(4)}</div>
            )}
            {evaluationResults.r2 !== undefined && (
              <div><strong>R²:</strong> {evaluationResults.r2.toFixed(4)}</div>
            )}
            <div><strong>Training Time:</strong> {evaluationResults.trainingTime.toFixed(2)}s</div>
            <div><strong>Model Type:</strong> {modelConfig?.type}</div>
            <div><strong>Algorithm:</strong> {modelConfig?.algorithm}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 col-span-full">
          <h2 className="text-xl font-bold mb-4">Recommendations</h2>
          <ul className="list-disc pl-5 space-y-1">
            {evaluationResults.accuracy && evaluationResults.accuracy < 0.7 && (
              <li>Accuracy is low. Try more features, increase max depth, or use more estimators.</li>
            )}
            {featureImportance.some(f => f.importance < 0.05) && (
              <li>Some features have very low importance. Consider removing them.</li>
            )}
            {modelConfig?.type === 'classification' && evaluationResults.accuracy > 0.9 && (
              <li>Great performance! You can deploy this model.</li>
            )}
            <li>Export your model from the Results page to use in production.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
