import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

interface TreeNode {
  title: string;
  children?: TreeNode[];
}

interface TreeMiniMapProps {
  data: TreeNode[];
  selectedNode: TreeNode | null;
  onNavigate: (node: TreeNode) => void;
}

const TreeMiniMap: React.FC<TreeMiniMapProps> = ({ data, selectedNode, onNavigate }) => {
  const maxDepth = React.useMemo(() => {
    const getDepth = (nodes: TreeNode[], currentDepth = 0): number => {
      let maxChildDepth = currentDepth;
      nodes.forEach(node => {
        if (node.children) {
          maxChildDepth = Math.max(maxChildDepth, getDepth(node.children, currentDepth + 1));
        }
      });
      return maxChildDepth;
    };
    return getDepth(data);
  }, [data]);

  const renderMiniNode = (
    node: TreeNode,
    depth = 0,
    index = 0,
    totalSiblings = 1
  ): JSX.Element => {
    const isSelected = selectedNode && selectedNode.title === node.title;
    const hasChildren = node.children && node.children.length > 0;
    const verticalSpace = 100 / (maxDepth + 1);
    const horizontalSpace = 100 / totalSiblings;
    const nodeSize = 4;

    return (
      <React.Fragment key={`${node.title}-${depth}-${index}`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1.2 : 1, 
            opacity: 1 
          }}
          whileHover={{ scale: 1.2 }}
          onClick={() => onNavigate(node)}
          style={{
            position: 'absolute',
            left: `${(index + 0.5) * horizontalSpace}%`,
            top: `${depth * verticalSpace}%`,
            width: nodeSize,
            height: nodeSize,
            borderRadius: '50%',
            backgroundColor: isSelected ? '#2196f3' : '#757575',
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />
        {hasChildren && node.children.map((child, childIndex) => (
          <React.Fragment key={`line-${child.title}-${childIndex}`}>
            <Box
              sx={{
                position: 'absolute',
                left: `${(index + 0.5) * horizontalSpace}%`,
                top: `${depth * verticalSpace}%`,
                width: '1px',
                height: `${verticalSpace}%`,
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                transform: 'translateX(-50%)',
                zIndex: 1,
              }}
            />
            {renderMiniNode(child, depth + 1, childIndex, node.children.length)}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 120,
        height: 160,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        opacity: 0.8,
        transition: 'opacity 0.2s ease',
        '&:hover': {
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {data.map((node, index) => renderMiniNode(node, 0, index, data.length))}
      </Box>
    </Box>
  );
};

export default TreeMiniMap;
