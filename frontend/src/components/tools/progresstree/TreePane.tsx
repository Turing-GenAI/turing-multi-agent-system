import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BranchLines from './BranchLines';
import NodeStatus from './NodeStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { getAgentDisplayNameByNode } from '../../../data/agentNames';

interface TreeNodeData {
  name: string;
  summary?: string;
  content?: string;
  children?: TreeNodeData[];
  status?: 'pending' | 'in progress' | 'complete';
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth?: number;
  isLastChild: boolean;
  onNodeSelect: (node: TreeNodeData & { path: string }) => void;
  selectedNode: (TreeNodeData & { path: string }) | null;
  expandedNodes: string[];
  onToggleExpand: (title: string) => void;
  parentPath?: string;
}

interface TreePaneProps {
  data: TreeNodeData[];
  selectedNode: (TreeNodeData & { path: string }) | null;
  onNodeSelect: (node: TreeNodeData & { path: string }) => void;
  expandedNodes: string[];
  onToggleExpand: (title: string) => void;
}

interface AnimatedTextProps {
  text: string;
  delay?: number;
  speed?: number;
}

interface SummaryPopupProps {
  summary: string;
  isVisible: boolean;
  position: { x: number; y: number };
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text, delay = 0, speed = 0.05 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Typography
        variant="body2"
        component={motion.div}
        sx={{
          color: 'text.secondary',
          fontSize: '0.85rem',
          mt: 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {text.split('').map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.1,
              delay: delay + (index * speed),
              ease: "easeOut"
            }}
          >
            {char}
          </motion.span>
        ))}
      </Typography>
    </motion.div>
  );
};

const SummaryPopup: React.FC<SummaryPopupProps> = ({ summary, isVisible, position }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderRadius: 1,
          p: 2,
          maxWidth: '400px',
          maxHeight: '200px',
          overflow: 'auto'
        }}
      >
        <Typography variant="body2">
          {summary}
        </Typography>
      </Box>
    </motion.div>
  );
};

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth = 0,
  isLastChild,
  onNodeSelect,
  selectedNode,
  expandedNodes,
  onToggleExpand,
  parentPath = ''
}) => {
  // Create a unique path for this node based on its position in the tree
  const nodePath = parentPath ? `${parentPath}.${node.name}` : node.name;
  const isSelected = selectedNode && selectedNode.path === nodePath;
  const isExpanded = expandedNodes.includes(nodePath);
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;

  const [popupPosition, setPopupPosition] = React.useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = React.useState(false);

  const handleNodeSelect = () => {
    onNodeSelect({ ...node, path: nodePath });
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (node.summary) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPopupPosition({
        x: rect.right + 10,
        y: rect.top
      });
      setShowPopup(true);
    }
  };

  const handleMouseLeave = () => {
    setShowPopup(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {node.summary && (
        <AnimatePresence>
          <SummaryPopup
            summary={node.summary}
            isVisible={showPopup}
            position={popupPosition}
          />
        </AnimatePresence>
      )}
      <BranchLines 
        depth={depth}
        isLastChild={isLastChild}
        hasChildren={!!hasChildren}
        isExpanded={isExpanded}
      />
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: depth * 0.1 }}
      >
        <Box
          component={motion.div}
          whileHover={{ scale: 1.01 }}
          onClick={handleNodeSelect}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            pl: depth * 3 + 6,
            pr: 2,
            py: 2,
            cursor: 'pointer',
            position: 'relative',
            minHeight: '40px',
            borderRadius: 1,
            transition: 'all 0.2s ease-in-out',
            border: '1px solid transparent',
            '&:hover': {
              bgcolor: 'background.highlight',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              borderColor: 'primary.light',
              transform: 'translateX(4px)',
            },
            ...(isSelected && {
              bgcolor: 'background.highlight',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                bgcolor: 'primary.main',
                borderRadius: '0 4px 4px 0',
              },
            }),
            ...(isLeaf && {
              margin: '4px 8px',
              '&:hover': {
                borderColor: 'primary.light',
                transform: 'translateX(4px)',
              },
            }),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {hasChildren && (
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onToggleExpand(nodePath);
                }}
                sx={{ mr: 1 }}
              >
                {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 28, mr: 1 }} />}
            
            <NodeStatus status={node.status || 'pending'} />
            
            <Box sx={{ 
              minWidth: 0, 
              flex: 1,
              width: '100%',
              overflow: 'visible',
              ml: 1.5
            }}>
              <Typography
                sx={{
                  fontSize: isLeaf ? '1rem' : '0.9rem',
                  fontWeight: isSelected ? 600 : isLeaf ? 500 : 400,
                  color: isLeaf ? 'primary.main' : 'text.primary',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getAgentDisplayNameByNode(node.name)}
              </Typography>
              {isLeaf && node.summary && (
                <AnimatedText 
                  text={node.summary}
                  delay={0.2}
                  speed={0.01}
                />
              )}
            </Box>
          </Box>
        </Box>
      </motion.div>

      <AnimatePresence>
        {isExpanded && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {node.children.map((child, index) => (
              <TreeNode
                key={child.name}
                node={child}
                depth={depth + 1}
                isLastChild={index === node.children!.length - 1}
                onNodeSelect={onNodeSelect}
                selectedNode={selectedNode}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                parentPath={nodePath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

const TreePane: React.FC<TreePaneProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  expandedNodes,
  onToggleExpand
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        py: 2,
      }}
    >
      {data.map((node, index) => (
        <TreeNode
          key={node.name}
          node={node}
          isLastChild={index === data.length - 1}
          onNodeSelect={onNodeSelect}
          selectedNode={selectedNode}
          expandedNodes={expandedNodes}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </Box>
  );
};

export default TreePane;
