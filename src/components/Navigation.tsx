import { NavLink } from 'react-router-dom';
import { Upload, Sliders, BarChart3, Cpu, Settings2, Award, TrendingUp, Settings } from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

const steps = [
  { path: '/', label: 'Import', icon: Upload },
  { path: '/preprocessing', label: 'Preprocess', icon: Sliders },
  { path: '/analyze', label: 'Analyze', icon: BarChart3 },
  { path: '/model-selection', label: 'Model', icon: Cpu },
  { path: '/tuning', label: 'Tune', icon: Settings2 },
  { path: '/results', label: 'Results', icon: Award },
  { path: '/insights', label: 'Insights', icon: TrendingUp },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const { currentStep } = useWorkflowStore();
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ML Studio
            </span>
          </div>
          <div className="flex space-x-4 overflow-x-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.path.slice(1) || (step.path === '/' && currentStep === 'data-import');
              return (
                <NavLink
                  key={step.path}
                  to={step.path}
                  className={({ isActive: navActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                      navActive || isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {step.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
