import React, { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { Calendar } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface FloatingDatePickerProps {
  targetRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onSelect: (range: any) => void;
}

export const FloatingDatePicker = forwardRef<HTMLDivElement, FloatingDatePickerProps>(({
  targetRef,
  isOpen,
  dateRange,
  onSelect,
}, ref) => {
  if (!isOpen || !targetRef.current) return null;

  const targetRect = targetRef.current.getBoundingClientRect();
  
  // Calculate position but adjust to ensure it stays in viewport
  const viewportHeight = window.innerHeight;
  const calendarHeight = 350; // Approximate height of calendar
  
  // If the calendar would go off the bottom of the screen, position it above the button
  const wouldOverflowBottom = targetRect.bottom + calendarHeight > viewportHeight;
  const top = wouldOverflowBottom 
    ? targetRect.top + window.scrollY - calendarHeight - 10 // Position above with a small gap
    : targetRect.bottom + window.scrollY + 5; // Position below with a small gap
  
  // Position to the right of the button
  const left = Math.min(window.innerWidth - 530, targetRect.right + window.scrollX + 10);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'absolute', // Change back to absolute to allow scrolling with page
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
        maxWidth: '520px', // Limit the overall width
        maxHeight: '350px', // Limit the overall height
        overflow: 'hidden' // Hide overflow
      }}
      className="bg-white rounded-lg shadow-xl border"
    >
      <div className="flex items-center p-2 border-b border-gray-200">
        <Calendar className="w-4 h-4 mr-2 text-gray-800" />
        <h3 className="text-sm font-medium text-gray-800">Select Date Range</h3>
      </div>
      <DayPicker
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={onSelect}
        disabled={{ after: new Date() }}
        numberOfMonths={2}
        className="p-2 scale-90 origin-top-left"
        modifiersClassNames={{
          selected: "custom-selected-day",
          range_start: "day-range-start",
          range_end: "day-range-end",
          range_middle: "day-range-middle"
        }}
        modifiersStyles={{
          today: {
            color: '#2563eb',
            fontWeight: 'bold'
          }
        }}
        styles={{
          months: { display: 'flex', gap: '0.5rem' },
          caption: { color: '#374151', fontWeight: '500', fontSize: '1rem' },
          head_cell: { color: '#374151', fontWeight: '500', padding: '0.25rem', fontSize: '0.9rem' },
          cell: { padding: '1px' },
          day: { margin: '0', width: '32px', height: '32px', fontSize: '0.9rem' },
        }}
      />
      <style jsx global>{`
        .custom-selected-day {
          font-weight: bold;
        }
        .day-range-start {
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 50% 0 0 50% !important;
        }
        .day-range-end {
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 0 50% 50% 0 !important;
        }
        .day-range-middle {
          background-color: rgba(37, 99, 235, 0.2) !important;
          color: #1e40af !important;
          border-radius: 0 !important;
        }
      `}</style>
    </div>,
    document.body
  );
});
