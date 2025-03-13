import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import DetailPane from './tools/progresstree/DetailPane';
import { Finding } from '../types';
import { FindingCard } from './findings/FindingCard';
import { FindingsSummary } from './findings/FindingsSummary';

interface TreeNode {
  title: string;
  content?: string;
  children?: TreeNode[];
}

interface FindingsTableProps {
  selectedFindingTab: string;
  setSelectedFindingTab: (value: string) => void;
  findings: Array<{
    id: string;
    agent: string;
    content: string;
    timestamp: string;
  }>;
  expandedRows: string[];
  setExpandedRows: (value: string[]) => void;
  selectedTreeNode: TreeNode | null;
  onRetrievedContextClick?: () => void;
  hasRetrievedContext?: boolean;
  retrievedContextCount?: number;
  isPDLoading?: boolean;
  isAELoading?: boolean;
  isContextLoading?: boolean;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  selectedFindingTab,
  setSelectedFindingTab,
  findings = [],
  expandedRows,
  setExpandedRows,
  selectedTreeNode,
  onRetrievedContextClick,
  hasRetrievedContext = false,
  retrievedContextCount = 0,
  isPDLoading = false,
  isAELoading = false,
  isContextLoading = false,
}) => {
  const toggleRow = (id: string) => {
    setExpandedRows(
      expandedRows.includes(id)
        ? expandedRows.filter((rowId) => rowId !== id)
        : [...expandedRows, id]
    );
  };

  const filteredFindings = useMemo(() => {
    return findings || [];
  }, [findings]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* DetailPane Section */}
      {/* <Box sx={{ flex: '0 0 auto', height: '300px', p: 2 }}>
        <DetailPane selectedNode={selectedTreeNode} />
      </Box> */}

      {/* Findings Section */}
      <Box sx={{ flex: '1 1 auto', overflow: 'auto' }}>
        <div className="bg-white rounded-lg shadow-sm flex flex-col">
          <div className="p-4 border-b space-y-4">
            <FindingsSummary 
              findings={findings} 
              isPDLoading={isPDLoading}
              isAELoading={isAELoading}
            />
          </div>
          {selectedTreeNode && (
            <DetailPane 
              selectedNode={selectedTreeNode} 
              onRetrievedContextClick={onRetrievedContextClick}
              hasRetrievedContext={hasRetrievedContext}
              isContextLoading={isContextLoading}
              retrievedContextCount={retrievedContextCount}
            />
          )}
        </div>
      </Box>
    </Box>
  );
};