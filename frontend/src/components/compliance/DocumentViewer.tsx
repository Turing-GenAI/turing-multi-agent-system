import React from 'react';
import { ScrollArea } from "../ui/scroll-area";

interface DocumentViewerProps {
  document: string;
  highlightText: string;
  highlightType: 'high' | 'low' | 'reference';
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  highlightText,
  highlightType
}) => {
  // Function to highlight specific text in the document
  const renderDocumentWithHighlights = () => {
    if (!document || !highlightText) {
      return <p>{document}</p>;
    }

    // Get highlight color based on type
    const getHighlightClass = () => {
      switch (highlightType) {
        case 'high':
          return 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500';
        case 'low':
          return 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500';
        case 'reference':
          return 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500';
        default:
          return 'bg-gray-100 dark:bg-gray-800';
      }
    };

    // Create a regular expression to find all occurrences of the highlight text
    // Using the 'gi' flags for global and case-insensitive matching
    const regex = new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    // Split the document by the regex to get parts before, matching, and after
    const parts = document.split(regex);

    return (
      <div>
        {parts.map((part, i) => {
          // Check if this part matches the highlightText (case-insensitive)
          if (part.toLowerCase() === highlightText.toLowerCase()) {
            return (
              <span key={i} className={`${getHighlightClass()} px-1 py-0.5 rounded`}>
                {part}
              </span>
            );
          }
          // Regular text
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="h-[450px] border rounded-md">
      <ScrollArea className="h-full p-4">
        <div className="font-mono text-sm whitespace-pre-wrap">
          {renderDocumentWithHighlights()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DocumentViewer;
