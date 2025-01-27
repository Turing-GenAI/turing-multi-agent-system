import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Loader2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { FloatingDatePicker } from './FloatingDatePicker';

interface SearchFormProps {
  selectedTrial: string;
  setSelectedTrial: (value: string) => void;
  selectedSite: string;
  setSelectedSite: (value: string) => void;
  isProcessing: boolean;
  handleRunClick: () => void;
  sites: {
    [key: string]: Array<{ id: string; status: string }>;
  };
  trials: string[];
}

export const SearchForm: React.FC<SearchFormProps> = ({
  selectedTrial,
  setSelectedTrial,
  selectedSite,
  setSelectedSite,
  isProcessing,
  handleRunClick,
  sites,
  trials,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (!dateButtonRef.current || !dateButtonRef.current.contains(event.target as Node)) &&
        (!datePickerRef.current || !datePickerRef.current.contains(event.target as Node))
      ) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isFormValid = useMemo(() => {
    return (
      selectedTrial !== '' &&
      selectedSite !== '' &&
      dateRange.from !== undefined &&
      dateRange.to !== undefined
    );
  }, [selectedTrial, selectedSite, dateRange.from, dateRange.to]);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Search Findings</h2>
          {!isFormValid && (
            <span className="text-sm text-gray-500">
              (Please fill all fields)
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 transition-transform duration-200 ${
            isCollapsed ? '' : 'transform rotate-180'
          }`} 
        />
      </div>

      <div 
        className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${
          isCollapsed ? 'max-h-0' : 'max-h-[500px]'
        }`}
      >
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Trial <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTrial}
                onChange={(e) => setSelectedTrial(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a trial</option>
                {trials.map((trial) => (
                  <option key={trial} value={trial}>
                    {trial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a site</option>
                {selectedTrial && sites[selectedTrial] && sites[selectedTrial].map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range <span className="text-red-500">*</span>
              </label>
              <button
                ref={dateButtonRef}
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full p-2 border rounded-lg text-left flex items-center gap-2 hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4" />
                <span className={dateRange.from ? 'text-gray-900' : 'text-gray-500'}>
                  {dateRange.from
                    ? `${format(dateRange.from, 'PP')} - ${
                        dateRange.to ? format(dateRange.to, 'PP') : 'Select end date'
                      }`
                    : 'Select date range'}
                </span>
              </button>
              
              <FloatingDatePicker
                ref={datePickerRef}
                targetRef={dateButtonRef}
                isOpen={showDatePicker}
                dateRange={dateRange}
                onSelect={(range: any) => {
                  setDateRange(range || { from: undefined, to: undefined });
                  if (range?.from && range?.to) {
                    setShowDatePicker(false);
                  }
                }}
              />
            </div>

            <div className="flex items-end">
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
    </div>
  );
};