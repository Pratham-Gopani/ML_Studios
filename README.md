# ML Workflow Studio

An interactive, AI-powered Machine Learning Workflow Studio built with TanStack Start and deployed on Netlify. Upload your dataset, preprocess it, analyze patterns, train models, and get AI-generated insights — all in one streamlined workflow.

## Features

- **Multi-step ML pipeline**: Overview → Import → Preprocess → Analyze → Model → Tune → Results → Insights
- **Dataset support**: CSV, Excel (.xlsx/.xls), and JSON file formats
- **Data preprocessing**: Missing value imputation, feature scaling, label encoding, feature selection, train/test splitting
- **Interactive visualizations**: Distribution charts, scatter plots, missing-value pie charts, confusion matrices, and feature importance charts using Recharts
- **AI guidance**: Claude AI assistant (via Netlify AI Gateway) provides contextual suggestions at each step
- **AI chat assistant**: Floating chatbot for real-time Q&A throughout the workflow
- **Project management**: Create and switch between multiple ML projects, all persisted locally

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React + Vite) |
| Routing | TanStack Router v1 (file-based) |
| State | Zustand with persistence |
| Charts | Recharts |
| Animations | Motion (Framer Motion) |
| Styling | Tailwind CSS 4 |
| AI | Anthropic Claude via Netlify AI Gateway |
| Deployment | Netlify |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

## Environment Variables

The Netlify AI Gateway automatically injects `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` when deployed on Netlify. For local development, create a `.env.local` file:

```
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

1. **Overview**: Set your ML goal (e.g., "Predict customer churn")
2. **Import Dataset**: Upload a CSV, Excel, or JSON file
3. **Preprocess**: Configure missing value strategy, scaling, target variable, and train/test split
4. **Analyze**: Explore feature distributions, scatter plots, and statistics
5. **Choose Model**: Select classification, regression, or clustering algorithms
6. **Tune & Evaluate**: Configure hyperparameters and train the model
7. **Results**: View accuracy, F1-score, confusion matrix, and feature importance
8. **Insights**: Get AI-generated data intelligence and strategic recommendations
