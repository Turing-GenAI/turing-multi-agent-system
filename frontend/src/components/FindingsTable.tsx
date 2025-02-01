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

  // Convert findings to the format expected by FindingsSummary
  const summaryFindings = useMemo(() => ({
    pd: filteredFindings.filter(f => f.agent.toLowerCase().includes('protocol')),
    ae: filteredFindings.filter(f => f.agent.toLowerCase().includes('adverse')),
    sgr: filteredFindings.filter(f => !f.agent.toLowerCase().includes('protocol') && !f.agent.toLowerCase().includes('adverse'))
  }), [filteredFindings]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
        <FindingsSummary findings={summaryFindings} />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {selectedTreeNode && (
          <DetailPane node={selectedTreeNode} />
        )}
        {filteredFindings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            isExpanded={expandedRows.includes(finding.id)}
            onToggle={() => toggleRow(finding.id)}
          />
        ))}
      </Box>
    </Box>
  );
};