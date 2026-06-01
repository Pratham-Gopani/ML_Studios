import { useState } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function Settings() {
  const { reset } = useWorkflowStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Appearance</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} /> Light
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Dark (coming soon)
            </label>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Data Handling</h2>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoSave} onChange={() => setAutoSave(!autoSave)} />
            Auto-save preprocessing state (local storage)
          </label>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Danger Zone</h2>
          <button
            onClick={() => {
              if (confirm('Reset all data? This cannot be undone.')) {
                reset();
                localStorage.clear();
                window.location.href = '/';
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            Reset Entire Application
          </button>
        </div>
      </div>
    </div>
  );
}
