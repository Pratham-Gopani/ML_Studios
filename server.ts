import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { preprocessDataset, trainAndEvaluate } from './src/lib/ml-engine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set payload size limits to handle datasets
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Initialize Gemini client on the server
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Health
  app.get("/api/health", (_req: any, res: any) => {
    res.json({ status: "ok" });
  });

  // API Route: AI Guidance
  app.post("/api/ai-guidance", async (req: any, res: any) => {
    try {
      const { type, step, context, prompt: customPrompt } = req.body;
      let userPrompt = '';

      if (type === 'custom' && customPrompt) {
        userPrompt = customPrompt;
      } else {
        const { goal, rawDataset, processedDataset, modelConfig, evaluationResults } = context || {};
        const goalInfo = goal ? `User's Goal: ${goal}` : "User's Goal: General data exploration and modeling.";
        const datasetInfo = rawDataset ? `
Dataset: ${rawDataset.columns?.join(', ')} (${rawDataset.shape?.[0]} rows × ${rawDataset.shape?.[1]} cols)
Missing values: ${JSON.stringify(rawDataset.missingValues)}` : '';

        const prompts: Record<string, string> = {
          overview: `Provide a brief, professional introduction to ML workflow for this project. ${goalInfo} Explain how a structured ML pipeline will help. Keep it concise (3-4 sentences).`,
          import: `${datasetInfo}. ${goalInfo}. Briefly explain if this data is suitable and suggest target variables (2-3 sentences).`,
          preprocess: `${datasetInfo}. ${goalInfo}. Suggest specific preprocessing: missing value handling, encoding, and scaling for this dataset. Be concise.`,
          analyze: `${datasetInfo}. ${goalInfo}. Suggest 3 specific visualizations for this dataset. Be brief.`,
          model: `${goalInfo}. Processed columns: ${processedDataset?.columns?.join(', ') || 'unknown'}. Recommend top 3 ML algorithms for this task with brief pros/cons.`,
          tune: `Model: ${modelConfig?.algorithm || 'Unknown'}. ${goalInfo}. Suggest key hyperparameters to tune and search ranges. Be concise.`,
          results: `Results: accuracy=${evaluationResults?.accuracy?.toFixed(3)}, f1=${evaluationResults?.f1?.toFixed(3)}, r2=${evaluationResults?.r2?.toFixed(3)}. ${goalInfo}. Interpret these results and suggest the next improvement step. Be concise.`,
          insights: `Model: ${modelConfig?.algorithm}, Results: ${JSON.stringify(evaluationResults)}. ${goalInfo}. Provide 3-4 strategic business insights from this model. Be concise.`
        };

        userPrompt = prompts[step] || `Provide guidance for step: ${step}. ${goalInfo}`;

        if (type === 'feature_engineering') {
          const { dataset, modelConfig: mc } = context;
          userPrompt = `Dataset columns: ${dataset?.columns?.join(', ')}. Model: ${mc?.algorithm} (${mc?.type}). ${goalInfo}. Suggest 3-4 feature engineering steps. Be concise.`;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: `You are a Senior ML Architect and the official embedded AI assistant inside ML Workflow Studio. 
Your core priority is supporting users as they run through the interactive step-by-step Machine Learning pipeline.

The application has the following architecture:
1. App Structure (8 steps):
   - Step 1 (Overview Page): High-level task goals setup.
   - Step 2 (Import Dataset Page): Import either a Tabular Dataset (CSV, Excel) or an Image Dataset (ZIP of categorized images).
   - Step 3 (Preprocess Page): Handle missing values, scaling, feature selection, and test split.
   - Step 4 (Analysis Page): Charts, stats tables, and class distributions.
   - Step 5 (Choose Model Page): Selecting algorithms (e.g., Logistic Regression, Random Forest, CNN, LSTM, VGG) and target/task type.
   - Step 6 (Tune & Evaluate Page): Set epochs, batch limits, hyperparams, and trigger live model training.
   - Step 7 (Results Page): Render progressive metrics, confusion matrix, precision/recall, and loss trends.
   - Step 8 (Insights Page): High-value strategic AI business analysis.

2. State Management & Storage:
   - Client is powered by Zustand stores: useWorkflowStore for pipeline state and useProjectStore for saved projects.
   - Persistence is fully handled client-side using a robust IndexedDB custom storage adapter ('MLStudioDB' with 'store' object-store) which auto-saves projects and workflow state local to the current logged-in user context. No complex SQL backend database is required for this client-first layout.

3. Processing & Training Engine:
   - Data preprocessing and file parsing are done client-side using papaparse and xlsx.
   - Training is executed directly in the user browser thread using TensorFlow.js (allowing real-time progressive logs and leveraging browser WebGL acceleration).
   - If WebGL throws a "Failed to link vertex and fragment shaders" driver error (common in sandboxed iframes or low-power hardware), our engine automatically triggers a self-healing cascade, falling back dynamically to CPU mode to finish model fitting seamlessly.

In your answers:
- Be concise (keep under 200 words), actionable, and extremely helpful.
- Reference the specific active step and page names naturally.
- Highlight that the app uses advanced client-side browser fitting with self-healing WebGL-to-CPU shader logic and Local IndexedDB project saving to ensure extreme speed and data privacy.`
        }
      });

      const text = response.text || 'No response from AI guidance.';
      res.json({ text });
    } catch (err: any) {
      console.error('AI guidance error:', err);
      res.json({ text: 'AI guidance unavailable. Please proceed manually.' });
    }
  });

  // API Route: Preprocess
  app.post("/api/ml/preprocess", async (req: any, res: any) => {
    try {
      const { snapshot, config } = req.body;
      const result = await preprocessDataset(snapshot, config);
      res.json(result);
    } catch (err: any) {
      console.error('Preprocessing api error:', err);
      res.status(400).json({ error: err.message || 'Preprocessing failed' });
    }
  });

  // API Route: Train
  app.post("/api/ml/train", async (req: any, res: any) => {
    try {
      const { trainSet, testSet, config } = req.body;
      const result = await trainAndEvaluate(trainSet, testSet, config);
      res.json(result);
    } catch (err: any) {
      console.error('Training api error:', err);
      res.status(400).json({ error: err.message || 'Training failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
