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
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  selectedFindingTab,
  setSelectedFindingTab,
  findings = [],
  expandedRows,
  setExpandedRows,
  selectedTreeNode,
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
            <FindingsSummary findings={findings} />
          </div>
          <DetailPane selectedNode={selectedTreeNode} />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {filteredFindings.map((finding) => (
                <FindingCard 
                  key={finding.id} 
                  finding={finding}
                  isExpanded={expandedRows.includes(finding.id)}
                  onToggle={() => toggleRow(finding.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </Box>
    </Box>
  );
};