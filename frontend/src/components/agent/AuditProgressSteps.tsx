import React from 'react';
import { CheckIcon } from 'lucide-react';

interface AuditProgressStepsProps {
  currentStep: 'greeting' | 'trial' | 'site' | 'date' | 'confirm';
}

const steps = [
  { key: 'trial', label: 'Select Trial' },
  { key: 'site', label: 'Select Site' },
  { key: 'date', label: 'Select Date' },
  { key: 'confirm', label: 'Confirm' },
];

export const AuditProgressSteps: React.FC<AuditProgressStepsProps> = ({ currentStep }) => {
  const getStepStatus = (stepKey: string) => {
    const stepOrder = ['greeting', 'trial', 'site', 'date', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${
                    getStepStatus(step.key) === 'completed'
                      ? 'bg-blue-500 text-white'
                      : getStepStatus(step.key) === 'current'
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-500'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {getStepStatus(step.key) === 'completed' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span 
                className={`
                  mt-2 text-xs font-medium
                  ${
                    getStepStatus(step.key) === 'completed'
                      ? 'text-blue-500'
                      : getStepStatus(step.key) === 'current'
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`
                  flex-1 h-[2px] mx-2
                  ${
                    getStepStatus(step.key) === 'completed'
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
