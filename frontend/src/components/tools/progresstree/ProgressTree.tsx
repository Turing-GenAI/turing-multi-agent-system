import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import TreePane from './TreePane';
import BreadcrumbTrail from './BreadcrumbTrail';
import TreeMiniMap from './TreeMiniMap';
import KeyboardNavigation from './KeyboardNavigation';
import QuickActions from './QuickActions';
import { activities, TreeNode, PathNode } from '../../../data/activities'
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressTreeProps {
  type: 'tree' | 'minimap' | 'full';
  value: TreeNode | null;
  onChange: (node: TreeNode | null) => void;
  options?: {
    showBreadcrumbs?: boolean;
    showMiniMap?: boolean;
    showKeyboardNav?: boolean;
    showQuickActions?: boolean;
    initialExpandedNodes?: string[];
    animationDuration?: number;
  };
}

const ProgressTree: React.FC<ProgressTreeProps> = ({ 
  type, 
  value: selectedNode, 
  onChange: onNodeSelect,
  options = {} 
}) => {
  const {
    showBreadcrumbs = true,
    showMiniMap = true,
    showKeyboardNav = true,
    showQuickActions = true,
    initialExpandedNodes = [],
    animationDuration = 800
  } = options;

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(initialExpandedNodes);
  const [displayedActivities, setDisplayedActivities] = useState<TreeNode[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Simulate dynamic node addition
  useEffect(() => {
    const addNodesSequentially = async () => {
      const buildNodeList = (nodes: TreeNode[], parentPath = '') => {
        return nodes.reduce<TreeNode[]>((acc, node) => {
          const currentPath = parentPath ? `${parentPath}/${node.title}` : node.title;
          acc.push({ ...node, fullPath: currentPath });
          if (node.children) {
            acc.push(...buildNodeList(node.children, currentPath));
          }
          return acc;
        }, []);
      };

      const allNodes = buildNodeList(activities);
      
      for (let i = 0; i < allNodes.length; i++) {
        await new Promise(resolve => setTimeout(resolve, animationDuration));
        const currentNode = allNodes[i];
        const pathParts = currentNode.fullPath?.split('/') || [];

        setDisplayedActivities(prev => {
          const newActivities = [...prev];
          let currentLevel = newActivities;
          
          for (let j = 0; j < pathParts.length - 1; j++) {
            const part = pathParts[j];
            let existingNode = currentLevel.find(n => n.title === part);
            if (!existingNode) {
              existingNode = { title: part, children: [] };
              currentLevel.push(existingNode);
            }
            currentLevel = existingNode.children || [];
          }

          const lastPart = pathParts[pathParts.length - 1];
          if (!currentLevel.find(n => n.title === lastPart)) {
            currentLevel.push({
              ...currentNode,
              children: currentNode.children || []
            });
          }

          return [...newActivities];
        });

        setExpandedNodes(prev => {
          const parentNodes = pathParts.slice(0, -1);
          return Array.from(new Set([...prev, ...parentNodes]));
        });

        onNodeSelect(currentNode);
      }
    };

    addNodesSequentially();
  }, [animationDuration, onNodeSelect]);

  const handleToggleExpand = useCallback((nodeTitle: string) => {
    setExpandedNodes(prev =>
      prev.includes(nodeTitle)
        ? prev.filter(title => title !== nodeTitle)
        : [...prev, nodeTitle]
    );
  }, []);

  const handleExpandAll = useCallback(() => {
    const getAllNodeTitles = (nodes: TreeNode[]): string[] => {
      return nodes.reduce<string[]>((titles, node) => {
        titles.push(node.title);
        if (node.children) {
          titles.push(...getAllNodeTitles(node.children));
        }
        return titles;
      }, []);
    };
    setExpandedNodes(getAllNodeTitles(activities));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes([]);
  }, []);

  const showKeyboardShortcuts = useCallback(() => {
    alert(`
Keyboard Shortcuts:
↑ Up Arrow: Navigate to previous node
↓ Down Arrow: Navigate to next node
← Left Arrow: Navigate to parent node
→ Right Arrow: Navigate to first child node
Enter: Toggle expand/collapse
    `);
  }, []);

  const nodePath = useMemo((): PathNode[] => {
    if (!selectedNode) return [];
    
    const path: PathNode[] = [];
    const findPath = (nodes: TreeNode[], targetNode: TreeNode): boolean => {
      for (const node of nodes) {
        if (node === targetNode) {
          path.push({ title: node.title, color: '#2196f3' });
          return true;
        }
        if (node.children && findPath(node.children, targetNode)) {
          path.unshift({ title: node.title, color: '#4caf50' });
          return true;
        }
      }
      return false;
    };
    
    findPath(activities, selectedNode);
    return path;
  }, [selectedNode]);

  switch (type) {
    case 'minimap':
      return (
        <TreeMiniMap
          data={activities}
          selectedNode={selectedNode}
          onNavigate={onNodeSelect}
        />
      );

    case 'tree':
      return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
          <TreePane
            data={displayedActivities}
            onNodeSelect={onNodeSelect}
            selectedNode={selectedNode}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
          />
        </Box>
      );

    case 'full':
    default:
      if (isMobile) {
        return (
          <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {mobileOpen && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bgcolor: 'background.paper',
                  zIndex: 1200,
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <TreePane
                  data={displayedActivities}
                  onNodeSelect={(node) => {
                    onNodeSelect(node);
                    setMobileOpen(false);
                  }}
                  selectedNode={selectedNode}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                />
              </Box>
            )}
            <Box
              component={motion.main}
              layout
              sx={{
                flexGrow: 1,
                height: '100%',
                overflow: 'auto',
                bgcolor: 'background.default',
                p: 2,
              }}
            >
              <AnimatePresence mode="wait">
                {showBreadcrumbs && nodePath.length > 0 && (
                  <BreadcrumbTrail path={nodePath} />
                )}
              </AnimatePresence>
            </Box>
            {showQuickActions && (
              <QuickActions
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                showKeyboardShortcuts={showKeyboardShortcuts}
              />
            )}
          </Box>
        );
      }

      return (
        <Box sx={{ width: '100%', bgcolor: 'grey.100' }}>
          <Box
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              m: 1,
            }}
          >
            <TreePane
              data={displayedActivities}
              onNodeSelect={onNodeSelect}
              selectedNode={selectedNode}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
            />
          </Box>

          {showKeyboardNav && (
            <KeyboardNavigation
              data={activities}
              selectedNode={selectedNode}
              onNodeSelect={onNodeSelect}
              onToggleExpand={handleToggleExpand}
            />
          )}

          {showMiniMap && (
            <TreeMiniMap
              data={activities}
              selectedNode={selectedNode}
              onNavigate={onNodeSelect}
            />
          )}

          {showQuickActions && (
            <QuickActions
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              showKeyboardShortcuts={showKeyboardShortcuts}
            />
          )}
        </Box>
      );
  }
};

export default ProgressTree;
