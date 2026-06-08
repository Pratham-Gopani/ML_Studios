# AGENTS.md

## Project Overview

ML Workflow Studio is an interactive, AI-guided machine learning pipeline application. Users upload datasets and are guided through preprocessing, analysis, model selection, training, and insights — all in a step-based UI.

## Directory Structure

```
src/
├── routes/
│   ├── __root.tsx          # Root HTML shell (HeadContent, Scripts)
│   ├── index.tsx           # Main App component (sidebar + step routing)
│   └── api/
│       ├── ai-guidance.ts  # POST /api/ai-guidance — calls Anthropic Claude
│       └── ml/
│           ├── preprocess.ts  # POST /api/ml/preprocess
│           └── train.ts       # POST /api/ml/train
├── pages/
│   ├── Overview.tsx        # Step 1: Goal setting + feature overview
│   ├── ImportDataset.tsx   # Step 2: Drag-drop file upload (CSV/Excel/JSON)
│   ├── Preprocess.tsx      # Step 3: Missing values, scaling, feature selection
│   ├── Analysis.tsx        # Step 4: Charts (distribution, scatter, stats table)
│   ├── ModelSelection.tsx  # Step 5: Choose model family + algorithm
│   ├── Tuning.tsx          # Step 6: Hyperparameter config + training trigger
│   ├── Results.tsx         # Step 7: Metrics, confusion matrix, feature importance
│   └── Insights.tsx        # Step 8: AI-generated data intelligence
├── components/
│   ├── Navbar.tsx          # Top nav with logo and user menu
│   └── Chatbot.tsx         # Floating AI assistant chat widget
├── store/
│   ├── useWorkflowStore.ts # Zustand store: all ML pipeline state (persisted)
│   └── useProjectStore.ts  # Zustand store: project list (persisted)
├── lib/
│   ├── ml-engine.ts        # File parsing (CSV/Excel/JSON), preprocessing, training simulation
│   └── data-processor.ts   # Pure data functions: type detection, stats, split, preprocessing
├── services/
│   └── api.ts              # Client-side API helpers (mlService, aiService)
├── types.ts                # TypeScript interfaces: Step, DatasetSnapshot, WorkflowState, etc.
├── router.tsx              # TanStack Router setup
└── styles.css              # Tailwind imports + global base styles
```

## Key Concepts

### State Management

The entire ML pipeline state lives in `useWorkflowStore` (Zustand, persisted to localStorage). When a new dataset is loaded, downstream state (processedDataset, model, results) is automatically cleared.

`useProjectStore` manages a list of saved projects. Each project snapshots the entire workflow state.

### AI Integration

All AI calls go through `/api/ai-guidance` (server-side) which uses the Anthropic SDK. Netlify AI Gateway automatically injects `ANTHROPIC_API_KEY`. The model used is `claude-haiku-4-5-20251001` for low latency.

**Do not** call the Anthropic SDK from client-side code — always route through the API endpoint.

### Data Processing

`src/lib/ml-engine.ts` handles file parsing (PapaParse for CSV, xlsx for Excel). `src/lib/data-processor.ts` contains pure functions for column type detection, summary stats, preprocessing (imputation + label encoding), and train/test splitting.

Training is simulated client-side (random but realistic metrics based on dataset size). In production, replace `trainAndEvaluate` with a real server-side ML call.

### Routing

File-based routing via TanStack Router. The route tree (`routeTree.gen.ts`) is auto-generated at build time — never edit it manually. API routes use the `server.handlers` pattern.

## Coding Conventions

- TypeScript strict mode — use explicit types, avoid `any` in new code
- All React components are function components with named exports
- Tailwind CSS for styling — use `cn()` (clsx + tailwind-merge) for conditional classes
- No mocks in API routes — they call real server-side logic

## Non-Obvious Decisions

- **No danfojs**: The original reference used danfojs for DataFrame operations. We replaced it with plain JS functions in `data-processor.ts` for better compatibility and smaller bundle size.
- **Anthropic over Gemini**: Netlify AI Gateway natively supports Anthropic, so we use Claude instead of Gemini to avoid managing separate API keys.
- **Client-side training simulation**: Model training returns simulated metrics. The server routes exist to support future real backend ML without refactoring the frontend.
- **Local persistence**: Projects and workflow state persist in localStorage via Zustand's `persist` middleware. No database is used for this version.
