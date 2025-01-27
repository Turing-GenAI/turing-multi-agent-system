import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ProgressStepsProps {
  steps: Step[];
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps }) => {
  return (
    <div className="w-full py-4">
      <div className="flex flex-col space-y-1">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              {/* Step Node */}
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-green-500'
                      : step.status === 'in_progress'
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : step.status === 'in_progress' ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-4 text-sm">
                  {step.label}
                </div>
              </div>
            </div>
            {/* Connector Line with Dots */}
            {index < steps.length - 1 && (
              <div className="ml-4 h-8 flex items-center">
                <div className={`w-0.5 h-full relative ${
                  step.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {/* Decorative dots */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 space-y-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} style={{ marginTop: '4px' }} />
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
