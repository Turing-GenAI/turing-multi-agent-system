import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { FloatingDatePicker } from './FloatingDatePicker';
import ProgressTree from './tools/progresstree/ProgressTree';
import { TreeNode } from '../data/activities';

interface ToolUIProps {
  type: 'trial' | 'site' | 'date' | 'button' | 'progresstree';
  value: any;
  onChange: (value: any) => void;
  options?: {
    trials?: string[];
    sites?: Array<{ id: string; status: string }>;
    datePickerProps?: {
      ref: React.RefObject<HTMLDivElement>;
      targetRef: React.RefObject<HTMLButtonElement>;
      isOpen: boolean;
      setIsOpen: (value: boolean) => void;
    };
    buttonText?: string;
    isAnalysisStarted?: boolean;
    progressTreeProps?: {
      showBreadcrumbs?: boolean;
      showMiniMap?: boolean;
      showKeyboardNav?: boolean;
      showQuickActions?: boolean;
      initialExpandedNodes?: string[];
      animationDuration?: number;
    };
  };
}

export const ToolUI: React.FC<ToolUIProps> = ({ type, value, onChange, options }) => {
  switch (type) {
    case 'progresstree': {
      const treeNode = value as TreeNode | null;
      return (
        <div className="mt-4">
          <ProgressTree
            type="full"
            value={treeNode}
            onChange={onChange}
            options={options?.progressTreeProps}
          />
        </div>
      );
    }

    case 'button': {
      return (
        <div className="mt-4">
          <button
            onClick={() => onChange(true)}
            disabled={options?.isAnalysisStarted}
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg 
            hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:ring-offset-2 transform transition-all duration-200 ease-in-out hover:scale-[1.02] 
            shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed 
            disabled:hover:scale-100 disabled:hover:shadow-sm disabled:hover:from-blue-500 
            disabled:hover:to-blue-600"
          >
            {options?.buttonText || 'Proceed'}
          </button>
        </div>
      );
    }

    case 'trial': {
      return (
        <div className="mt-4 relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm
            hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
            focus:outline-none transition-all duration-200 appearance-none pr-10"
          >
            <option value="" className="text-gray-500">Select a trial</option>
            {options?.trials?.map((trial) => (
              <option key={trial} value={trial} className="text-gray-900">
                {trial}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      );
    }

    case 'site': {
      return (
        <div className="mt-4 relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm
            hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
            focus:outline-none transition-all duration-200 appearance-none pr-10"
          >
            <option value="" className="text-gray-500">Select a site</option>
            {options?.sites?.map((site) => (
              <option key={site.id} value={site.id} className="text-gray-900">
                {site.id}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      );
    }

    case 'date': {
      const dateRange = value as { from: Date | undefined; to: Date | undefined };
      const { ref, targetRef, isOpen, setIsOpen } = options?.datePickerProps || {};

      return (
        <div className="mt-4">
          <button
            ref={targetRef}
            onClick={() => setIsOpen?.(!isOpen)}
            className="w-full p-3 border border-gray-200 rounded-lg text-left flex items-center gap-3 
            bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
            focus:outline-none transition-all duration-200 shadow-sm group"
          >
            <Calendar className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
            <span className={`${dateRange.from ? 'text-gray-900' : 'text-gray-500'} flex-1`}>
              {dateRange.from
                ? `${format(dateRange.from, 'PP')} - ${
                    dateRange.to ? format(dateRange.to, 'PP') : 'Select end date'
                  }`
                : 'Select date range'}
            </span>
          </button>
          
          {ref && targetRef && (
            <FloatingDatePicker
              ref={ref}
              targetRef={targetRef}
              isOpen={isOpen || false}
              dateRange={dateRange}
              onSelect={(range: any) => {
                onChange(range || { from: undefined, to: undefined });
                if (range?.from && range?.to) {
                  setIsOpen?.(false);
                }
              }}
            />
          )}
        </div>
      );
    }

    default: {
      return null;
    }
  }
};
