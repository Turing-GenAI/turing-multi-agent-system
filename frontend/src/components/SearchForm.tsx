import React from 'react';
import { Loader2 } from 'lucide-react';

interface SearchFormProps {
  selectedTrial: string;
  selectedSite: string;
  dateRange: { from: Date | undefined; to: Date | undefined };
  isProcessing: boolean;
  handleRunClick: () => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  selectedTrial,
  selectedSite,
  dateRange,
  isProcessing,
  handleRunClick,
}) => {
  const isFormValid = selectedTrial !== '' && selectedSite !== '' && dateRange.from !== undefined && dateRange.to !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Analysis Summary</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Trial</label>
            <div className="mt-1 p-2 bg-gray-50 rounded-lg">{selectedTrial || 'Not selected'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Site</label>
            <div className="mt-1 p-2 bg-gray-50 rounded-lg">{selectedSite || 'Not selected'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Date Range</label>
            <div className="mt-1 p-2 bg-gray-50 rounded-lg">
              {dateRange.from && dateRange.to
                ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                : 'Not selected'}
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={handleRunClick}
              disabled={isProcessing || !isFormValid}
              className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Run Analysis'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};