import React from 'react';
import { Box } from '@mui/material';

const branchColors: string[] = [
  '#2196f3', // Blue
  '#4caf50', // Green
  '#ff9800', // Orange
  '#e91e63', // Pink
  '#9c27b0', // Purple
];

interface BranchLinesProps {
  depth: number;
  isLastChild: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
}

const BranchLines: React.FC<BranchLinesProps> = ({ depth, isLastChild, hasChildren, isExpanded }) => {
  const colorIndex = (depth - 1) % branchColors.length;
  const lineColor = depth > 0 ? branchColors[colorIndex] : 'transparent';
  const baseX = depth * 24;
  const nodeHeight = 40;
  const halfNodeHeight = nodeHeight / 2;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: -halfNodeHeight,
        bottom: -halfNodeHeight,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        {depth > 0 && (
          <>
            {/* Vertical line from parent */}
            <path
              d={`
                M ${baseX} 0
                L ${baseX} ${halfNodeHeight}
                ${!isLastChild ? `L ${baseX} 100%` : ''}
              `}
              stroke={lineColor}
              strokeWidth={2}
              fill="none"
            />

            {/* Curved branch to current node */}
            <path
              d={`
                M ${baseX} ${halfNodeHeight}
                C ${baseX + 12} ${halfNodeHeight}
                  ${baseX + 24} ${halfNodeHeight}
                  ${baseX + 36} ${halfNodeHeight}
              `}
              stroke={lineColor}
              strokeWidth={2}
              fill="none"
            />

            {/* Connection to children if expanded */}
            {hasChildren && isExpanded && (
              <path
                d={`
                  M ${baseX + 36} ${halfNodeHeight}
                  L ${baseX + 48} ${halfNodeHeight}
                  C ${baseX + 60} ${halfNodeHeight}
                    ${baseX + 60} ${halfNodeHeight}
                    ${baseX + 60} ${halfNodeHeight + 20}
                  L ${baseX + 60} ${nodeHeight}
                `}
                stroke={lineColor}
                strokeWidth={2}
                fill="none"
              />
            )}
          </>
        )}
      </svg>
    </Box>
  );
};

export default BranchLines;
