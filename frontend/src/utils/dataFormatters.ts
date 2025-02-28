/**
 * Utility functions for formatting data for display
 */

/**
 * Formats Self RAG data for display in the DataViewer component
 * @param ragData The raw Self RAG data from the backend
 * @returns Formatted data for the DataViewer
 */
export const formatSelfRagData = (ragData: any) => {
  if (!ragData) return null;

  // Basic structure for the formatted data
  const formattedData = {
    ...ragData,
    source: 'Self RAG',
    filename: ragData.filename || 'Unknown',
    file_directory: ragData.file_path || ragData.directory || 'Unknown',
    last_modified: ragData.last_modified || new Date().toISOString(),
    page_name: ragData.page_name || 'Unknown',
    page_number: ragData.page_number || 1,
    filetype: ragData.filetype || getFileTypeFromFilename(ragData.filename),
    category: ragData.category || 'Document',
    // If the data has HTML content, we can use it directly
    text_as_html: ragData.text_as_html || formatTextAsHtml(ragData.text || ragData.content || ''),
  };

  return formattedData;
};

/**
 * Attempts to determine the file type from a filename
 * @param filename The filename to analyze
 * @returns The detected file type or 'Unknown'
 */
const getFileTypeFromFilename = (filename: string): string => {
  if (!filename) return 'Unknown';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'xls':
    case 'xlsx':
      return 'Excel Spreadsheet';
    case 'ppt':
    case 'pptx':
      return 'PowerPoint Presentation';
    case 'txt':
      return 'Text File';
    case 'csv':
      return 'CSV File';
    case 'json':
      return 'JSON File';
    case 'html':
    case 'htm':
      return 'HTML Document';
    default:
      return extension ? `${extension.toUpperCase()} File` : 'Unknown';
  }
};

/**
 * Converts plain text to HTML with proper formatting
 * @param text The plain text to convert
 * @returns HTML formatted text
 */
const formatTextAsHtml = (text: string): string => {
  if (!text) return '';
  
  // Replace newlines with <br> tags
  let html = text.replace(/\n/g, '<br>');
  
  // Highlight potential headers (lines that end with a colon)
  html = html.replace(/^(.+:)(?=<br>|$)/gm, '<strong>$1</strong>');
  
  // Wrap the content in a div
  return `<div class="formatted-text">${html}</div>`;
};
