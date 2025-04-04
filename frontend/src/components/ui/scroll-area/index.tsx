import React from 'react';

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
  viewportRef?: React.RefObject<HTMLDivElement>;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ 
  className = "", 
  children,
  viewportRef 
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={viewportRef}
        className="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {children}
      </div>
    </div>
  );
};

export const ScrollBar = ({ orientation = "vertical", className = "" }) => {
  return (
    <div
      className={`flex touch-none select-none transition-colors ${
        orientation === "vertical" 
          ? "h-full w-2 border-l border-l-transparent p-[1px]" 
          : "h-2 w-full border-t border-t-transparent p-[1px]"
      } ${className}`}
    >
      <div className="relative flex-1 rounded-full bg-gray-200" />
    </div>
  );
};
