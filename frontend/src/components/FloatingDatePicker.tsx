import React, { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
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
  const top = targetRect.bottom + window.scrollY;
  const left = targetRect.left + window.scrollX;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      }}
      className="bg-white rounded-lg shadow-xl border"
    >
      <DayPicker
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={onSelect}
        disabled={{ after: new Date() }}
        numberOfMonths={2}
        className="p-3"
        modifiersStyles={{
          selected: {
            backgroundColor: '#2563eb',
            color: 'white'
          },
          today: {
            color: '#2563eb',
            fontWeight: 'bold'
          }
        }}
        styles={{
          months: { display: 'flex', gap: '1rem' },
          caption: { color: '#374151', fontWeight: '500' },
          head_cell: { color: '#374151', fontWeight: '500', padding: '0.5rem' },
          cell: { padding: '2px' },
          day: { margin: '0', width: '40px', height: '40px', fontSize: '0.875rem' },
        }}
      />
    </div>,
    document.body
  );
});
