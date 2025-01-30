import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import TreePane from './TreePane';
import BreadcrumbTrail from './BreadcrumbTrail';
import TreeMiniMap from './TreeMiniMap';
import KeyboardNavigation from './KeyboardNavigation';
import QuickActions from './QuickActions';
import { TreeNode, PathNode } from '../../../data/activities'
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  showKeyboardShortcuts: () => void;
  onToggleSearch: () => void;
  onToggleFilters: () => void;
}

interface ProgressTreeProps {
  type: 'tree' | 'minimap' | 'full';
  value: TreeNode[];
  onChange: (node: TreeNode & { path: string } | null) => void;
  options?: {
    showBreadcrumbs?: boolean;
    showKeyboardNav?: boolean;
    showQuickActions?: boolean;
    initialExpandedNodes?: string[];
    animationDuration?: number;
  };
}

const ProgressTree: React.FC<ProgressTreeProps> = ({ 
  type, 
  value: activities = [], 
  onChange: onNodeSelect,
  options = {} 
}) => {
  const {
    showBreadcrumbs = true,
    showKeyboardNav = true,
    showQuickActions = true,
    initialExpandedNodes = [],
    animationDuration = 800
  } = options;

  console.log(" activities : ", activities);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(initialExpandedNodes);
  const [displayedActivities, setDisplayedActivities] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<(TreeNode & { path: string }) | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const updateNodeStatus = useCallback((nodes: TreeNode[], path: string[], newStatus: 'pending' | 'in progress' | 'complete'): TreeNode[] => {
    return nodes.map(node => {
      if (path.length === 0) return node;

      if (node.title === path[0]) {
        if (path.length === 1) {
          if (newStatus === 'in progress' && node.children) {
            const hasInProgressChild = node.children.some(child => child.status === 'in progress');
            if (hasInProgressChild) return node;
          }
          
          if (newStatus === 'complete' && node.children) {
            const allChildrenComplete = node.children.every(child => child.status === 'complete');
            if (!allChildrenComplete) return node;
          }
          
          return { ...node, status: newStatus };
        }
        
        return {
          ...node,
          children: node.children ? updateNodeStatus(node.children, path.slice(1), newStatus) : undefined
        };
      }
      return node;
    });
  }, []);

  const updateNodeStatusAndExpand = useCallback(async (path: string[], newStatus: 'pending' | 'in progress' | 'complete') => {
    // Helper function to get all node titles from a path
    const getNodeTitlesFromPath = (path: string[]): string[] => {
      // This will store all parent paths
      const paths: string[] = [];
      let currentPath = '';
      
      // Build paths incrementally
      path.forEach((segment, index) => {
        if (index === 0) {
          currentPath = segment;
        } else {
          currentPath = `${currentPath}.${segment}`;
        }
        paths.push(currentPath);
      });
      
      return paths;
    };

    // Update the status
    setDisplayedActivities(prev => updateNodeStatus(prev, path, newStatus));
    
    // Get all parent paths and expand them
    const nodePaths = getNodeTitlesFromPath(path);
    setExpandedNodes(prev => [...new Set([...prev, ...nodePaths])]);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, animationDuration));
  }, [animationDuration, updateNodeStatus]);

  useEffect(() => {
    let currentIndex = 0;
    const addNodesSequentially = async () => {
      if (currentIndex >= activities.length) return;

      const currentNode = activities[currentIndex];
      if (currentNode) {
        // Wait for the animation duration
        await new Promise(resolve => setTimeout(resolve, animationDuration));

        // Update node status
        setDisplayedActivities(prev => updateNodeStatus(prev, [currentNode.title], 'in progress'));

        // Get all parent paths for expansion
        const parentNodes = getParentPaths(currentNode.title);
        setExpandedNodes(prev => {
          return Array.from(new Set([...prev, ...parentNodes]));
        });

        // Set selected node with path
        const nodePath = parentNodes[parentNodes.length - 1] || currentNode.title;
        setSelectedNode({ ...currentNode, path: nodePath });
        onNodeSelect({ ...currentNode, path: nodePath });

        currentIndex++;
        addNodesSequentially();
      }
    };

    addNodesSequentially();
  }, [animationDuration, updateNodeStatus, onNodeSelect]);

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
    setExpandedNodes(getAllNodeTitles(displayedActivities));
  }, [displayedActivities]);

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

  const quickActionsProps: QuickActionsProps = {
    onExpandAll: handleExpandAll,
    onCollapseAll: handleCollapseAll,
    showKeyboardShortcuts,
    onToggleSearch: () => {},
    onToggleFilters: () => {}
  };

  const nodePath = useMemo((): PathNode[] => {
    if (!activities) return [];
    
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
    
    findPath(activities, activities[0]);
    return path;
  }, [activities]);

  const handleNodeSelect = (node: TreeNode & { path: string }) => {
    setSelectedNode(node);
    onNodeSelect(node);
  };

  switch (type) {
    case 'minimap':
      return (
        <TreeMiniMap
          data={activities}
          selectedNode={activities.length > 0 ? activities[0] : null}
          onNavigate={onNodeSelect}
        />
      );

    case 'tree':
      return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
          <TreePane
            data={displayedActivities}
            onNodeSelect={handleNodeSelect}
            selectedNode={selectedNode}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
          />
        </Box>
      );

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
                    handleNodeSelect(node);
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
            {showQuickActions && <QuickActions {...quickActionsProps} />}
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
              onNodeSelect={handleNodeSelect}
              selectedNode={selectedNode}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
            />
          </Box>

          {/* {showKeyboardNav && (
            <KeyboardNavigation
              data={activities}
              selectedNode={activities.length > 0 ? activities[0] : null}
              onNodeSelect={onNodeSelect}
              onToggleExpand={handleToggleExpand}
            />
          )} */}

          {/* {showMiniMap && (
            <TreeMiniMap
              data={activities}
              selectedNode={activities.length > 0 ? activities[0] : null}
              onNavigate={onNodeSelect}
            />
          )} */}

          {/* {showQuickActions && (
            <QuickActions
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              showKeyboardShortcuts={showKeyboardShortcuts}
              onToggleSearch={handleToggleSearch}
              onToggleFilters={handleToggleFilters}
            />
          )} */}
        </Box>
      );
  }
};

export default ProgressTree;
