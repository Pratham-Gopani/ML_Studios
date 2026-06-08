import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { aiService } from '../services/api';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

export default function Chatbot() {
  const { currentStep, goal, rawDataset, processedDataset, modelConfig, evaluationResults } = useWorkflowStore()
  void rawDataset; void processedDataset; void modelConfig; void evaluationResults;;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your ML Assistant. I'm here to help with your ${currentStep} step. What questions do you have?`,
        timestamp: Date.now()
      }]);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        step: currentStep, goal,
      }
      void context;;
      const prompt = `User question: ${input}\nContext: Step=${currentStep}, Goal=${goal || 'not set'}\nPlease answer concisely.`;
      const response = await aiService.getCustomInsight(prompt);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: response, timestamp: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "Sorry, I encountered an error. Please try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, height: isMinimized ? '64px' : '600px', width: '400px' }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-4 flex flex-col"
          >
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">ML Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-indigo-100 font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-slate-100'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                          <div className="prose prose-sm max-w-none">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                          <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 border border-slate-100 flex items-center justify-center shadow-sm">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask a question..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <button onClick={handleSend} disabled={!input.trim() || isLoading}
                      className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button onClick={() => setMessages([])} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />Clear Chat
                    </button>
                    <span className="text-[10px] text-slate-300">|</span>
                    <span className="text-[10px] text-slate-400">Powered by Claude AI</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group relative ${isOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:scale-110 hover:shadow-indigo-200'}`}>
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        {!isOpen && <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />}
        {!isOpen && (
          <div className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Need help? Ask me!
          </div>
        )}
      </button>
    </div>
  );
}
