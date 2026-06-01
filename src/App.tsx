import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DataImport from './pages/DataImport';
import Preprocessing from './pages/Preprocessing';
import AnalyzeData from './pages/AnalyzeData';
import ModelSelection from './pages/ModelSelection';
import Tuning from './pages/Tuning';
import Results from './pages/Results';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DataImport />} />
          <Route path="/preprocessing" element={<Preprocessing />} />
          <Route path="/analyze" element={<AnalyzeData />} />
          <Route path="/model-selection" element={<ModelSelection />} />
          <Route path="/tuning" element={<Tuning />} />
          <Route path="/results" element={<Results />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
