import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([
    { text: "Hi! I'm your ML assistant. Need help with any step?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const { currentStep, datasetType, modelConfig } = useWorkflowStore();

  const getResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    if (lower.includes('import') || lower.includes('upload')) {
      return "You can upload CSV files (with headers) or ZIP files containing images. Supported formats: CSV, ZIP.";
    } else if (lower.includes('clean') || lower.includes('missing')) {
      return "In Preprocessing, you can impute missing values (mean, median, mode, constant) or drop rows. You can also scale features (MinMax, Standard) and encode categorical variables (Label, One-Hot).";
    } else if (lower.includes('model') || lower.includes('algorithm')) {
      return `You are currently on the ${currentStep} step. Your dataset type is ${datasetType || 'not set'}. Selected model: ${modelConfig?.algorithm || 'none'}.`;
    } else if (lower.includes('tune') || lower.includes('hyper')) {
      return "Hyperparameter tuning options: Grid Search (exhaustive), Random Search (sampling), Bayesian Optimization (intensive random). Use cross-validation to avoid overfitting.";
    } else if (lower.includes('error') || lower.includes('fail')) {
      return "Common errors: missing target column, non-numeric features, or mismatched data types. Ensure all features are numeric or properly encoded.";
    } else {
      return "I can help with data import, preprocessing, model selection, hyperparameter tuning, and result interpretation. Just ask!";
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    const reply = getResponse(input);
    setTimeout(() => {
      setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
    }, 300);
    setInput('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
          <div className="flex justify-between items-center p-4 bg-indigo-600 text-white">
            <h3 className="font-bold">ML Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={sendMessage} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
