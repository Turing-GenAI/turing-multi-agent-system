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
            className="w-full p-3 bg-gray-900 text-white rounded-lg 
            hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 
            focus:ring-offset-2 transform transition-all duration-200 ease-in-out
            shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
            hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 
            focus:outline-none transition-all duration-200 appearance-none pr-10"
            style={{ borderColor: 'rgb(229, 231, 235)', color: '#111827' }} /* Ensure no blue colors */
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
            hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 
            focus:outline-none transition-all duration-200 appearance-none pr-10"
          >
            <option value="" className="text-gray-500">Select a site</option>
            {options?.sites?.map((site) => (
              <option key={site.id} value={site.id} className="text-gray-900">
                {site.id} {site.status ? `(${site.status})` : ''}
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
      const datePickerProps = options?.datePickerProps;
      const dateRange = value as { from: Date | undefined; to: Date | undefined };
      const formattedDate = dateRange.from && dateRange.to
        ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
        : 'Select date range';

      return (
        <div className="mt-4">
          <button
            ref={datePickerProps?.targetRef}
            onClick={() => datePickerProps?.setIsOpen(!datePickerProps.isOpen)}
            className="w-full p-3 bg-white border border-gray-200 rounded-lg text-left flex 
            justify-between items-center hover:border-gray-400 focus:border-gray-900 
            focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all duration-200 
            shadow-sm"
          >
            <span className={`${!dateRange.from && !dateRange.to ? 'text-gray-500' : 'text-gray-900'}`}>
              {formattedDate}
            </span>
            <Calendar className="h-5 w-5 text-gray-400" />
          </button>

          {datePickerProps?.isOpen && (
            <div
              ref={datePickerProps?.ref}
              className="absolute mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200"
            >
              <FloatingDatePicker
                targetRef={datePickerProps.targetRef}
                isOpen={datePickerProps.isOpen}
                dateRange={dateRange}
                onSelect={(dates) => onChange(dates)}
              />
            </div>
          )}
        </div>
      );
    }

    default: {
      return null;
    }
  }
};
